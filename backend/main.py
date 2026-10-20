import os
import sys
from pathlib import Path

# Ensure backend directory is in sys.path for direct imports
sys.path.insert(0, str(Path(__file__).resolve().parent))

from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np

from simulate import generate_simulation_data, SEVERITY, DATA_PATH
from fusion import run_kalman_filter
from voi import rank_zones_by_voi, DEFAULT_SAMPLING_COST
from treatments import simulate_treatments_monte_carlo
from recovery import compute_difference_in_differences

# In-memory storage for base data and dynamic DNA observations added via POST /sample/{z}
BASE_DATA_DF: Optional[pd.DataFrame] = None
# Format: { "B": { 179: 2.15 }, ... }
DYNAMIC_SAMPLES: Dict[str, Dict[int, float]] = {
    "A": {},
    "B": {},
    "C": {},
    "D": {}
}

# Active climate stress shift parameters
CLIMATE_SHIFT = {
    "temp_delta": 0.0,
    "rain_mult": 1.0,
    "drought_days": 0
}

# 10-acre farm GeoJSON zones situated in North East India (Upper Assam Valley / Brahmaputra Agro-Ecological Basin)
# Center: 26.7450° N, 94.2150° E (Jorhat-Golaghat Agricultural Belt, Assam, North East India)
FARM_ZONES_GEOJSON = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {"zone": "A", "name": "Zone A (North-West)", "acres": 2.5, "crop": "Assam Joha & Black Rice (Chak-Hao)", "soil": "Brahmaputra Alluvial Loam (pH 5.4)"},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [94.2138, 26.7460],
                    [94.2150, 26.7460],
                    [94.2150, 26.7450],
                    [94.2138, 26.7450],
                    [94.2138, 26.7460]
                ]]
            }
        },
        {
            "type": "Feature",
            "properties": {"zone": "B", "name": "Zone B (North-East - High Stress)", "acres": 2.5, "crop": "Specialty CTC & Orthodox Tea (Heat Stress & Drought)", "soil": "Acidic Red Sandy Loam (Thermal Die-off)"},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [94.2150, 26.7460],
                    [94.2162, 26.7460],
                    [94.2162, 26.7450],
                    [94.2150, 26.7450],
                    [94.2150, 26.7460]
                ]]
            }
        },
        {
            "type": "Feature",
            "properties": {"zone": "C", "name": "Zone C (South-West)", "acres": 2.5, "crop": "Kaji Nemu (Assam Lemon - GI) & Khasi Mandarin", "soil": "Sub-Himalayan Hill Foothill Loam"},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [94.2138, 26.7450],
                    [94.2150, 26.7450],
                    [94.2150, 26.7440],
                    [94.2138, 26.7440],
                    [94.2138, 26.7450]
                ]]
            }
        },
        {
            "type": "Feature",
            "properties": {"zone": "D", "name": "Zone D (South-East)", "acres": 2.5, "crop": "Bhoot Jolokia (King Chilli) & Nadia Ginger", "soil": "Rich Organic Humus-rich Terraced Loam"},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [94.2150, 26.7450],
                    [94.2162, 26.7450],
                    [94.2162, 26.7440],
                    [94.2150, 26.7440],
                    [94.2150, 26.7450]
                ]]
            }
        }
    ]
}

def get_base_data() -> pd.DataFrame:
    global BASE_DATA_DF
    if BASE_DATA_DF is None:
        if DATA_PATH.exists():
            BASE_DATA_DF = pd.read_csv(DATA_PATH)
        else:
            BASE_DATA_DF = generate_simulation_data(seed=42, write_csv=True)
    return BASE_DATA_DF.copy()

