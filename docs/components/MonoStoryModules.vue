<script setup lang="ts">
/*
 * Panel 2 of section 2: the same problem under Mono.
 *
 * Reads left to right the way the work actually flows. Each developer owns one
 * remote repository of their own; those modules feed a shared bus; the bus ends
 * at the Host Module, which owns the shell. The Host is the DESTINATION, not the
 * origin — everything converges on it.
 *
 * What the drawing adds is state: Module One is warning, Module Three and Module
 * Group are clean, and Module Two has been unwired, because somebody is taking
 * it over. Its developer is still attached to it; its wire into the Host is
 * simply gone. The argument is everything that does NOT happen as a result.
 *
 * Straight lines throughout, against the monolith panel's tangle of curves all
 * converging on one `main`. That contrast is the point of showing both.
 *
 * Just the drawing; <MonoStoryPanel> owns the figure and caption, and holds it
 * on frame 0 until it is scrolled into view, reaching these animations through
 * `:deep()`.
 *
 * Same clock discipline as the monolith story: one `--story` duration on every
 * element, act encoded as percentages inside each @keyframes, per-module
 * stagger via `--row`, runs ONCE, holds its final frame.
 *
 * Every id here is suffixed `Modules`: `url(#…)` and `<use href="#…">` resolve
 * document-wide, and both the hero and the monolith story put their own defs on
 * this same page.
 */

/* Left to right: developer, their own repo, the shared bus, the Host. */
const CARD_X = 104
const CARD_W = 330
const CARD_END = CARD_X + CARD_W
const BUS_X = 480
const HOST = { x: 530, y: 100, w: 230, h: 104 }
const HOST_Y = HOST.y + HOST.h / 2

type Mod = {
  /** Only an identity for the :key. */
  dev: string
  /**
   * The owning developer's colour. Four of the five tints the monolith story
   * uses — amber is deliberately dropped, because it is Module One's warning
   * colour here and a developer wearing it would read as a status.
   */
  tint: string
  name: string
  repo: string
  /** Card top. Its wire, rib, badge and name all hang off `head()`. */
  y: number
  h: number
  state: 'warn' | 'error' | 'ok'
}

const MODULES: Mod[] = [
  { dev: 'A', tint: '#14b8a6', name: 'Module One', repo: 'module-one', y: 24, h: 52, state: 'warn' },
  { dev: 'B', tint: '#0ea5e9', name: 'Module Two', repo: 'module-two', y: 92, h: 52, state: 'error' },
  { dev: 'C', tint: '#8b5cf6', name: 'Module Three', repo: 'module-three', y: 160, h: 52, state: 'ok' },
  // The tall one: it carries three more modules inside its own border.
  { dev: 'D', tint: '#ec4899', name: 'Module Group', repo: 'module-group', y: 228, h: 128, state: 'ok' },
]

const NESTED = ['Module Four', 'Module Five', 'Module Six']

/** The card's header row — where its wire and rib land, beside its badge. */
const head = (m: Mod) => m.y + 26
</script>

