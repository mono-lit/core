<script setup lang="ts">
/*
 * The documentation landing page, replacing VitePress' default `hero:` /
 * `features:` frontmatter block.
 *
 * `docs/index.md` keeps `layout: home` but declares NEITHER `hero` nor
 * `features` — both default blocks are `v-if`-guarded on those keys, so they
 * render nothing and this component takes the whole page. `markdownStyles:
 * false` keeps VitePress from wrapping it in `.vp-doc` typography.
 *
 * Section 1 (hero) renders directly: it is plain HTML and SVG. Every other
 * section wraps its `mono-*` components in <ClientOnly>, because @mono-lit/helper
 * ships the browser build of Lit with no SSR dom-shim -- server-rendering those
 * elements and then hydrating corrupts the markup. Any new section using
 * `mono-*` must do the same.
 */
import MonoShowcase from "./MonoShowcase.vue"
import MonoConflictSection from "./MonoConflictSection.vue"
import MonoAuthSection from "./MonoAuthSection.vue"
import MonoFetchSection from "./MonoFetchSection.vue"
import MonoSyncSection from "./MonoSyncSection.vue"
import MonoLlmsSection from "./MonoLlmsSection.vue"
import MonoFooter from "./MonoFooter.vue"
</script>

<template>
  <div class="mono-home">
    <!-- ── Section 1 · Hero ─────────────────────────────────────────────── -->
    <section class="mono-hero">
      <div class="mono-hero__inner">
        <!-- Left: the title block. The CTA lives here, with the title. -->
        <div class="mono-hero__title">
          <p class="mono-hero__eyebrow">Vue &middot; Nuxt &middot; Web components</p>

          <h1 class="mono-hero__heading">
            <span class="mono-hero__brand">Mono</span> &mdash; build Vue and Nuxt apps as micro-frontend
          </h1>

          <p class="mono-hero__lede">
            One Host owns the shell. Every module plugs in and develops on its own.
            Shared UI, cookies, JWT, configs. Making the app modular, composable, and maintainable. 
          </p>

          <div class="mono-hero__actions">
            <a class="mono-cta" href="/repo/getting-started">Getting Started</a>
          </div>
        </div>

        <!--
          Right: how the apps compose. One Host owns the shell; modules plug
          into it, and a module can itself be a group that nests further.

          The tree runs LEFT TO RIGHT on purpose: each extra level of nesting
          adds a column instead of squeezing an already-wide row of siblings,
          so a third level (features under a group) still fits a hero.
        -->
        <div class="mono-hero__diagram">
          <svg
            class="mono-diagram"
            viewBox="0 0 496 316"
            role="img"
            aria-labelledby="mono-diagram-title mono-diagram-desc"
          >
            <title id="mono-diagram-title">Host module composing nested modules</title>
            <desc id="mono-diagram-desc">
              A Host Module on the left, with its repository path. It composes
              Module One, Module Two, Module Three and a Module Group, each with
              its own repository and a deploy status: Module One is in
              development, Module Two is failing, and Module Three and the
              Module Group are deployed. The Module Group nests one level
              deeper, holding Module Four, Module Five and Module Six.
            </desc>

            <defs>
              <!-- Coloured from CSS, not from stop-color attributes — see the
                   .accent-* rules below for why, and for the two palettes. -->
              <linearGradient id="monoAccent" x1="0" y1="0" x2="1" y2="0">
                <stop class="accent-1" offset="0%" />
                <stop class="accent-2" offset="50%" />
                <stop class="accent-3" offset="100%" />
              </linearGradient>

              <!-- The GitHub mark, drawn once and stamped per box. It is a bare <path>, so
                   width/height on the <use> are IGNORED (those only apply to <symbol> or
                   <svg> targets) -- it renders at its native 24px unless scaled. Hence the
                   scale(0.3) on each use: 24 * 0.3 = 7.2px. -->
              <path
                id="ghMark"
                d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
              />
            </defs>

            <!-- Connectors first, so the cards paint over the bus lines. -->
            <g class="mono-diagram__links" fill="none">
              <!-- Host -> the four modules: stem, vertical bus, one rib each. -->
              <path class="link flow" d="M128,158 H140" />
              <path class="link flow" d="M140,42 V234" />
              <path class="link flow" d="M140,42 H158" />
              <path class="link flow" d="M140,106 H158" />
              <path class="link flow" d="M140,170 H158" />
              <path class="link flow" d="M140,234 H158" />
              <polygon class="arrow" points="164,42 156,37 156,47" />
              <polygon class="arrow" points="164,106 156,101 156,111" />
              <polygon class="arrow" points="164,170 156,165 156,175" />
              <polygon class="arrow" points="164,234 156,229 156,239" />

              <!-- Module Group -> its three modules, one level deeper. -->
              <path class="link flow" d="M320,234 H332" />
              <path class="link flow" d="M332,188 V280" />
              <path class="link flow" d="M332,188 H350" />
              <path class="link flow" d="M332,234 H350" />
              <path class="link flow" d="M332,280 H350" />
              <polygon class="arrow" points="356,188 348,183 348,193" />
              <polygon class="arrow" points="356,234 348,229 348,239" />
              <polygon class="arrow" points="356,280 348,275 348,285" />
            </g>

            <!-- Level 1 · the Host. -->
            <g class="mono-diagram__node is-host">
              <rect class="box" x="8" y="130" width="120" height="56" rx="12" />
              <text class="label" x="16" y="152">Host Module</text>
              <line class="divider" x1="8" y1="158" x2="128" y2="158" />
              <use class="repo-mark" href="#ghMark" transform="translate(16,165) scale(0.3)" />
              <text class="repo" x="29" y="171">github.com/company/host</text>
            </g>

            <!-- Level 2 · modules plugged into the Host. -->
            <g class="mono-diagram__node">
              <rect class="box" x="164" y="16" width="156" height="52" rx="10" />
              <g class="status is-warn" transform="translate(181,34)"><circle class="dot" r="5.5" /><path class="glyph" d="M0,-2.7 V0.7" /><circle class="glyph-dot" cy="2.4" r="0.8" /></g>
              <text class="label sm" x="192" y="38">Module One</text>
              <line class="divider" x1="164" y1="44" x2="320" y2="44" />
              <use class="repo-mark" href="#ghMark" transform="translate(176,51) scale(0.3)" />
              <text class="repo" x="189" y="57">github.com/company/module-one</text>
            </g>
            <g class="mono-diagram__node is-error">
              <rect class="box" x="164" y="80" width="156" height="52" rx="10" />
              <g class="status is-error" transform="translate(181,98)"><circle class="dot" r="5.5" /><path class="glyph" d="M-2,-2 L2,2 M2,-2 L-2,2" /></g>
              <text class="label sm" x="192" y="102">Module Two</text>
              <line class="divider" x1="164" y1="108" x2="320" y2="108" />
              <use class="repo-mark" href="#ghMark" transform="translate(176,115) scale(0.3)" />
              <text class="repo" x="189" y="121">github.com/company/module-two</text>
            </g>
            <g class="mono-diagram__node">
              <rect class="box" x="164" y="144" width="156" height="52" rx="10" />
              <g class="status is-ok" transform="translate(181,162)"><circle class="dot" r="5.5" /><path class="glyph" d="M-2.4,0.1 L-0.8,1.8 L2.4,-1.9" /></g>
              <text class="label sm" x="192" y="166">Module Three</text>
              <line class="divider" x1="164" y1="172" x2="320" y2="172" />
              <use class="repo-mark" href="#ghMark" transform="translate(176,179) scale(0.3)" />
              <text class="repo" x="189" y="185">github.com/company/module-three</text>
            </g>

            <!-- A module that is itself a group — accented, because it nests. -->
            <g class="mono-diagram__node is-group">
              <rect class="box" x="164" y="208" width="156" height="52" rx="10" />
              <g class="status is-ok" transform="translate(181,226)"><circle class="dot" r="5.5" /><path class="glyph" d="M-2.4,0.1 L-0.8,1.8 L2.4,-1.9" /></g>
              <text class="label sm" x="192" y="230">Module Group</text>
              <line class="divider" x1="164" y1="236" x2="320" y2="236" />
              <use class="repo-mark" href="#ghMark" transform="translate(176,243) scale(0.3)" />
              <text class="repo" x="189" y="249">github.com/company/module-group</text>
            </g>

            <!-- Level 3 · the modules nested inside the group. -->
            <g class="mono-diagram__node is-leaf">
              <rect class="box" x="356" y="171" width="132" height="34" rx="9" />
              <text class="label xs" x="368" y="192">Module Four</text>
            </g>
            <g class="mono-diagram__node is-leaf">
              <rect class="box" x="356" y="217" width="132" height="34" rx="9" />
              <text class="label xs" x="368" y="238">Module Five</text>
            </g>
            <g class="mono-diagram__node is-leaf">
              <rect class="box" x="356" y="263" width="132" height="34" rx="9" />
              <text class="label xs" x="368" y="284">Module Six</text>
            </g>
          </svg>
        </div>
      </div>
    </section>

    <!-- Section 2 - why one repo for everything manufactures conflicts -->
    <MonoConflictSection />

    <!-- Section 3 - every component, live -->
    <MonoShowcase />

    <!-- Section 4 - cookies and JWT from one config -->
    <MonoAuthSection />

    <!-- Section 5 - REST and OData fetching, run live -->
    <MonoFetchSection />

    <!-- Section 6 - sync between host and remotes -->
    <MonoSyncSection />

    <!-- Section 7 - llms.txt for AI agents -->
    <MonoLlmsSection />

    <MonoFooter />
  </div>