def build_evidence_and_missing_data(zone: str, fused_df: pd.DataFrame) -> Dict[str, List[str]]:
    """Generate domain-specific evidence and missing-data flags."""
    latest_row = fused_df.iloc[-1]
    health = float(latest_row["health_mean"])
    var = float(latest_row["health_variance"])
    ndvi_start = float(fused_df.iloc[0]["ndvi"])
    ndvi_end = float(latest_row["ndvi"])
    ndvi_drop = ((ndvi_start - ndvi_end) / ndvi_start) * 100.0 if ndvi_start > 0 else 0.0
    
    evidence = []
    missing_data = []

    # Evidence
    if ndvi_drop > 15:
        evidence.append(f"NDVI vegetative vigor declined {ndvi_drop:.1f}% from baseline (start: {ndvi_start:.2f}, latest: {ndvi_end:.2f}).")
    else:
        evidence.append(f"NDVI vegetative canopy stable at {ndvi_end:.2f} (baseline: {ndvi_start:.2f}).")

    sample_count = int(fused_df["has_dna_sample"].sum())
    evidence.append(f"{sample_count} DNA sequencing checkpoints integrated into Kalman fusion.")

    temp_max = float(fused_df["temp"].max())
    if temp_max > 28.0:
        evidence.append(f"Peak thermal stress detected: {temp_max:.1f}°C during hot spells.")

    rain_total = float(fused_df["rain"].sum())
    evidence.append(f"Cumulative 180-day simulated precipitation: {rain_total:.1f} mm.")

    # Missing data
    missing_data.append("Optical cloud occlusions: NDVI observations captured on fixed 5-day intervals (not daily).")
    if sample_count <= 4:
        missing_data.append("Metagenomic DNA sample gap: 55 days elapsed between day 120 and day 175 sequencing runs.")
    else:
        missing_data.append("Recent on-demand field DNA sample integrated at day 179; variance collapsed.")

    missing_data.append("Depth profile limitation: Satellite and core samples represent top 15cm; deep subsoil hydrology unobserved.")

    return {
        "evidence": evidence,
        "missing_data": missing_data
    }

def get_zone_fused_df(zone: str, df: Optional[pd.DataFrame] = None) -> pd.DataFrame:
    if df is None:
        df = get_base_data()
    zone_df = df[df["zone"] == zone].copy()
    extra_samples = DYNAMIC_SAMPLES.get(zone, {})
    return run_kalman_filter(zone_df, extra_dna_samples=extra_samples)

class ClimateSimRequest(BaseModel):
    temp_delta: float = Field(0.0, ge=0.0, le=4.0, description="Temperature increase in Celsius (0 - 4)")
    rain_mult: float = Field(1.0, ge=0.5, le=1.0, description="Rainfall multiplier (0.5 - 1.0)")
    drought_days: int = Field(0, ge=0, le=60, description="Duration of severe drought spell in days (0 - 60)")

@asynccontextmanager
async def lifespan(app: FastAPI):
    get_base_data()
    yield

app = FastAPI(
    title="BIOGUARD AI API",
    description="Uncertainty-first soil microbiome intelligence and climate resilience engine. All data is SIMULATED.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "app": "BIOGUARD AI",
        "description": "Uncertainty-first soil microbiome intelligence dashboard",
        "version": "1.0.0",
        "endpoints": [
            "/zones",
            "/zones/{z}/series",
            "/simulate",
            "/sample/{z}",
            "/zones/{z}/treatments",
            "/zones/{z}/recovery",
            "/reset"
        ],
        "disclaimer": "Simulated data. Screening result, not a laboratory diagnosis."
    }

