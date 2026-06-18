'use client';

import { motion } from 'framer-motion';
import type { Premise } from '@/lib/contract';
import { shortAddr } from '@/lib/contract';
import { instabilityBand, instabilityColor } from './instability';

function SkeletonRow() {
  return (
    <div className="rounded-sm border p-3 hairline">
      <div className="skeleton h-3 w-1/3" />
      <div className="skeleton mt-2 h-3 w-5/6" />
    </div>
  );
}

export default function ProjectionsDrawer({
  premises,
  loading,
  activeId,
  onSelect,
  onRipple,
  rippleBusyId,
  canWrite,
}: {
  premises: Premise[];
  loading: boolean;
  activeId: string | null;
  onSelect: (p: Premise) => void;
  onRipple: (p: Premise) => void;
  rippleBusyId: string | null;
  canWrite: boolean;
}) {
  return (
    <section aria-labelledby="drawer-h" className="rounded-sm border bg-panel/40 p-5 hairline">
      <div className="flex items-baseline justify-between">
        <h2 id="drawer-h" className="display text-lg font-700 uppercase tracking-wide text-ink">
          Saved projections
        </h2>
        <span className="mono text-[11px] text-faint">newest first</span>
      </div>

      <div className="mt-3 space-y-2">
        {loading && premises.length === 0 ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : premises.length === 0 ? (
          <div className="rounded-sm border border-dashed p-6 text-center hairline">
            <p className="display text-base font-600 uppercase tracking-wide text-muted">
              The field is quiet
            </p>
            <p className="mt-1 text-sm text-faint">
              No premise has rippled yet. State a what-if above and watch the first cascade unfurl
              across the domains.
            </p>
          </div>
        ) : (
          premises.map((p) => {
            const projected = p.status === 'PROJECTED';
            const color = instabilityColor(p.instability);
            const active = p.id === activeId;
            return (
              <motion.div
                key={p.id}
                layout
                className={`rounded-sm border p-3 transition-colors hairline ${
                  active ? 'bg-panel2/80 glow-mint' : 'bg-bg/40 hover:bg-panel/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => onSelect(p)}
                    className="min-w-0 flex-1 text-left"
                    aria-label={`View projection ${p.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="mono text-[10px] text-faint">{p.id}</span>
                      <span
                        className="mono text-[9px] uppercase tracking-wider"
                        style={{ color: projected ? color : 'rgb(var(--muted-rgb))' }}
                      >
                        {projected ? instabilityBand(p.instability) : 'OPEN'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-ink">{p.premise}</p>
                    <p className="mono mt-1 text-[10px] text-faint">
                      by {shortAddr(p.author)}
                      {projected ? ` - ${p.consequences.length} branches` : ''}
                    </p>
                  </button>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {projected ? (
                      <span
                        className="tnum display text-2xl font-700 leading-none"
                        style={{ color }}
                      >
                        {p.instability}
                      </span>
                    ) : (
                      <button
                        onClick={() => onRipple(p)}
                        disabled={!canWrite || rippleBusyId === p.id}
                        className="rounded-xs border border-phosphor/50 bg-phosphor/10 px-3 py-1 text-xs font-600 text-phosphor transition-colors hover:bg-phosphor/20 disabled:opacity-40"
                      >
                        {rippleBusyId === p.id ? 'rippling...' : 'Ripple'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </section>
  );
}
