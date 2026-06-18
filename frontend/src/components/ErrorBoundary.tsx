'use client';

import { Component, type ReactNode } from 'react';
import { EXPLORER } from '@/lib/contract';

interface State {
  error: Error | null;
}

// Never let a failed read crash the simulator. Offers Retry and an explorer
// link, with a precise diagnostic for the common chain faults.
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  private diagnose(msg: string): string {
    if (/not found/i.test(msg))
      return 'The contract could not be found at the configured address. It may not be deployed yet, or the address in lib/contract.ts is still the placeholder.';
    if (/execution reverted|reverted/i.test(msg))
      return 'A contract call reverted. The premise rules may have rejected the input.';
    if (/rate limit|429|too many/i.test(msg))
      return 'The network is rate limiting requests. Wait for the window to reset and retry.';
    return 'A read against the chain failed. The network may be busy.';
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const msg = String(error.message ?? error);
    return (
      <div
        role="alert"
        className="mx-auto mt-10 max-w-lg rounded-sm border bg-panel p-6 text-center hairline"
      >
        <p className="display text-lg font-700 uppercase tracking-wide text-coral text-glow-coral">
          The field destabilised
        </p>
        <p className="mt-2 text-sm text-muted">{this.diagnose(msg)}</p>
        <p className="mono mt-3 break-words text-[11px] text-faint">{msg.slice(0, 220)}</p>
        <div className="mt-5 flex justify-center gap-2">
          <button
            onClick={() => this.setState({ error: null })}
            className="rounded-sm border border-phosphor/50 bg-phosphor/10 px-4 py-2 text-sm font-600 text-phosphor transition-colors hover:bg-phosphor/20"
          >
            Retry
          </button>
          <a
            href={EXPLORER}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm border px-4 py-2 text-sm text-muted transition-colors hover:text-ink hairline"
          >
            Open explorer
          </a>
        </div>
      </div>
    );
  }
}