@app.get("/zones")
def get_zones():
    """
    Get current health, uncertainty (variance), priority, evidence, missing-data,
    confidence label, and sampling_rank from VOI across all 4 zones.
    """
    base_df = get_base_data()
    zones = ["A", "B", "C", "D"]
    zone_stats = []
    zone_fused_dict = {}

    for z in zones:
        fused_df = get_zone_fused_df(z, base_df)
        zone_fused_dict[z] = fused_df
        last_row = fused_df.iloc[-1]
        mean_val = float(last_row["health_mean"])
        var_val = float(last_row["health_variance"])
        sd_val = float(last_row["health_sd"])
        lo_val = float(last_row["health_lo"])
        hi_val = float(last_row["health_hi"])

        # Priority: High < 0.65, Moderate < 0.80, Low >= 0.80
        if mean_val < 0.65:
            priority = "High"
            priority_color = "#ef4444" # red
        elif mean_val < 0.80:
            priority = "Moderate"
            priority_color = "#f59e0b" # amber
        else:
            priority = "Low"
            priority_color = "#10b981" # emerald green

        # Confidence label based on variance
        if var_val < 0.0015:
            confidence_label = "High Confidence"
        elif var_val < 0.0035:
            confidence_label = "Moderate Confidence"
        else:
            confidence_label = "Low Confidence (High Variance)"

        zone_stats.append({
            "zone": z,
            "health_mean": mean_val,
            "health_variance": var_val,
            "health_sd": sd_val,
            "health_lo": lo_val,
            "health_hi": hi_val,
            "priority": priority,
            "priority_color": priority_color,
            "confidence_label": confidence_label
        })

    # Rank zones using Value of Information (VOI)
    ranked_voi = rank_zones_by_voi(zone_stats, sampling_cost=DEFAULT_SAMPLING_COST)
    voi_map = {item["zone"]: item for item in ranked_voi}

    # Merge VOI & domain evidence into final payload
    response_zones = []
    for item in zone_stats:
        z = item["zone"]
        v_info = voi_map[z]
        evi_dict = build_evidence_and_missing_data(z, zone_fused_dict[z])

        # Recommended next step
        if item["priority"] == "High" and v_info["sampling_rank"] == 1:
            rec_step = "Urgent: Order targeted metagenomic soil assay to confirm functional degradation before investing in restorative cover crop."
        elif item["priority"] == "High":
            rec_step = "High risk confirmed: Prepare soil remediation protocol (microbial inoculant / mulch)."
        elif item["priority"] == "Moderate":
            rec_step = "Monitor closely: Watch early warning autocorrelation signal for signs of critical slowing down."
        else:
            rec_step = "Maintenance: Preserve current regenerative practices; low risk of microbial collapse."

        merged = {
            **item,
            "sampling_rank": v_info["sampling_rank"],
            "voi_score": v_info["voi_score"],
            "variance_reduction_pct": v_info["variance_reduction_pct"],
            "voi_reason": v_info["reason"],
            "urgency": v_info["urgency"],
            "evidence": evi_dict["evidence"],
            "missing_data": evi_dict["missing_data"],
            "recommended_next_step": rec_step
        }
        response_zones.append(merged)

    # Sort so Zone A, B, C, D order is predictable for UI
    response_zones.sort(key=lambda x: x["zone"])

    return {
        "zones": response_zones,
        "geojson": FARM_ZONES_GEOJSON,
        "action_threshold": 0.70,
        "top_sampling_recommendation": ranked_voi[0]["zone"],
        "top_sampling_rationale": ranked_voi[0]["reason"],
        "source": "simulated",
        "disclaimer": "Simulated data. Screening result, not a laboratory diagnosis."
    }

@app.get("/zones/{z}/series")
def get_zone_series(z: str):
    """
    Get fused mean, lo/hi 90% band per day, NDVI, temp, rain, DNA sample days,
    and early-warning signals for zone z.
    """
    z_upper = z.upper()
    if z_upper not in ["A", "B", "C", "D"]:
        raise HTTPException(status_code=404, detail=f"Zone '{z}' not found. Valid zones: A, B, C, D")

    fused_df = get_zone_fused_df(z_upper)
    records = []
    for _, row in fused_df.iterrows():
        records.append({
            "day": int(row["day"]),
            "zone": z_upper,
            "health_mean": float(row["health_mean"]),
            "health_variance": float(row["health_variance"]),
            "health_sd": float(row["health_sd"]),
            "health_lo": float(row["health_lo"]),
            "health_hi": float(row["health_hi"]),
            "ndvi": float(row["ndvi"]),
            "temp": float(row["temp"]),
            "rain": float(row["rain"]),
            "shannon": None if pd.isna(row["shannon"]) else float(row["shannon"]),
            "has_dna_sample": bool(row["has_dna_sample"]),
            "rolling_variance": float(row["rolling_variance"]),
            "lag1_autocorr": float(row["lag1_autocorr"]),
            "true_health": float(row["true_health"])
        })

    last_row = fused_df.iloc[-1]
    return {
        "zone": z_upper,
        "current_health": float(last_row["health_mean"]),
        "current_variance": float(last_row["health_variance"]),
        "current_lo": float(last_row["health_lo"]),
        "current_hi": float(last_row["health_hi"]),
        "series": records,
        "source": "simulated",
        "disclaimer": "Simulated data. Screening result, not a laboratory diagnosis."
    }

