import numpy as np
import pandas as pd
from pathlib import Path

DATA_PATH = Path(__file__).parent / "data.csv"

SEVERITY = {
    "A": 0.0,
    "B": 1.0,
    "C": 0.4,
    "D": 0.1
}

def generate_simulation_data(seed: int = 42, write_csv: bool = True) -> pd.DataFrame:
    """
    Generate 180 days of simulated data for 4 farm zones (A, B, C, D).
    Severity per zone: A=0.0, B=1.0, C=0.4, D=0.1.
    Zone B: rising heat, falling rain, declining vegetation, declining microbial diversity.
    Hidden true_health = 1 - severity * 0.55 * (t / 180)**1.5.
    Daily columns: temp, rain, ndvi, true_health, shannon (sparse), source.
    """
    np.random.seed(seed)
    days = 180
    dna_sample_days = {0, 60, 120, 175}
    records = []

    for zone, severity in SEVERITY.items():
        for t in range(days):
            t_ratio = t / 180.0
            # Latent true health
            true_health = 1.0 - severity * 0.55 * (t_ratio ** 1.5)
            true_health = float(np.clip(true_health, 0.05, 1.0))

            # Temperature dynamics
            # Baseline: 22C with slight seasonal curve
            season_temp = 22.0 + 3.0 * np.sin(2 * np.pi * t / 180.0)
            # Zone B experiences rising heat wave stress (+7C towards day 180)
            heat_stress = severity * 6.0 * t_ratio
            temp_noise = np.random.normal(0, 0.8)
            temp = float(np.round(season_temp + heat_stress + temp_noise, 1))

            # Rain dynamics
            # Baseline: intermittent rain events, Zone B experiences drought
            rain_base = 3.5 * (1.0 - 0.75 * severity * t_ratio)
            rain_event = np.random.exponential(scale=rain_base) if np.random.rand() < 0.25 else 0.0
            rain = float(np.round(max(0.0, rain_event), 1))

            # NDVI: 0.2 + 0.6 * health + noise 0.03
            ndvi_noise = np.random.normal(0, 0.03)
            ndvi = float(np.clip(0.2 + 0.6 * true_health + ndvi_noise, 0.05, 0.95))

            # Shannon microbial diversity: 2 + 2 * health + noise 0.1
            # Sparse: available only on sample days
            if t in dna_sample_days:
                shannon_noise = np.random.normal(0, 0.1)
                shannon = float(np.round(np.clip(2.0 + 2.0 * true_health + shannon_noise, 1.5, 4.2), 3))
            else:
                shannon = np.nan

            records.append({
                "day": t,
                "zone": zone,
                "temp": temp,
                "rain": rain,
                "true_health": round(true_health, 4),
                "ndvi": round(ndvi, 4),
                "shannon": shannon,
                "source": "simulated"
            })

    df = pd.DataFrame(records)
    if write_csv:
        df.to_csv(DATA_PATH, index=False)
    return df

if __name__ == "__main__":
    df = generate_simulation_data(seed=42, write_csv=True)
    print(f"Generated {len(df)} rows across {df['zone'].nunique()} zones saved to {DATA_PATH}")
