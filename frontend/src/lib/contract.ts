import { createClient } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';

// ripple intelligent contract on GenLayer Bradbury Testnet.
// PARENT: overwrite CONTRACT_ADDRESS (and optionally DEPLOY_TX) after deploy.
export const CONTRACT_ADDRESS = '0xC476B82106565CdB55920712378c25EC2E611B56';
// PARENT: optionally set the deploy tx hash here (typed string, not a literal).
export const DEPLOY_TX: string = '0xc1b8f70141615c80a9ae5a99870ba9bfc81b83801944ad61d75f9c683fdf1161';

// A string-typed zero so the literal comparison below never trips TS2367.
const ZERO: string = '0x0000000000000000000000000000000000000000';
export const IS_DEPLOYED: boolean = CONTRACT_ADDRESS !== ZERO;

export const EXPLORER = 'https://explorer-bradbury.genlayer.com';
export const FAUCET = 'https://testnet-faucet.genlayer.foundation/';

export const BRADBURY_PARAMS = {
  chainId: '0x107D', // 4221
  chainName: 'GenLayer Bradbury Testnet',
  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
  rpcUrls: ['https://rpc-bradbury.genlayer.com'],
  blockExplorerUrls: ['https://explorer-bradbury.genlayer.com/'],
};

export const readClient = createClient({ chain: testnetBradbury });

export const makeWalletClient = (account: `0x${string}`) =>
  createClient({ chain: testnetBradbury, account });

export type WalletClient = ReturnType<typeof makeWalletClient>;

const ADDRESS = CONTRACT_ADDRESS as `0x${string}`;

export const shortAddr = (a: string, lead = 6, tail = 4): string => {
  const s = String(a ?? '');
  if (s.length <= lead + tail + 1) return s;
  return `${s.slice(0, lead)}\u2026${s.slice(-tail)}`;
};

// ---- closed sets and bounds mirrored from the contract -------------------

export const DOMAINS = [
  'ECONOMY',
  'SOCIETY',
  'TECHNOLOGY',
  'ENVIRONMENT',
  'POLITICS',
  'CULTURE',
  'HEALTH',
  'SECURITY',
] as const;
export type Domain = (typeof DOMAINS)[number];

export const LIMITS = {
  premise: { min: 8, max: 300 },
} as const;

export type Status = 'OPEN' | 'PROJECTED' | '';

export interface Consequence {
  domain: Domain;
  effect: string;
  sub: string[];
}

export interface Premise {
  id: string;
  premise: string;
  status: Status;
  author: string;
  created: string;
  instability: number;
  consequences: Consequence[];
}

export interface Stats {
  premises: number;
  projected: number;
}

// ---- resilient reads -----------------------------------------------------

export async function withRpcRetry<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      // "not found" is included: a freshly deployed contract or a just-sent tx
      // can briefly read as missing while the node catches up.
      if (!/rate limit|429|timeout|network|fetch|too many|not found/i.test(String(e))) throw e;
      // backoff: 2.5s, 5s, 10s, 20s
      await new Promise((r) => setTimeout(r, 2500 * 2 ** i));
    }
  }
  throw last;
}

function toRecord<T>(value: unknown): T {
  if (value instanceof Map) {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of value.entries()) obj[String(k)] = normalize(v);
    return obj as T;
  }
  return value as T;
}

function normalize(value: unknown): unknown {
  if (value instanceof Map) return toRecord(value);
  if (Array.isArray(value)) return value.map(normalize);
  if (typeof value === 'bigint') return value.toString();
  return value;
}

function num(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'bigint') return Number(v);
  const n = Number(String(v ?? '0'));
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string {
  return String(v ?? '');
}

function asStatus(v: unknown): Status {
  const s = str(v).toUpperCase();
  return s === 'OPEN' || s === 'PROJECTED' ? (s as Status) : '';
}

export function asDomain(v: unknown): Domain {
  const s = str(v).toUpperCase();
  return (DOMAINS as readonly string[]).includes(s) ? (s as Domain) : 'SOCIETY';
}

function asConsequence(raw: unknown): Consequence {
  const r = toRecord<Record<string, unknown>>(raw);
  const sub = Array.isArray(r.sub) ? (normalize(r.sub) as unknown[]).map(str) : [];
  return {
    domain: asDomain(r.domain),
    effect: str(r.effect),
    sub,
  };
}

export function asPremise(raw: unknown): Premise {
  const r = toRecord<Record<string, unknown>>(raw);
  const cons = Array.isArray(r.consequences)
    ? (normalize(r.consequences) as unknown[]).map(asConsequence)
    : [];
  return {
    id: str(r.id),
    premise: str(r.premise),
    status: asStatus(r.status),
    author: str(r.author),
    created: str(r.created),
    instability: num(r.instability),
    consequences: cons,
  };
}

export async function fetchPremises(start = 0): Promise<Premise[]> {
  const raw = await withRpcRetry(() =>
    readClient.readContract({ address: ADDRESS, functionName: 'get_premises', args: [BigInt(start)] }),
  );
  const arr = (normalize(raw) as unknown[]) ?? [];
  return arr.map(asPremise);
}

