'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CONTRACT_ADDRESS,
  EXPLORER,
  FAUCET,
  IS_DEPLOYED,
  fetchPremises,
  friendlyError,
  makeWalletClient,
  posePremise,
  ripplePremise,
  shortAddr,
  type LeaderDraft,
  type Premise,
} from '@/lib/contract';
import { useWallet } from '@/hooks/useWallet';
import { useToasts } from '@/components/Toasts';
import PhosphorField from '@/components/PhosphorField';
import CascadeCanvas from '@/components/CascadeCanvas';
import ConsoleBar from '@/components/ConsoleBar';
import PremiseComposer from '@/components/PremiseComposer';
import ProjectionsDrawer from '@/components/ProjectionsDrawer';
import ConsensusOverlay from '@/components/ConsensusOverlay';
import ConfirmDialog from '@/components/ConfirmDialog';
import ErrorBoundary from '@/components/ErrorBoundary';

type Pending =
  | { kind: 'pose'; premise: string }
  | { kind: 'ripple'; premise: Premise }
  | null;

const POLL_MS = 90_000;
const CONFIRM_BODY =
  'This submits a transaction on Bradbury Testnet. Network fees apply. Continue?';

export default function Page() {
  const wallet = useWallet();
  const toasts = useToasts();

  const [premises, setPremises] = useState<Premise[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [poseBusy, setPoseBusy] = useState(false);
  const [rippleBusyId, setRippleBusyId] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  // consensus overlay state
  const [consActive, setConsActive] = useState(false);
  const [consStatus, setConsStatus] = useState('PENDING');
  const [consDraft, setConsDraft] = useState<LeaderDraft | null>(null);
  const [consElapsed, setConsElapsed] = useState(0);
  const [consHash, setConsHash] = useState<string | null>(null);

  const inFlight = useRef(false);
  const elapsedTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const canWrite = !!wallet.address && wallet.onChain && IS_DEPLOYED;

  const stats = useMemo(() => {
    const total = premises.length;
    const projected = premises.filter((p) => p.status === 'PROJECTED').length;
    const readings = premises.filter((p) => p.status === 'PROJECTED').map((p) => p.instability);
    const avg = readings.length
      ? Math.round(readings.reduce((a, b) => a + b, 0) / readings.length)
      : 0;
    const peak = readings.length ? Math.max(...readings) : 0;
    return { total, projected, avg, peak };
  }, [premises]);

  const active = useMemo(
    () => premises.find((p) => p.id === activeId) ?? null,
    [premises, activeId],
  );
  const activeProjected = active && active.status === 'PROJECTED' ? active : null;

  const load = useCallback(
    async (silent = false) => {
      if (!IS_DEPLOYED) {
        setLoading(false);
        return;
      }
      if (inFlight.current) return;
      if (!silent) setLoading(true);
      try {
        const list = await fetchPremises(0);
        setPremises(list);
        setActiveId((cur) => {
          if (cur && list.some((p) => p.id === cur)) return cur;
          const firstProjected = list.find((p) => p.status === 'PROJECTED');
          return firstProjected ? firstProjected.id : cur;
        });
      } catch (e) {
        if (!silent) toasts.push({ kind: 'warn', title: 'Read failed', body: friendlyError(e) });
      } finally {
        setLoading(false);
      }
    },
    [toasts],
  );

  useEffect(() => {
    load();
  }, [load]);

  // poll every 90s, paused while a tx is in flight
  useEffect(() => {
    const id = setInterval(() => {
      if (!inFlight.current) load(true);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const startElapsed = () => {
    setConsElapsed(0);
    const t0 = Date.now();
    elapsedTimer.current = setInterval(() => {
      setConsElapsed(Math.floor((Date.now() - t0) / 1000));
    }, 1000);
  };
  const stopElapsed = () => {
    if (elapsedTimer.current) clearInterval(elapsedTimer.current);
    elapsedTimer.current = null;
  };

  // ---- pose flow ---------------------------------------------------------
  const runPose = useCallback(
    async (premise: string) => {
      if (!wallet.address) return;
      setPoseBusy(true);
      inFlight.current = true;
      try {
        const client = makeWalletClient(wallet.address);
        const hash = (await posePremise(client, premise)) as `0x${string}`;
        toasts.push({
          kind: 'info',
          title: 'Premise submitted',
          body: 'Registering the premise on-chain.',
          href: `${EXPLORER}/tx/${hash}`,
          hrefLabel: 'view tx',
        });
        const { pollUntilDecided } = await import('@/lib/contract');
        await pollUntilDecided(client, hash);
        toasts.push({
          kind: 'good',
          title: 'Premise posed',
          body: 'It is OPEN and ready to ripple.',
        });
        await load(true);
        wallet.refreshBalance();
      } catch (e) {
        toasts.push({ kind: 'warn', title: 'Could not pose', body: friendlyError(e) });
      } finally {
        setPoseBusy(false);
        inFlight.current = false;
      }
    },
    [wallet, toasts, load],
  );

  // ---- ripple flow -------------------------------------------------------
  const runRipple = useCallback(
    async (premise: Premise) => {
      if (!wallet.address) return;
      setRippleBusyId(premise.id);
      setActiveId(premise.id);
      inFlight.current = true;
      setConsDraft(null);
      setConsStatus('PENDING');
      setConsHash(null);
      setConsActive(true);
      startElapsed();
      try {
        const client = makeWalletClient(wallet.address);
        const hash = (await ripplePremise(client, premise.id)) as `0x${string}`;
        setConsHash(hash);
        toasts.push({
          kind: 'info',
          title: 'Projection submitted',
          body: 'Validators are convening.',
          href: `${EXPLORER}/tx/${hash}`,
          hrefLabel: 'view tx',
        });

        const { pollUntilDecided } = await import('@/lib/contract');
        const { status } = await pollUntilDecided(client, hash, (s, d) => {
          setConsStatus(s);
          if (d) setConsDraft(d);
        });

        if (status === 'ACCEPTED' || status === 'FINALIZED') {
          await load(true);
          toasts.push({
            kind: 'good',
            title: 'Cascade settled',
            body: 'The consequence tree is on-chain.',
          });
        } else if (status === 'UNDETERMINED') {
          toasts.push({
            kind: 'warn',
            title: 'Consensus undetermined',
            body: 'Validators could not agree this round. You can ripple it again.',
          });
        } else {
          toasts.push({
            kind: 'warn',
            title: 'Still settling',
            body: 'The projection is taking longer than expected. It may finalise shortly.',
          });
          await load(true);
        }
        wallet.refreshBalance();
      } catch (e) {
        toasts.push({ kind: 'warn', title: 'Projection failed', body: friendlyError(e) });
      } finally {
        stopElapsed();
        setConsActive(false);
        setRippleBusyId(null);
        inFlight.current = false;
      }
    },
    [wallet, toasts, load],
  );

  useEffect(() => () => stopElapsed(), []);

  // ---- confirm gate ------------------------------------------------------
  const confirm = () => {
    const p = pending;
    setPending(null);
    if (!p) return;
    if (p.kind === 'pose') runPose(p.premise);
    else runRipple(p.premise);
  };

  const fieldEnergy = consActive ? 0.9 : activeProjected ? activeProjected.instability / 140 : 0.12;

  return (
    <ErrorBoundary>
      <main className="relative min-h-screen pb-16">
        {/* brand monogram floats top-left over the canvas */}
        <div className="pointer-events-none absolute left-4 top-4 z-20 select-none">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-sm border border-phosphor/40 bg-bg/60 text-glow hairline">
              <span className="display text-lg font-700 text-phosphor">r</span>
            </span>
            <div className="leading-tight">
              <p className="display text-sm font-700 lowercase tracking-[0.2em] text-ink">ripple</p>
              <p className="mono text-[9px] uppercase tracking-[0.16em] text-faint">
                counterfactual simulator
              </p>
            </div>
          </div>
        </div>

        {/* ===== hero: the radial cascade canvas / live data ===== */}
        <section
          aria-label="Cascade field"
          className="labgrid relative overflow-hidden border-b px-4 pb-10 pt-20 hairline"
        >
          <PhosphorField energy={fieldEnergy} />
          <div className="relative z-10 mx-auto max-w-5xl">
            {/* live telemetry strip */}
            <div className="mx-auto mb-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center">
              <Stat label="premises" value={stats.total} />
              <Stat label="projected" value={stats.projected} />
              <Stat label="avg instability" value={stats.avg} accent />
              <Stat label="peak" value={stats.peak} accent />
            </div>

            {!IS_DEPLOYED ? (
              <AwaitingDeploy />
            ) : activeProjected ? (
              <CascadeCanvas premise={activeProjected} />
            ) : (
              <EmptyField hasOpen={premises.some((p) => p.status === 'OPEN')} />
            )}
          </div>
        </section>

        {/* ===== composer + drawer ===== */}
        <div className="mx-auto grid max-w-5xl gap-5 px-4 py-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <PremiseComposer
              onPose={(premise) => setPending({ kind: 'pose', premise })}
              busy={poseBusy}
              canWrite={canWrite}
            />
            {!IS_DEPLOYED ? (
              <p className="mono mt-2 text-[11px] text-amber">
                Reads and writes activate once the contract address is set in lib/contract.ts.
              </p>
            ) : !wallet.address ? (
              <p className="mono mt-2 text-[11px] text-faint">
                Need GEN? Claim from the{' '}
                <a
                  href={FAUCET}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber underline decoration-dotted underline-offset-2"
                >
                  faucet
                </a>
                .
              </p>
            ) : null}
          </div>
          <div className="lg:col-span-3">
            <ProjectionsDrawer
              premises={premises}
              loading={loading}
              activeId={activeId}
              onSelect={(p) => setActiveId(p.id)}
              onRipple={(p) => setPending({ kind: 'ripple', premise: p })}
              rippleBusyId={rippleBusyId}
              canWrite={canWrite}
            />
          </div>
        </div>

        {/* ===== how the projection works (a rite) ===== */}
        <section
          aria-labelledby="rite-h"
          className="mx-auto max-w-5xl px-4 pb-10"
        >
          <h2 id="rite-h" className="display text-lg font-700 uppercase tracking-wide text-ink">
            How a premise ripples
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Rite
              n="01"
              t="Pose"
              d="State one what-if. It lands on-chain as an OPEN premise, untouched by any model."
            />
            <Rite
              n="02"
              t="Ripple"
              d="A Futurist drafts a branching cascade across eight domains. Validators re-run it and anchor agreement on the headline instability reading within tolerance."
            />
            <Rite
              n="03"
              t="Settle"
              d="A deterministic backstop clamps the reading, repairs domains and caps the tree. The whole cascade is stored as PROJECTED."
            />
          </div>
        </section>

        {/* ===== telemetry footer line ===== */}
        <footer className="mx-auto max-w-5xl px-4 pb-6">
          <p className="mono text-center text-[10px] uppercase tracking-[0.18em] text-faint">
            ripple // {IS_DEPLOYED ? shortAddr(CONTRACT_ADDRESS) : 'contract pending deploy'} //
            bradbury testnet // {stats.total} premises traced // a one-shot generative
            consequence-cascade, settled under consensus
          </p>
        </footer>

        <ConsoleBar wallet={wallet} />
      </main>

      <ConsensusOverlay
        active={consActive}
        status={consStatus}
        draft={consDraft}
        elapsed={consElapsed}
        hash={consHash}
        explorer={EXPLORER}
      />

      <ConfirmDialog
        open={!!pending}
        title={pending?.kind === 'ripple' ? 'Project this cascade?' : 'Pose this premise?'}
        body={CONFIRM_BODY}
        confirmLabel={pending?.kind === 'ripple' ? 'Ripple it' : 'Pose it'}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      />
    </ErrorBoundary>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className={`tnum display text-2xl font-700 leading-none ${
          accent ? 'text-phosphor text-glow' : 'text-ink'
        }`}
      >
        {value}
      </span>
      <span className="mono mt-1 text-[10px] uppercase tracking-[0.16em] text-faint">{label}</span>
    </div>
  );
}

function Rite({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <div className="rounded-sm border bg-panel/40 p-4 hairline">
      <span className="mono text-[11px] text-phosphor">{n}</span>
      <p className="display mt-1 text-base font-600 uppercase tracking-wide text-ink">{t}</p>
      <p className="mt-1 text-sm text-muted">{d}</p>
    </div>
  );
}

function EmptyField({ hasOpen }: { hasOpen: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-xl rounded-sm border border-dashed p-10 text-center hairline"
    >
      <p className="display text-xl font-700 uppercase tracking-wide text-phosphor text-glow">
        The field is unperturbed
      </p>
      <p className="mt-2 text-sm text-muted">
        {hasOpen
          ? 'A premise is posed and waiting. Ripple it from the drawer to watch the consequence tree condense out of the phosphor.'
          : 'No cascade has been traced yet. State a what-if below and let the Futurist project where it leads.'}
      </p>
    </motion.div>
  );
}

function AwaitingDeploy() {
  return (
    <div className="mx-auto max-w-xl rounded-sm border border-dashed p-10 text-center hairline">
      <p className="display text-xl font-700 uppercase tracking-wide text-amber">
        Awaiting deploy
      </p>
      <p className="mt-2 text-sm text-muted">
        The simulator is wired to the ripple contract but the on-chain address has not been set yet.
        Once deployed, every reading you see here is live chain data, never a mock.
      </p>
    </div>
  );
}