<template>
  <svg
    class="mono-story mono-modules"
    viewBox="0 0 800 380"
    role="img"
    aria-labelledby="mono-modules-title mono-modules-desc"
  >
    <title id="mono-modules-title">
      Four developers, four repositories, one Host — and one of them unplugged
    </title>
    <desc id="mono-modules-desc">
      Four developers, each owning one module in a repository of their own, all
      feeding a single Host Module at github.com/company/host that owns the
      shell and is managed by one person of its own. Module One is deployed with a warning. Module Two has been taken
      over: its developer is still attached to it, but its wire into the Host
      is gone entirely and its card is marked with an error, so it is not
      currently wired in at all. Module Three is clean. Module Group is clean too, and holds Module
      Four, Module Five and Module Six inside it. The three modules that are
      still wired keep running throughout, unaffected by the one pulled out.
    </desc>

    <defs>
      <linearGradient id="modulesAccent" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#a855f7" />
        <stop offset="50%" stop-color="#7c3aed" />
        <stop offset="100%" stop-color="#4f46e5" />
      </linearGradient>

      <!-- The GitHub mark, stamped once per repo line. Native size is 24px and
           width/height on a <use> of a bare <path> is ignored, so it is scaled:
           24 * 0.3 = 7.2px. -->
      <path
        id="ghMarkModules"
        d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
      />

      <!-- mdi:account, the glyph `i-mdi-account` would give you. Inlined rather
           than used as an icon class because a CSS background-image cannot
           paint inside an SVG, and each avatar needs its own `fill`. -->
      <path
        id="accountMarkModules"
        d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"
      />
    </defs>

    <!--
      ── Layer 1 · every connector ──────────────────────────────────────────
      All the lines first, so nothing can paint over a card or a label. Same
      rule the hero diagram states, and the same one the monolith panel needed.
    -->
    <g class="mono-modules__links">
      <g
        v-for="(mod, i) in MODULES"
        :key="`link-${mod.repo}`"
        :class="`is-${mod.state}`"
        :style="{ '--dev': mod.tint, '--row': String(i) }"
      >
        <!-- Developer to their own repository. No curves anywhere in this
             drawing: that is the whole visual argument against the other panel. -->
        <path class="wire" :d="`M44,${head(mod)} H96`" pathLength="100" />
        <polygon
          class="wire-arrow"
          :points="`104,${head(mod)} 96,${head(mod) - 5} 96,${head(mod) + 5}`"
        />

