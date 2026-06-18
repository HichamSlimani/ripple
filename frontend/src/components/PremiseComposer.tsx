'use client';

import { useState } from 'react';
import { LIMITS } from '@/lib/contract';

const SEEDS = [
  'Every government releases its entire intelligence archive to the public on the same day.',
  'A working room-temperature superconductor is open-sourced overnight.',
  'Global shipping halts for thirty days with no warning.',
  'Sleep becomes optional for anyone who wants it.',
];

export default function PremiseComposer({
  onPose,
  busy,
  canWrite,
}: {
  onPose: (premise: string) => void;
  busy: boolean;
  canWrite: boolean;
}) {
  const [text, setText] = useState('');
  const len = text.trim().length;
  const tooShort = len > 0 && len < LIMITS.premise.min;
  const valid = len >= LIMITS.premise.min && len <= LIMITS.premise.max;

  return (
    <section aria-labelledby="composer-h" className="rounded-sm border bg-panel/60 p-5 hairline">
      <div className="flex items-baseline justify-between">
        <h2 id="composer-h" className="display text-lg font-700 uppercase tracking-wide text-ink">
          State a what-if
        </h2>
        <span
          className={`tnum mono text-[11px] ${
            len > LIMITS.premise.max ? 'text-coral' : 'text-faint'
          }`}
        >
          {len}/{LIMITS.premise.max}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">
        One premise. The Futurist reads it as untrusted data, never instructions, and projects the
        cascade outward.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, LIMITS.premise.max + 40))}
        rows={3}
        maxLength={LIMITS.premise.max + 40}
        placeholder="What if..."
        aria-label="Premise text"
        className="mt-3 w-full resize-none rounded-sm border bg-bg/60 p-3 text-sm text-ink outline-none placeholder:text-faint focus:border-phosphor/50 hairline"
      />

      <div className="mt-2 flex flex-wrap gap-1.5">
        {SEEDS.map((s) => (
          <button
            key={s}
            onClick={() => setText(s)}
            className="mono rounded-xs border px-2 py-1 text-left text-[10px] text-faint transition-colors hover:text-phosphor hairline"
          >
            {s.length > 46 ? `${s.slice(0, 46)}...` : s}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[11px] text-faint">
          {tooShort
            ? `A premise needs at least ${LIMITS.premise.min} characters to ripple.`
            : !canWrite
              ? 'Connect a wallet on Bradbury Testnet to pose.'
              : 'Posing registers the premise on-chain as OPEN. Network fees apply.'}
        </p>
        <button
          onClick={() => valid && onPose(text.trim())}
          disabled={!valid || busy || !canWrite}
          className="shrink-0 rounded-sm border border-phosphor/50 bg-phosphor/10 px-4 py-2 text-sm font-600 text-phosphor transition-colors hover:bg-phosphor/20 disabled:opacity-40"
        >
          {busy ? 'posing...' : 'Pose premise'}
        </button>
      </div>
    </section>
  );
}
