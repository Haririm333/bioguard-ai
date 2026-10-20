// Fallback mock engine for standalone GitHub Pages hosting (when backend is not running)
export const MOCK_NORTH_EAST_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { zone: "A", name: "Zone A (North-West)", crop: "Assam Joha & Black Rice (Chak-Hao)", soil: "Brahmaputra Alluvial Loam (pH 5.4)" },
      geometry: {
        type: "Polygon",
        coordinates: [[[94.2138, 26.7460], [94.2150, 26.7460], [94.2150, 26.7450], [94.2138, 26.7450], [94.2138, 26.7460]]]
      }
    },
    {
      type: "Feature",
      properties: { zone: "B", name: "Zone B (North-East - High Stress)", crop: "Specialty CTC & Orthodox Tea", soil: "Acidic Red Sandy Loam (Thermal Die-off)" },
      geometry: {
        type: "Polygon",
        coordinates: [[[94.2150, 26.7460], [94.2162, 26.7460], [94.2162, 26.7450], [94.2150, 26.7450], [94.2150, 26.7460]]]
      }
    },
    {
      type: "Feature",
      properties: { zone: "C", name: "Zone C (South-West)", crop: "Kaji Nemu (Assam Lemon - GI) & Khasi Mandarin", soil: "Sub-Himalayan Hill Foothill Loam" },
      geometry: {
        type: "Polygon",
        coordinates: [[[94.2138, 26.7450], [94.2150, 26.7450], [94.2150, 26.7440], [94.2138, 26.7440], [94.2138, 26.7450]]]
      }
    },
    {
      type: "Feature",
      properties: { zone: "D", name: "Zone D (South-East)", crop: "Bhoot Jolokia (King Chilli) & Nadia Ginger", soil: "Rich Organic Humus-rich Terraced Loam" },
      geometry: {
        type: "Polygon",
        coordinates: [[[94.2150, 26.7450], [94.2162, 26.7450], [94.2162, 26.7440], [94.2150, 26.7440], [94.2150, 26.7450]]]
      }
    }
  ]
};

export const MOCK_ZONES_SUMMARY = [
  {
    zone: "A",
    health_mean: 0.985,
    health_variance: 0.00092,
    health_sd: 0.0303,
    health_lo: 0.935,
    health_hi: 1.0,
    priority: "Low",
    priority_color: "#10b981",
    confidence_label: "High Confidence",
    sampling_rank: 4,
    voi_score: 1.2,
    variance_reduction_pct: 23.4,
    voi_reason: "Zone A is stable with low variance (0.0009) and high confidence. Prioritize other zones first.",
    urgency: "LOW",
    evidence: [
      "NDVI vegetative canopy stable at 0.88 (baseline: 0.86).",
      "4 DNA sequencing checkpoints integrated into Kalman fusion.",
      "Cumulative 180-day simulated precipitation: 312.4 mm."
    ],
    missing_data: [
      "Optical cloud occlusions: NDVI observations captured on fixed 5-day intervals.",
      "Depth profile limitation: Satellite and core samples represent top 15cm."
    ],
    recommended_next_step: "Maintenance: Preserve current regenerative practices; low risk of microbial collapse."
  },
  {
    zone: "B",
    health_mean: 0.468,
    health_variance: 0.00224,
    health_sd: 0.0473,
    health_lo: 0.391,
    health_hi: 0.545,
    priority: "High",
    priority_color: "#ef4444",
    confidence_label: "Low Confidence (High Variance)",
    sampling_rank: 2,
    voi_score: 8.4,
    variance_reduction_pct: 42.5,
    voi_reason: "Zone B has high stress and high variance (0.0022). Testing will narrow the confidence interval and prevent misallocating capital.",
    urgency: "HIGH",
    evidence: [
      "NDVI vegetative vigor declined 48.2% from baseline (start: 0.84, latest: 0.44).",
      "Peak thermal stress detected: 34.2°C during pre-monsoon heat spells.",
      "4 DNA sequencing checkpoints integrated into Kalman fusion."
    ],
    missing_data: [
      "Metagenomic DNA sample gap: 55 days elapsed between day 120 and day 175.",
      "Cloud occlusions during peak monsoon season."
    ],
    recommended_next_step: "High risk confirmed: Prepare soil remediation protocol (microbial inoculant / mulch)."
  },
  {
    zone: "C",
    health_mean: 0.795,
    health_variance: 0.00135,
    health_sd: 0.0367,
    health_lo: 0.735,
    health_hi: 0.855,
    priority: "Moderate",
    priority_color: "#f59e0b",
    confidence_label: "High Confidence",
    sampling_rank: 1,
    voi_score: 9.8,
    variance_reduction_pct: 31.0,
    voi_reason: "Zone C is straddling the critical intervention threshold (0.70) with health at 0.79. A DNA sample reduces uncertainty by 31%, clarifying if emergency mitigation is required.",
    urgency: "CRITICAL",
    evidence: [
      "NDVI vegetative canopy stable at 0.72 (baseline: 0.78).",
      "4 DNA sequencing checkpoints integrated into Kalman fusion."
    ],
    missing_data: [
      "No DNA observation between Day 120 and Day 175."
    ],
    recommended_next_step: "Monitor closely: Watch early warning autocorrelation signal for signs of critical slowing down."
  },
  {
    zone: "D",
    health_mean: 0.942,
    health_variance: 0.00221,
    health_sd: 0.0470,
    health_lo: 0.865,
    health_hi: 1.0,
    priority: "Low",
    priority_color: "#10b981",
    confidence_label: "High Confidence",
    sampling_rank: 3,
    voi_score: 4.1,
    variance_reduction_pct: 42.1,
    voi_reason: "Zone D is stable with low variance and high organic carbon.",
    urgency: "LOW",
    evidence: [
      "NDVI vegetative vigor healthy at 0.82.",
      "Rich humus-rich organic topsoil."
    ],
    missing_data: [
      "Deep subsoil hydrology unobserved."
    ],
    recommended_next_step: "Maintenance: Preserve current organic practices."
  }
];

