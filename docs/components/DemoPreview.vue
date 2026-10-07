<script setup lang="ts">
import { computed, ref, shallowRef, watch, type Component } from 'vue'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import type { HighlighterCore } from 'shiki/core'

const props = defineProps<{
  title?: string
  description?: string
  vueComponent?: Component
  vueCode?: string
  cssComponent?: Component
  cssCode?: string
  shadowComponent?: Component
  shadowCode?: string
}>()

type Mode = 'vue' | 'css' | 'shadow'

const hasVue = computed(() => Boolean(props.vueComponent))
const hasCss = computed(() => Boolean(props.cssComponent))
const hasShadow = computed(() => Boolean(props.shadowComponent))

/** Number of available source variants — the toggle only shows when ≥ 2 exist. */
const variantCount = computed(
  () => Number(hasVue.value) + Number(hasCss.value) + Number(hasShadow.value),
)

const mode = ref<Mode>(hasVue.value ? 'vue' : hasCss.value ? 'css' : 'shadow')

const showCode = ref(false)
const copied = ref(false)
const highlighted = shallowRef('')
const highlighting = ref(false)

const currentCode = computed(() =>
  mode.value === 'vue'
    ? props.vueCode ?? ''
    : mode.value === 'css'
      ? props.cssCode ?? ''
      : props.shadowCode ?? '',
)

const currentLanguage = computed(() => 'vue')
const langLabel = computed(() =>
  mode.value === 'vue'
    ? 'Vue SFC'
    : mode.value === 'css'
      ? 'Vue + CSS'
      : 'Vue + Shadow DOM',
)

let highlighterPromise: Promise<HighlighterCore> | null = null

function getDemoHighlighter() {
  highlighterPromise ??= createHighlighterCore({
    themes: [
      import('shiki/themes/github-dark-dimmed.mjs'),
    ],
    langs: [
      import('shiki/langs/vue.mjs'),
    ],
    engine: createJavaScriptRegexEngine(),
  })

  return highlighterPromise
}

async function highlight() {
  if (!currentCode.value) {
    highlighted.value = ''
    return
  }

  highlighting.value = true

  try {
    const highlighter = await getDemoHighlighter()

    highlighted.value = highlighter.codeToHtml(currentCode.value, {
      lang: currentLanguage.value,
      theme: 'github-dark-dimmed',
    })
  } finally {
    highlighting.value = false
  }
}

watch(
  [showCode, currentCode, currentLanguage],
  ([show]) => {
    if (show) highlight()
  },
  { immediate: false },
)

