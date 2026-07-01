interface RouteShapeProps {
  polyline: string;
  width?: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
}

export function RouteShape({ polyline, width = 280, height = 200, strokeColor = '#f97316', strokeWidth = 2.5, opacity = 0.6 }: RouteShapeProps) {
  const coords = parsePolyline(polyline);
  if (coords.length < 2) return null;

  const path = coordsToSvgPath(coords, width, height);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full" style={{ opacity }}>
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function parsePolyline(data: string): [number, number][] {
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
      return parsed as [number, number][];
    }
  } catch {}
  return [];
}

function coordsToSvgPath(coords: [number, number][], width: number, height: number): string {
  const lats = coords.map(c => c[0]);
  const lngs = coords.map(c => c[1]);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latRange = maxLat - minLat || 0.001;
  const lngRange = maxLng - minLng || 0.001;

  const padding = 20;
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;

  const scale = Math.min(drawWidth / lngRange, drawHeight / latRange);
  const offsetX = padding + (drawWidth - lngRange * scale) / 2;
  const offsetY = padding + (drawHeight - latRange * scale) / 2;

  const points = coords.map(([lat, lng]) => {
    const x = offsetX + (lng - minLng) * scale;
    const y = offsetY + (maxLat - lat) * scale;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return `M ${points.join(' L ')}`;
}
