<script setup lang="ts">
/*
 * Panel 1 of section 2: why a monolith manufactures merge conflicts.
 *
 * A git graph that draws itself left to right. `main` is the long line across
 * the top — it is the spine of the picture on purpose, because the whole story
 * is about what can and cannot get back onto it. Five developers branch off it
 * out of one repository; `chore/deps` and `feat/billing` curve back in and land
 * as merge commits; the other three never do, because all three touch the same
 * three files.
 *
 * Just the drawing. <MonoStoryPanel> wraps it and owns the figure and caption,
 * and holds it on frame 0 until it is scrolled into view by toggling `is-idle`
 * on its own element — which reaches these animations through `:deep()`,
 * because slotted content carries the SECTION's scope id and not the panel's.
 *
 * ── The one-clock rule ────────────────────────────────────────────────────
 * Every element on the story timeline shares ONE `animation-duration`
 * (`--story`) and encodes its act as percentages inside its own @keyframes, so
 * the acts cannot drift apart. The only delay in play is the per-lane stagger,
 * `--row * 0.1s`.
 *
 * It runs ONCE — nothing here repeats. Every keyframe therefore holds its final
 * value through to 100% and `animation-fill-mode: both` keeps it there, so the
 * resting state is the conflict itself rather than a cleared stage.
 *
 * ── Drawing a path on ─────────────────────────────────────────────────────
 * Every line draws itself with the dash trick, and every one of them is a
 * different real length — main is ~950 units, a branch kink about 90. Rather
 * than measure each, they all carry `pathLength="100"`, which renormalises the
 * dash maths onto a 0-100 scale, so ONE pair of dasharray/dashoffset values
 * draws any path in the drawing. The marching-ants overlay on main is the sole
 * exception: its 4/7 pattern has to stay in real user units to read as ants, so
 * it is a second path over the same `d` with no pathLength.
 *
 * Every id here is suffixed `Mono`: `url(#…)` and `<use href="#…">` resolve
 * document-wide, and both the hero diagram and the sibling modules story put
 * their own defs on this same page.
 */

/* main: out of the repository card, up, then a very long way right. */
const MAIN_Y = 44
const MAIN_D = 'M120,98 V60 Q120,44 136,44 H1020'

/** How far a branch travels sideways while it drops into, or climbs out of, its lane. */
const KINK = 46

type Lane = {
  /** Only an identity for the :key and the avatar's colour. */
  dev: string
  /** The avatar's colour. Deliberately none of the semantic red / green. */
  tint: string
  branch: string
  mr: string
  /** The lane's own horizontal track. */
  y: number
  /** Where it leaves main. */
  from: number
  /** Where its own track stops. */
  end: number
  /** Where it lands back on main, or null when the merge never happens. */
  merge: number | null
}

/*
 * Ordered by outcome rather than by developer: the two that land sit closest to
 * main and merge early, so the three that pile up underneath read as the
 * exception. Those three share an `end` — they all stall at the same wall.
 */
const LANES: Lane[] = [
  { dev: 'E', tint: '#14b8a6', branch: 'chore/deps', mr: 'MR #16', y: 118, from: 220, end: 520, merge: 566 },
  { dev: 'B', tint: '#0ea5e9', branch: 'feat/billing', mr: 'MR #13', y: 162, from: 270, end: 640, merge: 686 },
  { dev: 'A', tint: '#8b5cf6', branch: 'feat/orders', mr: 'MR #12', y: 206, from: 320, end: 740, merge: null },
  { dev: 'C', tint: '#f59e0b', branch: 'fix/auth', mr: 'MR #14', y: 250, from: 370, end: 740, merge: null },
  { dev: 'D', tint: '#ec4899', branch: 'feat/report', mr: 'MR #15', y: 294, from: 420, end: 740, merge: null },
]

/** Commits on main belonging to no single lane: the root, then main moving on. */
const ROOT_COMMIT = 160
const AHEAD_COMMITS = [800, 890, 980]

const branchD = (l: Lane) =>
  `M${l.from},${MAIN_Y} C${l.from + 30},${MAIN_Y} ${l.from + 16},${l.y} ${l.from + KINK},${l.y}`

const runD = (l: Lane) => `M${l.from + KINK},${l.y} H${l.end}`

