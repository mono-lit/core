<script setup lang="ts">
/*
 * The landing page footer: one centred line, nothing else.
 *
 * The copyright runs from the project's first year to the current one. The year
 * is resolved on MOUNT rather than during render: a static build bakes its HTML
 * once, so a site built in December and read in January would otherwise show a
 * stale year — and computing it during SSR would make the server and client
 * markup disagree at the turn of the year, which is a hydration mismatch.
 */
import { computed, onMounted, ref } from 'vue'

const START_YEAR = 2026

/* Seeded with the start year so SSR and the first client render agree. */
const currentYear = ref(START_YEAR)

onMounted(() => {
  currentYear.value = new Date().getFullYear()
})

/*
 * "2026" while it still is 2026 — a range only appears once there is one.
 * `Math.max` guards a device clock set before the start year, which would
 * otherwise render a backwards range like "2026-2019".
 */
const years = computed(() => {
  const end = Math.max(currentYear.value, START_YEAR)
  return end > START_YEAR ? `${START_YEAR}–${end}` : `${START_YEAR}`
})
</script>

<template>
  <footer class="mono-footer">
    <p class="mono-footer__copy">
      &copy; {{ years }} Mono. All rights reserved.
    </p>
  </footer>
</template>

<style scoped>
/* A single thin centred rule at the end of the page — not a section. */
.mono-footer {
  padding: 8px 24px;
  border-top: 1px solid var(--vp-c-divider);
  text-align: center;
}

.mono-footer__copy {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.35;
  color: var(--vp-c-text-3);
}
</style>