async function copy() {
  try {
    await navigator.clipboard.writeText(currentCode.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    /* clipboard unavailable */
  }
}
</script>
<template>
  <div class="mono-demo">
    <!-- gradient accent strip -->
    <div class="mono-demo__accent" />

    <!-- header -->
    <header v-if="title || description || variantCount > 1" class="mono-demo__header">
      <div class="mono-demo__heading">
        <h3 v-if="title" class="mono-demo__title">{{ title }}</h3>
        <p v-if="description" class="mono-demo__desc">{{ description }}</p>
      </div>
      <div
        v-if="variantCount > 1"
        class="mono-demo__toggle"
        role="tablist"
        aria-label="Demo language"
      >
        <button
          v-if="hasVue"
          type="button"
          role="tab"
          :aria-selected="mode === 'vue'"
          aria-label="Vue + Light DOM"
          title="Vue + Light DOM"
          class="mono-demo__toggle-btn"
          :class="{ 'is-active': mode === 'vue' }"
          @click="mode = 'vue'"
        >
          <span class="mono-demo__toggle-dot mono-demo__toggle-dot--vue" />
          <span class="mono-demo__toggle-icon i-vscode-icons-file-type-vue" aria-hidden="true" />
          <span class="mono-demo__toggle-label">Vue + Light DOM</span>
        </button>
        <button
          v-if="hasCss"
          type="button"
          role="tab"
          :aria-selected="mode === 'css'"
          aria-label="Vue + CSS"
          title="Vue + CSS"
          class="mono-demo__toggle-btn"
          :class="{ 'is-active': mode === 'css' }"
          @click="mode = 'css'"
        >
          <span class="mono-demo__toggle-dot mono-demo__toggle-dot--css" />
          <span class="mono-demo__toggle-icon i-vscode-icons-file-type-css" aria-hidden="true" />
          <span class="mono-demo__toggle-label">Vue + CSS</span>
        </button>
        <button
          v-if="hasShadow"
          type="button"
          role="tab"
          :aria-selected="mode === 'shadow'"
          aria-label="Vue + Shadow DOM"
          title="Vue + Shadow DOM"
          class="mono-demo__toggle-btn"
          :class="{ 'is-active': mode === 'shadow' }"
          @click="mode = 'shadow'"
        >
          <span class="mono-demo__toggle-dot mono-demo__toggle-dot--shadow" />
          <span class="mono-demo__toggle-icon i-vscode-icons-file-type-polymer" aria-hidden="true" />
          <span class="mono-demo__toggle-label">Vue + Shadow DOM</span>
        </button>
      </div>
    </header>

    <!-- stage -->
    <div class="mono-demo__stage">
      <div class="mono-demo__stage-glow" aria-hidden="true" />
      <div class="mono-demo__stage-grid" aria-hidden="true" />
      <div class="mono-demo__stage-inner">
        <ClientOnly>
          <component :is="vueComponent" v-if="mode === 'vue' && vueComponent" />
          <component :is="cssComponent" v-else-if="mode === 'css' && cssComponent" />
          <component :is="shadowComponent" v-else-if="mode === 'shadow' && shadowComponent" />
        </ClientOnly>
      </div>
    </div>

    <!-- action bar -->
    <div class="mono-demo__actions">
      <span class="mono-demo__lang-chip">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        {{ langLabel }}
      </span>
      <div class="mono-demo__actions-spacer" />
      <button
        type="button"
        class="mono-demo__btn"
        :title="copied ? 'Copied!' : 'Copy source'"
        @click="copy"
      >
        <svg v-if="!copied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {{ copied ? 'Copied' : 'Copy' }}
      </button>
      <button
        type="button"
        class="mono-demo__btn mono-demo__btn--toggle"
        :class="{ 'is-open': showCode }"
        :title="showCode ? 'Hide source' : 'View source'"
        :aria-expanded="showCode"
        @click="showCode = !showCode"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
        {{ showCode ? 'Hide source' : 'View source' }}
      </button>
    </div>

    <!-- code drawer -->
    <Transition name="mono-demo__code">
      <div v-if="showCode" class="mono-demo__code">
        <div v-if="highlighting && !highlighted" class="mono-demo__code-loading">Highlighting…</div>
        <div v-else class="mono-demo__code-shiki" v-html="highlighted" />
      </div>
    </Transition>
  </div>
</template>

<style>
.mono-demo {
  position: relative;
  margin: 2.25rem 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--vp-c-bg-soft);
  box-shadow:
    0 1px 0 0 rgba(0, 0, 0, 0.04),
    0 4px 12px -6px rgba(0, 0, 0, 0.06);
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}
.dark .mono-demo {
  box-shadow:
    0 1px 0 0 rgba(255, 255, 255, 0.03),
    0 8px 24px -10px rgba(0, 0, 0, 0.5);
}
.mono-demo:hover {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 25%, var(--vp-c-divider));
  box-shadow:
    0 1px 0 0 rgba(0, 0, 0, 0.04),
    0 18px 36px -16px color-mix(in srgb, var(--vp-c-brand-1) 22%, transparent);
}

/* gradient accent strip */
.mono-demo__accent {
  height: 3px;
  background: linear-gradient(90deg, #a855f7 0%, #7c3aed 50%, #4f46e5 100%);
  opacity: 0.85;
  border-radius: 16px 16px 0 0;
}

/* header */
.mono-demo__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 1.1rem 1.5rem 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--vp-c-brand-1) 4%, transparent), transparent);
}
.mono-demo__heading {
  flex: 1;
  min-width: 0;
}
.mono-demo__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
  line-height: 1.3;
  border: none;
  padding: 0;
}
.mono-demo__title::before {
  display: none !important;
}
.mono-demo__desc {
  margin: 0.35rem 0 0;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  line-height: 1.55;
}