</template>

<style scoped>
.mono-home {
  /* The page is full-bleed (`.VPContent.is-home`), so the section owns its
     own max-width rather than inheriting a doc container. */
  --mono-home-max: 1152px;
}

/* ── Section 1 · Hero ───────────────────────────────────────────────────── */

.mono-hero {
  position: relative;
  overflow: hidden;
  padding: 48px 24px 64px;
}

/*
 * Two decorative layers, both `pointer-events: none` so neither can swallow a
 * click on the CTA, and both under the content.
 *
 * ::before is the aurora — three fixed radial gradients rather than a blurred
 * element. Deliberately NOT `filter: blur()`: a filtered ancestor establishes a
 * containing block, which is exactly what breaks the 100vw panel bleed over in
 * the fetch section, and it is worth keeping the one habit across the page.
 */
.mono-hero::before {
  content: '';
  position: absolute;
  inset: -30% -10% -10%;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(38% 42% at 78% 22%, var(--cyber-aurora-1), transparent 70%),
    radial-gradient(30% 34% at 22% 8%, var(--cyber-aurora-2), transparent 70%),
    radial-gradient(46% 40% at 50% 100%, var(--cyber-aurora-3), transparent 72%);
}

/*
 * ::after is the horizon grid. Perspective tilts a flat pair of repeating
 * gradients away from the viewer; `transform-origin: 50% 0` puts the vanishing
 * point at the top so the lines spread as they come forward.
 *
 * The mask is not optional — without it the lines run straight through the
 * headline and the type stops being readable.
 */
