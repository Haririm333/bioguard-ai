import React, { useEffect, useRef, useState } from 'react';
import { Layers, ShieldAlert, Activity, Satellite, Map as MapIcon } from 'lucide-react';

const TILE_LAYERS = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri &mdash; High-Resolution Satellite'
  },
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }
};

// Hardcoded fallback for North East India (Brahmaputra Valley / Upper Assam Agro-Ecological Basin)
const DEFAULT_NORTH_EAST_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { zone: "A", name: "Zone A (North-West)", crop: "Assam Joha & Black Rice (Chak-Hao)", soil: "Brahmaputra Alluvial Loam" },
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

export default function FarmMap({
  zones,
  geojson,
  selectedZone,
  onSelectZone,
  viewMode,
  onToggleViewMode,
  climateSimZones
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const activeTileLayerRef = useRef(null);
  const geojsonLayerRef = useRef(null);
  const markersLayerGroupRef = useRef(null);
  const [basemapType, setBasemapType] = useState('satellite');

  // Initialize map once centered on North East India (Jorhat / Brahmaputra Basin, Assam)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const L = window.L;
    if (!L) return;

    const map = L.map(mapContainerRef.current, {
      center: [26.7450, 94.2150],
      zoom: 17,
      zoomControl: true,
      attributionControl: false
    });

    const initialConfig = TILE_LAYERS.satellite;
    const tileLayer = L.tileLayer(initialConfig.url, {
      maxZoom: initialConfig.maxZoom,
      subdomains: ['a', 'b', 'c']
    }).addTo(map);
    activeTileLayerRef.current = tileLayer;

    // Layer group for permanent zone badge markers
    markersLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle switching basemap
  useEffect(() => {
    const L = window.L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    if (activeTileLayerRef.current) {
      map.removeLayer(activeTileLayerRef.current);
    }

    const cfg = TILE_LAYERS[basemapType] || TILE_LAYERS.satellite;
    const newLayer = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      subdomains: ['a', 'b', 'c']
    }).addTo(map);

    if (geojsonLayerRef.current) {
      geojsonLayerRef.current.bringToFront();
    }

    activeTileLayerRef.current = newLayer;
  }, [basemapType]);

  // Update GeoJSON layer whenever zones, selectedZone, viewMode, or climate simulation changes
  useEffect(() => {
    const L = window.L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
    }
    if (markersLayerGroupRef.current) {
      markersLayerGroupRef.current.clearLayers();
    }

    // Always prefer valid North East India GeoJSON
    const activeGeojson = (geojson && geojson.features && geojson.features.length > 0 && geojson.features[0].geometry.coordinates[0][0][0] > 70)
      ? geojson
      : DEFAULT_NORTH_EAST_GEOJSON;

    const zoneDataMap = {};
    (zones || []).forEach(z => {
      const simMatch = climateSimZones?.find(cz => cz.zone === z.zone);
      zoneDataMap[z.zone] = {
        ...z,
        activeHealth: simMatch ? simMatch.simulated_health : z.health_mean,
        activeVar: simMatch ? simMatch.simulated_variance : z.health_variance,
        activePriority: simMatch ? simMatch.priority : z.priority,
        activeColor: simMatch ? simMatch.priority_color : z.priority_color,
        isSimulatedStress: !!simMatch
      };
    });

    const getZoneStyle = (feature) => {
      const zId = feature.properties.zone;
      const data = zoneDataMap[zId] || {};
      const isSelected = selectedZone === zId;

      let fillColor = '#10b981';
      let fillOpacity = 0.55;

      if (viewMode === 'risk') {
        if (data.activePriority === 'High') fillColor = '#ef4444';
        else if (data.activePriority === 'Moderate') fillColor = '#f59e0b';
        else fillColor = '#10b981';
      } else {
        const v = data.activeVar || 0;
        if (v > 0.0035) {
          fillColor = '#8b5cf6';
          fillOpacity = 0.70;
        } else if (v > 0.0018) {
          fillColor = '#3b82f6';
          fillOpacity = 0.60;
        } else {
          fillColor = '#06b6d4';
          fillOpacity = 0.45;
        }
      }

      return {
        fillColor: fillColor,
        weight: isSelected ? 3.5 : 2,
        opacity: 1,
        color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
        fillOpacity: isSelected ? fillOpacity + 0.15 : fillOpacity,
        dashArray: isSelected ? '4' : null
      };
    };

    const layer = L.geoJSON(activeGeojson, {
      style: getZoneStyle,
      onEachFeature: (feature, layerItem) => {
        const zId = feature.properties.zone;
        const data = zoneDataMap[zId] || {};

        layerItem.on({
          click: () => onSelectZone(zId),
          mouseover: (e) => {
            const target = e.target;
            target.setStyle({
              weight: 3.5,
              color: '#34d399',
              fillOpacity: 0.8
            });
          },
          mouseout: (e) => {
            layer.resetStyle(e.target);
          }
        });

        // Add permanent center badge label
        const bounds = layerItem.getBounds();
        const center = bounds.getCenter();
        const labelHtml = `
          <div class="px-2 py-0.5 rounded-md font-bold text-xs shadow-md border ${
            selectedZone === zId
              ? 'bg-white text-slate-950 border-white ring-2 ring-emerald-400'
              : 'bg-slate-900/90 text-white border-slate-700/80'
          }">
            Zone ${zId}
          </div>
        `;
        const icon = L.divIcon({
          className: 'zone-center-badge',
          html: labelHtml,
          iconSize: [60, 24],
          iconAnchor: [30, 12]
        });
        if (markersLayerGroupRef.current) {
          L.marker(center, { icon: icon, interactive: false }).addTo(markersLayerGroupRef.current);
        }

        const tooltipContent = `
          <div class="p-2 min-w-[170px]">
            <div class="font-bold text-sm text-white flex items-center justify-between gap-2">
              <span>Zone ${zId}</span>
              <span class="text-xs px-1.5 py-0.5 rounded ${
                data.activePriority === 'High' ? 'bg-red-950 text-red-300 border border-red-700' :
                data.activePriority === 'Moderate' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                'bg-emerald-950 text-emerald-300 border border-emerald-700'
              }">${data.activePriority || 'Normal'} Risk</span>
            </div>
            <div class="text-[11px] text-emerald-300 font-semibold mt-0.5">${feature.properties.crop}</div>
            <div class="text-xs text-slate-300 mt-1">Health: <strong class="text-white">${data.activeHealth ? data.activeHealth.toFixed(2) : '0.85'}</strong></div>
            <div class="text-xs text-slate-300">Variance: <strong class="text-white">${(data.activeVar || 0.002).toFixed(4)}</strong></div>
            <div class="text-xs text-indigo-300 mt-0.5">VOI Sample Rank: #${data.sampling_rank || '1'}</div>
            <div class="text-[10px] text-emerald-400 mt-1 font-semibold">Click to inspect Kalman fusion</div>
          </div>
        `;
        layerItem.bindTooltip(tooltipContent, {
          sticky: true,
          direction: 'top',
          className: 'leaflet-popup-content-wrapper'
        });
      }
    }).addTo(map);

    geojsonLayerRef.current = layer;
    layer.bringToFront();
    map.fitBounds(layer.getBounds(), { padding: [35, 35] });

  }, [geojson, zones, selectedZone, viewMode, climateSimZones]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl flex flex-col h-[480px]">
      {/* Map Header & Controls */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Farm Badge */}
        <div className="pointer-events-auto bg-slate-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200">10-Acre Sentinel Farm (Upper Assam, North East India)</span>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold">
            Simulated
          </span>
        </div>

        {/* View Mode Toggle & Basemap Switcher */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Basemap Switcher (Satellite vs Streets) */}
          <div className="bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-1">
            <button
              onClick={() => setBasemapType('satellite')}
              title="Real high-resolution satellite aerial imagery"
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                basemapType === 'satellite'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Satellite className="w-3.5 h-3.5" />
              <span>Satellite</span>
            </button>
            <button
              onClick={() => setBasemapType('streets')}
              title="OpenStreetMap standard roads and boundaries"
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                basemapType === 'streets'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
          </div>

          {/* Risk vs Uncertainty Toggle */}
          <div className="bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-1">
            <button
              onClick={() => onToggleViewMode('risk')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'risk'
                  ? 'bg-red-500/25 text-red-200 border border-red-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Risk View</span>
            </button>
            <button
              onClick={() => onToggleViewMode('uncertainty')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'uncertainty'
                  ? 'bg-violet-500/25 text-violet-200 border border-violet-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-violet-400" />
              <span>Uncertainty View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Leaflet Map Div */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-950/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/80 shadow-lg text-[11px] text-slate-300">
        <div className="font-semibold text-white mb-1.5 flex items-center gap-1">
          <span>{viewMode === 'risk' ? 'Risk Severity' : 'Kalman Uncertainty (Variance)'}</span>
        </div>
        {viewMode === 'risk' ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-500 inline-block border border-red-400/50"></span>
              High (&lt;0.65)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-500 inline-block border border-amber-400/50"></span>
              Moderate (&lt;0.80)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block border border-emerald-400/50"></span>
              Low (≥0.80)
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-violet-600 inline-block border border-violet-400/50"></span>
              High (Sparse DNA)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-500 inline-block border border-blue-400/50"></span>
              Moderate
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-cyan-500 inline-block border border-cyan-400/50"></span>
              Low (Collapsed)
            </span>
          </div>
        )}
      </div>

      {/* Selected Zone Pill */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-slate-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/80 shadow-lg text-xs text-slate-300 flex items-center gap-2">
        <span>Active Focus:</span>
        <strong className="text-emerald-400 font-bold">Zone {selectedZone}</strong>
      </div>
    </div>
  );
}
