import React, { useState } from 'react';
import { Target, Sparkles, CheckCircle2, ArrowRight, Dna, TrendingDown, DollarSign } from 'lucide-react';

export default function SamplingAdvisor({
  zones,
  onCollectSample,
  samplingLoading,
  lastSampleResult,
  selectedZone,
  onSelectZone
}) {
  const [activeZoneToSample, setActiveZoneToSample] = useState('B');

  // Sort zones by sampling rank (1 is highest)
  const rankedZones = [...zones].sort((a, b) => (a.sampling_rank || 99) - (b.sampling_rank || 99));
  const topZone = rankedZones[0];

  const handleSampleClick = (zoneId) => {
    setActiveZoneToSample(zoneId);
    onCollectSample(zoneId);
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between h-full">
      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                Value-of-Information Advisor
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  VOI Model
                </span>
              </h3>
              <p className="text-xs text-slate-400">Bayesian decision-theoretic sampling optimization</p>
            </div>
          </div>
        </div>

        {/* Top Recommendation Banner */}
        {topZone && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900/90 border border-emerald-500/30 mb-4 shadow-inner">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span>Top Recommendation</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-700/50">
                Rank #1
              </span>
            </div>
            <div className="font-semibold text-white text-sm">
              Test <span className="text-emerald-400 font-bold underline decoration-emerald-500/60 decoration-2">Zone {topZone.zone}</span> First
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {topZone.voi_reason || `Zone ${topZone.zone} is nearest the critical intervention threshold (0.70) with high uncertainty. Testing resolves maximum posterior risk.`}
            </p>
            <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400">Predicted Variance Reduction:</span>
              <strong className="text-emerald-300 font-mono">
                {topZone.variance_reduction_pct ? `${topZone.variance_reduction_pct}%` : '72%'}
              </strong>
            </div>
          </div>
        )}

        {/* Collapse Feedback Alert */}
        {lastSampleResult && (
          <div className="mb-4 p-3 rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-xs animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-indigo-300 mb-1">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span>DNA Observation Integrated at Day 179</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              Zone {lastSampleResult.zone}: Uncertainty collapsed by <strong className="text-white font-mono">{lastSampleResult.variance_reduction_pct}%</strong>. Band width narrowed from <span className="line-through text-slate-400">{lastSampleResult.pre_sample.band_width_90}</span> to <span className="text-emerald-400 font-bold">{lastSampleResult.post_sample.band_width_90}</span>.
            </p>
          </div>
        )}

        {/* Ranked Zones List */}
        <div className="space-y-2 mb-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex justify-between px-1">
            <span>Zone Priority</span>
            <span>VOI Score / Uncertainty</span>
          </div>

          {rankedZones.map((z) => {
            const isSelected = selectedZone === z.zone;
            return (
              <div
                key={z.zone}
                onClick={() => onSelectZone(z.zone)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-800/90 border-emerald-500/50 shadow-md'
                    : 'bg-slate-900/50 border-slate-800/70 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    z.sampling_rank === 1 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {z.sampling_rank || '-'}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Zone {z.zone}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                        z.priority === 'High' ? 'bg-red-950 text-red-300' :
                        z.priority === 'Moderate' ? 'bg-amber-950 text-amber-300' :
                        'bg-emerald-950 text-emerald-300'
                      }`}>
                        {z.priority} Risk
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Health: <strong className="text-slate-200">{z.health_mean?.toFixed(2)}</strong> | Var: <span className="font-mono">{z.health_variance?.toFixed(4)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      +{z.variance_reduction_pct || 70}%
                    </div>
                    <div className="text-[10px] text-slate-400">reduction</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSampleClick(z.zone);
                    }}
                    disabled={samplingLoading}
                    title="Collect physical soil sample for this zone"
                    className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all text-xs"
                  >
                    <Dna className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Button: Collect Soil Sample on selected/top zone */}
      <div className="pt-3 border-t border-slate-800">
        <button
          onClick={() => handleSampleClick(selectedZone || topZone?.zone || 'B')}
          disabled={samplingLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Dna className={`w-4 h-4 ${samplingLoading ? 'animate-spin' : ''}`} />
          <span>
            {samplingLoading ? 'Sequencing Sample...' : `Collect Soil Sample (Zone ${selectedZone || topZone?.zone || 'B'})`}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-emerald-200" />
        </button>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          Adds dynamic DNA checkpoint at Day 179; re-runs Kalman filter to collapse uncertainty band.
        </p>
      </div>
    </div>
  );
}
