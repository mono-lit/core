<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const open = ref(false)

function onKey(e) {
  if (e.key === 'Escape' && open.value) open.value = false
}
onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div>
    <div mono-button mono-color="purple"><button mono-native type="button" @click="open = true">Open themed drawer</button></div>

    <!-- Vars set inline on the .mono-drawer root theme the panel. -->
    <div
      mono-drawer
      :mono-open="open ? '' : null"
      style="
        --mono-drawer-accent: #7c3aed;
        --mono-drawer-width: 360px;
        --mono-drawer-title-color: #7c3aed;
        --mono-drawer-header-bg: color-mix(in oklab, #7c3aed 8%, var(--popover));
        --mono-drawer-header-border: color-mix(in oklab, #7c3aed 25%, transparent);
        --mono-drawer-header-border-width: 1px;
      "
      role="dialog"
      aria-modal="true"
      :aria-hidden="!open"
    >
      <div mono-overlay @click="open = false"></div>
      <div mono-panel>
        <div mono-header>
          <div mono-title>Themed drawer</div>
          <button type="button" mono-close aria-label="Close drawer" @click="open = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div mono-body>
          <p style="margin: 0;">The port leaves the header bar OFF; the three <code>--mono-drawer-header-*</code>
            knobs bring it back, and the accent and the measure are vars too.</p>
        </div>
      </div>
    </div>
  </div>
</template>
