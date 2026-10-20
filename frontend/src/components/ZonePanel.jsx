import React from 'react';
import PlotlyChart from './PlotlyChart';
import { ShieldAlert, AlertTriangle, CheckCircle, Info, Sparkles, TrendingUp, Clock, Dna, HelpCircle } from 'lucide-react';

export default function ZonePanel({ zoneData, seriesData, loading, onCollectSample, samplingLoading }) {
  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-slate-800 shadow-xl flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs">Fetching Kalman filter series and early-warning signals...</p>
        </div>
      </div>
    );
  }

  if (!seriesData || !zoneData) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-slate-800 shadow-xl flex items-center justify-center min-h-[500px] text-slate-400 text-xs">
        Select a zone on the farm map to inspect its Kalman fusion and diagnostic evidence.
      </div>
    );
  }

  const days = seriesData.map(d => d.day);
  const healthMean = seriesData.map(d => d.health_mean);
  const healthLo = seriesData.map(d => d.health_lo);
  const healthHi = seriesData.map(d => d.health_hi);
  const ndvi = seriesData.map(d => d.ndvi);

  // Extract DNA sample points
  const dnaPoints = seriesData.filter(d => d.has_dna_sample);
  const dnaDays = dnaPoints.map(d => d.day);
  const dnaHealth = dnaPoints.map(d => d.health_mean);

  // Early warning signals
  const rollingVar = seriesData.map(d => d.rolling_variance);
  const lag1Corr = seriesData.map(d => d.lag1_autocorr);

  // Primary Plotly traces: Kalman Mean, 90% Band, NDVI overlay, DNA checkpoints
  const primaryTraces = [
    // 90% Hi boundary (invisible line for fill)
    {
      x: days,
      y: healthHi,
      mode: 'lines',
      line: { color: 'rgba(52, 211, 153, 0.05)', width: 0 },
      showlegend: false,
      name: '90% Upper Bound',
      hoverinfo: 'skip'
    },
    // 90% Lo boundary (fills up to Hi)
    {
      x: days,
      y: healthLo,
      mode: 'lines',
      fill: 'tonexty',
      fillcolor: 'rgba(16, 185, 129, 0.16)',
      line: { color: 'rgba(52, 211, 153, 0.05)', width: 0 },
      name: '90% Confidence Band (±1.64σ)',
      hoverinfo: 'skip'
    },
    // Fused health mean
    {
      x: days,
      y: healthMean,
      mode: 'lines',
      line: { color: '#10b981', width: 2.5 },
      name: 'Fused Latent Health h(t)',
      hovertemplate: 'Day %{x}: Latent Health = %{y:.3f}<extra></extra>'
    },
    // Raw NDVI observations
    {
      x: days,
      y: ndvi,
      mode: 'lines',
      line: { color: 'rgba(251, 191, 36, 0.65)', width: 1.2, dash: 'dot' },
      name: 'NDVI (5-day cadence)',
      hovertemplate: 'Day %{x}: NDVI = %{y:.3f}<extra></extra>'
    },
    // DNA Metagenomic Checkpoints
    {
      x: dnaDays,
      y: dnaHealth,
      mode: 'markers',
      marker: {
        symbol: 'diamond',
        size: 9,
        color: '#6366f1',
        line: { color: '#ffffff', width: 1.5 }
      },
      name: 'DNA Sequencing Event',
      hovertemplate: 'Day %{x}: DNA Metagenomic Sample<br>Latent Health: %{y:.3f}<extra></extra>'
    }
  ];

  const primaryLayout = {
    title: {
      text: `Zone ${zoneData.zone} — Kalman Filter Latent Health Fusion`,
      font: { color: '#f8fafc', size: 13, family: 'Outfit, sans-serif' }
    },
    height: 250,
    margin: { l: 40, r: 20, t: 35, b: 35 },
    xaxis: {
      title: 'Timeline (Days 0 - 180)',
      gridcolor: '#1e293b',
      zerolinecolor: '#1e293b',
      tickfont: { color: '#64748b', size: 10 }
    },
    yaxis: {
      title: 'Health h ∈ [0, 1]',
      range: [0.0, 1.05],
      gridcolor: '#1e293b',
      zerolinecolor: '#1e293b',
      tickfont: { color: '#64748b', size: 10 }
    },
    legend: {
      orientation: 'h',
      x: 0,
      y: 1.25,
      font: { color: '#94a3b8', size: 10 }
    }
  };

  // Secondary Chart: Early Warning Signals (Rolling variance and lag-1 autocorrelation)
  const ewsTraces = [
    {
      x: days,
      y: rollingVar,
      mode: 'lines',
      line: { color: '#f59e0b', width: 1.8 },
      name: 'Rolling Variance (45d window)',
      hovertemplate: 'Day %{x}: Var = %{y:.5f}<extra></extra>'
    },
    {
      x: days,
      y: lag1Corr,
      mode: 'lines',
      line: { color: '#a855f7', width: 1.8 },
      yaxis: 'y2',
      name: 'Lag-1 Autocorrelation',
      hovertemplate: 'Day %{x}: AC(1) = %{y:.3f}<extra></extra>'
    }
  ];

  const ewsLayout = {
    title: {
      text: 'Critical Slowing Down: Early-Warning Ecosystem Regime Shift Signals',
      font: { color: '#f8fafc', size: 12, family: 'Outfit, sans-serif' }
    },
    height: 170,
    margin: { l: 40, r: 40, t: 30, b: 30 },
    xaxis: {
      title: '',
      gridcolor: '#1e293b',
      tickfont: { color: '#64748b', size: 9 }
    },
    yaxis: {
      title: 'Residual Var',
      gridcolor: '#1e293b',
      tickfont: { color: '#f59e0b', size: 9 }
    },
    yaxis2: {
      title: 'Lag-1 Corr',
      overlaying: 'y',
      side: 'right',
      range: [-0.5, 1.0],
      tickfont: { color: '#a855f7', size: 9 }
    },
    legend: {
      orientation: 'h',
      x: 0,
      y: 1.28,
      font: { color: '#94a3b8', size: 9 }
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 shadow-xl space-y-5">
      {/* Zone Header Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-heading text-lg font-bold text-white">Zone {zoneData.zone} Diagnostic Intel</h2>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
              zoneData.priority === 'High' ? 'bg-red-950/80 text-red-300 border-red-700/60' :
              zoneData.priority === 'Moderate' ? 'bg-amber-950/80 text-amber-300 border-amber-700/60' :
              'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
            }`}>
              {zoneData.priority} Priority
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              {zoneData.confidence_label}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Current Latent Health: <strong className="text-white font-mono">{zoneData.health_mean?.toFixed(3)}</strong> (90% CI: {zoneData.health_lo?.toFixed(3)} - {zoneData.health_hi?.toFixed(3)}) | Variance: <span className="font-mono text-emerald-400">{zoneData.health_variance?.toFixed(5)}</span>
          </p>
        </div>

        <button
          onClick={() => onCollectSample(zoneData.zone)}
          disabled={samplingLoading}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Dna className="w-3.5 h-3.5" />
          <span>{samplingLoading ? 'Sequencing...' : 'Collapse Band with DNA Sample'}</span>
        </button>
      </div>

      {/* Primary Chart: Fused Health & Confidence Band */}
      <div className="rounded-xl bg-slate-950/60 p-2 border border-slate-800/80">
        <PlotlyChart data={primaryTraces} layout={primaryLayout} />
      </div>

      {/* Secondary Chart: Early Warning Signals */}
      <div className="rounded-xl bg-slate-950/60 p-2 border border-slate-800/80">
        <PlotlyChart data={ewsTraces} layout={ewsLayout} />
      </div>

      {/* Diagnostic Evidence & Missing Data Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Evidence Card */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Multi-Source Empirical Evidence</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {zoneData.evidence?.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5 leading-snug">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Missing Data & Uncertainty Drivers */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Data Gaps & Uncertainty Drivers</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {zoneData.missing_data?.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5 leading-snug">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Recommended Next Step Box */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800/60 to-slate-900 border border-emerald-500/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <strong className="text-white">Recommended Next Action:</strong>
            <span className="text-slate-300 ml-1.5">{zoneData.recommended_next_step}</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 font-mono shrink-0 hidden sm:block">
          VOI Rank: #{zoneData.sampling_rank}
        </div>
      </div>
    </div>
  );
}