const mergeD = (l: Lane) =>
  `M${l.end},${l.y} C${l.end + 30},${l.y} ${(l.merge as number) - 30},${MAIN_Y} ${l.merge},${MAIN_Y}`

/** The merge request rides the middle of the lane's own track. */
const pillX = (l: Lane) => (l.from + KINK + l.end) / 2
</script>

<template>
  <svg
    class="mono-story"
    viewBox="0 0 1040 340"
    role="img"
    aria-labelledby="mono-monolith-title mono-monolith-desc"
  >
    <title id="mono-monolith-title">
      Five branches off one main, and only two of them land
    </title>
    <desc id="mono-monolith-desc">
      A git graph. Five developers share a single
      repository, github.com/company/app, holding src/router.ts,
      src/store.ts, package.json and 1,240 more files. A long main branch
      runs across the top. Five branches leave it in turn: chore/deps,
      feat/billing, feat/orders, fix/auth and feat/report, each raising a
      merge request. chore/deps and feat/billing curve back into main and
      land as merge commits. The remaining three — feat/orders, fix/auth
      and feat/report — all touch the same three shared files, so none of
      them can rejoin: their branches stop dead and are marked as
      conflicts, while main carries on ahead without them.
    </desc>

    <defs>
      <linearGradient id="monolithAccent" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#a855f7" />
        <stop offset="50%" stop-color="#7c3aed" />
        <stop offset="100%" stop-color="#4f46e5" />
      </linearGradient>

      <!-- The GitHub mark, stamped once on the repo line. Native size is
           24px and width/height on a <use> of a bare <path> is ignored,
           so it is scaled: 24 * 0.3 = 7.2px. -->
      <path
        id="ghMarkMono"
        d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
      />

      <!-- mdi:account, the same glyph `i-mdi-account` would give you.
           Inlined rather than used as an icon class because a CSS
           background-image cannot paint inside an SVG, and each avatar
           needs its own `fill`. 24px native, so scale(0.75) = 18px. -->
      <path
        id="accountMarkMono"
        d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"
      />
    </defs>

    <!-- ── Act 1 · one repository, five people committing into it ──── -->
    <g class="mono-story__monolith">
      <g
        v-for="lane in LANES"
        :key="`dev-${lane.dev}`"
        :style="{ '--dev': lane.tint }"
      >
        <circle class="dev beat" cx="24" :cy="lane.y" r="13" />
        <use
          class="dev-icon beat"
          href="#accountMarkMono"
          :transform="`translate(15,${lane.y - 9}) scale(0.75)`"
        />
        <path class="dev-link beat" :d="`M37,${lane.y} H60`" />
      </g>

      <rect class="box beat" x="60" y="98" width="140" height="214" rx="14" />
      <text class="label beat" x="74" y="130">Monolith</text>
      <line class="divider beat" x1="60" y1="140" x2="200" y2="140" />
      <text class="file beat" x="74" y="164">src/router.ts</text>
      <text class="file beat" x="74" y="182">src/store.ts</text>
      <text class="file beat" x="74" y="200">package.json</text>
      <text class="file is-muted beat" x="74" y="218">+ 1,240 more</text>
      <line class="divider beat" x1="60" y1="270" x2="200" y2="270" />
      <use
        class="repo-mark beat"
        href="#ghMarkMono"
        transform="translate(74,278) scale(0.3)"
      />
      <text class="repo beat" x="87" y="284">github.com/company/app</text>
    </g>

    <!--
      ── Acts 3-6, layer 1 · every connector ───────────────────────
      ALL of the lines go down first, in one layer, because each lane
      used to be a single group holding both its line and its chip:
      feat/report's branch curve is drawn after feat/billing's group and
      crosses straight over billing's pill and label on the way down to
      its own lane. Same rule the hero diagram states — connectors
      first, so the cards paint over them.
    -->
    <g class="mono-story__links">
      <g
        v-for="(lane, i) in LANES"
        :key="`link-${lane.branch}`"
        :class="lane.merge === null ? 'is-blocked' : 'is-merged'"
        :style="{ '--row': String(i) }"
      >
        <path class="branch" :d="branchD(lane)" pathLength="100" />
        <path class="run" :d="runD(lane)" pathLength="100" />
        <!-- Landed: the branch climbs back onto main. -->
        <path
          v-if="lane.merge !== null"
          class="merge"
          :d="mergeD(lane)"
          pathLength="100"
        />
      </g>
    </g>

    <!-- ── Act 2 · main, and it runs a long way ─────────────────────── -->
    <g class="mono-story__main">
      <path class="main-line" :d="MAIN_D" pathLength="100" />
      <path class="main-flow" :d="MAIN_D" />
      <text class="main-label beat" x="146" y="30">main</text>
      <circle class="commit is-root" :cx="ROOT_COMMIT" :cy="MAIN_Y" r="4.5" />

      <!-- Act 7 · main carries on without the three that are stuck. -->
      <circle
        v-for="x in AHEAD_COMMITS"
        :key="`ahead-${x}`"
        class="commit is-ahead"
        :cx="x"
        :cy="MAIN_Y"
        r="4.5"
      />
    </g>

    <!-- ── Acts 3-6, layer 2 · everything meant to be read ──────────── -->
    <g
      v-for="(lane, i) in LANES"
      :key="lane.branch"
      class="mono-story__lane"
      :class="lane.merge === null ? 'is-blocked' : 'is-merged'"
      :style="{ '--row': String(i) }"
    >
      <circle class="commit is-branch" :cx="lane.from" :cy="MAIN_Y" r="4.5" />

      <text class="branch-label beat" :x="lane.from + 52" :y="lane.y - 14">
        {{ lane.branch }}
      </text>

      <g class="mr beat">
        <rect
          class="pill"
          :x="pillX(lane) - 38"
          :y="lane.y - 11"
          width="76"
          height="22"
          rx="11"
        />
        <text class="pill-text" :x="pillX(lane)" :y="lane.y + 3.5">{{ lane.mr }}</text>
      </g>

      <!-- A landed branch's verdict IS its merge commit, sitting on main. -->
      <g v-if="lane.merge !== null" class="verdict is-merged">
        <circle class="badge" :cx="lane.merge" :cy="MAIN_Y" r="8" />
        <path
          class="glyph"
          :d="`M${lane.merge - 3.2},${MAIN_Y + 0.2} L${lane.merge - 0.8},${MAIN_Y + 2.6} L${lane.merge + 3.4},${MAIN_Y - 2.6}`"
        />
      </g>

      <!-- Stalled: there is no merge path at all in layer 1. The curve
           that never gets drawn is the point of the whole picture. -->
      <g v-else class="verdict is-blocked">
        <circle class="badge" :cx="lane.end + 14" :cy="lane.y" r="8" />
        <path
          class="glyph"
          :d="`M${lane.end + 11},${lane.y - 3} L${lane.end + 17},${lane.y + 3} M${lane.end + 17},${lane.y - 3} L${lane.end + 11},${lane.y + 3}`"
        />
      </g>
    </g>

    <!-- ── Act 6 · what the pile-up costs ───────────────────────────── -->
    <g class="mono-story__alert" :style="{ '--row': '5' }">
      <circle class="halo" cx="810" cy="196" r="16" />
      <rect class="alert-box beat" x="790" y="170" width="210" height="140" rx="12" />
      <circle class="alert-badge beat" cx="810" cy="196" r="7" />
      <path class="alert-glyph beat" d="M810,192.4 V196.4 M810,199.4 V199.5" />
      <text class="alert-title beat" x="826" y="200">Merge conflict</text>
      <line class="alert-divider beat" x1="790" y1="212" x2="1000" y2="212" />
      <text class="alert-file beat" x="808" y="236">src/router.ts</text>
      <text class="alert-file beat" x="808" y="254">src/store.ts</text>
      <text class="alert-file beat" x="808" y="272">package.json</text>
      <text class="alert-foot beat" x="808" y="294">3 of 5 branches blocked</text>
    </g>
  </svg>