/* segmented toggle */
.mono-demo__toggle {
  display: inline-flex;
  flex-shrink: 0;
  padding: 3px;
  background: var(--vp-c-default-soft);
  border-radius: 9px;
  border: 1px solid var(--vp-c-divider);
}
.mono-demo__toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--vp-c-text-2);
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.15s, background-color 0.15s, box-shadow 0.15s;
}
.mono-demo__toggle-btn:hover {
  color: var(--vp-c-text-1);
}
.mono-demo__toggle-btn.is-active {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.06),
    0 0 0 1px color-mix(in srgb, var(--vp-c-brand-1) 30%, var(--vp-c-divider));
}
.dark .mono-demo__toggle-btn.is-active {
  background: var(--vp-c-bg-soft);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.5),
    0 0 0 1px color-mix(in srgb, var(--vp-c-brand-1) 35%, transparent);
}
.mono-demo__toggle-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}
.mono-demo__toggle-dot--vue {
  background: linear-gradient(135deg, #42b883, #35495e);
}
.mono-demo__toggle-dot--css {
  background: linear-gradient(135deg, #06b6d4, #2563eb);
}
.mono-demo__toggle-dot--shadow {
  background: linear-gradient(135deg, #8b5cf6, #d946ef);
}

/* The file-type icon shown INSTEAD of the label on small screens. Hidden by a
   two-class selector so it beats the `display: inline-block` that UnoCSS's
   presetIcons puts on `.i-vscode-icons-*` (single class) regardless of which
   stylesheet lands first. */
.mono-demo__toggle-btn .mono-demo__toggle-icon {
  display: none;
  width: 1.05rem;
  height: 1.05rem;
  flex: none;
}

/* ── Responsive ────────────────────────────────────────────────────────────
   The toggle is a fixed 412px (142 + 103 + 160 for the three labels) and does
   not shrink, so below ~600px it pushed straight out of the card — and, being
   the widest box on the page, it was what made the whole docs page scroll
   sideways on a phone (documentElement.scrollWidth 481 at a 390px viewport).
   Under 640px the labels give way to their file-type icons, which takes the
   toggle to ~110px and lets it fit any phone. */
@media (max-width: 640px) {
  .mono-demo__header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    padding: 0.9rem 1rem 0.85rem;
  }
  .mono-demo__toggle {
    align-self: flex-start;
    max-width: 100%;
  }
  .mono-demo__toggle-btn {
    padding: 0.4rem 0.6rem;
    gap: 0;
  }
  .mono-demo__toggle-btn .mono-demo__toggle-dot,
  .mono-demo__toggle-btn .mono-demo__toggle-label {
    display: none;
  }
  .mono-demo__toggle-btn .mono-demo__toggle-icon {
    display: inline-block;
  }
  /* The action bar has the same no-shrink problem, just a milder one. */
  .mono-demo__actions {
    flex-wrap: wrap;
    padding: 0.5rem 0.75rem;
  }
  .mono-demo__btn {
    padding: 0.4rem 0.55rem;
  }
}

/* stage */
/*
 * The stage is pinned to the LIBRARY tokens, not the page tokens, and so does
 * not follow the site's dark mode.
 *
 * mono ships a light theme only. Its components render light surfaces and dark
 * ink whatever the docs are set to, so a stage on --vp-c-bg would put them on a
 * near-black ground in dark mode and any plain text a demo writes would go dark
 * on dark. --theme-surface is #ffffff by default, which is exactly what this
 * rule painted in light mode anyway; the difference is that it now STAYS there.
 *
 * Using the token rather than a literal #fff also means the stage tracks the
 * mono palette switcher, which is the one thing that should repaint it.
 */
.mono-demo__stage {
  position: relative;
  min-height: 180px;
  padding: 2rem 1.5rem;
  background: var(--theme-surface);
  color: var(--theme-text);
}
.mono-demo__stage-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse 60% 50% at 50% 30%,
    color-mix(in srgb, var(--theme-purple) 9%, transparent) 0%,
    transparent 70%
  );
}
.mono-demo__stage-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(var(--theme-border) 1px, transparent 1px),
    linear-gradient(90deg, var(--theme-border) 1px, transparent 1px);
  background-size: 32px 32px;
  background-position: -1px -1px;
  opacity: 0.35;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 80%);
}
.mono-demo__stage-inner {
  position: relative;
  /* No z-index: a stacking context here would TRAP shadow components' fixed
     overlays (drawer/modal, z-index 9990) inside the demo card, so they'd stack
     behind the page instead of covering it (the light build escapes via a <body>
     portal). The decorations (.mono-demo__stage-glow/grid) are position:absolute
     z-index:auto and precede this element in the DOM, so tree order still paints
     content above them — no visual change. */
  display: flex;
  flex-direction: column;
  /* `center`, deliberately. On a column flexbox this sizes each child to its own
     content, which is what makes a small demo — one button, a checkbox, a radio —
     sit in the middle of the stage instead of clinging to the left edge. A demo
     spans the stage by declaring `width: 100%` on its own wrapper, and most do.

     This used to be the cause of the Vue / CSS tabs of the SAME demo rendering at
     different widths, because each demo's `css/` variant is hand-written separately
     from its `vue/` one and the two drifted (accordion: `vue/sizes.vue` had
     `width: 100%`, `css/sizes.vue` didn't). Switching this to `stretch` would force
     agreement, but at the cost of left-aligning every small control. So the tabs are
     kept in step at the SOURCE instead: `tests/perf/demo-wrapper-parity.spec.mjs`
     fails the build if a demo's `css/` and `vue/` roots disagree on width, display,
     gap or flex-direction. Fix a mismatch there, not here.

     `justify-content` below is the VERTICAL axis (centering in the tall stage). */
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: inherit;
  text-align: left;
}
.mono-demo__stage-inner > * {
  max-width: 100%;
}

