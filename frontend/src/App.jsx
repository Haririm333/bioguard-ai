import React, { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import FarmMap from './components/FarmMap';
import ZonePanel from './components/ZonePanel';
import SamplingAdvisor from './components/SamplingAdvisor';
import ClimateSimulator from './components/ClimateSimulator';
import TreatmentTab from './components/TreatmentTab';
import RecoveryTab from './components/RecoveryTab';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { AlertCircle, RefreshCw } from 'lucide-react';

import { MOCK_NORTH_EAST_GEOJSON, MOCK_ZONES_SUMMARY, generateMockSeries } from './mockData';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [zones, setZones] = useState([]);
  const [geojson, setGeojson] = useState(null);
  const [selectedZone, setSelectedZone] = useState('B'); // Zone B is the central story zone
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [viewMode, setViewMode] = useState('risk'); // 'risk' | 'uncertainty'
  const [loadingZones, setLoadingZones] = useState(true);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [samplingLoading, setSamplingLoading] = useState(false);
  const [lastSampleResult, setLastSampleResult] = useState(null);
  const [climateSimResult, setClimateSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all zones summary (with auto-fallback for standalone GitHub Pages hosting)
  const fetchZones = async () => {
    try {
      const res = await fetch(`${API_BASE}/zones`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setZones(data.zones || []);
      setGeojson(data.geojson || MOCK_NORTH_EAST_GEOJSON);
      setIsDemoMode(false);
      setError(null);
    } catch (err) {
      console.warn("Backend API not reachable; activating standalone client-side engine for web viewing:", err.message);
      setZones(MOCK_ZONES_SUMMARY);
      setGeojson(MOCK_NORTH_EAST_GEOJSON);
      setIsDemoMode(true);
      setError(null);
    } finally {
      setLoadingZones(false);
    }
  };

  // Fetch specific zone series (with auto-fallback)
  const fetchSeries = async (zoneId) => {
    setLoadingSeries(true);
    try {
      const res = await fetch(`${API_BASE}/zones/${zoneId}/series`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setSelectedSeries(data.series || []);
    } catch (err) {
      // Fallback for standalone web hosting
      setSelectedSeries(generateMockSeries(zoneId));
    } finally {
      setLoadingSeries(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchZones();
  }, []);

  // Whenever selectedZone changes, fetch its series
  useEffect(() => {
    if (selectedZone) {
      fetchSeries(selectedZone);
    }
  }, [selectedZone]);

  // Collect physical soil sample (POST /sample/{z})
  const handleCollectSample = async (zoneId) => {
    setSamplingLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sample/${zoneId}`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setLastSampleResult(data);

      // Refresh zones and the active series to show the collapsed band
      await fetchZones();
      await fetchSeries(zoneId);
    } catch (err) {
      console.warn("Backend unavailable; using client sampling simulation:", err.message);
      setLastSampleResult({
        zone: zoneId,
        sample_day: 179,
        variance_reduction_pct: 42.5,
        pre_sample: { band_width_90: 0.154 },
        post_sample: { band_width_90: 0.088 }
      });
      setSelectedSeries(prev => {
        if (!prev) return prev;
        return prev.map(pt => pt.day === 179 ? {
          ...pt,
          has_dna_sample: true,
          health_variance: pt.health_variance * 0.55,
          health_lo: pt.health_mean - 0.04,
          health_hi: pt.health_mean + 0.04
        } : pt);
      });
    } finally {
      setSamplingLoading(false);
    }
  };

  // Run climate simulation (POST /simulate)
  const handleRunSimulation = async (simParams) => {
    setSimLoading(true);
    try {
      const res = await fetch(`${API_BASE}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simParams)
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setClimateSimResult(data);
    } catch (err) {
      console.warn("Backend unavailable; using client climate simulation:", err.message);
      const stress = (simParams.temp_delta / 4.0) * 0.15 + (1.0 - simParams.rain_mult) * 0.18;
      const simZones = zones.map(z => {
        const simHealth = Math.max(0.1, z.health_mean - stress * (z.zone === 'B' ? 1.0 : 0.4));
        return {
          zone: z.zone,
          baseline_health: z.health_mean,
          simulated_health: parseFloat(simHealth.toFixed(3)),
          health_delta: parseFloat((simHealth - z.health_mean).toFixed(3)),
          simulated_variance: z.health_variance,
          simulated_lo: parseFloat((simHealth - 0.06).toFixed(3)),
          simulated_hi: parseFloat((simHealth + 0.06).toFixed(3)),
          priority: simHealth < 0.65 ? 'High' : simHealth < 0.80 ? 'Moderate' : 'Low',
          priority_color: simHealth < 0.65 ? '#ef4444' : simHealth < 0.80 ? '#f59e0b' : '#10b981'
        };
      });
      setClimateSimResult({ zones: simZones, label: "Model estimate under stated assumptions" });
    } finally {
      setSimLoading(false);
    }
  };

  // Reset climate simulation
  const handleResetSimulation = async () => {
    setClimateSimResult(null);
    await handleRunSimulation({ temp_delta: 0.0, rain_mult: 1.0, drought_days: 0 });
  };

  // Global reset system
  const handleResetAll = async () => {
    setResetting(true);
    try {
      await fetch(`${API_BASE}/reset`, { method: 'POST' });
    } catch (err) {
      console.warn("Backend reset endpoint unavailable:", err.message);
    } finally {
      setLastSampleResult(null);
      setClimateSimResult(null);
      await fetchZones();
      await fetchSeries(selectedZone);
      setResetting(false);
    }
  };

  const currentZoneData = zones.find(z => z.zone === selectedZone) || zones[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onResetAll={handleResetAll}
        resetting={resetting}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/80 border border-red-700 text-red-200 text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchZones}
              className="px-3 py-1 rounded bg-red-800 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Tab 1: Overview & Farm Map */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Grid: Farm Map + Sampling Advisor */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Leaflet Farm Map (7 cols) */}
              <div className="lg:col-span-7">
                <ErrorBoundary>
                  <FarmMap
                    zones={zones}
                    geojson={geojson}
                    selectedZone={selectedZone}
                    onSelectZone={setSelectedZone}
                    viewMode={viewMode}
                    onToggleViewMode={setViewMode}
                    climateSimZones={climateSimResult?.zones}
                  />
                </ErrorBoundary>
              </div>

              {/* VOI Sampling Advisor Card (5 cols) */}
              <div className="lg:col-span-5">
                <SamplingAdvisor
                  zones={zones}
                  onCollectSample={handleCollectSample}
                  samplingLoading={samplingLoading}
                  lastSampleResult={lastSampleResult}
                  selectedZone={selectedZone}
                  onSelectZone={setSelectedZone}
                />
              </div>
            </div>

            {/* Diagnostic Detail Panel for Selected Zone */}
            <ZonePanel
              zoneData={currentZoneData}
              seriesData={selectedSeries}
              loading={loadingSeries}
              onCollectSample={handleCollectSample}
              samplingLoading={samplingLoading}
            />
          </div>
        )}

        {/* Tab 2: Climate Stress Simulator */}
        {activeTab === 'simulator' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6">
                <ErrorBoundary>
                  <FarmMap
                    zones={zones}
                    geojson={geojson}
                    selectedZone={selectedZone}
                    onSelectZone={setSelectedZone}
                    viewMode={viewMode}
                    onToggleViewMode={setViewMode}
                    climateSimZones={climateSimResult?.zones}
                  />
                </ErrorBoundary>
              </div>
              <div className="lg:col-span-6">
                <ClimateSimulator
                  onRunSimulation={handleRunSimulation}
                  simResult={climateSimResult}
                  simLoading={simLoading}
                  onResetSimulation={handleResetSimulation}
                />
              </div>
            </div>

            {/* Also show the selected zone's series in simulator mode */}
            <ZonePanel
              zoneData={currentZoneData}
              seriesData={selectedSeries}
              loading={loadingSeries}
              onCollectSample={handleCollectSample}
              samplingLoading={samplingLoading}
            />
          </div>
        )}

        {/* Tab 3: Treatment Economics */}
        {activeTab === 'treatments' && (
          <div className="animate-fadeIn">
            <TreatmentTab
              selectedZone={selectedZone}
              zones={zones}
              onSelectZone={setSelectedZone}
            />
          </div>
        )}

        {/* Tab 4: Counterfactual Recovery */}
        {activeTab === 'recovery' && (
          <div className="animate-fadeIn">
            <RecoveryTab selectedZone={selectedZone} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
