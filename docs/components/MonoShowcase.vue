<script setup lang="ts">
/*
 * Section 3 of the landing page: four cards, and a switch that restyles every
 * one of them.
 *
 * The switch flips `customized`, which swaps the `cssClass` object handed to
 * each component. `cssClass` appends a class to a named INTERNAL part of the
 * element (`root`, `label`, `field`, `track`, `thumb`, …), so the same markup
 * can wear a completely different look without touching a single tag — which is
 * the point the section is making.
 *
 * The classes those objects name live in the UNSCOPED <style> block at the
 * bottom. They have to be unscoped: `cssClass` lands on elements the component
 * renders itself, which never carry this file's `data-v-…` scope attribute, so
 * a scoped rule would never match them.
 */
import { computed, ref } from 'vue'

import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/checkbox'
import '@mono-lit/helper/ui/dropdown'
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/radio'
import '@mono-lit/helper/ui/switch'
import '@mono-lit/helper/ui/tabs'
import '@mono-lit/helper/ui/tag-input'

/** The one piece of state in the section: default look, or my own look. */
const customized = ref(false)

const radioPick = ref('a')
const activeTab = ref('overview')
const dropdownOpen = ref(false)
const tags = ref(['Lit', 'Vue'])
/* Controlled like everything else here. These two checkboxes and the text field
   were the only inert controls in a section whose whole point is that the
   components work when you touch them. */
const acceptTerms = ref(true)
const wantUpdates = ref(false)
const fullName = ref('')

const tabItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'details', label: 'Details' },
]
const tagItems = [
  { value: 'Lit', label: 'Lit' },
  { value: 'Vue', label: 'Vue' },
  { value: 'Nuxt', label: 'Nuxt' },
]

/*
 * `@mono-lit/helper` publishes 27 `./ui/*` component subpaths. The count in the CTA
 * is what is NOT shown here, so it has to be derived from the list of what is —
 * a hand-kept number said "seven" while nine were on display, and the card
 * advertised 20+ when the honest figure was 18+.
 *
 * Add a component to the section, add its name here. TOTAL_COMPONENTS is still
 * manual: bump it when a new `./ui/*` subpath ships in package.json.
 */
const TOTAL_COMPONENTS = 27
const ON_DISPLAY = [
  'card', 'button', 'tabs', 'checkbox', 'radio',
  'dropdown', 'switch', 'input', 'tag-input',
] as const
const remaining = TOTAL_COMPONENTS - ON_DISPLAY.length

/*
 * One look per card:
 *   1 Actions   — modern minimalist, thin type, square corners, no shadow
 *   2 Entry     — soft glossy, pill fields, deep rounding
 *   3 Explore   — purple and strong
 *   4 Customize — black and white noir
 *
 * `undefined` when the switch is off, so every component falls back to its own
 * default styling rather than being handed an empty object to merge.
 */
const off = undefined

const css = computed(() => {
  if (!customized.value) {
    return {
      cardMinimal: off, cardGlossy: off, cardPurple: off, cardNoir: off,
      button: off, checkbox: off, radio: off, tabs: off, dropdown: off,
      input: off, tagInput: off, switchEl: off,
    }
  }
  return {
    /* ── card shells ── */
    cardMinimal: { root: 'fx-min-card', title: 'fx-min-title' },
    cardGlossy: { root: 'fx-glossy-card', title: 'fx-glossy-title' },
    cardPurple: { root: 'fx-purple-card' },
    cardNoir: { root: 'fx-noir-card' },

    /* ── card 1, minimalist ── */
    button: { main: 'fx-min-btn' },
    checkbox: { box: 'fx-min-box', labelText: 'fx-min-text' },
    radio: { labelText: 'fx-min-text' },
    tabs: { tab: 'fx-min-tab', tabActive: 'fx-min-tab-active' },
    dropdown: { panel: 'fx-min-panel' },

    /* ── card 2, glossy ── */
    input: { field: 'fx-glossy-field', label: 'fx-glossy-label' },
    tagInput: {
      field: 'fx-glossy-field',
      label: 'fx-glossy-label',
      chip: 'fx-glossy-chip',
    },

    /* ── card 4, noir ── */
    switchEl: { track: 'fx-noir-track', labelText: 'fx-noir-text' },
  }
})
</script>

