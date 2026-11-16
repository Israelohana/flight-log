"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId, useMemo } from "react";

export type Waypoint = { week: number; date: string; count: number };

function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/**
 * The journey as a great-circle arc over the earth's curvature.
 * Origin (right, RTL start) → destination (left). Each course week is a waypoint on the arc.
 */
export function FlightRoute({ waypoints, current, compact = false }: { waypoints: Waypoint[]; current: number; compact?: boolean }) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const W = compact ? 400 : 1100;
  const H = compact ? 190 : 300;
  const fs = compact ? 12 : 13;
  const pillW = 10 * (fs * 0.62 + 1.5) + 26; // "WK02 · NOW" in mono

  // Quadratic arc: origin → control → destination
  const P0 = { x: W - (compact ? 22 : 40), y: H * 0.72 };
  const P2 = { x: compact ? 22 : 40, y: H * 0.72 };
  const C = { x: W / 2, y: compact ? H * 0.02 : -H * 0.12 };
  const at = (t: number) => ({
    x: (1 - t) ** 2 * P0.x + 2 * (1 - t) * t * C.x + t ** 2 * P2.x,
    y: (1 - t) ** 2 * P0.y + 2 * (1 - t) * t * C.y + t ** 2 * P2.y,
  });
  const tangent = (t: number) => ({
    x: 2 * (1 - t) * (C.x - P0.x) + 2 * t * (P2.x - C.x),
    y: 2 * (1 - t) * (C.y - P0.y) + 2 * t * (P2.y - C.y),
  });
  // Split the quadratic at t (de Casteljau) to draw the flown part
  const flownPath = (t: number) => {
    const q0 = { x: P0.x + (C.x - P0.x) * t, y: P0.y + (C.y - P0.y) * t };
    const end = at(t);
    return `M ${P0.x} ${P0.y} Q ${q0.x} ${q0.y} ${end.x} ${end.y}`;
  };
  const full = `M ${P0.x} ${P0.y} Q ${C.x} ${C.y} ${P2.x} ${P2.y}`;

  const n = waypoints.length;
  // Weeks spread over the first 82% of the route; the rest is the open road to the destination.
  const tOf = (i: number) => 0.06 + (i / Math.max(1, n - 1)) * 0.76;
  const curIdx = Math.max(0, waypoints.findIndex((w) => w.week === current));
  const tCur = tOf(curIdx);
  const plane = at(tCur);
  const tg = tangent(tCur);
  const angle = (Math.atan2(tg.y, tg.x) * 180) / Math.PI;

  // Earth: a huge circle whose top edge sits near the bottom of the scene
  const R = W * (compact ? 1.6 : 1.9);
  const earthTop = H * 0.86;
  const lights = useMemo(
    () =>
      Array.from({ length: compact ? 40 : 90 }, (_, i) => {
        const x = rand(i + 3) * W;
        const dx = x - W / 2;
        const surface = earthTop + R - Math.sqrt(R * R - dx * dx);
        return { x, y: surface + 4 + rand(i + 50) * 30, o: 0.2 + rand(i + 9) * 0.6, r: rand(i + 77) > 0.85 ? 1.3 : 0.7 };
      }),
    [W, R, earthTop, compact],
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label={`מסלול הלמידה, שבוע ${current}`}>
      <defs>
        <linearGradient id={`trail-${uid}`} x1="1" x2="0" y1="0" y2="0">
          <stop offset="0" stopColor="#FF6B2C" stopOpacity=".15" />
          <stop offset=".7" stopColor="#FF6B2C" />
          <stop offset="1" stopColor="#FFB38A" />
        </linearGradient>
        <radialGradient id={`earth-${uid}`} cx="50%" cy="0%" r="60%">
          <stop offset="0" stopColor="#13284D" />
          <stop offset="1" stopColor="#050B18" />
        </radialGradient>
        <filter id={`blur-${uid}`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <radialGradient id={`halo-${uid}`}>
          <stop offset="0" stopColor="#FF6B2C" stopOpacity=".6" />
          <stop offset="1" stopColor="#FF6B2C" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Earth + atmosphere */}
      <circle cx={W / 2} cy={earthTop + R} r={R + 6} fill="none" stroke="#6FA8FF" strokeOpacity=".35" strokeWidth="10" filter={`url(#blur-${uid})`} />
      <circle cx={W / 2} cy={earthTop + R} r={R} fill={`url(#earth-${uid})`} stroke="#6FA8FF" strokeOpacity=".45" strokeWidth="1" />
      {lights.map((l, i) => (
        <circle key={i} cx={l.x} cy={l.y} r={l.r} fill="#FFC77A" opacity={l.o} />
      ))}

      {/* Full route */}
      <path d={full} fill="none" stroke="white" strokeOpacity=".22" strokeWidth="1.4" strokeDasharray="2 8" strokeLinecap="round" />

      {/* Contrail: glow + core */}
      <motion.path
        d={flownPath(tCur)}
        fill="none"
        stroke="#FF6B2C"
        strokeWidth="10"
        strokeOpacity=".35"
        filter={`url(#blur-${uid})`}
        initial={{ pathLength: reduce ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d={flownPath(tCur)}
        fill="none"
        stroke={`url(#trail-${uid})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: reduce ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Origin & destination beacons */}
      {[P0, P2].map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill={i === 0 ? "#FF6B2C" : "#070E1C"} stroke={i === 0 ? "#FFB38A" : "#6FA8FF"} strokeWidth="1.5" />
          {i === 1 && (
            <motion.circle
              cx={p.x}
              cy={p.y}
              r="5"
              fill="none"
              stroke="#6FA8FF"
              initial={{ r: 5, opacity: 0.7 }}
              animate={reduce ? undefined : { r: 18, opacity: 0 }}
              transition={{ duration: 2.4, repeat: Infinity }}
            />
          )}
        </g>
      ))}

      {/* Week waypoints */}
      {waypoints.map((w, i) => {
        const p = at(tOf(i));
        const past = i < curIdx;
        const isCur = i === curIdx;
        const future = i > curIdx;
        return (
          <g key={w.week}>
            <circle
              cx={p.x}
              cy={p.y}
              r={isCur ? 0 : 3.5}
              fill={past ? "#FF6B2C" : "#070E1C"}
              stroke={future ? "rgba(255,255,255,.4)" : "#FFB38A"}
              strokeWidth="1.2"
            />
            {!isCur && (
              <g transform={`translate(${p.x} ${p.y + fs * 2})`} textAnchor="middle" className="font-mono">
                <text fill={future ? "rgba(238,242,249,.5)" : "rgba(238,242,249,.9)"} fontSize={fs} letterSpacing="1.5" fontWeight={600}>
                  {future ? "NEXT" : `WK${String(w.week).padStart(2, "0")}`}
                </text>
                <text y={fs * 1.25} fill="rgba(180,190,208,.75)" fontSize={fs * 0.9}>
                  {w.date}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Aircraft at the current week */}
      <circle cx={plane.x} cy={plane.y} r={compact ? 30 : 42} fill={`url(#halo-${uid})`} />
      <motion.g
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: reduce ? 0 : 1.4, type: "spring", stiffness: 160, damping: 13 }}
        style={{ transformOrigin: `${plane.x}px ${plane.y}px` }}
      >
        <motion.g
          animate={reduce ? undefined : { y: [0, -3, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <g transform={`translate(${plane.x} ${plane.y}) rotate(${angle}) scale(${compact ? 1.25 : 1.55})`}>
            <path
              d="M12 0 C12 -1 10.5 -1.6 9 -1.6 L4 -1.6 L-2 -10 L-4.6 -10 L-1.2 -1.6 L-6.5 -1.6 L-8.6 -4.6 L-10.4 -4.6 L-9.2 0 L-10.4 4.6 L-8.6 4.6 L-6.5 1.6 L-1.2 1.6 L-4.6 10 L-2 10 L4 1.6 L9 1.6 C10.5 1.6 12 1 12 0 Z"
              fill="white"
            />
          </g>
        </motion.g>
      </motion.g>
      <g transform={`translate(${plane.x} ${plane.y - (compact ? 30 : 38)})`} textAnchor="middle" className="font-mono">
        <rect x={-pillW / 2} y={-fs - 4} width={pillW} height={fs + 10} rx={(fs + 10) / 2} fill="#FF6B2C" />
        <text y="1" fill="white" fontSize={fs} fontWeight={700} letterSpacing="1.5">
          {`WK${String(current).padStart(2, "0")} · NOW`}
        </text>
      </g>
    </svg>
  );
}
