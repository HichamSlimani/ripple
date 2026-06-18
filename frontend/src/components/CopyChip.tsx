'use client';

import { useState } from 'react';

// Copy-to-clipboard chip for addresses and hashes.
export default function CopyChip({
  value,
  label,
  className = '',
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  return (
    <button
      onClick={copy}
      title={`Copy ${value}`}
      aria-label={`Copy ${label ?? value}`}
      className={`mono inline-flex items-center gap-1 text-faint transition-colors hover:text-phosphor ${className}`}
    >
      <span>{label ?? value}</span>
      <span className="text-[10px]">{copied ? '[copied]' : '[copy]'}</span>
    </button>
  );
}
