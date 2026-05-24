import { useEffect, useRef, useState } from 'react';

interface EventMapProps {
  events: any[];
  onEventClick: (id: number) => void;
}

export function EventMapView({ events, onEventClick }: EventMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance) return;

    let L: any;
    try {
      L = require('leaflet');
    } catch {
      setError('Map library not loaded. Install: npm install leaflet react-leaflet');
      return;
    }

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([19.076, 72.8777], 12); // Mumbai default

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    setMapInstance(map);

    return () => { map.remove(); };
  }, []);

  useEffect(() => {
    if (!mapInstance) return;

    let L: any;
    try { L = require('leaflet'); } catch { return; }

    const bounds: [number, number][] = [];

    events.forEach(event => {
      if (!event.latitude || !event.longitude) return;

      const lat = parseFloat(event.latitude);
      const lng = parseFloat(event.longitude);
      bounds.push([lat, lng]);

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#FF6B35,#FF2E63);display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid rgba(255,255,255,0.2);box-shadow:0 2px 8px rgba(255,107,53,0.4);">📍</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([lat, lng], { icon }).addTo(mapInstance);

      const popup = L.popup({ className: 'event-popup', closeButton: false }).setContent(`
        <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:10px 12px;min-width:160px;cursor:pointer;">
          <p style="font-size:12px;font-weight:600;color:white;margin:0;">${event.title}</p>
          <p style="font-size:10px;color:#71717a;margin:2px 0 0;">${event.location_name || ''}</p>
          <p style="font-size:10px;color:#c8ff00;margin:4px 0 0;">${event.attendee_count || 0} going</p>
        </div>
      `);

      marker.bindPopup(popup);
      marker.on('click', () => onEventClick(event.id));
    });

    if (bounds.length > 0) {
      mapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [mapInstance, events, onEventClick]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-center p-6">
        <div>
          <span className="text-2xl">🗺️</span>
          <p className="text-[12px] text-zinc-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const eventsWithLocation = events.filter(e => e.latitude && e.longitude);

  if (eventsWithLocation.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center p-6">
        <div>
          <span className="text-2xl">📍</span>
          <p className="text-[12px] text-zinc-500 mt-2">No events with locations yet</p>
          <p className="text-[10px] text-zinc-700 mt-1">Events with GPS coordinates will appear on the map</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapRef} className="h-full w-full" style={{ background: '#1a1a2e' }} />
  );
}
