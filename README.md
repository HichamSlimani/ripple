```
            r i p p l e
   on-chain AI counterfactual simulator
   one premise in. a cascade out. settled by consensus.
```

## What this is

`ripple` is a one-shot generative consequence-cascade. You state a single
what-if premise. A Futurist AI reads it and projects a branching tree of
plausible downstream consequences across eight distinct domains, then settles a
single headline INSTABILITY reading for how hard the world gets shaken. The
whole tree is stored on-chain.

It is not a verdict engine, not a persistent world, not a map. It is a
foresight instrument: drop a pebble, watch the rings, read the disturbance.

## Why it needs GenLayer

A consequence projection is subjective and AI-mediated, the kind of judgment no
single node should be trusted to make alone. So `ripple` puts the projection
under validator consensus. A leader drafts the cascade; validators independently
re-run the Futurist and anchor agreement on the headline instability reading
within a tolerance band. The branching tree itself is leader flavor and is never
compared, because two honest foresight analysts will phrase the future
differently while still agreeing on how disruptive it is. A deterministic
backstop then clamps the reading, repairs any out-of-set domain, caps the tree,
and writes PROJECTED state every validator computes identically.

## The eight domains

```
ECONOMY   SOCIETY    TECHNOLOGY   ENVIRONMENT
POLITICS  CULTURE    HEALTH       SECURITY
```

Every first-order consequence is tagged with exactly one of these and carries
one or two short second-order effects beneath it.

## The lifecycle

```
pose  ->  premise lands on-chain as OPEN, untouched by any model
ripple -> leader drafts, validators re-run and anchor on instability
settle -> backstop clamps + repairs + caps, tree stored as PROJECTED
```

## Contract surface

```
pose(premise: str) -> str          register an OPEN premise (8-300 chars)
ripple(premise_id: str) -> None    project the cascade under consensus
get_premises(start: u256) -> list  paged, newest-first, 20 per page
get_premise(premise_id) -> dict    one full record, or {}
get_stats() -> dict                {"premises", "projected"}
```

State lives in a `TreeMap[str, str]` of JSON records keyed by `premise-<n>`,
an id ordering array, and a `u256` projection counter. No value transfer, no
floats, no emojis.

## The instrument panel (frontend)

A phosphor-field simulator, not a card grid. The premise is the central node of
a radial canvas and its consequences unfurl outward as expandable branch pills
around an instability dial. While validators deliberate, the particle field
condenses into the forming tree and streams the leader-draft peek with honest
status names: leader rotation is informative, not a failure. Coral is reserved
for high instability; mint reads as a settled, contained cascade.

```
cd frontend
npm install
npm run dev      # local instrument panel
npm run build    # static export to ./out (GitHub Pages, basePath /ripple)
```

## Validate it yourself

```
genvm-lint lint contracts/contract.py --json
gltest tests/integration/ -v -s --network studionet \
  --default-wait-interval 5000 --default-wait-retries 120
```

The integration test poses a real premise, ripples it through live consensus,
and asserts a settled instability in 0-100, three to five branches with valid
domain tags, and updated stats.

## Reading the dial

```
0-14    CONTAINED          ripples die out fast
15-33   PERTURBED          local disturbance
34-66   TURBULENT          spreading across domains
67-83   DESTABILISING      systems start to buckle
84-100  SYSTEMIC UPHEAVAL  the whole field rings
```

## Coordinates

```ini
live_app  = https://hichamslimani.github.io/ripple/
network   = GenLayer Bradbury Testnet
contract  = TBD (set by parent after deploy)
runner    = py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6
faucet    = https://testnet-faucet.genlayer.foundation/
explorer  = https://explorer-bradbury.genlayer.com
```
