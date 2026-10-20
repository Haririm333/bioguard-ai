import numpy as np
from typing import Dict, Any, List

TREATMENT_CATALOG = [
    {
        "id": "dhaincha_sunnhemp",
        "name": "Dhaincha & Sunnhemp Green Manuring (Sesbania + Crotalaria)",
        "cost_per_acre": 55.0,
        "cost_inr_per_acre": 4500,
        "crop_compat": "High (Cotton, Kharif Pulses, Sugarcane, Wheat-Rice rotations)",
        "soil_ok": "Vertisols (Black Cotton Soils), Medium Alluvial Loam (pH 6.5 - 8.2)",
        "evidence_level": "High (ICAR-CRIDA & ICAR-IISS multi-decade trials)",
        "drought_benefit": 0.20,
        "diversity_benefit": 0.26,
        "description": "Deccan green manuring adds 15-20 t/ha biomass, restores active soil organic carbon (SOC), and fixes 60-80 kg N/ha."
    },
    {
        "id": "pali_straw_drip",
        "name": "Pali Method Straw Mulching + Precision Drip Irrigation",
        "cost_per_acre": 130.0,
        "cost_inr_per_acre": 10500,
        "crop_compat": "Universal (Cotton, Horticultural Crops, Turmeric, Orchards)",
        "soil_ok": "Cracking Black Vertisols, prevents deep fissures and root shear",
        "evidence_level": "Moderate-High (MPKV Rahuri & NABARD dryland watershed trials)",
        "drought_benefit": 0.36,
        "diversity_benefit": 0.16,
        "description": "Heavy crop residue mulching dampens soil surface temperature by 6-9°C during Indian summer heatwaves and retains residual root-zone moisture."
    },
    {
        "id": "jeevamrutha_bio_npk",
        "name": "Bio-NPK Consortium & Jeevamrutha Microbial Inoculation",
        "cost_per_acre": 80.0,
        "cost_inr_per_acre": 6500,
        "crop_compat": "Soybean, Pigeon Pea (Tur), Cotton, Millets, Vegetables",
        "soil_ok": "Effective in Indian soils with organic carbon > 0.4%",
        "evidence_level": "Moderate (ICAR-NBAIM Mau & UAS Dharwad genomic assays)",
        "drought_benefit": 0.24,
        "diversity_benefit": 0.40,
        "description": "Fermented indigenous beneficial consortium (Azotobacter, PSB, KMB, Trichoderma viride, VAM) to unlock bound phosphorus in alkaline black soils."
    }
]

def simulate_treatments_monte_carlo(
    current_health: float,
    acres: float = 10.0,
    n_scenarios: int = 500,
    seed: int = 42
) -> Dict[str, Any]:
    """
    Run 500 Monte Carlo climate scenarios across treatment options.
    Computes:
    - Expected risk reduction
    - Worst-case (5th percentile) outcome
    - Total cost (acres * cost_per_acre) in USD and INR
    - Pareto optimality flags across cost, expected benefit, and worst-case benefit
    """
    rng = np.random.RandomState(seed)
    
    # 500 climate scenarios: temp delta [0, 4] C, rainfall mult [0.5, 1.0]
    temp_deltas = rng.uniform(0.0, 4.0, size=n_scenarios)
    rain_mults = rng.uniform(0.5, 1.0, size=n_scenarios)
    
    # Baseline current risk
    base_risk = 1.0 - current_health

    results = []

    for t_def in TREATMENT_CATALOG:
        total_cost_usd = round(acres * t_def["cost_per_acre"], 2)
        total_cost_inr = int(acres * t_def["cost_inr_per_acre"])
        reductions = []

        for i in range(n_scenarios):
            dt = temp_deltas[i]
            rm = rain_mults[i]

            # Climate stress severity [0 to 1]
            heat_stress = dt / 4.0
            drought_stress = (1.0 - rm) / 0.5
            climate_stress = 0.55 * heat_stress + 0.45 * drought_stress

            # Stress increases risk
            stress_induced_risk = min(1.0, base_risk + 0.35 * climate_stress + rng.normal(0, 0.02))

            # Treatment efficacy under this climate
            d_ben = t_def["drought_benefit"] * (0.8 + 0.4 * climate_stress)
            div_ben = t_def["diversity_benefit"] * (1.0 - 0.25 * climate_stress)
            random_variation = rng.normal(0, 0.02)
            
            # Net risk reduction achieved
            efficacy = d_ben + div_ben + random_variation
            reduction = float(np.clip(efficacy, 0.01, stress_induced_risk))
            reductions.append(reduction)

        reductions_arr = np.array(reductions)
        expected_benefit = float(np.mean(reductions_arr))
        worst_case_benefit = float(np.percentile(reductions_arr, 5))
        best_case_benefit = float(np.percentile(reductions_arr, 95))

        results.append({
            "id": t_def["id"],
            "name": t_def["name"],
            "cost_per_acre": t_def["cost_per_acre"],
            "cost_inr_per_acre": t_def["cost_inr_per_acre"],
            "acres": acres,
            "total_cost": total_cost_usd,
            "total_cost_inr": total_cost_inr,
            "crop_compat": t_def["crop_compat"],
            "soil_ok": t_def["soil_ok"],
            "evidence_level": t_def["evidence_level"],
            "description": t_def["description"],
            "drought_benefit": t_def["drought_benefit"],
            "diversity_benefit": t_def["diversity_benefit"],
            "expected_risk_reduction": round(expected_benefit, 4),
            "worst_case_5th_pct": round(worst_case_benefit, 4),
            "best_case_95th_pct": round(best_case_benefit, 4),
            "pareto_optimal": False
        })

    # Evaluate Pareto optimality
    for i, a in enumerate(results):
        dominated = False
        for j, b in enumerate(results):
            if i == j:
                continue
            cost_better = b["total_cost"] <= a["total_cost"]
            exp_better = b["expected_risk_reduction"] >= a["expected_risk_reduction"]
            worst_better = b["worst_case_5th_pct"] >= a["worst_case_5th_pct"]

            strict = (b["total_cost"] < a["total_cost"]) or \
                     (b["expected_risk_reduction"] > a["expected_risk_reduction"]) or \
                     (b["worst_case_5th_pct"] > a["worst_case_5th_pct"])

            if cost_better and exp_better and worst_better and strict:
                dominated = True
                break
        a["pareto_optimal"] = not dominated

    results.sort(key=lambda x: x["expected_risk_reduction"], reverse=True)

    assumptions = {
        "simulation_method": "Monte Carlo Indian Agro-Ecological stress simulation",
        "scenarios_evaluated": n_scenarios,
        "temperature_delta_c": "Uniform(0.0, 4.0 °C) [Pre-monsoon thermal heatwaves]",
        "rainfall_multiplier": "Uniform(0.5, 1.0) [Monsoon deficit stress]",
        "worst_case_metric": "5th percentile risk reduction (severe drought test)",
        "pareto_criteria": "Non-dominated across (Cost, Expected Benefit, 5th Percentile Worst-Case)",
        "agronomic_advisory": "Check local KVK (Krishi Vigyan Kendra) & ICAR agronomic guidance. Bio-inoculant efficacy varies with Vertisol moisture, pH (alkaline soils), and baseline organic carbon."
    }

    return {
        "treatments": results,
        "assumptions": assumptions,
        "disclaimer": "Simulated data. Screening result, not a laboratory diagnosis."
    }