</template>

<style scoped>
/* ── The story ──────────────────────────────────────────────────────────── */

.mono-story {
  /* One clock for every act, run through exactly once. */
  --story: 7s;
  display: block;
  width: 100%;
  max-width: 1040px;
  height: auto;
  margin: 12px auto 0;
}

/* Everything on the story clock. The per-lane stagger phase-shifts a lane
   without changing its duration, so the lanes cannot drift apart. */
.mono-story .beat,
.mono-story .main-line,
.mono-story .main-flow,
.mono-story .branch,
.mono-story .run,
.mono-story .merge,
.mono-story .commit,
.mono-story .verdict,
.mono-story .halo {
  animation-duration: var(--story);
  animation-timing-function: ease;
  animation-iteration-count: 1;
  animation-fill-mode: both;
  animation-delay: calc(var(--row, 0) * 0.1s);
}

/* ── Act 1 · the repository and the people committing into it ───────────── */

/* One avatar colour per developer, off `--dev`. They are five people, not five
   states, so these are deliberately none of the semantic red / green / violet
   the rest of the drawing spends on meaning. */
.mono-story .dev {
  fill: color-mix(in srgb, var(--dev) 12%, var(--vp-c-bg));
  stroke: var(--dev);
  stroke-width: 1.5;
  animation-name: story-hold;
}
.mono-story .dev-icon {
  fill: var(--dev);
  animation-name: story-hold;
}
.mono-story .dev-link {
  fill: none;
  stroke: var(--vp-c-divider);
  stroke-width: 1.5;
  stroke-linecap: round;
  animation-name: story-hold;
}

