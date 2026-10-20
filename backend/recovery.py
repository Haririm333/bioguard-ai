import numpy as np
import pandas as pd
from typing import Dict, Any, Optional

def compute_difference_in_differences(
    df: pd.DataFrame,
    treated_zone: str,
    control_zone: str = "A",
    treatment_day: int = 120,
    n_bootstrap: int = 1000,
    seed: int = 42
) -> Dict[str, Any]:
    """
    Compute Difference-in-Differences (DiD) between treated_zone and control_zone:
    - Pre window: day < treatment_day
    - Post window: day >= treatment_day
    - DiD estimator = (Y_treated_post - Y_treated_pre) - (Y_control_post - Y_control_pre)
    - Bootstrap 95% Confidence Interval
    - Counterfactual series under parallel trends assumption:
        Y_cf(t) = Y_control(t) + (Y_treated_pre_mean - Y_control_pre_mean)
    - Returns 'needs_more_data' if fewer than 20 observations exist in any window.
    """
    treated_df = df[df["zone"] == treated_zone].sort_values("day").copy().reset_index(drop=True)
    control_df = df[df["zone"] == control_zone].sort_values("day").copy().reset_index(drop=True)

    if treated_df.empty or control_df.empty:
        return {
            "status": "error",
            "message": f"Missing data for zone {treated_zone} or control {control_zone}",
            "disclaimer": "Simulated data. Screening result, not a laboratory diagnosis."
        }

    # Split pre and post
    treated_pre = treated_df[treated_df["day"] < treatment_day]["ndvi"].values
    treated_post = treated_df[treated_df["day"] >= treatment_day]["ndvi"].values
    control_pre = control_df[control_df["day"] < treatment_day]["ndvi"].values
    control_post = control_df[control_df["day"] >= treatment_day]["ndvi"].values

    min_obs = 20
    if (len(treated_pre) < min_obs or len(treated_post) < min_obs or 
        len(control_pre) < min_obs or len(control_post) < min_obs):
        return {
            "status": "needs_more_data",
            "message": f"Fewer than {min_obs} observations available in one of the pre/post evaluation windows.",
            "treated_zone": treated_zone,
            "control_zone": control_zone,
            "treatment_day": treatment_day,
            "counts": {
                "treated_pre": len(treated_pre),
                "treated_post": len(treated_post),
                "control_pre": len(control_pre),
                "control_post": len(control_post)
            },
            "disclaimer": "Simulated data. Screening result, not a laboratory diagnosis."
        }

    t_pre_mean = float(np.mean(treated_pre))
    t_post_mean = float(np.mean(treated_post))
    c_pre_mean = float(np.mean(control_pre))
    c_post_mean = float(np.mean(control_post))

    did_estimate = (t_post_mean - t_pre_mean) - (c_post_mean - c_pre_mean)

    # Bootstrap 95% CI
    rng = np.random.RandomState(seed)
    boot_estimates = []
    n_t_pre, n_t_post = len(treated_pre), len(treated_post)
    n_c_pre, n_c_post = len(control_pre), len(control_post)

    for _ in range(n_bootstrap):
        b_t_pre = rng.choice(treated_pre, size=n_t_pre, replace=True)
        b_t_post = rng.choice(treated_post, size=n_t_post, replace=True)
        b_c_pre = rng.choice(control_pre, size=n_c_pre, replace=True)
        b_c_post = rng.choice(control_post, size=n_c_post, replace=True)

        b_did = (np.mean(b_t_post) - np.mean(b_t_pre)) - (np.mean(b_c_post) - np.mean(b_c_pre))
        boot_estimates.append(b_did)

    ci_lo = float(np.percentile(boot_estimates, 2.5))
    ci_hi = float(np.percentile(boot_estimates, 97.5))

    # Construct counterfactual series
    # Offset = treated_pre_mean - control_pre_mean
    pre_offset = t_pre_mean - c_pre_mean
    merged = pd.merge(
        treated_df[["day", "ndvi"]].rename(columns={"ndvi": "treated_actual"}),
        control_df[["day", "ndvi"]].rename(columns={"ndvi": "control_actual"}),
        on="day"
    )
    
    # Counterfactual for post-treatment
    merged["counterfactual"] = merged["control_actual"] + pre_offset
    # For days before treatment, counterfactual matches actual pre-trend baseline
    merged.loc[merged["day"] < treatment_day, "counterfactual"] = merged.loc[merged["day"] < treatment_day, "treated_actual"]

    series = []
    for _, row in merged.iterrows():
        series.append({
            "day": int(row["day"]),
            "treated_actual": round(float(row["treated_actual"]), 4),
            "control_actual": round(float(row["control_actual"]), 4),
            "counterfactual": round(float(row["counterfactual"]), 4),
            "is_post_treatment": bool(row["day"] >= treatment_day)
        })

    return {
        "status": "success",
        "treated_zone": treated_zone,
        "control_zone": control_zone,
        "treatment_day": treatment_day,
        "did_estimate": round(did_estimate, 4),
        "ci_95": [round(ci_lo, 4), round(ci_hi, 4)],
        "p_value_approx": round(float(2 * min(np.mean(np.array(boot_estimates) > 0), np.mean(np.array(boot_estimates) < 0))), 4),
        "means": {
            "treated_pre": round(t_pre_mean, 4),
            "treated_post": round(t_post_mean, 4),
            "control_pre": round(c_pre_mean, 4),
            "control_post": round(c_post_mean, 4),
            "treated_delta": round(t_post_mean - t_pre_mean, 4),
            "control_delta": round(c_post_mean - c_pre_mean, 4)
        },
        "series": series,
        "caveat": "Change does not prove causation. Assumes parallel pre-treatment trends hold in unobserved counterfactual states.",
        "disclaimer": "Simulated data. Screening result, not a laboratory diagnosis."
    }