@app.post("/simulate")
def run_climate_simulation(req: ClimateSimRequest):
    """
    Re-run fusion with shifted weather and vegetation response under climate stress.
    Returns new zone scores and delta vs baseline.
    """
    global CLIMATE_SHIFT
    CLIMATE_SHIFT["temp_delta"] = req.temp_delta
    CLIMATE_SHIFT["rain_mult"] = req.rain_mult
    CLIMATE_SHIFT["drought_days"] = req.drought_days

    base_df = get_base_data()
    zones = ["A", "B", "C", "D"]
    shifted_records = []

    # Shift weather and response:
    # Higher temp and lower rain reduces vegetative vigor and microbial resilience
    for _, row in base_df.iterrows():
        r = row.to_dict()
        t = int(r["day"])
        z = str(r["zone"])
        sev = SEVERITY.get(z, 0.0)

        # Apply temperature shift
        new_temp = r["temp"] + req.temp_delta
        # Apply rainfall multiplier
        new_rain = r["rain"] * req.rain_mult

        # Drought impact factor: scaled by drought_days and zone severity
        # Hotter / drier simulation increases stress
        stress_factor = (req.temp_delta / 4.0) * 0.12 + (1.0 - req.rain_mult) * 0.15
        if req.drought_days > 0 and t >= (180 - req.drought_days):
            stress_factor += (req.drought_days / 60.0) * 0.10

        # Health adjustment (never increases health; hotter/drier always reduces or preserves health)
        adjusted_true_health = max(0.05, r["true_health"] - stress_factor * (0.6 + 0.4 * sev))
        
        # NDVI shifted downwards under stress
        ndvi_stress_drop = stress_factor * 0.15
        adjusted_ndvi = max(0.05, min(0.95, r["ndvi"] - ndvi_stress_drop))

        # Shannon shifted downwards under stress on sample days
        adjusted_shannon = r["shannon"]
        if not pd.isna(r["shannon"]):
            adjusted_shannon = max(1.2, r["shannon"] - stress_factor * 0.5)

        r["temp"] = round(new_temp, 1)
        r["rain"] = round(new_rain, 1)
        r["true_health"] = round(adjusted_true_health, 4)
        r["ndvi"] = round(adjusted_ndvi, 4)
        r["shannon"] = adjusted_shannon
        shifted_records.append(r)

    sim_df = pd.DataFrame(shifted_records)

    # Compute baseline and shifted scores
    zone_results = []
    for z in zones:
        # Baseline
        base_fused = get_zone_fused_df(z, base_df)
        base_health = float(base_fused.iloc[-1]["health_mean"])
        base_var = float(base_fused.iloc[-1]["health_variance"])

        # Shifted
        extra_samples = DYNAMIC_SAMPLES.get(z, {})
        z_sim_df = sim_df[sim_df["zone"] == z].copy()
        sim_fused = run_kalman_filter(z_sim_df, extra_dna_samples=extra_samples)
        sim_health = float(sim_fused.iloc[-1]["health_mean"])
        sim_var = float(sim_fused.iloc[-1]["health_variance"])
        sim_lo = float(sim_fused.iloc[-1]["health_lo"])
        sim_hi = float(sim_fused.iloc[-1]["health_hi"])

        # Health delta (shifted - baseline)
        health_delta = round(sim_health - base_health, 4)
        risk_delta = round(-health_delta, 4) # Lower health means higher risk

        # New priority
        if sim_health < 0.65:
            new_priority = "High"
            color = "#ef4444"
        elif sim_health < 0.80:
            new_priority = "Moderate"
            color = "#f59e0b"
        else:
            new_priority = "Low"
            color = "#10b981"

        zone_results.append({
            "zone": z,
            "baseline_health": round(base_health, 4),
            "simulated_health": round(sim_health, 4),
            "health_delta": health_delta,
            "risk_delta": risk_delta,
            "simulated_variance": round(sim_var, 6),
            "simulated_lo": round(sim_lo, 4),
            "simulated_hi": round(sim_hi, 4),
            "priority": new_priority,
            "priority_color": color
        })

    return {
        "parameters": {
            "temp_delta_c": req.temp_delta,
            "rain_multiplier": req.rain_mult,
            "drought_days": req.drought_days
        },
        "zones": zone_results,
        "label": "Model estimate under stated assumptions",
        "source": "simulated",
        "disclaimer": "Simulated data. Screening result, not a laboratory diagnosis."
    }

