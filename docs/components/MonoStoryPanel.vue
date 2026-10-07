<script setup lang="ts">
/*
 * The frame around one animated story in section 2: the card, its caption, and
 * the one piece of behaviour these drawings need.
 *
 * Each story plays exactly once and comes to rest on its final frame — there is
 * nothing to pause and nothing to replay. The only thing this component still
 * has to decide is WHEN a story is allowed to start.
 *
 * ── Why it does not simply start on mount ─────────────────────────────────
 * Section 2 sits well below the fold. A single-run animation kicked off at page
 * load is finished long before anyone scrolls down to it, so every reader would
 * arrive to a static end frame and never see the story. Each panel therefore
 * sits parked on frame 0 until it is genuinely on screen.
 *
 * It parks by PAUSING rather than by delaying: a delay has to guess how long
 * the reader will take, whereas a paused animation holds frame 0 indefinitely
 * and starts the instant the class comes off.
 *
 * ── Reaching into the slot ────────────────────────────────────────────────
 * Slotted content carries the SECTION's scope id, not this component's, so a
 * plain `.mono-story-panel.is-idle *` rule would compile to `… *[data-v-panel]`
 * and match nothing inside the slot. The play-state rule therefore goes through
 * `:deep()`, which drops the attribute from the descendant part of the
 * selector. That is also why `is-idle` lives on THIS element: the panel needs no
 * ref into its child and no defineExpose.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps<{
  /** The uppercase pill at the head of the caption. */
  tag: string
}>()

const frameEl = ref<HTMLElement | null>(null)
const started = ref(false)

let observer: IntersectionObserver | null = null

function stopObserving() {
  observer?.disconnect()
  observer = null
}

onMounted(() => {
  const el = frameEl.value
  if (!el) return
  if (typeof IntersectionObserver === 'undefined') {
    started.value = true
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return
      started.value = true
      stopObserving()
    },
    { threshold: 0.3 },
  )
  observer.observe(el)
})

onBeforeUnmount(stopObserving)
</script>

<template>
  <figure ref="frameEl" class="mono-story-panel" :class="{ 'is-idle': !started }">
    <figcaption class="mono-story-panel__caption">
      <span class="mono-story-panel__tag">{{ tag }}</span>
      <slot name="caption" />
    </figcaption>

    <slot />
  </figure>
</template>

<style scoped>
.mono-story-panel {
  margin: 0;
  padding: 20px 20px 24px;
  border: 1px solid var(--cyber-edge);
  border-radius: 16px;
  background: var(--vp-c-bg-soft);
  box-shadow:
    inset 0 1px 0 var(--cyber-inner-hi),
    0 0 44px -16px var(--cyber-glow);
}

.mono-story-panel__caption {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 0.9rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-2);
}
.mono-story-panel__caption code {
  padding: 0.15em 0.4em;
  border-radius: 4px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 0.9em;
}
.mono-story-panel__tag {
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* Parked on frame 0 until the panel is scrolled into view. The animations are
   fully built, they are simply not running yet. */
.mono-story-panel.is-idle :deep(*) {
  animation-play-state: paused;
}
</style>
