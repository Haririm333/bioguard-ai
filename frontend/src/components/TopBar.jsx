import React from 'react';
import { Shield, Dna, Activity, RotateCcw, AlertTriangle, Layers, Thermometer, DollarSign, GitCompare } from 'lucide-react';

export default function TopBar({ activeTab, onSelectTab, onResetAll, resetting }) {
  const tabs = [
    { id: 'overview', label: 'Farm Map & Fusion', icon: Layers },
    { id: 'simulator', label: 'Climate Stress Simulator', icon: Thermometer },
    { id: 'treatments', label: 'Treatment Economics', icon: DollarSign },
    { id: 'recovery', label: 'Counterfactual Recovery', icon: GitCompare }
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-heading font-black text-lg text-white tracking-tight">
                  BIOGUARD <span className="text-emerald-400">AI</span>
                </h1>
                {/* Permanent SIMULATED DATA badge */}
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm animate-pulse-slow">
                  SIMULATED DATA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Uncertainty-First Soil Microbiome Intelligence • Upper Assam Agro-Ecological Basin, North East India
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Global Reset Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onResetAll}
              disabled={resetting}
              title="Reset all dynamic DNA samples and climate shifts to baseline"
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-slate-400 ${resetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Reset System</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1 border-t border-slate-800/60">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 ${
                  isActive ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
