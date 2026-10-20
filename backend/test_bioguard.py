import pytest
import numpy as np
import pandas as pd
from simulate import generate_simulation_data
from fusion import run_kalman_filter
from voi import rank_zones_by_voi, calculate_zone_voi
from recovery import compute_difference_in_differences
from fastapi.testclient import TestClient
from main import app, get_base_data

client = TestClient(app)

def test_kalman_band_shrinks_after_dna_sample():
    """Test 1: Kalman band (variance / 90% interval) shrinks immediately after a DNA sample."""
    df = generate_simulation_data(seed=42, write_csv=False)
    zone_b_df = df[df["zone"] == "B"].copy()
    
    # Run baseline fusion (sparse samples at [0, 60, 120, 175])
    fused_base = run_kalman_filter(zone_b_df)
    var_day_178 = fused_base.loc[fused_base["day"] == 178, "health_variance"].values[0]
    var_day_179 = fused_base.loc[fused_base["day"] == 179, "health_variance"].values[0]
    # Without new sample, variance increases or stays high
    assert var_day_179 >= var_day_178 or var_day_179 > 0.001

    # Now simulate adding a DNA sample at day 179
    fused_with_sample = run_kalman_filter(zone_b_df, extra_dna_samples={179: 2.1})
    post_sample_var_179 = fused_with_sample.loc[fused_with_sample["day"] == 179, "health_variance"].values[0]
    post_sample_band_179 = (
        fused_with_sample.loc[fused_with_sample["day"] == 179, "health_hi"].values[0] -
        fused_with_sample.loc[fused_with_sample["day"] == 179, "health_lo"].values[0]
    )
    base_band_179 = (
        fused_base.loc[fused_base["day"] == 179, "health_hi"].values[0] -
        fused_base.loc[fused_base["day"] == 179, "health_lo"].values[0]
    )

    # Variance and band width must collapse significantly
    assert post_sample_var_179 < var_day_179
    assert post_sample_band_179 < base_band_179
    # The collapse should be substantial (> 20% reduction)
    assert (var_day_179 - post_sample_var_179) / var_day_179 > 0.20

def test_hotter_drier_simulation_never_lowers_risk():
    """Test 2: Hotter / drier simulation increases stress, never lowers risk (i.e. health never increases)."""
    # Test across multiple climate shifts
    shifts = [
        {"temp_delta": 2.0, "rain_mult": 0.8, "drought_days": 15},
        {"temp_delta": 4.0, "rain_mult": 0.5, "drought_days": 30},
        {"temp_delta": 1.0, "rain_mult": 0.9, "drought_days": 0}
    ]

    for s in shifts:
        res = client.post("/simulate", json=s)
        assert res.status_code == 200
        data = res.json()
        for z_info in data["zones"]:
            # Health under stress should be <= baseline health
            assert z_info["simulated_health"] <= z_info["baseline_health"] + 1e-6
            # Risk delta should be >= 0 (risk increases or stays same)
            assert z_info["risk_delta"] >= -1e-6

def test_voi_ranks_highest_uncertainty_near_threshold_zone_first():
    """Test 3: VOI ranks highest-uncertainty near-threshold (0.7) zone first."""
    # Create candidate zones:
    # Zone 1: Far above threshold (0.95), low uncertainty
    # Zone 2: Right at threshold (0.69), high uncertainty
    # Zone 3: Far below threshold (0.30), low uncertainty
    stats = [
        {"zone": "Z1_Healthy", "health_mean": 0.92, "health_variance": 0.001},
        {"zone": "Z2_Threshold_Uncertain", "health_mean": 0.69, "health_variance": 0.006},
        {"zone": "Z3_Collapsed", "health_mean": 0.35, "health_variance": 0.002}
    ]
    ranked = rank_zones_by_voi(stats, sampling_cost=1200.0)
    # The zone near 0.70 with highest uncertainty MUST be ranked #1
    assert ranked[0]["zone"] == "Z2_Threshold_Uncertain"
    assert ranked[0]["sampling_rank"] == 1
    assert ranked[0]["voi_raw"] > ranked[1]["voi_raw"]

def test_did_returns_near_zero_when_no_treatment_applied():
    """Test 4: DiD returns ~0 effect when comparing two control segments or identical trajectories."""
    base_df = get_base_data()
    # Zone A has severity 0.0 (no degradation, no treatment intervention)
    # If we compare Zone A against Zone A itself or synthetic identical series, DiD is 0.0
    res = compute_difference_in_differences(base_df, treated_zone="A", control_zone="A", treatment_day=120)
    assert res["status"] == "success"
    assert abs(res["did_estimate"]) < 1e-4
    assert res["ci_95"][0] <= 0.0 <= res["ci_95"][1]