<template>
  <section class="mono-showcase" :class="{ 'is-custom': customized }">
    <!-- The section paints edge to edge; this holds the content to the same
         width as the rest of the page. -->
    <div class="mono-showcase__inner">
    <header class="mono-showcase__head">
      <h2 class="mono-showcase__title">
        Basic UI to centralize, everyone just uses the single UI library.
      </h2>
      <p class="mono-showcase__lede">
        Built on top of Lit Web Components, can be used anywhere and anytime.
        Fully general and basic components, can be easily customized to your own
        style.
      </p>
    </header>

    <!-- @mono-lit/helper ships the browser Lit build with no SSR dom-shim, so these
         components must never be server-rendered. See DemoPreview.vue, which
         wraps every demo on the site the same way. -->
    <div class="mono-stage">
    <ClientOnly>
    <div class="mono-grid">
      <!-- Left column ------------------------------------------------------ -->
      <div class="mono-col">
        <!-- 1 · Actions. Grows to fill whatever the column has spare. -->
        <mono-card
          bordered
          width="100%"
          height="100%"
          class="mono-card--fill mono-card--actions"
          :css-class.prop="css.cardMinimal"
        >
          <strong slot="title">Actions</strong>
          <div class="mono-stack">
            <div class="mono-row">
              <mono-button color="primary" size="sm" :css-class.prop="css.button">
                Primary
              </mono-button>
              <!-- `secondary`, not `neutral`: the outline look is emitted as an
                   `outline-<color>` class, and there is no `outline-neutral`
                   rule, so an invalid colour silently rendered a SOLID button. -->
              <mono-button
                variant="outline"
                color="secondary"
                size="sm"
                :css-class.prop="css.button"
              >
                Outline
              </mono-button>
            </div>

            <mono-tabs
              :items.prop="tabItems"
              :model-value="activeTab"
              :css-class.prop="css.tabs"
              @change="activeTab = $event.detail.modelValue"
            />

            <div class="mono-row">
              <mono-checkbox
                label="Accept terms"
                :model-value.prop="acceptTerms"
                :css-class.prop="css.checkbox"
                @change="acceptTerms = $event.detail.modelValue"
              />
              <mono-checkbox
                label="Updates"
                color="success"
                :model-value.prop="wantUpdates"
                :css-class.prop="css.checkbox"
                @change="wantUpdates = $event.detail.modelValue"
              />
            </div>

            <div class="mono-row">
              <mono-radio
                label="Option A"
                value="a"
                :model-value="radioPick"
                :css-class.prop="css.radio"
                @change="radioPick = String($event.detail.modelValue)"
              />
              <mono-radio
                label="Option B"
                value="b"
                :model-value="radioPick"
                :css-class.prop="css.radio"
                @change="radioPick = String($event.detail.modelValue)"
              />
            </div>

            <mono-dropdown
              placement="bottom-start"
              :model-value="dropdownOpen"
              :css-class.prop="css.dropdown"
              @toggle="dropdownOpen = $event.detail.modelValue"
            >
              <mono-button
                slot="main"
                color="primary"
                variant="outline"
                size="sm"
                :css-class.prop="css.button"
              >
                Dropdown
              </mono-button>
              <div slot="body" class="mono-drop-body">Any HTML goes here.</div>
            </mono-dropdown>
          </div>
        </mono-card>

        <!-- 3 · Explore more -->
        <mono-card
          bordered
          width="100%"
          href="/ui/getting-started"
          class="mono-more"
          :css-class.prop="css.cardPurple"
        >
          <span class="mono-more__link">
            <span class="mono-more__count">{{ remaining }}+</span>
            <span class="mono-more__text">Explore more components here</span>
            <span class="mono-more__arrow" aria-hidden="true">&rarr;</span>
          </span>
        </mono-card>
      </div>

      <!-- Right column ----------------------------------------------------- -->
      <div class="mono-col mono-col--glass">
        <!-- 4 · the switch that drives the whole section -->
        <mono-card
          bordered
          width="100%"
          class="mono-custom"
          :css-class.prop="css.cardNoir"
        >
          <div class="mono-custom__inner">
            <span class="mono-custom__text">
              <span class="mono-custom__title">
                {{ customized ? 'My own style' : 'Check my customized UI' }}
                <span
                  v-if="!customized"
                  class="mono-custom__arrow"
                  aria-hidden="true"
                  >&rarr;</span
                >
              </span>
              <span class="mono-custom__hint">
                One switch, four looks — the same components restyled through
                <code>cssClass</code> and CSS variables.
              </span>
            </span>
            <mono-switch
              label=""
              aria-label="Use my own style"
              :model-value.prop="customized"
              :css-class.prop="css.switchEl"
              @change="customized = $event.detail.modelValue"
            />
          </div>
        </mono-card>

        <!-- 2 · Data entry. Grows to fill the rest of the column. -->
        <mono-card
          bordered
          width="100%"
          height="100%"
          class="mono-card--fill mono-card--entry"
          :css-class.prop="css.cardGlossy"
        >
          <strong slot="title">Data entry</strong>
          <div class="mono-stack">
            <mono-input
              label="Full name"
              placeholder="Ada Lovelace"
              size="sm"
              :model-value.prop="fullName"
              :css-class.prop="css.input"
              @input="fullName = $event.detail.modelValue"
            />
            <mono-tag-input
              label="Skills"
              placeholder="Add one"
              size="sm"
              :model-value.prop="tags"
              :items.prop="tagItems"
              key-value="value"
              display-value="label"
              :css-class.prop="css.tagInput"
              @change="tags = $event.detail.modelValue as any"
            />
          </div>
        </mono-card>
      </div>
    </div>
    </ClientOnly>
    </div>
    </div>
  </section>