<!-- Their repository into the shared bus. Module Two's draws with the
             rest and then goes entirely: no stub, no dashes, no red remnant.
             The empty track where a line plainly ought to be is a louder
             statement than any severed-cable drawing. -->
        <path class="rib" :d="`M${CARD_END},${head(mod)} H${BUS_X}`" pathLength="100" />

        <!-- The three that stay plugged in keep marching to the end: "the
             others still run". Module Two gets no ants — it is not running. -->
        <path
          v-if="mod.state !== 'error'"
          class="rib-flow"
          :d="`M${CARD_END},${head(mod)} H${BUS_X}`"
        />
      </g>

      <!-- The shared bus, and the stem that carries it into the Host. -->
      <path
        class="hub"
        :d="`M${BUS_X},${head(MODULES[0])} V${head(MODULES[3])}`"
        pathLength="100"
      />
      <path class="hub" :d="`M${BUS_X},${HOST_Y} H522`" pathLength="100" />
      <polygon class="hub-arrow" :points="`${HOST.x},${HOST_Y} 522,${HOST_Y - 6} 522,${HOST_Y + 6}`" />
    </g>

    <!-- ── Layer 2 · each developer's own repository ───────────────────────── -->
    <g
      v-for="(mod, i) in MODULES"
      :key="mod.repo"
      class="mono-modules__card"
      :class="`is-${mod.state}`"
      :style="{ '--row': String(i) }"
    >
      <!-- The slide-in is animated on this WRAPPER, never on the children: a
           CSS `transform` overrides an SVG `transform=""` attribute, so tagging
           the <use> below would tear the GitHub mark off its own
           translate()/scale() and drop it at the origin at full size. -->
      <g class="card">
        <rect class="box" :x="CARD_X" :y="mod.y" :width="CARD_W" :height="mod.h" rx="10" />
        <text class="label sm" x="136" :y="head(mod) - 5">{{ mod.name }}</text>
        <line
          class="divider"
          :x1="CARD_X"
          :y1="head(mod) + 6"
          :x2="CARD_END"
          :y2="head(mod) + 6"
        />
        <use
          class="repo-mark"
          href="#ghMarkModules"
          :transform="`translate(118,${head(mod) + 12}) scale(0.3)`"
        />
        <text class="repo" x="131" :y="head(mod) + 18">
          github.com/company/{{ mod.repo }}
        </text>

        <!-- The hero's own status glyphs, stroked rather than typed so they stay
             crisp at 11px. Red / amber / green are semantic and deliberately sit
             outside the violet brand palette. Opacity-only animation, so this
             group's own transform attribute is safe. -->
        <g class="status" :transform="`translate(122,${head(mod) - 10})`">
          <circle class="dot" r="5.5" />
          <path v-if="mod.state === 'warn'" class="glyph" d="M0,-2.7 V0.7" />
          <circle v-if="mod.state === 'warn'" class="glyph-dot" cy="2.4" r="0.8" />
          <path v-else-if="mod.state === 'error'" class="glyph" d="M-2,-2 L2,2 M2,-2 L-2,2" />
          <path v-else class="glyph" d="M-2.4,0.1 L-0.8,1.8 L2.4,-1.9" />
        </g>

        <!-- Module Group holds its three inside its own border, rather than
             branching out to a fourth column. -->
        <template v-if="mod.name === 'Module Group'">
          <line
            class="divider is-nested"
            :x1="CARD_X"
            :y1="mod.y + 56"
            :x2="CARD_END"
            :y2="mod.y + 56"
          />
          <g v-for="(leaf, n) in NESTED" :key="leaf" class="leaf" :style="{ '--leaf': String(n) }">
            <rect class="leaf-box" x="118" :y="mod.y + 64 + n * 20" width="302" height="16" rx="6" />
            <circle class="leaf-dot" cx="130" :cy="mod.y + 72 + n * 20" r="2.2" />
            <text class="leaf-label" x="140" :y="mod.y + 75 + n * 20">{{ leaf }}</text>
          </g>
        </template>
      </g>
    </g>

    <!-- ── Layer 3 · the Host, where everything ends up ────────────────────── -->
    <g class="mono-modules__host">
      <!-- Same wrapper rule as the module cards: the slide is on the group, so
           the GitHub mark keeps its own transform attribute. -->
      <g class="host">
        <rect
          class="box is-host"
          :x="HOST.x"
          :y="HOST.y"
          :width="HOST.w"
          :height="HOST.h"
          rx="14"
        />
        <text class="label" x="546" y="134">Host Module</text>
        <line class="divider is-host" x1="530" y1="146" x2="760" y2="146" />
        <use
          class="repo-mark"
          href="#ghMarkModules"
          transform="translate(544,163) scale(0.3)"
        />
        <text class="repo" x="557" y="169">github.com/company/host</text>
        <text class="note" x="546" y="190">owns the shell</text>
      </g>

      <!-- The shell has an owner too. Same grammar as the four on the left — a
           person, wired straight into the thing they manage — but the avatar
           carries the accent gradient instead of a flat tint, which marks them
           as the shell's owner rather than a fifth module owner. -->
      <g class="owner">
        <circle class="dev is-owner" cx="616" cy="58" r="14" />
        <use
          class="dev-icon is-owner"
          href="#accountMarkModules"
          transform="translate(607,49) scale(0.75)"
        />
        <text class="note" x="636" y="62">one owner</text>
      </g>
      <path class="owner-wire" d="M616,72 V92" pathLength="100" />
      <polygon class="owner-arrow" points="616,100 611,92 621,92" />
    </g>

    <!-- ── Layer 4 · the people ────────────────────────────────────────────── -->
    <g class="mono-modules__devs">
      <g v-for="mod in MODULES" :key="`dev-${mod.dev}`" :style="{ '--dev': mod.tint }">
        <circle class="dev beat" cx="28" :cy="head(mod)" r="14" />
        <use
          class="dev-icon beat"
          href="#accountMarkModules"
          :transform="`translate(19,${head(mod) - 9}) scale(0.75)`"
        />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.mono-modules {
  /* One clock for every act, run through exactly once. */
  --story: 7s;
  display: block;
  width: 100%;
  /* Narrower than the monolith panel: this drawing has three columns to its
     seven, and letting it fill 1040px would only make it sparse. */
  max-width: 840px;
  height: auto;
  margin: 12px auto 0;
}