export function generateMockSeries(zoneId) {
  const isStressed = zoneId === 'B';
  const isMod = zoneId === 'C';
  const points = [];
  const dnaDays = new Set([0, 60, 120, 175]);

  for (let t = 0; t < 180; t++) {
    const t_ratio = t / 180.0;
    let mean = 0.95;
    let ndvi = 0.85;

    if (isStressed) {
      mean = Math.max(0.40, 0.98 - 0.55 * Math.pow(t_ratio, 1.5));
      ndvi = Math.max(0.35, 0.2 + 0.6 * mean + (Math.sin(t / 5) * 0.02));
    } else if (isMod) {
      mean = Math.max(0.72, 0.95 - 0.22 * Math.pow(t_ratio, 1.5));
      ndvi = Math.max(0.60, 0.2 + 0.6 * mean + (Math.cos(t / 6) * 0.02));
    } else {
      mean = 0.98 - 0.03 * t_ratio;
      ndvi = 0.84 + Math.sin(t / 8) * 0.02;
    }

    // Variance widens and shrinks after DNA
    let daysSinceDna = t;
    [0, 60, 120, 175].forEach(d => {
      if (t >= d) daysSinceDna = t - d;
    });
    const variance = 0.0008 + (daysSinceDna / 60) * 0.0015;
    const sd = Math.sqrt(variance);

    points.push({
      day: t,
      zone: zoneId,
      health_mean: parseFloat(mean.toFixed(3)),
      health_variance: parseFloat(variance.toFixed(5)),
      health_sd: parseFloat(sd.toFixed(4)),
      health_lo: parseFloat(Math.max(0, mean - 1.64 * sd).toFixed(3)),
      health_hi: parseFloat(Math.min(1, mean + 1.64 * sd).toFixed(3)),
      ndvi: parseFloat(ndvi.toFixed(3)),
      temp: parseFloat((24.0 + (isStressed ? 8.0 * t_ratio : 2.0) + Math.sin(t) * 1.5).toFixed(1)),
      rain: parseFloat((Math.max(0, 3.0 - (isStressed ? 2.5 * t_ratio : 0.5) + Math.cos(t) * 1.5)).toFixed(1)),
      shannon: dnaDays.has(t) ? parseFloat((2.0 + 2.0 * mean).toFixed(2)) : null,
      has_dna_sample: dnaDays.has(t),
      rolling_variance: parseFloat((0.0001 + (isStressed ? 0.001 * t_ratio : 0.0001)).toFixed(5)),
      lag1_autocorr: parseFloat((isStressed ? Math.min(0.85, 0.15 + 0.7 * t_ratio) : 0.1).toFixed(3)),
      true_health: parseFloat(mean.toFixed(3))
    });
  }

  return points;
}