.mono-story .box {
  /* --vp-c-bg, not --vp-c-bg-soft: the panel behind is already bg-soft, so a
     card sharing it has no edge. This is the page background — white in light,
     and it inverts on its own in dark. */
  fill: var(--vp-c-bg-elv);
  stroke: url(#monolithAccent);
  stroke-width: 2;
  animation-name: story-hold;
}
.mono-story .label {
  fill: var(--vp-c-text-1);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
  animation-name: story-hold;
}
.mono-story .divider {
  stroke: color-mix(in srgb, var(--vp-c-brand-1) 40%, transparent);
  stroke-width: 1;
  animation-name: story-hold;
}
.mono-story .file {
  fill: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
  font-size: 9.5px;
  animation-name: story-hold;
}
.mono-story .file.is-muted {
  fill: var(--vp-c-text-3);
}
.mono-story .repo {
  fill: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  font-size: 6.6px;
  animation-name: story-hold;
}
.mono-story .repo-mark {
  fill: var(--vp-c-text-3);
  animation-name: story-hold;
}

/* ── Act 2 · main ───────────────────────────────────────────────────────── */

/* The heaviest line in the drawing, and the only neutral one — everything
   coloured is a branch trying to get back onto it. */
.mono-story .main-line {
  fill: none;
  stroke: var(--vp-c-text-2);
  stroke-width: 2.75;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 100;
  stroke-dashoffset: 0;
  animation-name: story-draw-main;
}

/* The hero diagram's marching ants, over the same `d`. This one keeps real user
   units so the 4/7 pattern reads as ants, and it drifts 13 whole dash periods
   across the single run, landing exactly on the pattern it started from. */
.mono-story .main-flow {
  fill: none;
  stroke: var(--vp-c-brand-1);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 4 7;
  animation-name: story-main-flow, story-ants;
  animation-duration: var(--story), var(--story);
  animation-timing-function: ease, linear;
  animation-iteration-count: 1, 1;
  animation-fill-mode: both, both;
  animation-delay: 0s, 0s;
}

.mono-story .main-label {
  fill: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  font-weight: 700;
  animation-name: story-main-flow;
}

/* ── Acts 3-6 · the lanes ───────────────────────────────────────────────── */

.mono-story .branch,
.mono-story .run,
.mono-story .merge {
  fill: none;
  stroke: var(--vp-c-brand-1);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 100;
  stroke-dashoffset: 0;
}
.mono-story .branch {
  animation-name: story-draw-branch;
}
.mono-story .run {
  animation-name: story-draw-run;
}
.mono-story .merge {
  animation-name: story-draw-merge;
}

/* A branch that never lands goes red along its whole length. */
.mono-story .is-blocked .branch {
  animation-name: story-draw-branch, story-clash;
  animation-duration: var(--story), var(--story);
  animation-timing-function: ease, ease;
  animation-iteration-count: 1, 1;
  animation-fill-mode: both, both;
  animation-delay: calc(var(--row, 0) * 0.1s), calc(var(--row, 0) * 0.1s);
}
.mono-story .is-blocked .run {
  animation-name: story-draw-run, story-clash;
  animation-duration: var(--story), var(--story);
  animation-timing-function: ease, ease;
  animation-iteration-count: 1, 1;
  animation-fill-mode: both, both;
  animation-delay: calc(var(--row, 0) * 0.1s), calc(var(--row, 0) * 0.1s);
}

/* The knockout: `paint-order: stroke` paints a panel-coloured outline BEHIND
   the glyphs, so a line passing under the label is cut cleanly around it rather
   than running through the letterforms. The clash keyframes only touch `fill`,
   so the halo survives the branch turning red. */
.mono-story .branch-label {
  fill: var(--vp-c-text-3);
  stroke: var(--vp-c-bg-soft);
  stroke-width: 3;
  stroke-linejoin: round;
  paint-order: stroke;
  font-family: var(--vp-font-family-mono);
  font-size: 10.5px;
  animation-name: story-label;
}
.mono-story .is-blocked .branch-label {
  animation-name: story-label, story-clash-label;
  animation-duration: var(--story), var(--story);
  animation-timing-function: ease, ease;
  animation-iteration-count: 1, 1;
  animation-fill-mode: both, both;
  animation-delay: calc(var(--row, 0) * 0.1s), calc(var(--row, 0) * 0.1s);
}

/* Commits. A branch point appears as its branch leaves; the ones ahead of the
   pile-up appear last, which is the whole "main moved on without you" beat. */
.mono-story .commit {
  fill: var(--vp-c-bg-elv);
  stroke: var(--vp-c-text-2);
  stroke-width: 2.5;
}
.mono-story .commit.is-root {
  animation-name: story-commit-root;
}
.mono-story .commit.is-branch {
  animation-name: story-commit-branch;
}
.mono-story .commit.is-ahead {
  animation-name: story-commit-ahead;
}

/* The merge request. The pill fill is opaque page background on purpose so the
   lane passes behind it instead of through it. */
.mono-story .mr {
  animation-name: story-pop;
}
.mono-story .pill {
  fill: var(--vp-c-bg-elv);
  stroke: var(--vp-c-divider);
  stroke-width: 1.5;
}
.mono-story .pill-text {
  fill: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
  font-size: 9.5px;
  font-weight: 600;
  text-anchor: middle;
}
.mono-story .is-blocked .pill {
  animation: story-clash-pill var(--story) ease both;
  animation-delay: calc(var(--row, 0) * 0.1s);
}
.mono-story .is-blocked .pill-text {
  animation: story-clash-text var(--story) ease both;
  animation-delay: calc(var(--row, 0) * 0.1s);
}

/* The verdict. Red / green are semantic here, so they stay out of the violet
   brand palette, exactly as the hero's status badges do. */
.mono-story .verdict .glyph {
  fill: none;
  stroke: #ffffff;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.mono-story .verdict.is-merged {
  animation-name: story-verdict-merge;
}
.mono-story .verdict.is-merged .badge {
  fill: #22c55e;
}
.mono-story .verdict.is-blocked {
  animation-name: story-verdict-block;
}
.mono-story .verdict.is-blocked .badge {
  fill: #ef4444;
}

/* ── Act 7 · what the pile-up costs ─────────────────────────────────────── */

.mono-story .alert-box {
  fill: var(--vp-c-bg-elv);
  stroke: #ef4444;
  stroke-width: 1.75;
  animation-name: story-alert;
}
.mono-story .halo {
  fill: #ef4444;
  opacity: 0;
  animation-name: story-halo;
}
.mono-story .alert-badge {
  fill: #ef4444;
  animation-name: story-alert;
}
.mono-story .alert-glyph {
  fill: none;
  stroke: #ffffff;
  stroke-width: 1.6;
  stroke-linecap: round;
  animation-name: story-alert;
}
.mono-story .alert-title {
  fill: var(--vp-c-text-1);
  font-size: 12.5px;
  font-weight: 700;
  animation-name: story-alert;
}
.mono-story .alert-divider {
  stroke: var(--vp-c-divider);
  stroke-width: 1;
  animation-name: story-alert;
}
.mono-story .alert-file {
  fill: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
  font-size: 9px;
  animation-name: story-alert;
}
.mono-story .alert-foot {
  fill: #ef4444;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
  animation-name: story-alert;
}

/* ── Keyframes ──────────────────────────────────────────────────────────── */

/*  %   act
   ─────────────────────────────────────────────────────────────────────────
    0   the repository and its five developers
   10   main draws out, a long way
   26   branches leave main, one after another
   34   each lane runs
   48   merge requests are raised
   58   chore/deps and feat/billing curve back in and land as merge commits
   74   the other three go red and are marked blocked
   82   the conflict card names the three files they all share
   88   main carries on ahead without them                                  */

@keyframes story-hold {
  0%,
  2% {
    opacity: 0;
  }
  8%,
  100% {
    opacity: 1;
  }
}

/* Every drawn line carries pathLength="100", so one 100 -> 0 sweep draws any
   of them regardless of its real length. */
@keyframes story-draw-main {
  0%,
  10% {
    stroke-dashoffset: 100;
  }
  26%,
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes story-draw-branch {
  0%,
  26% {
    stroke-dashoffset: 100;
  }
  36%,
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes story-draw-run {
  0%,
  34% {
    stroke-dashoffset: 100;
  }
  48%,
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes story-draw-merge {
  0%,
  58% {
    stroke-dashoffset: 100;
  }
  70%,
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes story-main-flow {
  0%,
  16% {
    opacity: 0;
  }
  26%,
  100% {
    opacity: 1;
  }
}
@keyframes story-ants {
  to {
    stroke-dashoffset: -143;
  }
}

@keyframes story-commit-root {
  0%,
  12% {
    opacity: 0;
  }
  18%,
  100% {
    opacity: 1;
  }
}
@keyframes story-commit-branch {
  0%,
  26% {
    opacity: 0;
  }
  33%,
  100% {
    opacity: 1;
  }
}
@keyframes story-commit-ahead {
  0%,
  88% {
    opacity: 0;
  }
  96%,
  100% {
    opacity: 1;
  }
}

@keyframes story-label {
  0%,
  30% {
    opacity: 0;
  }
  38%,
  100% {
    opacity: 1;
  }
}

@keyframes story-pop {
  0%,
  48% {
    opacity: 0;
    transform: translateY(7px);
  }
  57%,
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* The colour turn, all on one beat: the branch, its run, its label and its
   merge request stop being brand-coloured and start being a problem. */
@keyframes story-clash {
  0%,
  74% {
    stroke: var(--vp-c-brand-1);
  }
  80%,
  100% {
    stroke: #ef4444;
  }
}
@keyframes story-clash-pill {
  0%,
  74% {
    stroke: var(--vp-c-divider);
  }
  80%,
  100% {
    stroke: #ef4444;
  }
}
@keyframes story-clash-label {
  0%,
  74% {
    fill: var(--vp-c-text-3);
  }
  80%,
  100% {
    fill: #ef4444;
  }
}
@keyframes story-clash-text {
  0%,
  74% {
    fill: var(--vp-c-text-2);
  }
  80%,
  100% {
    fill: #ef4444;
  }
}

/* The landing lands: the merge commit arrives just as its curve finishes. */
@keyframes story-verdict-merge {
  0%,
  68% {
    opacity: 0;
    transform: translateY(-5px);
  }
  75%,
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes story-verdict-block {
  0%,
  78% {
    opacity: 0;
    transform: translateX(-6px);
  }
  85%,
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes story-alert {
  0%,
  82% {
    opacity: 0;
    transform: translate(10px, 8px);
  }
  91%,
  100% {
    opacity: 1;
    transform: translate(0, 0);
  }
}

/* A one-shot flare behind the warning badge. Opacity rather than a scale, so it
   needs no `transform-box: fill-box` to keep its origin off the SVG's 0,0. */
@keyframes story-halo {
  0%,
  84% {
    opacity: 0;
  }
  90% {
    opacity: 0.5;
  }
  96%,
  100% {
    opacity: 0.16;
  }
}

/* ── Reduced motion ─────────────────────────────────────────────────────── */

/* Resolve to the LAST frame, not the first: killing the animations alone would
   leave the stage on Act 1's empty repository, which tells the reader nothing.
   Every animated element's resting style is already the finished state, so the
   only fixes needed are the ones the keyframes drove past their static value. */
@media (prefers-reduced-motion: reduce) {
  .mono-story,
  .mono-story * {
    animation: none !important;
  }
  .mono-story .is-blocked .branch,
  .mono-story .is-blocked .run,
  .mono-story .is-blocked .pill {
    stroke: #ef4444;
  }
  .mono-story .is-blocked .branch-label,
  .mono-story .is-blocked .pill-text {
    fill: #ef4444;
  }
  .mono-story .halo {
    opacity: 0.16;
  }
}</style>
