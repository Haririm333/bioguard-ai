# BIOGUARD AI 🌿🔬

> 🌐 **Live Vercel Application:** [https://bioguard-2iiwtve1k-haririm333.vercel.app/](https://bioguard-2iiwtve1k-haririm333.vercel.app/)  
> **Uncertainty-First Soil Microbiome Intelligence & Climate Resilience Engine**  
> *A hackathon prototype for precision regenerative agriculture. Software only, local execution, all data is SIMULATED.*

---

## 🚀 Key Signature Idea
Traditional soil and vegetation dashboards hide uncertainty behind smooth colored averages. **BIOGUARD AI** is built on an uncertainty-first foundation:
- **How confident is the system?** 1-D Kalman filter fuses sparse, high-fidelity metagenomic DNA data with frequent NDVI and weather observations to yield continuous mean and 90% confidence bands ($lo / hi = \mu \pm 1.64\sigma$).
- **Why is it uncertain?** Explicit empirical evidence bullets vs missing-data warnings (e.g. 55-day metagenomic blackouts and optical cloud occlusions).
- **Which single soil sample would reduce uncertainty the most?** A Bayesian **Value-of-Information (VOI)** advisor mathematically ranks zones by expected posterior variance reduction weighted by proximity to the critical intervention threshold ($0.70$).

---

## 🛠️ Tech Stack & Monorepo Layout
```
bioguard AI/
├── backend/
│   ├── simulate.py       # 180-day 4-zone simulation generator (Seed 42)
│   ├── fusion.py         # 1-D Kalman filter + Early Warning Signals (EWS)
│   ├── voi.py            # Bayesian Value of Information (VOI) ranking
│   ├── treatments.py     # 500-scenario Monte Carlo + Pareto frontier
│   ├── recovery.py       # Difference-in-Differences (DiD) + Bootstrap CI
│   ├── main.py           # FastAPI server with CORS & full REST endpoints
│   ├── test_bioguard.py  # 4 Pytest unit tests
│   └── data.csv          # Generated simulation dataset
├── frontend/             # Vite + React 19 + Tailwind CSS + Leaflet + Plotly
│   ├── src/
│   │   ├── components/
│   │   │   ├── FarmMap.jsx           # 10-acre GeoJSON farm (Risk & Uncertainty views)
│   │   │   ├── ZonePanel.jsx         # Kalman fusion & Early Warning signals
│   │   │   ├── SamplingAdvisor.jsx   # VOI advisor + dynamic sample trigger
│   │   │   ├── ClimateSimulator.jsx  # Stress sliders (Temp, Rain, Drought)
│   │   │   ├── TreatmentTab.jsx      # Monte Carlo comparison & Pareto frontier
│   │   │   ├── RecoveryTab.jsx       # DiD causal recovery & counterfactuals
│   │   │   ├── PlotlyChart.jsx       # Responsive Plotly wrapper
│   │   │   ├── TopBar.jsx            # Top navigation & SIMULATED DATA badge
│   │   │   └── Footer.jsx            # 4 Core Model Limitations & Caveats
│   │   ├── App.jsx
│   │   └── index.css
│   └── index.html
└── README.md
```

---

## ⚡ Quick Start

### 1. Backend Setup & Run
```bash
# From workspace root
cd backend

# (Optional) Re-generate the simulated data
python simulate.py

# Start FastAPI server on port 8000
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at: **http://127.0.0.1:8000/docs**

### 2. Frontend Setup & Run
```bash
# In a new terminal from workspace root
cd frontend

# Start the Vite development server
npm.cmd run dev
```
Open **http://127.0.0.1:5173/** in your browser.

---

## 🧪 Running Pytest Unit Tests
To run the 4 automated validation tests:
```bash
python -m pytest backend/test_bioguard.py -v
```
**Tests Covered:**
1. `test_kalman_band_shrinks_after_dna_sample`: Proves the Kalman 90% confidence band narrows significantly immediately after an on-demand DNA sample.
2. `test_hotter_drier_simulation_never_lowers_risk`: Verifies temperature increases and rainfall drops monotonically increase or maintain stress risk.
3. `test_voi_ranks_highest_uncertainty_near_threshold_zone_first`: Verifies the Bayesian decision proximity equation prioritizes candidate zones near the 0.70 threshold.
4. `test_did_returns_near_zero_when_no_treatment_applied`: Confirms Difference-in-Differences yields ~0 effect for identical control series.

---

## 🎯 Verification Checklist & Live Features

| Feature | Where to Test in UI | What to Look For |
|---|---|---|
| **Map Risk View** | Map top-right toggle | Zone B is red/high-risk, Zone A is green, Zone C is amber. |
| **Map Uncertainty View** | Map top-right toggle | Colors change from risk to variance levels (Violet = High, Cyan = Low). |
| **Zone Diagnostics** | Click any zone polygon | Latent health $\mu$ curve with shaded $\pm 1.64\sigma$ band, NDVI overlay, and early-warning lag-1 autocorrelation. |
| **Dynamic Sample Collapse** | "Value-of-Information Advisor" | Click **"Collect Soil Sample"**. Watch the uncertainty band instantly collapse and feedback badge appear. |
| **Climate Stress Test** | "Climate Stress Simulator" tab | Slide temperature up to +3.5°C or pick **"2030 Heat Wave"**. Map colors shift live, and before/after comparison table updates. |
| **Treatment Economics** | "Treatment Economics" tab | Change treatment acreage. Observe 500-scenario Monte Carlo outcomes and golden Pareto-optimal markers. |
| **Counterfactual Recovery** | "Counterfactual Recovery" tab | Select treated vs control zone. View DiD estimate $\hat{\beta}$, 95% bootstrap CI, and dashed unmanaged counterfactual line. |

---

## ⚠️ Core Limitations & Agronomic Caveats
1. **DNA Presence $\neq$ Metabolic Activity**: Metagenomic DNA indicates taxonomy, not instantaneous enzyme kinetics or microbial respiration.
2. **NDVI Cannot Prove Microbial Damage**: Vegetative canopy vigor reflects photosynthetic response, which may be influenced by multiple abiotic and biotic factors.
3. **Simulated Research Data**: All figures and curves are synthetic in silico models for screening and evaluation purposes.
4. **Certified Agronomist Guidance**: Always consult local university extension agents and certified crop advisers prior to executing soil input investments.
