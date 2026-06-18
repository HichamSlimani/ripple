'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import type { LeaderDraft } from '@/lib/contract';
import { domainTint, instabilityColor } from './instability';

// Honest, informative status names. Leader rotation/timeout is NOT an error.
const STATUS_COPY: Record<string, string> = {
  PENDING: 'Premise queued. Waiting for a leader to pick it up.',
  PROPOSING: 'Leader is drafting the consequence cascade.',
  COMMITTING: 'Validators are committing their independent readings.',
  REVEALING: 'Validators are revealing and anchoring on instability.',
  LEADER_TIMEOUT: 'Leader rotated. A fresh validator is taking the projection. Still working.',
  VALIDATORS_TIMEOUT: 'Validator set is rotating. Consensus continues. Still working.',
  ACCEPTED: 'Consensus reached. Settling the cascade.',
  FINALIZED: 'Finalised on-chain.',
};

function ParticleCondense() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 160;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    const cx = size / 2;
    const cy = size / 2;
    const parts = Array.from({ length: 64 }, (_, i) => ({
      a: (i / 64) * Math.PI * 2,
      rad: 60 + Math.random() * 18,
      sp: 0.4 + Math.random() * 0.6,
      ph: Math.random() * Math.PI * 2,
    }));
    const render = (t: number) => {
      ctx.clearRect(0, 0, size, size);
      for (const p of parts) {
        const breathe = (Math.sin(t * 0.0016 * p.sp + p.ph) + 1) / 2;
        const rad = 14 + p.rad * breathe;
        const x = cx + Math.cos(p.a + t * 0.0004) * rad;
        const y = cy + Math.sin(p.a + t * 0.0004) * rad;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.strokeStyle = `rgba(102,255,194,${0.04 + (1 - breathe) * 0.06})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(102,255,194,${0.25 + (1 - breathe) * 0.5})`;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(102,255,194,0.9)';
      ctx.fill();
      if (!reduce) raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} aria-hidden="true" style={{ width: 160, height: 160 }} />;
}

export default function ConsensusOverlay({
  active,
  status,
  draft,
  elapsed,
  hash,
  explorer,
}: {
  active: boolean;
  status: string;
  draft: LeaderDraft | null;
  elapsed: number;
  hash: string | null;
  explorer: string;
}) {
  const copy = STATUS_COPY[status] ?? 'Working through consensus. Still projecting.';
  const inst = draft?.instability;

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] grid place-items-center bg-bg/85 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Projecting consequence cascade under validator consensus"
        >
          <motion.div
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-lg rounded-sm border bg-panel/90 p-6 hairline"
          >
            <div className="flex items-center gap-4">
              <div className="grid place-items-center">
                <ParticleCondense />
              </div>
              <div className="min-w-0 flex-1">
                <p className="display text-lg font-700 uppercase tracking-wide text-phosphor text-glow">
                  Projecting cascade
                </p>
                <p className="mono mt-1 text-[11px] uppercase tracking-[0.18em] text-faint">
                  {status} - {elapsed}s elapsed
                </p>
                <p className="mt-2 text-sm text-muted">{copy}</p>
              </div>
            </div>

            {/* leader draft peek */}
            <div className="mt-5 rounded-sm border bg-bg/50 p-3 hairline">
              <div className="flex items-center justify-between">
                <span className="mono text-[10px] uppercase tracking-[0.18em] text-faint">
                  leader draft peek
                </span>
                {typeof inst === 'number' ? (
                  <span
                    className="tnum mono text-xs font-600"
                    style={{ color: instabilityColor(inst) }}
                  >
                    instability ~{inst}
                  </span>
                ) : (
                  <span className="mono text-[10px] text-faint">forming...</span>
                )}
              </div>
              <ul className="mt-2 space-y-1.5">
                {draft && draft.consequences.length > 0 ? (
                  draft.consequences.slice(0, 5).map((c, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-2 text-xs text-ink"
                    >
                      <span
                        className="mono mt-0.5 shrink-0 text-[9px] uppercase"
                        style={{ color: domainTint(c.domain) }}
                      >
                        {c.domain}
                      </span>
                      <span className="text-muted">{c.effect}</span>
                    </motion.li>
                  ))
                ) : (
                  <li className="mono text-xs text-faint">
                    The branches have not condensed yet. The leader is still drafting.
                  </li>
                )}
              </ul>
            </div>

            <p className="mt-4 text-center text-[11px] text-faint">
              A projection can take one to five minutes. Leave this open; the cascade renders the
              moment consensus settles.
            </p>
            {hash ? (
              <p className="mono mt-2 text-center text-[10px]">
                <a
                  href={`${explorer}/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-phosphor underline decoration-dotted underline-offset-2"
                >
                  track tx on explorer
                </a>
              </p>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