/*
 * The live demo renders inside VitePress's `.vp-doc` container, so its prose
 * rules (`.vp-doc p`, `.vp-doc h3`, code chips, link colors…) bleed into the
 * demo content and make it look "off". Revert those to the browser defaults for
 * the demo's own UNCLASSED content (slotted <p>/<h3>/<code>/…), so a component
 * shows exactly as it would in a real app. `:not([class])` spares the
 * component's own classed elements (e.g. the light card root `<a class="mono-card">`
 * and its `.mono-card-*` internals); inline `style="…"` still wins over this.
 *
 * `:not(.mono-table *)` additionally spares everything inside a `<table class="mono-table">`:
 * the table component styles UNCLASSED native cells via descendant selectors
 * (`.mono-table th/td`, `.mono-table tbody tr`), which `all: revert` would otherwise
 * strip back to browser defaults — leaving every table demo unstyled.
 *
 * `:not(.sun-editor *)` spares SunEditor (the rich-text-editor addon) for the same
 * reason: its toolbar is unclassed `<ul><li>` floated by descendant rules, and
 * its editing area is arbitrary user HTML the content sheet styles.
 *
 * `:not([mono-button] *)` spares the Basecoat-ported components, which are styled
 * by ATTRIBUTE and carry no classes at all in the hand-written CSS tab — the
 * `<a mono-native>` of a link button is exactly an "unclassed a" and used to be
 * reverted to a bare blue link here. Add each ported component's root
 * (`[mono-<component>] *`) as it lands — AND its shadow host
 * (`mono-shadow-<component> *`): in that build the consumer's content stays in
 * the light DOM as a child of the host and never matches `[mono-<c>] *`, so it
 * was being reverted while the light twin was not. That is a real parity bug in
 * the docs, not in the component.
 *
 * `mono-button-dropdown` IS in the list even though it is a popup: unlike
 * `mono-dropdown` its panel holds no consumer content — the rows are entries
 * from the `buttons` array — so the hand-written `<ul mono-list>` of the CSS
 * tab is the component's own markup and must not be reverted to bullets.
 *
 * `mono-dropdown` is deliberately NOT in that list. Its panel is CONSUMER
 * content and, while open, the light build moves it into a body portal — out of
 * `.vp-doc`'s reach. Sparing the in-place copy too would leave one tab's
 * slotted `<code>` wearing VitePress's chip styling and the other's plain
 * (measured: a 17px taller panel). Reverting both is what matches.
 */
.vp-doc .mono-demo__stage-inner
  :where(
    h1, h2, h3, h4, h5, h6, p, a, ul, ol, li, dl, dt, dd,
    blockquote, figure, figcaption, hr, table, thead, tbody, tr, th, td,
    code, pre, kbd, strong, em, small, img
  ):not([class]):not(.mono-table *):not([mono-table]):not([mono-table] *):not([mono-filter-builder] *):not(mono-shadow-filter-builder *):not([mono-dropdown-table] *):not(mono-shadow-dropdown-table *):not([mono-rich-text-editor] *):not(mono-shadow-rich-text-editor *):not(.sun-editor *):not([mono-button] *):not([mono-button-dropdown] *):not([mono-input] *):not([mono-select] *):not([mono-date] *):not([mono-tag-input] *):not([mono-checkbox] *):not([mono-radio] *):not([mono-switch] *):not([mono-card] *):not([mono-alert] *):not([mono-textarea] *):not([mono-file-upload] *):not([mono-chip] *):not([mono-breadcrumb] *):not([mono-menu] *):not([mono-sidebar] *):not([mono-status-dot] *):not(mono-shadow-button *):not(mono-shadow-button-dropdown *):not(mono-shadow-input *):not(mono-shadow-select *):not(mono-shadow-date *):not(mono-shadow-tag-input *):not(mono-shadow-checkbox *):not(mono-shadow-radio *):not(mono-shadow-switch *):not(mono-shadow-card *):not(mono-shadow-alert *):not(mono-shadow-textarea *):not(mono-shadow-file-upload *):not(mono-shadow-chip *):not(mono-shadow-breadcrumb *):not(mono-shadow-breadcrumb-list *):not(mono-shadow-menu *):not(mono-shadow-sidebar *):not(mono-status-dot *) {
  all: revert;
}