/* Everything on the story clock. The per-module stagger phase-shifts a row
   without changing its duration, so the rows cannot drift apart. */
.mono-modules .beat,
.mono-modules .wire,
.mono-modules .wire-arrow,
.mono-modules .hub,
.mono-modules .hub-arrow,
.mono-modules .rib,
.mono-modules .rib-flow,
.mono-modules .card,
.mono-modules .host,
.mono-modules .owner,
.mono-modules .owner-wire,
.mono-modules .owner-arrow,
.mono-modules .status,
.mono-modules .leaf {
  animation-duration: var(--story);
  animation-timing-function: ease;
  animation-iteration-count: 1;
  animation-fill-mode: both;
  animation-delay: calc(var(--row, 0) * 0.1s);
}

/* ── Act 1 · the people ─────────────────────────────────────────────────── */

/* One avatar colour per developer, off `--dev`. They are four people, not four
   states, so these sit outside the semantic red / amber / green. */
.mono-modules .dev {
  fill: color-mix(in srgb, var(--dev) 12%, var(--vp-c-bg));
  stroke: var(--dev);
  stroke-width: 1.5;
  animation-name: story-hold;
}
.mono-modules .dev-icon {
  fill: var(--dev);
  animation-name: story-hold;
}

/* ── Act 2 · each developer into their own repository ───────────────────── */

.mono-modules .wire {
  fill: none;
  stroke: var(--dev);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 100 100;
  stroke-dashoffset: 0;
  animation-name: story-draw-wire;
}
.mono-modules .wire-arrow {
  fill: var(--dev);
  animation-name: story-wire-arrow;
}

/* ── Acts 3-4 · the cards, and the bus they feed ────────────────────────── */

