import React, { useEffect, useRef } from 'react';

export default function PlotlyChart({ data, layout, config, style, className }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const Plotly = window.Plotly;
    if (!Plotly) return;

    const defaultLayout = {
      autosize: true,
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: {
        family: 'Plus Jakarta Sans, sans-serif',
        color: '#94a3b8',
        size: 11
      },
      margin: { l: 45, r: 25, t: 30, b: 35 },
      ...layout
    };

    const defaultConfig = {
      responsive: true,
      displayModeBar: false,
      ...config
    };

    Plotly.react(containerRef.current, data, defaultLayout, defaultConfig);

    const handleResize = () => {
      if (containerRef.current && Plotly) {
        Plotly.Plots.resize(containerRef.current);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && Plotly) {
        Plotly.purge(containerRef.current);
      }
    };
  }, [data, layout, config]);

  return <div ref={containerRef} style={style} className={className || 'w-full h-full'} />;
}
