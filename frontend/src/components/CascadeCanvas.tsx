'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { Premise } from '@/lib/contract';
import InstabilityDial from './InstabilityDial';
import { domainTint, instabilityColor } from './instability';

// The radial cascade: the premise sits at the centre as an instability dial and
// its consequences unfurl as branches outward. Each branch is an expandable
// node pill; expanding reveals the second-order sub-effects.
export default function CascadeCanvas({ premise }: { premise: Premise | null }) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    setOpen(null);
  }, [premise?.id]);

  if (!premise) return null;

  const cons = premise.consequences;
  const n = Math.max(cons.length, 1);
  const accent = instabilityColor(premise.instability);

  return (
    <div className="relative">
      {/* radial spokes layer (decorative, behind the nodes) */}
      <svg
        className="pointer-events-none absolute left-1/2 top-[112px] -z-0 -translate-x-1/2"
        width="2"
        height="2"
        aria-hidden="true"
      />

      <div className="flex flex-col items-center">
        {/* central node */}
        <motion.div
          layout
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 26 }}
          className="relative z-10 grid place-items-center"
        >
          <InstabilityDial value={premise.instability} />
        </motion.div>

        <p className="mono mt-3 max-w-xl text-center text-[11px] uppercase tracking-[0.18em] text-faint">
          central premise
        </p>
        <p className="mt-1 max-w-2xl text-balance text-center text-base text-ink">
          {premise.premise}
        </p>

        {/* branches */}
        <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cons.map((c, i) => {
            const tint = domainTint(c.domain);
            const isOpen = open === i;
            return (
              <motion.div
                key={`${premise.id}-${i}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + (i / n) * 0.5, duration: 0.5 }}
                className="relative"
              >
                {/* connector tick up toward the centre */}
                <span
                  aria-hidden="true"
                  className="absolute -top-3 left-5 h-3 w-px"
                  style={{ background: `linear-gradient(${tint}, transparent)` }}
                />
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="group w-full rounded-sm border bg-panel/70 p-3 text-left transition-colors hover:bg-panel2/80 hairline"
                  style={{ borderLeft: `2px solid ${tint}` }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="mono text-[10px] font-600 uppercase tracking-[0.16em]"
                      style={{ color: tint }}
                    >
                      {c.domain}
                    </span>
                    <span className="mono text-[10px] text-faint">
                      {c.sub.length ? `${c.sub.length} sub` : 'first-order'}
                      <span className="ml-1 inline-block transition-transform group-aria-expanded:rotate-90">
                        {isOpen ? '-' : '+'}
                      </span>
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-snug text-ink">{c.effect}</p>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && c.sub.length > 0 ? (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.28 }}
                      className="overflow-hidden pl-4"
                    >
                      {c.sub.map((s, j) => (
                        <li
                          key={j}
                          className="relative mt-2 border-l pl-3 text-xs text-muted hairline"
                        >
                          <span
                            aria-hidden="true"
                            className="absolute -left-[3px] top-2 h-1.5 w-1.5 rounded-full"
                            style={{ background: tint }}
                          />
                          {s}
                        </li>
                      ))}
                    </motion.ul>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <p
          className="mono mt-6 text-[11px] uppercase tracking-[0.18em]"
          style={{ color: accent }}
        >
          cascade settled - {cons.length} first-order branches projected
        </p>
      </div>
    </div>
  );
}
