import React, { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import * as KMZ from 'leaflet-kmz';



const Map = ({ kmlUrl }) => {
  const [mapInstance, setMapInstance] = useState(null);
  const mapContainerRef = useRef(null);
  const legendRef = useRef(null);

  useEffect(() => {
    if (!kmlUrl || !mapContainerRef.current) return;

    // Initialize the map
    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 1,
      maxBounds: [
        [-90, -180],
        [90, 180]
      ]
    });

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      noWrap: true
    }).addTo(map);

    // Add zoom control
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    // Add scale control
    L.control.scale({
      imperial: false,
      position: 'bottomleft'
    }).addTo(map);

    // Create and add legend
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function() {
      const div = L.DomUtil.create('div', 'info legend');
      div.innerHTML = `
        <div style="background: white; padding: 10px; border-radius: 5px; box-shadow: 0 1px 5px rgba(0,0,0,0.4);">
          <h4 style="margin: 0 0 8px 0; font-weight: bold;">Connection Types</h4>
          <div style="margin-bottom: 5px;">
            <span style="display: inline-block; width: 16px; height: 3px; background: #ff0000; margin-right: 8px;"></span>
            Public to Public
          </div>
          <div style="margin-bottom: 5px;">
            <span style="display: inline-block; width: 16px; height: 3px; background: #0000ff; margin-right: 8px;"></span>
            Public to Private
          </div>
          <div>
            <span style="display: inline-block; width: 16px; height: 3px; background: #00ff00; margin-right: 8px;"></span>
            Private to Public
          </div>
        </div>
      `;
      return div;
    };
    legend.addTo(map);
    legendRef.current = legend;

    // Load KML data
    const kmz = new KMZ({
      suppressInfoWindows: false,
    });
    
    // Add a loading indicator
    const loadingControl = L.control({ position: 'center' });
    loadingControl.onAdd = function() {
      const div = L.DomUtil.create('div', 'loading-indicator');
      div.innerHTML = '<div class="spinner"></div><div class="loading-text">Loading data...</div>';
      return div;
    };
    loadingControl.addTo(map);
    
    // Load KML
    const fullKmlUrl = kmlUrl.startsWith('http') ? kmlUrl : `http://localhost:5000${kmlUrl}`;
    kmz.load(fullKmlUrl);
    
    kmz.on('load', function(e) {
      // Remove loading indicator
      map.removeControl(loadingControl);
      
      // Add the KML layer to the map
      const layer = e.layer;
      layer.addTo(map);
      
      try {
        // Fit map to bounds of KML data
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 8
          });
        }
      } catch (error) {
        console.error("Error fitting bounds:", error);
      }
    });
    
    kmz.on('error', function(e) {
      console.error("Error loading KML:", e);
      // Remove loading indicator
      map.removeControl(loadingControl);
    });

    // Store map instance
    setMapInstance(map);

    // Cleanup function
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [kmlUrl]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mapInstance) {
        mapInstance.invalidateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mapInstance]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-2xl font-semibold">Geographic Visualization</h2>
        <p className="text-gray-600">Connections between IP addresses from your network traffic</p>
      </div>
      <div 
        ref={mapContainerRef} 
        className="w-full h-[600px]"
        style={{
          height: '600px'
        }}
      ></div>
      
      <style jsx>{`
        .loading-indicator {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 0 15px rgba(0,0,0,0.2);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin-bottom: 10px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Map;