/*
 * …and the one thing that exclusion gives back: VitePress's own prose rules for
 * lists. `.vp-doc ul` (0,1,1) out-specifies a component's resting part rule
 * (`:where([mono-button-dropdown]) [mono-list]` = (0,1,0) — deliberately weak so
 * a `cssClass` utility wins), so the hand-written `<ul mono-list>` of a CSS tab
 * was indented 20px while the Vue tab's portaled copy — which escapes `.vp-doc`
 * entirely — was not. Nothing to do with the component: no real page has these
 * rules. Neutralise them here rather than making every list sheet heavier.
 */
.vp-doc .mono-demo__stage-inner :where([mono-list], [mono-list] > li) {
  list-style: none;
}

/*
 * The box half of that neutraliser skips a NESTED list. A tree's indent IS
 * `padding-inline-start` plus a hanging `margin`, and `mono-menu`'s own nested
 * rule is (0,2,0) — the same weight as this one, so zeroing here simply won by
 * source order and flattened every nested menu into one straight column.
 * `mono-menu` is the only component with an in-flow nested `[mono-list]` (a
 * select's or a dropdown's panel is portaled out of `.vp-doc` altogether), and
 * its (0,2,0) rule already out-specifies `.vp-doc ul` (0,1,1) and
 * `.vp-doc li > ul` (0,1,2) on its own.
 *
 * The two arms are split by what VitePress actually injects, because some `li`
 * children own a box: a divider is inset horizontally, a subheader is padded to
 * line its label up with the rows. On the list, `.vp-doc ul` adds a prose
 * indent and a block margin, so both are cleared. On a row, the only prose rule
 * that reaches it is `li + li { margin-top }` — clearing just the block margin
 * leaves the inline box the component owns intact. Sparing those rows entirely
 * is not an option: `.vp-doc li + li` is (0,1,2) and out-specifies a (0,1,0)
 * resting part rule, which pushed every divider down 8px.
 *
 * A nested list is spared so the component's own tree indent survives — but
 * only while it HOLDS something. A declarative row always renders its children
 * list, and an empty one takes the component's tree rule no more than it takes
 * `.vp-doc li > ul { margin: 8px 0 0 }`, which added 8px under every leaf.
 */
.vp-doc .mono-demo__stage-inner
  :where([mono-list]:not([mono-list] *), [mono-list] [mono-list]:not(:has(> *))) {
  margin: 0;
  padding: 0;
}

.vp-doc .mono-demo__stage-inner :where([mono-list]) > li {
  margin-block: 0;
}

/* action bar */
.mono-demo__actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem 0.5rem 1rem;
  border-top: 1px solid var(--vp-c-divider);
  background: color-mix(in srgb, var(--vp-c-bg-soft) 70%, var(--vp-c-bg));
  border-radius: 0 0 16px 16px;
}
.mono-demo:has(.mono-demo__code) .mono-demo__actions {
  border-radius: 0;
}
.mono-demo__actions-spacer { flex: 1; }

.mono-demo__lang-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.55rem;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--vp-c-text-2);
  background: var(--vp-c-default-soft);
  border-radius: 5px;
}
.mono-demo__lang-chip svg {
  color: var(--vp-c-brand-1);
}

.mono-demo__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.mono-demo__btn:hover {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-divider);
}
.mono-demo__btn--toggle svg {
  transition: transform 0.25s ease;
}
.mono-demo__btn--toggle.is-open svg {
  transform: rotate(180deg);
}

/* code drawer */
.mono-demo__code {
  background: #1c2128;
  border-top: 1px solid var(--vp-c-divider);
  border-radius: 0 0 16px 16px;
  overflow: hidden;
}
.mono-demo__code-loading {
  padding: 0.85rem 1.25rem;
  font-size: 0.75rem;
  color: #768390;
}
.mono-demo__code-shiki .shiki {
  margin: 0;
  padding: 1.1rem 1.25rem;
  border-radius: 0;
  font-size: 0.82rem;
  line-height: 1.65;
  overflow-x: auto;
  background: transparent !important;
  color: #adbac7 !important;
}
.mono-demo__code-shiki .shiki code {
  background: transparent;
  color: inherit;
  font-size: inherit;
  padding: 0;
}

.mono-demo__code-enter-active,
.mono-demo__code-leave-active {
  transition: opacity 0.2s ease, max-height 0.3s ease;
  overflow: hidden;
}
.mono-demo__code-enter-from,
.mono-demo__code-leave-to {
  opacity: 0;
  max-height: 0;
}
.mono-demo__code-enter-to,
.mono-demo__code-leave-from {
  opacity: 1;
  max-height: 1400px;
}
</style>
