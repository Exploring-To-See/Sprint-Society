import { useEffect, useRef, useState } from 'react';

interface EventMapProps {
  events: any[];
  onEventClick: (id: number) => void;
}

export function EventMapView({ events, onEventClick }: EventMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

  const eventsWithLocation = events.filter(e => e.latitude && e.longitude);
  const hasLocated = eventsWithLocation.length > 0;

  // Init keyed on container presence: with []-deps the effect fired once while
  // the placeholder (no events yet) was rendered — mapRef.current was null and
  // the map never initialized even after events with coordinates arrived.
  useEffect(() => {
    if (!hasLocated || !mapRef.current || mapInstanceRef.current) return;

    import('leaflet').then(L => {
      leafletRef.current = L.default || L;
      const Leaf = leafletRef.current;

      const map = Leaf.map(mapRef.current!, {
        zoomControl: false,
        attributionControl: false,
      }).setView([19.076, 72.8777], 12);

      Leaf.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      Leaf.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
      setMapInstance(map);
    });

    // Cleanup via the ref — the old closure captured the initial null
    // mapInstance, so the Leaflet map leaked on every unmount.
    return () => { mapInstanceRef.current?.remove(); mapInstanceRef.current = null; setMapInstance(null); };
  }, [hasLocated]);

  // Markers added per render pass — must be removed before the next pass or
  // they stack forever (the effect re-runs whenever events/onEventClick change).
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapInstance || !leafletRef.current) return;
    const L = leafletRef.current;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds: [number, number][] = [];

    events.forEach(event => {
      if (!event.latitude || !event.longitude) return;

      const lat = parseFloat(event.latitude);
      const lng = parseFloat(event.longitude);
      bounds.push([lat, lng]);

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#F97316,#FB923C);display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,0.2);box-shadow:0 2px 8px rgba(249,115,22,0.45);"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21.5s-7-6.6-7-11.5a7 7 0 0 1 14 0c0 4.9-7 11.5-7 11.5Z"/><circle cx="12" cy="9.8" r="2.6"/></svg></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([lat, lng], { icon }).addTo(mapInstance);
      markersRef.current.push(marker);

      const popup = L.popup({ className: 'event-popup', closeButton: false }).setContent(`
        <div style="background:#0B0A16;border:1px solid rgba(255,255,255,.09);border-radius:12px;padding:10px 12px;min-width:160px;cursor:pointer;">
          <p style="font:600 12px 'Space Grotesk',sans-serif;color:#F4F4F8;margin:0;">${event.title}</p>
          <p style="font:500 10px Inter,sans-serif;color:#9A9CB0;margin:2px 0 0;">${event.location_name || ''}</p>
          <p style="font:600 10px 'JetBrains Mono',monospace;color:#34D399;margin:4px 0 0;">${event.attendee_count || 0} going</p>
        </div>
      `);

      marker.bindPopup(popup);
      marker.on('click', () => onEventClick(event.id));
    });

    if (bounds.length > 0) {
      mapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [mapInstance, events, onEventClick]);

  if (!hasLocated) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
        <div>
          <span className="ticon" style={{ margin: '0 auto', width: 36, height: 36, borderRadius: 11, display: 'grid', placeItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21.5s-7-6.6-7-11.5a7 7 0 0 1 14 0c0 4.9-7 11.5-7 11.5Z" /><circle cx="12" cy="9.8" r="2.6" /></svg>
          </span>
          <p style={{ font: '500 12px var(--body)', color: 'var(--muted)', marginTop: 8 }}>No events with locations yet</p>
          <p style={{ font: '400 10px var(--body)', color: 'var(--muted-2)', marginTop: 4 }}>Events with GPS coordinates will appear on the map</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapRef} style={{ height: '100%', width: '100%', background: 'var(--bg2)' }} />
  );
}