export function getMockTreatments(zone = 'B', acres = 10) {
  const isStressed = zone === 'B';
  return {
    zone: zone,
    current_health: isStressed ? 0.468 : 0.85,
    treatments: [
      {
        id: "pali_straw_drip",
        name: "Pali Method Straw Mulching + Precision Drip Irrigation",
        cost_per_acre: 130.0,
        cost_inr_per_acre: 10500,
        acres: acres,
        total_cost: Math.round(acres * 130),
        total_cost_inr: Math.round(acres * 10500),
        crop_compat: "Universal (Tea, Horticultural Crops, Turmeric, Ginger)",
        soil_ok: "Acidic soils & Cracking Vertisols; prevents root shear",
        evidence_level: "Moderate-High (ICAR-CRIDA & Assam Agricultural University trials)",
        description: "Heavy crop residue mulching dampens soil surface temperature by 6-9°C during summer heatwaves.",
        drought_benefit: 0.36,
        diversity_benefit: 0.16,
        expected_risk_reduction: 0.325,
        worst_case_5th_pct: 0.245,
        best_case_95th_pct: 0.395,
        pareto_optimal: true
      },
      {
        id: "jeevamrutha_bio_npk",
        name: "Bio-NPK Consortium & Jeevamrutha Microbial Inoculation",
        cost_per_acre: 80.0,
        cost_inr_per_acre: 6500,
        acres: acres,
        total_cost: Math.round(acres * 80),
        total_cost_inr: Math.round(acres * 6500),
        crop_compat: "Tea estates, Black Rice, Assam Lemon, Spices",
        soil_ok: "Effective in North East organic soils with organic carbon > 0.5%",
        evidence_level: "Moderate (ICAR-NBAIM Mau & AAU Jorhat genomic assays)",
        description: "Fermented indigenous beneficial consortium (Azotobacter, PSB, KMB, Trichoderma viride, VAM).",
        drought_benefit: 0.24,
        diversity_benefit: 0.40,
        expected_risk_reduction: 0.290,
        worst_case_5th_pct: 0.210,
        best_case_95th_pct: 0.370,
        pareto_optimal: true
      },
      {
        id: "dhaincha_sunnhemp",
        name: "Dhaincha & Sunnhemp Green Manuring (Sesbania + Crotalaria)",
        cost_per_acre: 55.0,
        cost_inr_per_acre: 4500,
        acres: acres,
        total_cost: Math.round(acres * 55),
        total_cost_inr: Math.round(acres * 4500),
        crop_compat: "High (Black Rice, Paddy rotations, Tea replantation)",
        soil_ok: "Brahmaputra Alluvial Loam & Acidic soils (pH 5.0 - 7.5)",
        evidence_level: "High (ICAR-CRIDA multi-decade trials)",
        description: "Adds 15-20 t/ha biomass, restores active soil organic carbon (SOC), and fixes 60-80 kg N/ha.",
        drought_benefit: 0.20,
        diversity_benefit: 0.26,
        expected_risk_reduction: 0.220,
        worst_case_5th_pct: 0.165,
        best_case_95th_pct: 0.285,
        pareto_optimal: false
      }
    ],
    assumptions: {
      simulation_method: "Monte Carlo North East India Agro-Ecological stress simulation",
      scenarios_evaluated: 500,
      temperature_delta_c: "Uniform(0.0, 4.0 °C)",
      rainfall_multiplier: "Uniform(0.5, 1.0)",
      worst_case_metric: "5th percentile risk reduction (severe drought test)",
      pareto_criteria: "Non-dominated across (Cost, Expected Benefit, 5th Percentile Worst-Case)",
      agronomic_advisory: "Check local KVK (Krishi Vigyan Kendra) & Assam Agricultural University (AAU) guidance."
    },
    disclaimer: "Simulated data. Screening result, not a laboratory diagnosis."
  };
}

export function getMockRecovery(treatedZone = 'B', controlZone = 'A') {
  const treatmentDay = 120;
  const series = [];
  for (let t = 0; t < 180; t++) {
    const t_ratio = t / 180.0;
    const isTreatedStressed = treatedZone === 'B';
    const treatedBase = isTreatedStressed ? Math.max(0.40, 0.85 - 0.45 * Math.pow(t_ratio, 1.4)) : 0.88;
    const controlVal = 0.86 + Math.sin(t / 8) * 0.02;
    const treatedActual = t < treatmentDay ? treatedBase : treatedBase + 0.12 * Math.pow((t - treatmentDay) / 60.0, 0.8);
    const counterfactual = t < treatmentDay ? treatedActual : treatedBase;

    series.push({
      day: t,
      treated_actual: parseFloat(treatedActual.toFixed(3)),
      control_actual: parseFloat(controlVal.toFixed(3)),
      counterfactual: parseFloat(counterfactual.toFixed(3)),
      is_post_treatment: t >= treatmentDay
    });
  }

  return {
    status: "success",
    treated_zone: treatedZone,
    control_zone: controlZone,
    treatment_day: treatmentDay,
    did_estimate: 0.142,
    ci_95: [0.088, 0.196],
    p_value_approx: 0.002,
    means: {
      treated_pre: 0.645,
      treated_post: 0.765,
      control_pre: 0.862,
      control_post: 0.864,
      treated_delta: 0.120,
      control_delta: 0.002
    },
    series: series,
    caveat: "Change does not prove causation. Assumes parallel pre-treatment trends hold.",
    disclaimer: "Simulated data. Screening result, not a laboratory diagnosis."
  };
}

