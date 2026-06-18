'use client';

import { FAUCET, shortAddr } from '@/lib/contract';
import type { WalletState } from '@/hooks/useWallet';
import CopyChip from './CopyChip';

// The header is a BOTTOM instrument console bar: network, wallet and faucet
// readouts sit along the base of the simulator like an oscilloscope panel.
export default function ConsoleBar({ wallet }: { wallet: WalletState }) {
  const { address, onChain, balance, connecting, hasProvider, connect, disconnect } = wallet;

  return (
    <footer
      className="fixed inset-x-0 bottom-0 z-[90] border-t bg-panel/90 backdrop-blur hairline"
      aria-label="Instrument console"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-1.5 px-4 py-2 text-[11px]">
        <span className="mono inline-flex items-center gap-1.5 text-faint">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              onChain ? 'bg-phosphor' : 'bg-coral'
            }`}
            aria-hidden="true"
          />
          NET
          <span className={onChain ? 'text-phosphor' : 'text-coral'}>
            {onChain ? 'BRADBURY' : address ? 'WRONG CHAIN' : 'BRADBURY TESTNET'}
          </span>
        </span>

        <span className="mono text-faint">
          BAL <span className="tnum text-muted">{balance ?? '--'}</span> GEN
        </span>

        {address ? (
          <span className="mono inline-flex items-center gap-2 text-faint">
            ACCT
            <CopyChip value={address} label={shortAddr(address)} className="text-muted" />
          </span>
        ) : null}

        <a
          href={FAUCET}
          target="_blank"
          rel="noopener noreferrer"
          className="mono text-amber underline decoration-dotted underline-offset-2 hover:text-phosphor"
        >
          FAUCET
        </a>

        <div className="ml-auto flex items-center gap-2">
          {address ? (
            <button
              onClick={disconnect}
              className="mono rounded-xs border px-3 py-1 text-muted transition-colors hover:text-ink hairline"
            >
              disconnect
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={connecting}
              className="mono rounded-xs border border-phosphor/50 bg-phosphor/10 px-3 py-1 font-600 text-phosphor transition-colors hover:bg-phosphor/20"
            >
              {connecting ? 'connecting...' : hasProvider ? 'connect wallet' : 'connect wallet'}
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}
