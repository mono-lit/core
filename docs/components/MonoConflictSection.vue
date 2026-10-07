<script setup lang="ts">
/*
 * Section 2: the whole argument for splitting an app into modules, in two
 * animated panels.
 *
 * Panel 1 is the problem — a git graph of a monolith, five developers off one
 * long `main`, two branches landing and three colliding on the same files.
 * Panel 2 is the answer, drawn as the hero diagram's own composition so it
 * reads as the same page's idea: one Host, four modules, one of them pulled out
 * without anything else noticing.
 *
 * The two drawings are deliberately built from opposite vocabularies. The
 * monolith is all curves converging on a single spine; the Mono-Repo panel is
 * nothing but straight lines fanning out. That contrast IS the argument, so
 * neither should drift toward the other.
 *
 * Both are plain HTML and SVG — no `mono-*` Lit elements — so neither needs a
 * <ClientOnly> wrapper and both server-render as-is.
 *
 * <MonoStoryPanel> owns the card and its caption, and holds whichever story it
 * wraps on frame 0 until that panel is scrolled into view. Each story then runs
 * once and stays on its final frame; there is nothing to pause or replay.
 */
import MonoStoryPanel from './MonoStoryPanel.vue'
import MonoStoryMonolith from './MonoStoryMonolith.vue'
import MonoStoryModules from './MonoStoryModules.vue'
</script>

<template>
  <section class="mono-conflict">
    <div class="mono-conflict__inner">
      <header class="mono-conflict__head">
        <h2 class="mono-conflict__title">Minimize the conflict surface of every module</h2>
        <p class="mono-conflict__lede">
          In a monolith every feature lands in the same tree, and every branch has
          to get back onto the same <code>main</code>. Two of these five make it.
          The other three touch the files everyone touches, and stop.
        </p>
      </header>

      <div class="mono-conflict__panels">
        <MonoStoryPanel tag="Monolith">
          <template #caption>One repository, five developers, one <code>main</code></template>
          <MonoStoryMonolith />
        </MonoStoryPanel>

        <p class="mono-conflict__bridge">
          In a Mono-Repo, the modular approach minimizes the conflict down to a
          single developer. You want to take over a specific module? That's fine
          &mdash; the others still run, even in parallel.
        </p>

        <MonoStoryPanel tag="Mono-Repo">
          <template #caption>
            One repository per developer, all wired into a single <code>Host</code>
          </template>
          <MonoStoryModules />
        </MonoStoryPanel>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Page background: this now sits between the hero and MonoShowcase's
   full-bleed purple band, so it is the quiet stretch that sets that band off. */
.mono-conflict {
  padding: 72px 24px 88px;
}
@media (min-width: 960px) {
  .mono-conflict {
    padding: 104px 48px 120px;
  }
}

.mono-conflict__inner {
  max-width: 1152px;
  margin: 0 auto;
}

.mono-conflict__head {
  max-width: 46rem;
  margin: 0 0 40px;
}
.mono-conflict__title {
  margin: 0;
  font-size: clamp(1.6rem, 3.2vw, 2.3rem);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--vp-c-text-1);
}
.mono-conflict__lede {
  margin: 14px 0 0;
  font-size: clamp(0.98rem, 1.5vw, 1.1rem);
  line-height: 1.6;
  color: var(--vp-c-text-2);
}
.mono-conflict__lede code {
  padding: 0.15em 0.4em;
  border-radius: 4px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 0.9em;
}

.mono-conflict__panels {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
}

/* The turn of the argument, so it carries more weight than the section lede and
   sits centred between the two panels rather than hanging off the left edge. */
.mono-conflict__bridge {
  position: relative;
  max-width: 44rem;
  margin: 12px auto;
  padding-top: 28px;
  font-size: clamp(1rem, 1.6vw, 1.16rem);
  font-weight: 500;
  line-height: 1.65;
  text-align: center;
  color: var(--vp-c-text-1);
}

/* A short brand rule above it: the visual "and here is the other way". */
.mono-conflict__bridge::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 48px;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--cyber-accent-1), var(--cyber-accent-3));
  box-shadow: 0 0 14px 1px var(--cyber-glow);
  transform: translateX(-50%);
}

@media (max-width: 640px) {
  .mono-conflict__bridge {
    text-align: left;
  }
  .mono-conflict__bridge::before {
    left: 0;
    transform: none;
  }
}
</style>
