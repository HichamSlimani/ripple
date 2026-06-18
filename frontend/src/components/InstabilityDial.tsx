'use client';

import { motion } from 'framer-motion';
import { instabilityBand, instabilityColor } from './instability';

// A radial instability dial. The arc sweeps to the settled reading and the
// numeral counts in tabular numerals. Used at the centre of the cascade.
export default function InstabilityDial({
  value,
  size = 168,
  settling = false,
}: {
  value: number;
  size?: number;
  settling?: boolean;
}) {
  const v = Math.max(0, Math.min(100, value));
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (v / 100) * c;
  const color = instabilityColor(v);

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
      aria-label={`Instability reading ${v} of 100, ${instabilityBand(v)}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(102,255,194,0.10)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - dash }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <span
          className="tnum display text-5xl font-700 leading-none"
          style={{ color, textShadow: `0 0 18px ${color}` }}
        >
          {v}
        </span>
        <span className="mono mt-1 text-[10px] uppercase tracking-[0.2em] text-faint">
          {settling ? 'settling' : 'instability'}
        </span>
        <span
          className="display mt-1 text-[11px] font-600 uppercase tracking-wide"
          style={{ color }}
        >
          {instabilityBand(v)}
        </span>
      </div>
    </div>
  );
}