</template>

<style scoped>
/* The band. Full bleed on purpose — the page is `layout: home`, so the section
   spans the viewport and only its inner wrapper is held to the page width. */
.mono-showcase {
  position: relative;
  padding: 72px 24px 88px;
  /* One token now, defined on the landing root in custom.css — this gradient
     used to be copy-pasted verbatim into four components. */
  background: var(--cyber-band);
}
@media (min-width: 960px) {
  .mono-showcase {
    padding: 104px 48px 120px;
  }
}

.mono-showcase::before,
.mono-showcase::after {
  content: '';
  position: absolute;
  right: 0;
  left: 0;
  height: 1px;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    transparent,
    var(--cyber-edge-hi) 22%,
    var(--cyber-edge-hi) 78%,
    transparent
  );
}
.mono-showcase::before {
  top: 0;
}
.mono-showcase::after {
  bottom: 0;
}

.mono-showcase__inner {
  max-width: 1152px;
  margin: 0 auto;
}

.mono-showcase__head {
  max-width: 46rem;
  margin: 0 0 40px;
}
/* Type goes light: these sit on the gradient, not on the page background, so
   the theme text tokens would be unreadable in light mode. */
.mono-showcase__title {
  margin: 0;
  font-size: clamp(1.6rem, 3.2vw, 2.3rem);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: #ffffff;
}
.mono-showcase__lede {
  margin: 14px 0 0;
  font-size: clamp(0.98rem, 1.5vw, 1.1rem);
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.82);
}

/*
 * `ClientOnly` renders NOTHING until mount (it has no fallback slot), so the
 * stage reserves the height its contents will take. Without this the section
 * collapses in the server HTML and the page jumps as it hydrates.
 */
/*
 * MEASURED, not guessed — see the note on the 760px override below. Stacked, the
 * grid peaks at 780px, and that peak is at ~400px wide (narrower text wraps to
 * more lines), NOT at 759px as you would assume. 800 leaves a little headroom
 * for late-loading fonts.
 */
.mono-stage {
  min-height: 800px;
}
/*
 * Two columns: the grid peaks at 400px, and that peak is at exactly 760px — the
 * narrowest the two-column layout ever gets — settling to 389px by 1280px. So
 * the reservation is pinned to the breakpoint edge, not to a desktop width.
 *
 * These two numbers were 1180 / 560 and had drifted far past the content: 400px
 * and 160px of dead space respectively, which is what made the section look like
 * it had a hole under it. Re-measure with a headless pass over a width sweep
 * whenever the card contents change — guessing is what produced the old values.
 */
@media (min-width: 760px) {
  .mono-stage {
    min-height: 420px;
  }
}

