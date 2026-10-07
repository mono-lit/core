<script setup lang="ts">
import '@mono-lit/helper/ui/card'

// A fully customized card, themed ENTIRELY through `--mono-card-*` custom
// properties set on the element. Because custom properties inherit and pierce
// the shadow boundary, this exact styling renders identically in the Light, CSS
// and Shadow tabs — no utility classes, no `cssClass`, no `::part`.
const proCard = {
  maxWidth: '340px',
  '--mono-card-accent': 'var(--purple)',
  '--mono-card-radius': '20px',
  '--mono-card-padding': '1.5rem',
  '--mono-card-bg': 'color-mix(in oklab, var(--purple) 8%, var(--card))',
  '--mono-card-ring-color': 'color-mix(in oklab, var(--purple) 30%, transparent)',
  '--mono-card-shadow': '0 18px 40px -14px color-mix(in oklab, var(--purple) 45%, transparent)',
  '--mono-card-shadow-hover': '0 26px 60px -16px color-mix(in oklab, var(--purple) 55%, transparent)',
  '--mono-card-icon-size': '2.75rem',
  '--mono-card-header-gap': '1rem',
}
</script>

<template>
  <div style="width: 100%; display: flex; justify-content: center;">
    <mono-card hoverable :style="proCard">
      <span slot="icon">✦</span>
      <h3 slot="title">Pro plan</h3>
      <p slot="subtitle">Everything, unlocked</p>

      <div style="font-size: 2.25rem; font-weight: 800; letter-spacing: -0.02em;">
        $29<span style="font-size: 0.9rem; font-weight: 500; opacity: 0.65;">/mo</span>
      </div>
      <p style="margin-top: 0.5rem; opacity: 0.75;">
        Unlimited projects, priority support and every premium component.
      </p>

      <button
        slot="actions"
        style="border: 0; border-radius: 10px; padding: 0.55rem 1rem; cursor: pointer; font-weight: 600; color: var(--purple-foreground); background: var(--mono-card-accent);"
      >
        Upgrade
      </button>
    </mono-card>
  </div>
</template>
