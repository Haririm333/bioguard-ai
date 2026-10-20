import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional

def compute_early_warning_signals(ndvi_series: pd.Series, window: int = 45, mean_window: int = 30) -> pd.DataFrame:
    """
    Compute early-warning signals of ecosystem transition:
    - Residual = ndvi - 30-day rolling mean
    - Over 45-day rolling window: rolling variance and lag-1 autocorrelation
    """
    rolling_mean = ndvi_series.rolling(window=mean_window, min_periods=5).mean()
    residual = ndvi_series - rolling_mean

    rolling_var = residual.rolling(window=window, min_periods=10).var().fillna(0.0)

    # Rolling lag-1 autocorrelation
    lag_residual = residual.shift(1)
    
    # Compute rolling correlation between residual and lag_residual over window
    def rolling_lag1_corr(s1: pd.Series, s2: pd.Series, win: int) -> pd.Series:
        corrs = []
        for i in range(len(s1)):
            start_idx = max(0, i - win + 1)
            w1 = s1.iloc[start_idx:i+1]
            w2 = s2.iloc[start_idx:i+1]
            # Valid pairs
            valid = (~w1.isna()) & (~w2.isna())
            if valid.sum() >= 10:
                std1 = w1[valid].std()
                std2 = w2[valid].std()
                if std1 > 1e-6 and std2 > 1e-6:
                    c = float(np.corrcoef(w1[valid], w2[valid])[0, 1])
                    corrs.append(np.clip(c, -1.0, 1.0))
                else:
                    corrs.append(0.0)
            else:
                corrs.append(0.0)
        return pd.Series(corrs, index=s1.index)

    autocorr = rolling_lag1_corr(residual, lag_residual, window)

    return pd.DataFrame({
        "rolling_variance": rolling_var.round(5),
        "lag1_autocorr": autocorr.round(4)
    })

def run_kalman_filter(
    zone_df: pd.DataFrame,
    extra_dna_samples: Optional[Dict[int, float]] = None,
    q_process: float = 2e-4,
    r_ndvi: float = 0.01,
    r_dna: float = 0.003
) -> pd.DataFrame:
    """
    1-D Kalman filter for latent soil health h in [0, 1].
    - Predict step adds process noise Q = 2e-4 each day.
    - NDVI observation every 5 days (normalized (ndvi - 0.2) / 0.6, noise R = 0.01).
    - DNA observation when shannon exists (normalized (shannon - 2) / 2, noise R = 0.003).
    - Returns per-day mean, variance, sd, lo (mean - 1.64*sd), hi (mean + 1.64*sd).
    """
    df = zone_df.sort_values("day").copy().reset_index(drop=True)
    n = len(df)
    
    means = np.zeros(n)
    variances = np.zeros(n)
    
    # Initial state prior: h ~ N(x0, P0)
    # If day 0 has DNA or NDVI, initialize near observed
    init_val = 1.0
    if not np.isnan(df.loc[0, "shannon"]):
        init_val = float(np.clip((df.loc[0, "shannon"] - 2.0) / 2.0, 0.0, 1.0))
    elif not np.isnan(df.loc[0, "ndvi"]):
        init_val = float(np.clip((df.loc[0, "ndvi"] - 0.2) / 0.6, 0.0, 1.0))
        
    x = init_val
    p = 0.04  # Initial uncertainty

    for t in range(n):
        # 1. Predict Step (adds process noise Q)
        if t > 0:
            x_pred = x
            p_pred = p + q_process
        else:
            x_pred = x
            p_pred = p

        x_curr = x_pred
        p_curr = p_pred

        # 2. Update step - NDVI observation every 5 days
        day_val = int(df.loc[t, "day"])
        has_ndvi_obs = (day_val % 5 == 0) and (not np.isnan(df.loc[t, "ndvi"]))
        if has_ndvi_obs:
            raw_ndvi = float(df.loc[t, "ndvi"])
            z_ndvi = float(np.clip((raw_ndvi - 0.2) / 0.6, 0.0, 1.0))
            k_ndvi = p_curr / (p_curr + r_ndvi)
            x_curr = x_curr + k_ndvi * (z_ndvi - x_curr)
            p_curr = (1.0 - k_ndvi) * p_curr

        # 3. Update step - DNA observation if shannon exists or extra DNA sample provided
        shannon_val = df.loc[t, "shannon"]
        has_dna_obs = not np.isnan(shannon_val)
        extra_dna_val = None
        if extra_dna_samples and day_val in extra_dna_samples:
            has_dna_obs = True
            extra_dna_val = extra_dna_samples[day_val]

        if has_dna_obs:
            if extra_dna_val is not None:
                z_dna = float(np.clip((extra_dna_val - 2.0) / 2.0, 0.0, 1.0))
            else:
                z_dna = float(np.clip((float(shannon_val) - 2.0) / 2.0, 0.0, 1.0))
            k_dna = p_curr / (p_curr + r_dna)
            x_curr = x_curr + k_dna * (z_dna - x_curr)
            p_curr = (1.0 - k_dna) * p_curr

        x = float(np.clip(x_curr, 0.0, 1.0))
        p = max(float(p_curr), 1e-6)

        means[t] = x
        variances[t] = p

    sds = np.sqrt(variances)
    lo = np.clip(means - 1.64 * sds, 0.0, 1.0)
    hi = np.clip(means + 1.64 * sds, 0.0, 1.0)

    # Compute early-warning signals from NDVI
    ews = compute_early_warning_signals(df["ndvi"])

    result_df = df.copy()
    result_df["health_mean"] = np.round(means, 4)
    result_df["health_variance"] = np.round(variances, 6)
    result_df["health_sd"] = np.round(sds, 5)
    result_df["health_lo"] = np.round(lo, 4)
    result_df["health_hi"] = np.round(hi, 4)
    result_df["rolling_variance"] = ews["rolling_variance"]
    result_df["lag1_autocorr"] = ews["lag1_autocorr"]
    result_df["has_dna_sample"] = ~result_df["shannon"].isna()
    if extra_dna_samples:
        for extra_day in extra_dna_samples:
            result_df.loc[result_df["day"] == extra_day, "has_dna_sample"] = True

    return result_df