.mono-hero::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: -2px;
  left: 0;
  height: 300px;
  z-index: 0;
  pointer-events: none;
  transform: perspective(340px) rotateX(64deg);
  transform-origin: 50% 0;
  background:
    repeating-linear-gradient(to right, var(--cyber-grid) 0 1px, transparent 1px 64px),
    repeating-linear-gradient(to bottom, var(--cyber-grid) 0 1px, transparent 1px 64px);
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 55%);
  mask-image: linear-gradient(to bottom, transparent, #000 55%);
}

.mono-hero__inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  gap: 48px;
  max-width: var(--mono-home-max);
  margin: 0 auto;
}

@media (min-width: 960px) {
  .mono-hero {
    padding: 80px 48px 96px;
  }
  .mono-hero__inner {
    /* The diagram is the wider half now that it carries three levels. */
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
    gap: 56px;
  }
}

/* A lit terminal readout rather than a soft pill: mono, wide-tracked, with a
   glowing status dot. */
.mono-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 18px;
  padding: 5px 14px;
  border: 1px solid var(--cyber-edge);
  border-radius: 999px;
  background: rgba(167, 139, 250, 0.07);
  box-shadow: 0 0 24px -8px var(--cyber-glow);
  color: var(--vp-c-brand-2);
  font-family: var(--vp-font-family-mono);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.mono-hero__eyebrow::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  box-shadow: 0 0 8px 1px var(--vp-c-brand-1);
}

.mono-hero__heading {
  margin: 0;
  font-size: clamp(2rem, 4.6vw, 3rem);
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -0.02em;
  color: var(--vp-c-text-1);
}

/* The bloom is a `drop-shadow` filter, not a `text-shadow`: the glyphs are
   transparent — background-clipped — so a text-shadow would have nothing to cast
   from. The gradient itself flips with the theme via --cyber-wordmark, since the
   dark palette's pale stops are invisible on white and vice versa. */
.mono-hero__brand {
  background: var(--cyber-wordmark);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 22px var(--cyber-glow));
}

.mono-hero__lede {
  max-width: 34rem;
  margin: 20px 0 0;
  font-size: clamp(1rem, 1.55vw, 1.15rem);
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.mono-hero__actions {
  margin-top: 28px;
}

.mono-cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0 24px;
  border: 1px solid var(--cyber-edge-hi);
  border-radius: 20px;
  background: var(--cyber-cta);
  color: var(--cyber-cta-ink);
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 38px;
  text-decoration: none;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    0 0 34px -10px var(--cyber-glow);
  transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
}
.mono-cta::after {
  content: '\2192';
  font-weight: 700;
  transition: transform 0.2s;
}
.mono-cta:hover {
  transform: translateY(-1px);
  filter: brightness(1.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.32),
    0 0 44px -8px var(--cyber-glow);
}
.mono-cta:hover::after {
  transform: translateX(3px);
}

