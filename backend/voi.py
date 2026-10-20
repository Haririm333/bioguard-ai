import numpy as np
from scipy import stats
from typing import Dict, Any, List

DEFAULT_SAMPLING_COST = 1200.0
ACTION_THRESHOLD = 0.70
DNA_NOISE_R = 0.003

def calculate_zone_voi(
    zone: str,
    current_mean: float,
    current_var: float,
    sampling_cost: float = DEFAULT_SAMPLING_COST,
    action_threshold: float = ACTION_THRESHOLD,
    r_dna: float = DNA_NOISE_R
) -> Dict[str, Any]:
    """
    Compute Value of Information (VOI) for a single zone:
    - posterior variance after hypothetical DNA sample = var * R / (var + R)
    - reduction = var - posterior
    - weight by decision proximity = normal pdf of action threshold (0.7) under current estimate times sd
    - VOI raw = (reduction * proximity) / cost
    """
    sd = float(np.sqrt(max(current_var, 1e-8)))
    
    # Posterior variance after observing DNA
    posterior_var = (current_var * r_dna) / (current_var + r_dna)
    reduction = current_var - posterior_var
    reduction_pct = (reduction / current_var) * 100.0 if current_var > 0 else 0.0

    # Decision proximity: normal pdf of 0.7 under N(current_mean, sd) times sd
    # Note: pdf * sd = standard normal pdf at (0.7 - mean)/sd!
    proximity = float(stats.norm.pdf(action_threshold, loc=current_mean, scale=sd) * sd)

    voi_raw = float((reduction * proximity) / sampling_cost)
    # UI-friendly VOI score normalized to an index
    voi_score = round(voi_raw * 1e6, 2)

    # Human-readable rationale
    dist_to_threshold = abs(current_mean - action_threshold)
    if current_mean < action_threshold and dist_to_threshold < 0.15:
        urgency = "CRITICAL"
        reason = f"Zone {zone} is straddling the critical intervention threshold ({action_threshold:.2f}) with health at {current_mean:.2f}. A DNA sample reduces uncertainty by {reduction_pct:.0f}%, clarifying if emergency mitigation is required."
    elif current_var > 0.002:
        urgency = "HIGH"
        reason = f"Zone {zone} has elevated uncertainty (variance {current_var:.4f}). Testing will narrow the confidence interval and prevent misallocating capital."
    else:
        urgency = "LOW"
        reason = f"Zone {zone} is stable with low variance ({current_var:.4f}) and high confidence. Prioritize other zones first."

    return {
        "zone": zone,
        "current_health": round(current_mean, 4),
        "current_variance": round(current_var, 6),
        "current_sd": round(sd, 4),
        "posterior_variance": round(posterior_var, 6),
        "variance_reduction": round(reduction, 6),
        "variance_reduction_pct": round(reduction_pct, 1),
        "decision_proximity": round(proximity, 4),
        "sampling_cost": sampling_cost,
        "action_threshold": action_threshold,
        "voi_raw": voi_raw,
        "voi_score": voi_score,
        "urgency": urgency,
        "reason": reason
    }

def rank_zones_by_voi(
    zone_stats: List[Dict[str, Any]],
    sampling_cost: float = DEFAULT_SAMPLING_COST
) -> List[Dict[str, Any]]:
    """
    Rank all zones by VOI descending.
    Adds 'sampling_rank' (1 = highest priority to sample).
    """
    voi_results = []
    for item in zone_stats:
        z_voi = calculate_zone_voi(
            zone=item["zone"],
            current_mean=item["health_mean"],
            current_var=item["health_variance"],
            sampling_cost=sampling_cost
        )
        voi_results.append(z_voi)

    # Sort descending by voi_raw
    voi_results.sort(key=lambda x: x["voi_raw"], reverse=True)

    for rank_idx, item in enumerate(voi_results, start=1):
        item["sampling_rank"] = rank_idx

    return voi_results