export async function fetchPremise(premiseId: string): Promise<Premise | null> {
  const raw = await withRpcRetry(() =>
    readClient.readContract({ address: ADDRESS, functionName: 'get_premise', args: [premiseId] }),
  );
  const r = toRecord<Record<string, unknown>>(normalize(raw));
  if (!r || !r.id) return null;
  return asPremise(r);
}

export async function fetchStats(): Promise<Stats> {
  const raw = await withRpcRetry(() =>
    readClient.readContract({ address: ADDRESS, functionName: 'get_stats', args: [] }),
  );
  const r = toRecord<Record<string, unknown>>(normalize(raw));
  return {
    premises: num(r.premises),
    projected: num(r.projected),
  };
}

// ---- writes --------------------------------------------------------------

export function posePremise(client: WalletClient, premise: string) {
  return client.writeContract({
    address: ADDRESS,
    functionName: 'pose',
    args: [premise],
    value: 0n,
  });
}

export function ripplePremise(client: WalletClient, premiseId: string) {
  return client.writeContract({
    address: ADDRESS,
    functionName: 'ripple',
    args: [premiseId],
    value: 0n,
  });
}

// ---- transaction polling -------------------------------------------------

const STATUS_NAME: Record<string, string> = {
  '1': 'PENDING',
  '2': 'PROPOSING',
  '3': 'COMMITTING',
  '4': 'REVEALING',
  '5': 'ACCEPTED',
  '6': 'UNDETERMINED',
  '7': 'FINALIZED',
  '8': 'CANCELED',
  '12': 'VALIDATORS_TIMEOUT',
  '13': 'LEADER_TIMEOUT',
};

export const statusName = (s: unknown): string =>
  STATUS_NAME[String(s)] ?? String(s ?? 'PENDING').toUpperCase();

// LEADER_TIMEOUT / VALIDATORS_TIMEOUT are intentionally absent: the network
// rotates the leader and retries, so keep polling through them.
const TERMINAL = new Set(['ACCEPTED', 'FINALIZED', 'UNDETERMINED', 'CANCELED']);

export interface LeaderDraft {
  instability?: number;
  consequences: { domain: Domain; effect: string }[];
}

function pick(obj: unknown, key: string): unknown {
  if (obj instanceof Map) return obj.get(key);
  if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[key];
  return undefined;
}

export function extractLeaderDraft(tx: unknown): LeaderDraft | null {
  try {
    const receipts = pick(pick(tx, 'consensus_data'), 'leader_receipt');
    const first = Array.isArray(receipts) ? receipts[0] : receipts;
    const b64 = pick(pick(first, 'eq_outputs'), '0');
    if (typeof b64 !== 'string' || b64.length === 0) return null;
    const text = atob(b64);
    for (let i = text.length - 1; i >= 0; i--) {
      if (text[i] !== '{') continue;
      try {
        const obj = JSON.parse(text.slice(i)) as Record<string, unknown>;
        if (obj && typeof obj === 'object' && ('instability' in obj || 'consequences' in obj)) {
          const cons = Array.isArray(obj.consequences) ? obj.consequences : [];
          return {
            instability: obj.instability !== undefined ? num(obj.instability) : undefined,
            consequences: cons
              .map((c) => {
                const r = toRecord<Record<string, unknown>>(c);
                return { domain: asDomain(r.domain), effect: str(r.effect) };
              })
              .filter((c) => c.effect.length > 0),
          };
        }
      } catch {
        /* keep scanning toward the start for a parseable object */
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function pollUntilDecided(
  client: WalletClient,
  hash: `0x${string}`,
  onUpdate?: (status: string, draft: LeaderDraft | null) => void,
): Promise<{ status: string; draft: LeaderDraft | null }> {
  let draft: LeaderDraft | null = null;
  for (let i = 0; i < 150; i++) {
    const tx = await client
      .getTransaction({ hash } as Parameters<typeof client.getTransaction>[0])
      .catch(() => null);
    const status = statusName(tx ? (tx as { status?: unknown }).status : 'PENDING');
    draft = extractLeaderDraft(tx) ?? draft;
    onUpdate?.(status, draft);
    if (TERMINAL.has(status)) return { status, draft };
    await new Promise((r) => setTimeout(r, 8000));
  }
  return { status: 'TIMEOUT', draft };
}

// ---- friendly error mapping ----------------------------------------------

export function friendlyError(e: unknown): string {
  const msg = String((e as { message?: string })?.message ?? e ?? '');
  if (/LackOfFundForMaxFee|insufficient funds|max fee/i.test(msg))
    return 'Not enough GEN to cover network fees. Claim testnet GEN from the faucet and retry.';
  if (/reject|denied|4001|user rejected/i.test(msg)) return 'You cancelled the request.';
  if (/rate limit|429|too many/i.test(msg)) return 'The network is rate limiting requests. Wait a moment and retry.';
  if (/timeout/i.test(msg)) return 'The request timed out. The cascade may still settle; check again shortly.';
  if (/not found/i.test(msg)) return 'Contract not found at this address yet. It may still be propagating.';
  if (/execution reverted|reverted/i.test(msg)) return 'The contract rejected this action. Check the premise rules and try again.';
  return msg.slice(0, 200) || 'Something went wrong. Please retry.';
}