/*
 * Two independent columns rather than a 2x2 of rows. Each column stacks its own
 * cards and stretches to the grid's height; the card marked `--fill` absorbs
 * whatever is left over. Row-based placement tied the two columns together and
 * left dead space whenever one card was shorter than its neighbour.
 */
.mono-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
}
@media (min-width: 760px) {
  .mono-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}


.mono-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}
.mono-card--fill {
  flex: 1;
  min-height: 0;
}

/*
 * A colour wash sitting BEHIND the right column. It exists so the glass card
 * has something to refract: `backdrop-filter` blurs whatever is painted behind
 * the element, and over a plain page background that is nothing at all — the
 * card would just look like flat grey. Only visible once the switch is on.
 */
.mono-col--glass {
  position: relative;
}
.mono-col--glass::before {
  content: '';
  position: absolute;
  inset: -8% -6%;
  z-index: 0;
  pointer-events: none;
  opacity: 0;
  filter: blur(26px);
  transition: opacity 0.35s ease;
  background:
    radial-gradient(38% 38% at 18% 18%, rgba(124, 58, 237, 0.6), transparent 70%),
    radial-gradient(42% 42% at 86% 26%, rgba(6, 182, 212, 0.55), transparent 70%),
    radial-gradient(44% 44% at 62% 88%, rgba(236, 72, 153, 0.5), transparent 70%);
}
.is-custom .mono-col--glass::before {
  opacity: 1;
}
/* Cards ride above the wash, otherwise the blob paints over them. */
.mono-col > mono-card {
  position: relative;
  z-index: 1;
}

/*
 * Single-column order: the switch leads, Explore more closes.
 *
 * `order` only sorts SIBLINGS, and each card is nested inside its column
 * wrapper — so the wrappers are dissolved with `display: contents` at this
 * width, which promotes all four cards to direct children of the grid and puts
 * them in one ordering context.
 *
 * This block MUST stay below the `.mono-col` rules above. A media query adds no
 * specificity, so `.mono-col { display: flex }` would out-cascade the
 * `display: contents` here purely by being later in the file — which is exactly
 * what happened when this sat next to the min-width block.
 */
@media (max-width: 759.98px) {
  .mono-grid {
    display: flex;
    flex-direction: column;
  }
  .mono-col {
    display: contents;
  }
  .mono-custom {
    order: 1;
  }
  .mono-card--actions {
    order: 2;
  }
  .mono-card--entry {
    order: 3;
  }
  .mono-more {
    order: 4;
  }
  /*
   * The colour wash is positioned against `.mono-col--glass`, which no longer
   * generates a box here — it would anchor to the wrong ancestor. Drop it: the
   * section's own purple band sits behind the card and gives `backdrop-filter`
   * plenty to refract on its own.
   */
  .mono-col--glass::before {
    display: none;
  }
}

/* Inside a card: fields stack full width, small controls sit side by side. */
.mono-stack {
  display: flex;
  flex-direction: column;
  /* One scale for both tall cards: 16 between groups, 10 within a row. */
  gap: 16px;
  min-width: 0;
}
.mono-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.mono-stack > *,
.mono-row > * {
  max-width: 100%;
}
.mono-drop-body {
  font-size: 0.85rem;
}

