import React, { useState, useEffect } from 'react';
import PlotlyChart from './PlotlyChart';
import { DollarSign, Award, CheckCircle2, AlertCircle, Info, Sparkles, TrendingUp, Sliders } from 'lucide-react';

import { getMockTreatments } from '../mockData';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export default function TreatmentTab({ selectedZone, zones, onSelectZone }) {
  const [acres, setAcres] = useState(10);
  const [treatmentData, setTreatmentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTreatments = async (zone, acresVal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/zones/${zone}/treatments?acres=${acresVal}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setTreatmentData(data);
    } catch (err) {
      console.warn("Backend unavailable; using client mock treatments:", err.message);
      // Fallback for Vercel / GitHub Pages deployment
      setTreatmentData(getMockTreatments(zone, acresVal));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedZone) {
      fetchTreatments(selectedZone, acres);
    }
  }, [selectedZone, acres]);

  const handleAcresChange = (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 0) {
      setAcres(val);
    }
  };

  const treatments = treatmentData?.treatments || [];
  const assumptions = treatmentData?.assumptions || {};

  // Build Plotly Scatter Chart: Cost vs Expected Benefit vs Worst-Case
  const paretoOptions = treatments.filter(t => t.pareto_optimal);
  const nonParetoOptions = treatments.filter(t => !t.pareto_optimal);

  const chartTraces = [
    // Non-Pareto
    {
      x: nonParetoOptions.map(t => t.total_cost_inr || t.total_cost),
      y: nonParetoOptions.map(t => t.expected_risk_reduction),
      text: nonParetoOptions.map(t => `${t.name}<br>Worst-Case: ${t.worst_case_5th_pct}`),
      mode: 'markers+text',
      textposition: 'top center',
      marker: {
        size: 14,
        color: '#64748b',
        line: { color: '#94a3b8', width: 1.5 }
      },
      name: 'Standard Option',
      hovertemplate: '<b>%{text}</b><br>Total Cost: ₹%{x:,.0f}<br>Expected Benefit: %{y:.3f}<extra></extra>'
    },
    // Pareto-Optimal
    {
      x: paretoOptions.map(t => t.total_cost_inr || t.total_cost),
      y: paretoOptions.map(t => t.expected_risk_reduction),
      text: paretoOptions.map(t => `★ ${t.name}<br>Worst-Case: ${t.worst_case_5th_pct}`),
      mode: 'markers+text',
      textposition: 'top center',
      marker: {
        size: 18,
        color: '#10b981',
        line: { color: '#f59e0b', width: 2.5 }
      },
      name: 'Pareto-Optimal Frontier',
      hovertemplate: '<b>%{text}</b><br>Total Cost: ₹%{x:,.0f}<br>Expected Benefit: %{y:.3f}<extra></extra>'
    }
  ];

  const chartLayout = {
    title: {
      text: `Treatment Decision Frontier (Zone ${selectedZone}, ${acres} Acres)`,
      font: { color: '#f8fafc', size: 13, family: 'Outfit, sans-serif' }
    },
    height: 280,
    margin: { l: 45, r: 25, t: 35, b: 40 },
    xaxis: {
      title: 'Total Capital Investment (₹ INR)',
      gridcolor: '#1e293b',
      tickprefix: '₹',
      tickfont: { color: '#64748b', size: 10 }
    },
    yaxis: {
      title: 'Expected Risk Reduction',
      gridcolor: '#1e293b',
      tickfont: { color: '#64748b', size: 10 }
    },
    legend: {
      orientation: 'h',
      x: 0,
      y: 1.25,
      font: { color: '#94a3b8', size: 10 }
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 shadow-xl space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="font-heading font-bold text-base text-white flex items-center gap-2">
            Soil Restoration & Mitigation Economics
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
              500 Scenarios
            </span>
          </h2>
          <p className="text-xs text-slate-400">Monte Carlo climate stress test evaluating biological & agronomic mitigations</p>
        </div>

        {/* Zone Selector and Editable Acres */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-700/80">
            <span className="text-xs text-slate-400 pl-2">Zone:</span>
            {['A', 'B', 'C', 'D'].map(z => (
              <button
                key={z}
                onClick={() => onSelectZone(z)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  selectedZone === z ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {z}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Treatment Acres:</span>
            <input
              type="number"
              min="1"
              max="500"
              value={acres}
              onChange={handleAcresChange}
              className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="py-12 flex justify-center text-slate-400 text-xs">
          Simulating 500 Monte Carlo climate resilience scenarios...
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300">
          Error loading treatments: {error}
        </div>
      )}

      {!loading && treatments.length > 0 && (
        <>
          {/* Comparison Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-700/80">
                <tr>
                  <th className="py-2.5 px-3">Restoration Strategy</th>
                  <th className="py-2.5 px-3">Cost / Acre</th>
                  <th className="py-2.5 px-3">Total Cost ({acres} ac)</th>
                  <th className="py-2.5 px-3">Expected Benefit</th>
                  <th className="py-2.5 px-3">5th % Worst-Case</th>
                  <th className="py-2.5 px-3">Compatibility & Soil</th>
                  <th className="py-2.5 px-3">Pareto Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {treatments.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-white text-xs">{t.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{t.description}</div>
                      <div className="text-[10px] text-indigo-300 font-mono mt-0.5">{t.evidence_level}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-200">
                      <div>₹{t.cost_inr_per_acre?.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">(${t.cost_per_acre?.toFixed(0)})</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      <div>₹{t.total_cost_inr?.toLocaleString()}</div>
                      <div className="text-[10px] text-emerald-400 font-normal">(${t.total_cost?.toLocaleString()})</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-400 font-bold">
                      +{t.expected_risk_reduction?.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-300">
                      +{t.worst_case_5th_pct?.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-300">
                      <div>{t.crop_compat}</div>
                      <div className="text-[10px] text-slate-400 italic">{t.soil_ok}</div>
                    </td>
                    <td className="py-3 px-3">
                      {t.pareto_optimal ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1 shadow-sm">
                          <Award className="w-3 h-3 text-amber-400" />
                          <span>Pareto Optimal</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] text-slate-400 bg-slate-800 border border-slate-700">
                          Dominated
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pareto Frontier Plotly Chart */}
          <div className="rounded-xl bg-slate-950/60 p-2 border border-slate-800/80">
            <PlotlyChart data={chartTraces} layout={chartLayout} />
          </div>

          {/* Transparent Assumptions & Advisory */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <Info className="w-4 h-4 text-amber-400" />
              <span>Transparent Model Assumptions & Agronomic Advisory</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300 text-[11px]">
              <div>• <strong>Monte Carlo Specs:</strong> {assumptions.scenarios_evaluated} climate realizations over {assumptions.temperature_delta_c} and {assumptions.rainfall_multiplier}.</div>
              <div>• <strong>Worst-Case Metric:</strong> {assumptions.worst_case_metric}.</div>
              <div>• <strong>Pareto Frontier:</strong> {assumptions.pareto_criteria}.</div>
              <div>• <strong>Caveat:</strong> <span className="text-amber-200 font-semibold">{assumptions.agronomic_advisory}</span></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
