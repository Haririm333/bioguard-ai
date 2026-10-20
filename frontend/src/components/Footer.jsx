import React from 'react';
import { AlertTriangle, ShieldCheck, HelpCircle, FileText } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 mt-12 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Limitations & Caveats Panel */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider mb-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Core Model Limitations & Agronomic Caveats</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-slate-400 text-[11px] leading-relaxed">
            <div className="space-y-1">
              <strong className="text-slate-200 block">1. DNA Presence ≠ Metabolic Activity</strong>
              <p>Metagenomic 16S/ITS sequencing detects genomic presence. It does not measure transcription rates, enzymatic turnover, or microbial respiration.</p>
            </div>

            <div className="space-y-1">
              <strong className="text-slate-200 block">2. NDVI Cannot Prove Microbial Damage</strong>
              <p>Optical satellite indices capture canopy chlorophyll absorption. Canopy stress may be driven by root pathogens, compaction, or nitrogen leaching rather than microbial die-off.</p>
            </div>

            <div className="space-y-1">
              <strong className="text-slate-200 block">3. In Silico Synthetic Simulations</strong>
              <p>All data and climate stress response curves are simulated models. They do not constitute certified laboratory diagnoses or regulatory predictions.</p>
            </div>

            <div className="space-y-1">
              <strong className="text-slate-200 block">4. Certified Agronomist Verification</strong>
              <p>Before purchasing biological inoculants, cover crop seed, or irrigation equipment, consult local university agricultural extension agents and soil chemistry tests.</p>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-slate-300">BIOGUARD AI</span>
            <span>•</span>
            <span className="font-mono text-amber-400 font-semibold">ALL DATA IS SIMULATED FOR RESEARCH & SCREENING</span>
          </div>
          <div>
            Built with FastAPI, 1-D Kalman Filter, Bayesian VOI, and React.
          </div>
        </div>
      </div>
    </footer>
  );
}