/* ── card 3 · Explore more ─────────────────────────────────────────────── */
.mono-more__link {
  display: flex;
  align-items: center;
  gap: 14px;
  height: 100%;
  text-decoration: none;
  /* --theme-*, not --vp-*: this sits on a mono-card, so it takes the card's ink
     rather than the page's. See the note on .mono-custom__text below. */
  color: var(--theme-text);
  font-weight: 600;
}
.mono-more__count {
  font-size: clamp(1.6rem, 3vw, 2.1rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(120deg, #7c3aed 30%, #4f46e5);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.mono-more__text {
  flex: 1;
  min-width: 0;
  font-size: 0.95rem;
}
.mono-more__arrow {
  flex: none;
  font-size: clamp(1.7rem, 3.2vw, 2.3rem);
  line-height: 1;
  color: var(--theme-purple);
  transition: transform 0.2s;
}
.mono-more__link:hover .mono-more__arrow {
  transform: translateX(4px);
}

/* On purple the gradient text and brand arrow both disappear — repaint them. */
.is-custom .mono-more__link,
.is-custom .mono-more__arrow {
  color: #ffffff;
}
.is-custom .mono-more__count {
  background: none;
  -webkit-background-clip: initial;
  background-clip: initial;
  color: #ffffff;
}

/* ── card 4 · the switch ───────────────────────────────────────────────── */
.mono-custom__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.mono-custom__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  font-size: 0.95rem;
  font-weight: 600;
  /*
   * The whole section deliberately keeps the components in their real light
   * look, because mono has no dark theme yet. That makes every card here a
   * light island, so any text ON one has to be coloured from the library's ink
   * tokens and not the page's — the page's are near-white in dark mode, which
   * turned these labels invisible against the card.
   */
  color: var(--theme-text);
}
.mono-custom__title {
  display: flex;
  align-items: center;
  gap: 10px;
}
/* The hint is the only place the section says out loud what the switch does. */
.mono-custom__hint {
  font-size: 0.78rem;
  font-weight: 400;
  line-height: 1.45;
  color: color-mix(in srgb, var(--theme-text) 68%, transparent);
}
.mono-custom__hint code {
  padding: 0.1em 0.35em;
  border-radius: 4px;
  background: color-mix(in srgb, var(--theme-purple) 12%, transparent);
  font-family: var(--vp-font-family-mono);
  font-size: 0.92em;
  color: var(--theme-purple);
}
/* An invitation, so it only shows while the switch is off. */
.mono-custom__arrow {
  font-size: 1.5rem;
  line-height: 1;
  color: var(--theme-purple);
}
.is-custom .mono-custom__text,
.is-custom .mono-custom__arrow {
  color: #ffffff;
}
.is-custom .mono-custom__hint {
  color: rgba(255, 255, 255, 0.72);
}
.is-custom .mono-custom__hint code {
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
}
</style>

<style>
/*
 * The four looks the switch turns on. UNSCOPED on purpose: `cssClass` appends
 * these to elements the components render internally, which never carry this
 * file's scope attribute — a `scoped` rule could not reach them.
 *
 * `fx-` prefixed so they cannot collide with anything else on the site.
 */

/*
 * Flipping the switch used to snap. These four properties are the ones every
 * look actually changes, and they are all cheap to interpolate.
 *
 * `backdrop-filter` is deliberately NOT in the list even though the glass look
 * animates into existence: transitioning a blur forces a re-rasterise of
 * everything behind it on every frame, and the wash behind this card is itself
 * a 26px blur. The rim and fill carry the change well enough on their own.
 *
 * Declared on the BASE classes, not the fx-* ones: an fx class only exists while
 * the switch is on, so a transition living there would apply on the way in and
 * vanish on the way out. And not on the custom-element hosts either — those
 * paint nothing. Every component renders an inner element and pushes
 * `cssClass.root` onto ITS class list (card-core.ts:350), so a transition on
 * `mono-card` the ELEMENT would be a silent no-op.
 */
.mono-showcase :is(
  .mono-card,
  .mono-button-main,
  .mono-button-native,
  .mono-checkbox-box,
  .mono-radio-circle,
  .mono-tabs-tab,
  .mono-dropdown-panel,
  .mono-input-field,
  .mono-tag-input-field,
  .mono-chip,
  .mono-switch-track
) {
  transition: background-color 0.32s ease, border-color 0.32s ease,
    color 0.32s ease, box-shadow 0.32s ease;
}

@media (prefers-reduced-motion: reduce) {
  .mono-showcase :is(
    .mono-card,
    .mono-button-main,
    .mono-button-native,
    .mono-checkbox-box,
    .mono-radio-circle,
    .mono-tabs-tab,
    .mono-dropdown-panel,
    .mono-input-field,
    .mono-tag-input-field,
    .mono-chip,
    .mono-switch-track
  ) {
    transition: none;
  }
}

/* 1 · modern minimalist — thin type, square corners, no shadow */
.fx-min-card {
  border-color: #e5e5e5 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}
.fx-min-title {
  font-weight: 300 !important;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-size: 0.72rem;
}
.fx-min-btn {
  font-weight: 300 !important;
  letter-spacing: 0.08em;
  border-radius: 0 !important;
}
.fx-min-box {
  border-radius: 0 !important;
}
.fx-min-text {
  font-weight: 300 !important;
  letter-spacing: 0.04em;
}
.fx-min-tab {
  font-weight: 300 !important;
  letter-spacing: 0.08em;
}
.fx-min-tab-active {
  font-weight: 500 !important;
}
.fx-min-panel {
  border-radius: 0 !important;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08) !important;
}

/* 2 · iOS glass — translucent, backdrop-blurred, specular top edge.
   Four ingredients, and it stops reading as glass if any one is dropped:
     · a background that is genuinely see-through (0.4 alpha, not a grey)
     · backdrop-filter blur + saturate, which is what frosts and enriches
       whatever shows through — the colour wash behind the column
     · a hairline white rim, brightest along the top edge
     · the specular sweep drawn by ::before */
.fx-glossy-card {
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.7) !important;
  border-radius: 30px !important;
  background: rgba(255, 255, 255, 0.4) !important;
  background-image: linear-gradient(
    170deg,
    rgba(255, 255, 255, 0.55) 0%,
    rgba(255, 255, 255, 0.18) 48%,
    rgba(255, 255, 255, 0.32) 100%
  ) !important;
  -webkit-backdrop-filter: blur(26px) saturate(200%);
  backdrop-filter: blur(26px) saturate(200%);
  box-shadow: 0 24px 56px -22px rgba(15, 23, 42, 0.45),
    0 2px 8px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    inset 0 -1px 0 rgba(255, 255, 255, 0.45) !important;
}
/* The gloss itself: bright along the top rim, curving away by mid-card, the way
   an iOS control catches light. Sized inside the card so it needs no
   `overflow: hidden`, which would clip the tag input's dropdown panel. */