.mono-modules .box {
  /* --vp-c-bg, not --vp-c-bg-soft: the panel behind is already bg-soft, so a
     card sharing it has no edge. This is the page background — white in light,
     and it inverts on its own in dark. */
  fill: var(--vp-c-bg-elv);
  stroke: var(--vp-c-divider);
  stroke-width: 1.5;
}
.mono-modules .label {
  fill: var(--vp-c-text-1);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.mono-modules .label.sm {
  font-size: 13.5px;
  font-weight: 600;
}
.mono-modules .divider {
  stroke: var(--vp-c-divider);
  stroke-width: 1;
}
.mono-modules .repo {
  fill: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  font-size: 6.6px;
}
.mono-modules .repo-mark {
  fill: var(--vp-c-text-3);
}
.mono-modules .note {
  fill: var(--vp-c-text-3);
  font-size: 9px;
}

.mono-modules .rib {
  fill: none;
  stroke: var(--vp-c-brand-1);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 100 100;
  stroke-dashoffset: 0;
  animation-name: story-draw-rib;
}

/* Fine, and flagged-but-fine. Module Two has no rib left to colour. */
.mono-modules .is-ok .rib,
.mono-modules .is-ok .rib-flow {
  stroke: #22c55e;
}
.mono-modules .is-warn .rib,
.mono-modules .is-warn .rib-flow {
  stroke: #f59e0b;
}

/* The three that stay plugged in keep marching after everything else has
   settled. Their ants ride the story clock like every other animation here,
   drifting 13 whole dash periods (4 + 7) so they end on the pattern they
   started from. */
.mono-modules .rib-flow {
  fill: none;
  stroke: var(--vp-c-brand-1);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 4 7;
  animation-name: story-flow-in, story-ants;
  animation-duration: var(--story), var(--story);
  animation-timing-function: ease, linear;
  animation-iteration-count: 1, 1;
  animation-fill-mode: both, both;
  animation-delay: calc(var(--row, 0) * 0.1s), 0s;
}

/* The bus and the stem into the Host: neutral, because they belong to the shell
   rather than to any one module. */
.mono-modules .hub {
  fill: none;
  stroke: var(--vp-c-text-3);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 100 100;
  stroke-dashoffset: 0;
  animation-name: story-draw-hub;
}
.mono-modules .hub-arrow {
  fill: var(--vp-c-brand-1);
  animation-name: story-hub-arrow;
}

/* ── Act 5 · the cards land ─────────────────────────────────────────────── */

.mono-modules .card {
  animation-name: story-card;
}

/* The status colour owns the whole lane: the card's outline and the rib into
   the bus are the same colour, so the row reads at a glance from either end.
   Violet stays reserved for the shell — the Host card and the arrow into it. */
.mono-modules .is-ok .box,
.mono-modules .is-warn .box,
.mono-modules .is-error .box {
  stroke-width: 1.75;
}
.mono-modules .is-ok .box {
  stroke: #22c55e;
}
.mono-modules .is-warn .box {
  stroke: #f59e0b;
}
.mono-modules .is-error .box {
  stroke: #ef4444;
}

.mono-modules .status {
  animation-name: story-badge;
}
.mono-modules .status .dot {
  fill: var(--vp-c-text-3);
}
.mono-modules .status .glyph {
  fill: none;
  stroke: #ffffff;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.mono-modules .status .glyph-dot {
  fill: #ffffff;
}
.mono-modules .is-ok .status .dot {
  fill: #22c55e;
}
.mono-modules .is-warn .status .dot {
  fill: #f59e0b;
}
.mono-modules .is-error .status .dot {
  fill: #ef4444;
}

/* The three that live inside Module Group. */
.mono-modules .leaf {
  animation-name: story-leaf;
  animation-delay: calc(var(--row, 0) * 0.1s + var(--leaf, 0) * 0.08s);
}
.mono-modules .leaf-box {
  /* Inverted against the others: these sit ON the white group card, so they
     take the soft tone to read as inset rather than disappearing into it. */
  fill: var(--vp-c-bg-soft);
  stroke: var(--vp-c-divider);
  stroke-width: 1;
}
.mono-modules .leaf-dot {
  fill: var(--vp-c-brand-1);
}
.mono-modules .leaf-label {
  fill: var(--vp-c-text-2);
  font-size: 9.5px;
  font-weight: 600;
}

/* ── Act 6 · the Host, where it all ends up ─────────────────────────────── */

.mono-modules .box.is-host {
  stroke: url(#modulesAccent);
  stroke-width: 2;
}
.mono-modules .divider.is-host {
  stroke: color-mix(in srgb, var(--vp-c-brand-1) 40%, transparent);
}
.mono-modules .host {
  animation-name: story-host;
}

/* The Host's owner. The gradient stroke is the tell: every other avatar wears a
   flat personal tint, this one wears the shell's own accent. */
.mono-modules .dev.is-owner {
  fill: color-mix(in srgb, var(--vp-c-brand-1) 12%, var(--vp-c-bg));
  stroke: url(#modulesAccent);
  stroke-width: 2;
}
.mono-modules .dev-icon.is-owner {
  fill: var(--vp-c-brand-1);
}
.mono-modules .owner,
.mono-modules .owner .dev,
.mono-modules .owner .dev-icon {
  animation-name: story-owner;
}
.mono-modules .owner-wire {
  fill: none;
  stroke: var(--vp-c-text-3);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 100 100;
  stroke-dashoffset: 0;
  animation-name: story-draw-owner;
}
.mono-modules .owner-arrow {
  fill: var(--vp-c-brand-1);
  animation-name: story-owner-arrow;
}

/* ── Act 7 · the module that leaves ─────────────────────────────────────── */

/* Module Two's rib draws with every other one, then disappears completely.
   Two animations on two separate properties: `stroke-dashoffset` draws it,
   `opacity` takes it away. */
.mono-modules .is-error .rib {
  animation-name: story-draw-rib, story-unwire;
  animation-duration: var(--story), var(--story);
  animation-timing-function: ease, ease;
  animation-iteration-count: 1, 1;
  animation-fill-mode: both, both;
  animation-delay: calc(var(--row, 0) * 0.1s), calc(var(--row, 0) * 0.1s);
}

/* ── Keyframes ──────────────────────────────────────────────────────────── */

/*  %   act
   ─────────────────────────────────────────────────────────────────────────
    0   four developers
    8   each draws a straight wire into their own repository
   16   the four module cards land
   30   each card's rib reaches the shared bus
   40   the bus, and the stem carrying it into the Host
   48   the Host Module card — the destination, so it arrives last
   58   Module Four / Five / Six appear inside Module Group
   60   the Host's own owner, wired down into it
   64   status badges land
   74   Module Two's rib disappears entirely — it is being taken over
   82   ants run on the three that are still wired                          */

@keyframes story-hold {
  0%,
  1% {
    opacity: 0;
  }
  8%,
  100% {
    opacity: 1;
  }
}

/* Every drawn line carries pathLength="100", so one 100 -> 0 sweep draws any of
   them regardless of its real length. */
@keyframes story-draw-wire {
  0%,
  8% {
    stroke-dashoffset: 100;
  }
  20%,
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes story-wire-arrow {
  0%,
  18% {
    opacity: 0;
  }
  24%,
  100% {
    opacity: 1;
  }
}
@keyframes story-card {
  0%,
  16% {
    opacity: 0;
    transform: translateX(-8px);
  }
  28%,
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes story-draw-rib {
  0%,
  30% {
    stroke-dashoffset: 100;
  }
  42%,
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes story-draw-hub {
  0%,
  40% {
    stroke-dashoffset: 100;
  }
  52%,
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes story-hub-arrow {
  0%,
  50% {
    opacity: 0;
  }
  56%,
  100% {
    opacity: 1;
  }
}
@keyframes story-host {
  0%,
  48% {
    opacity: 0;
    transform: translateX(10px);
  }
  60%,
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes story-owner {
  0%,
  60% {
    opacity: 0;
  }
  70%,
  100% {
    opacity: 1;
  }
}
@keyframes story-draw-owner {
  0%,
  66% {
    stroke-dashoffset: 100;
  }
  76%,
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes story-owner-arrow {
  0%,
  74% {
    opacity: 0;
  }
  80%,
  100% {
    opacity: 1;
  }
}
@keyframes story-leaf {
  0%,
  58% {
    opacity: 0;
    transform: translateX(6px);
  }
  68%,
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes story-badge {
  0%,
  64% {
    opacity: 0;
  }
  72%,
  100% {
    opacity: 1;
  }
}

/* Somebody takes Module Two over, and its wire is simply not there any more. */
@keyframes story-unwire {
  0%,
  74% {
    opacity: 1;
  }
  84%,
  100% {
    opacity: 0;
  }
}

/* The payoff: the wires that were not cut are still moving at the end. */
@keyframes story-flow-in {
  0%,
  82% {
    opacity: 0;
  }
  90%,
  100% {
    opacity: 1;
  }
}
@keyframes story-ants {
  to {
    stroke-dashoffset: -143;
  }
}

/* ── Reduced motion ─────────────────────────────────────────────────────── */

/* Resolve to the LAST frame, not the first: killing the animations alone would
   leave the stage on four developers wired to nothing. Every element's resting
   style is already the finished state, so the only fixes needed are the ones
   the keyframes drove past their static value. */
@media (prefers-reduced-motion: reduce) {
  .mono-modules,
  .mono-modules * {
    animation: none !important;
  }
  .mono-modules .is-error .rib {
    opacity: 0;
  }
}
</style>