@media (prefers-reduced-motion: reduce) {
  .mono-cta,
  .mono-cta::after {
    transition: none;
  }
  .mono-cta:hover,
  .mono-cta:hover::after {
    transform: none;
  }
}

/* ── The diagram ────────────────────────────────────────────────────────── */

.mono-hero__diagram {
  display: flex;
  justify-content: center;
}

.mono-diagram {
  width: 100%;
  max-width: 580px;
  height: auto;
}

/* stop-color set here rather than on the elements: as a presentation
   attribute it cannot take a var(), so the gradient could not follow the theme.
   The light stops are invisible on near-black and the dark ones are invisible
   on white, hence two sets. */
.mono-diagram .accent-1 {
  stop-color: var(--cyber-accent-1);
}
.mono-diagram .accent-2 {
  stop-color: var(--cyber-accent-2);
}
.mono-diagram .accent-3 {
  stop-color: var(--cyber-accent-3);
}

.mono-diagram__node .box {
  fill: var(--cyber-node);
  stroke: var(--vp-c-divider);
  stroke-width: 1.5;
}
/* The Host carries the full brand gradient; the group that nests gets a plain
   brand stroke, so "this one has children" reads at a glance. */
.mono-diagram__node.is-host .box {
  stroke: url(#monoAccent);
  stroke-width: 2;
}
.mono-diagram__node.is-group .box {
  stroke: var(--vp-c-brand-1);
  stroke-width: 1.75;
}
.mono-diagram__node.is-leaf .box {
  fill: var(--cyber-node-leaf);
}

.mono-diagram__node .label {
  fill: var(--vp-c-text-1);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.mono-diagram__node .label.sm {
  font-size: 13.5px;
  font-weight: 600;
}
.mono-diagram__node .label.xs {
  /* One step down from a level-2 module: still a module, just nested. */
  font-size: 12.5px;
  font-weight: 600;
}
.mono-diagram__node .sub {
  fill: var(--vp-c-text-3);
  font-size: 10px;
  letter-spacing: 0.02em;
}

/* Deploy status, one badge per module. Red / amber / green are semantic here —
   they mean broken / in progress / shipped — so they deliberately do NOT follow
   the violet brand palette. Glyphs are stroked paths rather than text so they
   stay crisp at 11px and keep the source ASCII. */
.mono-diagram__node .status .dot {
  fill: var(--vp-c-text-3);
}
.mono-diagram__node .status .glyph {
  fill: none;
  stroke: #ffffff;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.mono-diagram__node .status .glyph-dot {
  fill: #ffffff;
}
.mono-diagram__node .status.is-ok .dot {
  fill: #22c55e;
}
.mono-diagram__node .status.is-warn .dot {
  fill: #f59e0b;
}
.mono-diagram__node .status.is-error .dot {
  fill: #ef4444;
}
/* A module that is failing outlines in red, so it reads before the badge does. */
.mono-diagram__node.is-error .box {
  stroke: #ef4444;
  stroke-width: 1.75;
}

/* The rule that turns the repo line into a card footer. Spans the box edge to
   edge, like a card's own divider, so the gap between name and repo reads as a
   deliberate split rather than loose spacing. */
.mono-diagram__node .divider {
  stroke: var(--vp-c-divider);
  stroke-width: 1;
}
.mono-diagram__node.is-host .divider {
  stroke: color-mix(in srgb, var(--vp-c-brand-1) 40%, transparent);
}

/* The repo line under each module's name. Display only — deliberately not a
   link, since these are illustrative paths rather than real repositories.
   6.6px keeps the longest of them (module-three) inside its 132-wide box. */
.mono-diagram__node .repo {
  fill: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  font-size: 6.2px;
  letter-spacing: 0;
}
.mono-diagram__node .repo-mark {
  fill: var(--vp-c-text-3);
}

.mono-diagram__links .link {
  stroke: var(--vp-c-divider);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.mono-diagram__links .arrow {
  fill: var(--vp-c-brand-1);
}

/* Dashes drift outward, from the Host toward what it composes, so the
   direction of the tree reads without a legend. */
.mono-diagram__links .flow {
  stroke: var(--vp-c-brand-1);
  stroke-dasharray: 4 7;
  animation: mono-flow 1.4s linear infinite;
}
@keyframes mono-flow {
  to {
    stroke-dashoffset: -22;
  }
}
@media (prefers-reduced-motion: reduce) {
  .mono-diagram__links .flow {
    animation: none;
  }
}
</style>