@app.post("/sample/{z}")
def add_soil_sample(z: str):
    """
    Simulate collecting an on-demand DNA soil sample at the latest day (day 179)
    for zone z. Re-runs Kalman filter to show the uncertainty band collapsing.
    """
    z_upper = z.upper()
    if z_upper not in ["A", "B", "C", "D"]:
        raise HTTPException(status_code=404, detail=f"Zone '{z}' not found.")

    base_df = get_base_data()
    z_df = base_df[base_df["zone"] == z_upper].sort_values("day")
    
    # Calculate pre-sample variance
    pre_fused = get_zone_fused_df(z_upper, base_df)
    pre_var = float(pre_fused.iloc[-1]["health_variance"])
    pre_lo = float(pre_fused.iloc[-1]["health_lo"])
    pre_hi = float(pre_fused.iloc[-1]["health_hi"])
    pre_sd = float(pre_fused.iloc[-1]["health_sd"])
    pre_mean = float(pre_fused.iloc[-1]["health_mean"])

    # Simulate realistic Shannon diversity value based on latent health at day 179
    latest_row = z_df.iloc[-1]
    latent_health = float(latest_row["true_health"])
    simulated_shannon = float(np.round(2.0 + 2.0 * latent_health + np.random.normal(0, 0.05), 3))

    # Add to dynamic samples storage for day 179
    latest_day = int(latest_row["day"])
    DYNAMIC_SAMPLES[z_upper][latest_day] = simulated_shannon

    # Re-run Kalman filter with the new sample
    post_fused = get_zone_fused_df(z_upper, base_df)
    post_var = float(post_fused.iloc[-1]["health_variance"])
    post_lo = float(post_fused.iloc[-1]["health_lo"])
    post_hi = float(post_fused.iloc[-1]["health_hi"])
    post_sd = float(post_fused.iloc[-1]["health_sd"])
    post_mean = float(post_fused.iloc[-1]["health_mean"])

    var_reduction_pct = round(((pre_var - post_var) / pre_var) * 100.0, 1) if pre_var > 0 else 0.0

    return {
        "status": "success",
        "zone": z_upper,
        "sample_day": latest_day,
        "observed_shannon": simulated_shannon,
        "pre_sample": {
            "mean": pre_mean,
            "variance": pre_var,
            "sd": pre_sd,
            "band_width_90": round(pre_hi - pre_lo, 4),
            "lo": pre_lo,
            "hi": pre_hi
        },
        "post_sample": {
            "mean": post_mean,
            "variance": post_var,
            "sd": post_sd,
            "band_width_90": round(post_hi - post_lo, 4),
            "lo": post_lo,
            "hi": post_hi
        },
        "variance_reduction_pct": var_reduction_pct,
        "message": f"DNA sample integrated for Zone {z_upper}. Uncertainty collapsed by {var_reduction_pct}%.",
        "disclaimer": "Simulated data. Screening result, not a laboratory diagnosis."
    }

@app.post("/reset")
def reset_samples():
    """Reset dynamic samples and simulation parameters to initial state."""
    global DYNAMIC_SAMPLES, CLIMATE_SHIFT
    DYNAMIC_SAMPLES = {"A": {}, "B": {}, "C": {}, "D": {}}
    CLIMATE_SHIFT = {"temp_delta": 0.0, "rain_mult": 1.0, "drought_days": 0}
    return {
        "status": "reset_successful",
        "message": "All dynamic samples and climate shifts reset to baseline.",
        "disclaimer": "Simulated data. Screening result, not a laboratory diagnosis."
    }

@app.get("/zones/{z}/treatments")
def get_treatments(z: str, acres: float = Query(10.0, ge=1.0, le=500.0)):
    """
    Get ranked treatment comparison and Monte Carlo stress analysis for zone z.
    """
    z_upper = z.upper()
    if z_upper not in ["A", "B", "C", "D"]:
        raise HTTPException(status_code=404, detail=f"Zone '{z}' not found.")

    fused_df = get_zone_fused_df(z_upper)
    current_health = float(fused_df.iloc[-1]["health_mean"])
    result = simulate_treatments_monte_carlo(current_health=current_health, acres=acres)
    result["zone"] = z_upper
    result["current_health"] = current_health
    return result

@app.get("/zones/{z}/recovery")
def get_recovery(z: str, control: str = Query("A")):
    """
    Compute Difference-in-Differences recovery tracking between zone z and control zone.
    """
    z_upper = z.upper()
    c_upper = control.upper()
    if z_upper not in ["A", "B", "C", "D"]:
        raise HTTPException(status_code=404, detail=f"Zone '{z}' not found.")
    if c_upper not in ["A", "B", "C", "D"]:
        raise HTTPException(status_code=404, detail=f"Control zone '{control}' not found.")

    base_df = get_base_data()
    return compute_difference_in_differences(
        df=base_df,
        treated_zone=z_upper,
        control_zone=c_upper,
        treatment_day=120
    )
