<script setup>
import { ref } from 'vue'

// The same picker as the Vue tab; the hand-written markup takes the colour as
// the `mono-color` attribute (primary is the default and emits nothing, and so
// is the `default` variant).
const color = ref('primary')
</script>

<template>
  <div style="width: 100%;">
    <DemoControls>
      <DemoSelect v-model="color" label="Color" colors="nav" />
    </DemoControls>

    <div style="display: flex; flex-direction: column; gap: 0.95rem;">
      <div v-for="v in ['default', 'contained', 'underlined']" :key="v" style="display: flex; align-items: center; gap: 1rem;">
        <span style="min-width: 5.5rem; font-size: 0.7rem; color: var(--foreground); opacity: 0.55; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;">{{ v }}</span>
        <nav mono-breadcrumb :mono-variant="v === 'default' ? null : v" :mono-color="color === 'primary' ? null : color" aria-label="Breadcrumb">
          <ol mono-list>
            <li mono-item>
              <a mono-action href="#">
                <span mono-content><span mono-title>Dashboard</span></span>
              </a>
            </li>
            <li mono-separator aria-hidden="true">›</li>
            <li mono-item>
              <a mono-action href="#">
                <span mono-content><span mono-title>Reports</span></span>
              </a>
            </li>
            <li mono-separator aria-hidden="true">›</li>
            <li mono-item mono-current aria-current="page">
              <span mono-action>
                <span mono-content><span mono-title>Q4 Summary</span></span>
              </span>
            </li>
          </ol>
        </nav>
      </div>
    </div>
  </div>
</template>