.fx-glossy-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 52%;
  pointer-events: none;
  border-radius: 30px 30px 50% 50% / 30px 30px 24% 24%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.4) 42%,
    rgba(255, 255, 255, 0) 100%
  );
}
/* Content rides above the sheen, or the fields wash out under it. */
.fx-glossy-card > * {
  position: relative;
  z-index: 1;
}
.fx-glossy-title {
  color: #0f172a !important;
  font-weight: 700 !important;
  letter-spacing: -0.01em;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.85);
}
.fx-glossy-label {
  color: #1f2937 !important;
  font-weight: 600 !important;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
}
/* Fields are their own little pieces of glass: translucent, blurred, pill.
   The rim is a DARK hairline, not a white one — on a pale glass card a white
   border is invisible, which left the fields with no readable edge at all. The
   white is kept as an inset highlight just inside the rim, which is what gives
   the edge its thickness without hiding it. */
.fx-glossy-field {
  border: 1.5px solid rgba(15, 23, 42, 0.3) !important;
  border-radius: 999px !important;
  background: rgba(255, 255, 255, 0.62) !important;
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  backdrop-filter: blur(12px) saturate(180%);
  box-shadow: inset 0 1px 3px rgba(15, 23, 42, 0.14),
    inset 0 0 0 1px rgba(255, 255, 255, 0.85),
    0 1px 2px rgba(15, 23, 42, 0.12) !important;
}
/* Same treatment on the chips, so the two do not disagree about edges. */
.fx-glossy-chip {
  border: 1px solid rgba(15, 23, 42, 0.22) !important;
  border-radius: 999px !important;
  background: rgba(255, 255, 255, 0.75) !important;
  -webkit-backdrop-filter: blur(8px) saturate(160%);
  backdrop-filter: blur(8px) saturate(160%);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 1) !important;
}

/* 3 · purple and strong.
   Pitched BRIGHTER than the section band behind it — the earlier violet-to-
   indigo mix was the same gradient as the background, so the card dissolved
   into it. A light rim does the rest of the separating. */
.fx-purple-card {
  border: 1px solid rgba(255, 255, 255, 0.45) !important;
  border-radius: 18px !important;
  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 55%, #6366f1 100%) !important;
  box-shadow: 0 22px 44px -18px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.5) !important;
  color: #ffffff !important;
}

/* 4 · black and white noir */
.fx-noir-card {
  border-color: #000000 !important;
  border-radius: 0 !important;
  background: #0a0a0a !important;
  box-shadow: 0 18px 40px -20px rgba(0, 0, 0, 0.8) !important;
  color: #ffffff !important;
}
.fx-noir-track {
  background: #3f3f46 !important;
}
.fx-noir-text {
  color: #ffffff !important;
  letter-spacing: 0.06em;
}
</style>
