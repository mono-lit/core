<script setup>
import '@mono-lit/helper/ui/nav'
const brandStyle = 'display: flex; align-items: center; gap: 0.55rem; font-weight: 800; font-size: 0.95rem;'
const btnStyle =
  'padding: 0.35rem 0.8rem; border-radius: 999px; border: 1px solid color-mix(in oklab, currentColor 40%, transparent); background: color-mix(in oklab, currentColor 18%, transparent); color: inherit; cursor: pointer; font: inherit; font-weight: 700;'
</script>

<template>
  <!-- Bar background, text and height set on the wrapper cascade into the nav
       inside (custom properties inherit — and pierce the shadow boundary). -->
  <div style="border: 1px solid var(--border); border-radius: var(--mono-nav-radius, var(--mono-radius-xl)); overflow: hidden; --mono-nav-bg: var(--purple); --mono-nav-text: var(--purple-foreground); --mono-nav-bar-height: 64px; --mono-nav-pad-x: 1.5rem;">
    <mono-nav>
      <div slot="start" :style="brandStyle">Mono UI</div>
      <button slot="end" type="button" :style="btnStyle">Sign in</button>
    </mono-nav>
    <div style="padding: 1.25rem; color: var(--foreground); font-size: 0.85rem;">
      Bar background, text and height come from <code>--mono-nav-*</code> on the wrapper.
    </div>
  </div>
</template>
