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
