import React, { useState, useEffect } from 'react';
import PlotlyChart from './PlotlyChart';
import { GitCompare, AlertTriangle, CheckCircle, Info, TrendingUp, HelpCircle } from 'lucide-react';

export default function RecoveryTab({ selectedZone }) {
  const [treatedZone, setTreatedZone] = useState(selectedZone || 'B');
  const [controlZone, setControlZone] = useState('A');
  const [recoveryData, setRecoveryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecovery = async (tZone, cZone) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://127.0.0.1:8000/zones/${tZone}/recovery?control=${cZone}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setRecoveryData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecovery(treatedZone, controlZone);
  }, [treatedZone, controlZone]);

  const series = recoveryData?.series || [];
  const days = series.map(d => d.day);
  const treatedActual = series.map(d => d.treated_actual);
  const controlActual = series.map(d => d.control_actual);
  const counterfactual = series.map(d => d.counterfactual);

  const treatmentDay = recoveryData?.treatment_day || 120;

  // Build Plotly Traces: Treated Actual, Control Actual, Counterfactual Line, Intervention Line
  const traces = [
    {
      x: days,
      y: controlActual,
      mode: 'lines',
      line: { color: '#10b981', width: 2 },
      name: `Control (Zone ${controlZone}) Actual`,
      hovertemplate: 'Day %{x}: Control NDVI = %{y:.3f}<extra></extra>'
    },
    {
      x: days,
      y: treatedActual,
      mode: 'lines',
      line: { color: '#f59e0b', width: 2.2 },
      name: `Treated (Zone ${treatedZone}) Observed`,
      hovertemplate: 'Day %{x}: Observed NDVI = %{y:.3f}<extra></extra>'
    },
    {
      x: days.filter(d => d >= treatmentDay),
      y: counterfactual.filter((_, idx) => days[idx] >= treatmentDay),
      mode: 'lines',
      line: { color: '#06b6d4', width: 2.5, dash: 'dash' },
      name: `Counterfactual (Unmanaged Zone ${treatedZone})`,
      hovertemplate: 'Day %{x}: Counterfactual NDVI = %{y:.3f}<extra></extra>'
    }
  ];

  const layout = {
    title: {
      text: `Difference-in-Differences & Counterfactual Recovery (Zone ${treatedZone} vs Control ${controlZone})`,
      font: { color: '#f8fafc', size: 13, family: 'Outfit, sans-serif' }
    },
    height: 300,
    margin: { l: 45, r: 25, t: 40, b: 35 },
    xaxis: {
      title: 'Timeline (Days 0 - 180)',
      gridcolor: '#1e293b',
      tickfont: { color: '#64748b', size: 10 }
    },
    yaxis: {
      title: 'Vegetation Canopy (NDVI)',
      gridcolor: '#1e293b',
      tickfont: { color: '#64748b', size: 10 }
    },
    shapes: [
      {
        type: 'line',
        x0: treatmentDay,
        y0: 0,
        x1: treatmentDay,
        y1: 1,
        line: { color: '#a855f7', width: 2, dash: 'dot' }
      }
    ],
    annotations: [
      {
        x: treatmentDay,
        y: 0.85,
        xref: 'x',
        yref: 'y',
        text: 'Treatment Intervention (Day 120)',
        showarrow: true,
        arrowhead: 2,
        arrowcolor: '#a855f7',
        font: { color: '#d8b4fe', size: 10 },
        bgcolor: '#3b0764',
        bordercolor: '#a855f7'
      }
    ],
    legend: {
      orientation: 'h',
      x: 0,
      y: 1.25,
      font: { color: '#94a3b8', size: 10 }
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 shadow-xl space-y-5">
      {/* Header & Zone Picker */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-base text-white flex items-center gap-2">
              Counterfactual Recovery & Causal Inference
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                DiD Estimator
              </span>
            </h2>
            <p className="text-xs text-slate-400">Synthetic control & difference-in-differences evaluation of intervention efficacy</p>
          </div>
        </div>

        {/* Zone Pickers */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-700/80 text-xs">
            <span className="text-slate-400">Treated Zone:</span>
            <select
              value={treatedZone}
              onChange={(e) => setTreatedZone(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-white font-bold text-xs"
            >
              {['A', 'B', 'C', 'D'].map(z => (
                <option key={z} value={z}>Zone {z}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-700/80 text-xs">
            <span className="text-slate-400">Control Zone:</span>
            <select
              value={controlZone}
              onChange={(e) => setControlZone(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-white font-bold text-xs"
            >
              {['A', 'B', 'C', 'D'].map(z => (
                <option key={z} value={z}>Zone {z}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="py-12 flex justify-center text-slate-400 text-xs">
          Calculating Difference-in-Differences and 1,000 bootstrap iterations...
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300">
          Error: {error}
        </div>
      )}

      {/* Needs more data state */}
      {recoveryData?.status === 'needs_more_data' && (
        <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="font-bold">Insufficient Data For Causal Inference</div>
            <p className="mt-1 text-slate-300">{recoveryData.message}</p>
            <div className="mt-2 font-mono text-[11px] text-amber-300">
              Minimum 20 observations per pre/post window required to guarantee statistical power.
            </div>
          </div>
        </div>
      )}

      {/* Main Results */}
      {!loading && recoveryData?.status === 'success' && (
        <>
          {/* Key Metric Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase font-mono">DiD Causal Effect (β̂)</div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {recoveryData.did_estimate >= 0 ? `+${recoveryData.did_estimate}` : recoveryData.did_estimate}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Estimated NDVI differential drift</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase font-mono">Bootstrap 95% Confidence Interval</div>
              <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                [{recoveryData.ci_95?.[0]} , {recoveryData.ci_95?.[1]}]
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">1,000 empirical resamples</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase font-mono">Treated Pre/Post Mean NDVI</div>
              <div className="text-sm font-bold font-mono text-amber-300 mt-1">
                {recoveryData.means?.treated_pre} → {recoveryData.means?.treated_post}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Control: {recoveryData.means?.control_pre} → {recoveryData.means?.control_post}</div>
            </div>
          </div>

          {/* Plotly Chart */}
          <div className="rounded-xl bg-slate-950/60 p-2 border border-slate-800/80">
            <PlotlyChart data={traces} layout={layout} />
          </div>

          {/* Causal Caveat Notice */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong className="text-white">Methodological Caveat:</strong> {recoveryData.caveat}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0 hidden md:block">
              Quasi-Experimental Design
            </span>
          </div>
        </>
      )}
    </div>
  );
}
