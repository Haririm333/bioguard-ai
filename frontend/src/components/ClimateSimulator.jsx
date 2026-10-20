import React, { useState, useEffect } from 'react';
import { Thermometer, CloudRain, Sun, RotateCcw, AlertTriangle, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

export default function ClimateSimulator({
  onRunSimulation,
  simResult,
  simLoading,
  onResetSimulation
}) {
  const [tempDelta, setTempDelta] = useState(0.0);
  const [rainMult, setRainMult] = useState(1.0);
  const [droughtDays, setDroughtDays] = useState(0);

  // Trigger simulation when slider values change
  const triggerSim = (t, r, d) => {
    onRunSimulation({
      temp_delta: parseFloat(t),
      rain_mult: parseFloat(r),
      drought_days: parseInt(d, 10)
    });
  };

  const handleTempChange = (val) => {
    setTempDelta(val);
    triggerSim(val, rainMult, droughtDays);
  };

  const handleRainChange = (val) => {
    setRainMult(val);
    triggerSim(tempDelta, val, droughtDays);
  };

  const handleDroughtChange = (val) => {
    setDroughtDays(val);
    triggerSim(tempDelta, rainMult, val);
  };

  const applyPreset = (t, r, d) => {
    setTempDelta(t);
    setRainMult(r);
    setDroughtDays(d);
    triggerSim(t, r, d);
  };

  const handleReset = () => {
    setTempDelta(0.0);
    setRainMult(1.0);
    setDroughtDays(0);
    onResetSimulation();
  };

  const isShifted = tempDelta > 0 || rainMult < 1.0 || droughtDays > 0;

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 shadow-xl space-y-5">
      {/* Simulator Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-base text-white flex items-center gap-2">
              Climate Stress Simulator
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                Forward Stress Test
              </span>
            </h2>
            <p className="text-xs text-slate-400">Project soil health deterioration under climate shock trajectories</p>
          </div>
        </div>

        {/* Reset / Status */}
        <div className="flex items-center gap-2">
          {isShifted && (
            <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Stress Shift Active</span>
            </span>
          )}
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* Preset Scenarios */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-medium">Scenario Presets:</span>
        <button
          onClick={() => applyPreset(0.0, 1.0, 0)}
          className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
            !isShifted ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600' : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          Baseline 2026
        </button>
        <button
          onClick={() => applyPreset(1.8, 0.85, 14)}
          className="px-2.5 py-1 text-xs rounded-lg border bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700 hover:text-amber-300 transition-all"
        >
          2030 Heat Wave (+1.8°C, -15% rain)
        </button>
        <button
          onClick={() => applyPreset(3.2, 0.60, 35)}
          className="px-2.5 py-1 text-xs rounded-lg border bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700 hover:text-red-300 transition-all"
        >
          Severe Megadrought (+3.2°C, -40% rain, 35d spell)
        </button>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
        {/* Slider 1: Temperature */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-rose-400" />
              <span>Temperature Shift</span>
            </span>
            <span className="font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50">
              +{tempDelta.toFixed(1)} °C
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="4.0"
            step="0.1"
            value={tempDelta}
            onChange={(e) => handleTempChange(e.target.value)}
            className="w-full accent-rose-500 cursor-pointer bg-slate-800 h-2 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>0.0°C</span>
            <span>+2.0°C</span>
            <span>+4.0°C (Extreme)</span>
          </div>
        </div>

        {/* Slider 2: Rainfall Multiplier */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-cyan-400" />
              <span>Precipitation Multiplier</span>
            </span>
            <span className="font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
              {(rainMult * 100).toFixed(0)}% ({rainMult.toFixed(2)}x)
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.0"
            step="0.05"
            value={rainMult}
            onChange={(e) => handleRainChange(e.target.value)}
            className="w-full accent-cyan-500 cursor-pointer bg-slate-800 h-2 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>50% (Drought)</span>
            <span>75%</span>
            <span>100% (Normal)</span>
          </div>
        </div>

        {/* Slider 3: Drought Length */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Drought Spell Duration</span>
            </span>
            <span className="font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
              {droughtDays} Days
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            step="5"
            value={droughtDays}
            onChange={(e) => handleDroughtChange(e.target.value)}
            className="w-full accent-amber-500 cursor-pointer bg-slate-800 h-2 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>0 Days</span>
            <span>30 Days</span>
            <span>60 Days (Prolonged)</span>
          </div>
        </div>
      </div>

      {/* Before / After Impact Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Zone Stress Trajectory Comparison</span>
          </div>
          <div className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700 font-mono">
            Model estimate under stated assumptions
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-700/80">
              <tr>
                <th className="py-2.5 px-3">Zone</th>
                <th className="py-2.5 px-3">Baseline Health</th>
                <th className="py-2.5 px-3">Simulated Health</th>
                <th className="py-2.5 px-3">Net Health Δ</th>
                <th className="py-2.5 px-3">Simulated 90% Band</th>
                <th className="py-2.5 px-3">Stress Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {simResult?.zones?.map((z) => {
                const deltaNegative = z.health_delta < 0;
                return (
                  <tr key={z.zone} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: z.priority_color }}></span>
                      Zone {z.zone}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {z.baseline_health?.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-white">
                      {z.simulated_health?.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className={`px-2 py-0.5 rounded ${
                        deltaNegative ? 'bg-red-950/70 text-red-300 border border-red-800/50' : 'text-slate-400'
                      }`}>
                        {z.health_delta >= 0 ? `+${z.health_delta.toFixed(3)}` : z.health_delta.toFixed(3)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                      [{z.simulated_lo?.toFixed(3)} - {z.simulated_hi?.toFixed(3)}]
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        z.priority === 'High' ? 'bg-red-950 text-red-300 border-red-700' :
                        z.priority === 'Moderate' ? 'bg-amber-950 text-amber-300 border-amber-700' :
                        'bg-emerald-950 text-emerald-300 border-emerald-700'
                      }`}>
                        {z.priority} Risk
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
