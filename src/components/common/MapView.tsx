'use client';

import type { RideStatus } from '@/types/ride';

// Carte simulée : sera remplacée par une vraie carte (ticket 20 du backlog).
type Point = [number, number];

const DRIVER_PATH: Point[] = [[30, 200], [30, 150], [120, 150], [120, 100]]; // chauffeur → client
const TRIP_PATH: Point[] = [[120, 100], [210, 100], [210, 50], [330, 50]]; // client → destination

const toD = (pts: Point[]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');

function pointAlong(pts: Point[], t: number): Point {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let dist = segs.reduce((a, b) => a + b, 0) * Math.min(1, Math.max(0, t));

  for (let i = 0; i < segs.length; i++) {
    if (dist <= segs[i]) {
      const r = segs[i] ? dist / segs[i] : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r];
    }
    dist -= segs[i];
  }
  return pts[pts.length - 1];
}

function moverPosition(status: RideStatus, progress: number): Point | null {
  if (status === 'enroute') return pointAlong(DRIVER_PATH, progress);
  if (status === 'arrived') return DRIVER_PATH[DRIVER_PATH.length - 1];
  if (status === 'trip') return pointAlong(TRIP_PATH, progress);
  if (status === 'dropoff') return TRIP_PATH[TRIP_PATH.length - 1];
  return null;
}

const STREETS_X = [30, 120, 210, 300];
const STREETS_Y = [50, 100, 150, 200];

export default function MapView({ status, progress }: { status: RideStatus; progress: number }) {
  const mover = moverPosition(status, progress);
  const onFoot = status === 'enroute';

  return (
    <svg className="map" viewBox="0 0 360 230" role="img" aria-label="Carte du trajet">
      <rect width="360" height="230" fill="var(--map-block)" />
      {STREETS_X.map((x) => (
        <line key={`x${x}`} x1={x} y1={0} x2={x} y2={230} stroke="var(--map-street)" strokeWidth={10} />
      ))}
      {STREETS_Y.map((y) => (
        <line key={`y${y}`} x1={0} y1={y} x2={360} y2={y} stroke="var(--map-street)" strokeWidth={10} />
      ))}

      {onFoot && (
        <path d={toD(DRIVER_PATH)} fill="none" stroke="var(--warn)" strokeWidth={4} strokeDasharray="6 6" />
      )}
      {status !== 'done' && (
        <path
          d={toD(TRIP_PATH)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={5}
          strokeLinecap="round"
          opacity={status === 'idle' ? 0.35 : 1}
        />
      )}

      <circle cx={120} cy={100} r={9} fill="var(--text)" />
      <text x={120} y={88} textAnchor="middle" fontSize={11} fill="var(--text)" fontWeight={700}>
        Vous
      </text>
      <rect x={322} y={42} width={16} height={16} rx={3} fill="var(--accent)" />
      <text x={330} y={74} textAnchor="middle" fontSize={11} fill="var(--text)" fontWeight={700}>
        Arrivée
      </text>

      {mover && (
        <g transform={`translate(${mover[0]},${mover[1]})`}>
          <circle r={11} fill={onFoot ? 'var(--warn)' : 'var(--success)'} stroke="#fff" strokeWidth={3} />
          <text y={4} textAnchor="middle" fontSize={11}>
            {onFoot ? '🛴' : '🚗'}
          </text>
        </g>
      )}
    </svg>
  );
}
