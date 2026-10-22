<script setup lang="ts">
// `slot="select-all"` — you render what sits beside the "All" checkbox, mono keeps the row.
//
// The checkbox, its tri-state, the click that ticks every visible row and the server drain all stay
// mono's. Only the label area is handed over, so anything can go there: an icon, a count, a button.
//
// A control you put in the slot keeps its own click — the `(?)` below opens a hint and does NOT
// select everything. That holds for button, a[href], input, select, textarea, label and anything
// marked `data-mono-no-toggle`.
import '@mono-lit/helper/ui/tag-input'
import { ref } from 'vue'

const depts = [
  { Code: 'MKT', Nama: 'Marketing' },
  { Code: 'MRS', Nama: 'Market Research' },
  { Code: 'TMM', Nama: 'Trade Marketing' },
  { Code: 'SLS', Nama: 'Sales' },
  { Code: 'MTR', Nama: 'MTI & NKA' },
  { Code: 'DSC', Nama: 'Demand Supply Customer Operation' },
]

const selected = ref<string[]>([])
const hint = ref(false)
</script>

<template>
  <div style="width: 100%; display: grid; gap: 0.6rem;">
    <mono-tag-input
      checkable
      searchable
      :items.prop="depts"
      :model-value.prop="selected"
      key-value="Code"
      display-value="Nama"
      label="Departemen"
      placeholder="Pilih…"
      @change="selected = ($event.detail.currentValue as string[])"
    >
      <!-- ONE wrapper. mono places it beside the checkbox and never reaches inside it. -->
      <div slot="select-all" class="example-all">
        <span class="i-mdi-domain example-all-icon"></span>
        <span class="example-all-label">Semua departemen</span>
        <span class="example-all-count">{{ selected.length }}/{{ depts.length }}</span>
        <!-- A real <button>: its click is yours, the row does not toggle. -->
        <button type="button" class="example-all-help" title="Tentang pilihan ini" @click="hint = !hint">
          ?
        </button>
      </div>
    </mono-tag-input>

    <p v-if="hint" style="margin: 0; font-size: 0.8rem; opacity: 0.8;">
      "Semua" memilih setiap departemen yang terlihat — ketik untuk mempersempit dulu.
    </p>

    <div style="font-family: 'DM Mono', ui-monospace, monospace; font-size: 0.8rem; opacity: 0.7;">
      value → {{ selected.length ? selected.join(', ') : '—' }}
    </div>
  </div>
</template>

<style scoped>
/* Only what this demo adds — the row's height, padding, hover and sticky surface are mono's. */
.example-all {
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
    align-items: center;
    gap: 0.5rem;
}

.example-all-icon {
    flex: 0 0 auto;
    opacity: 0.6;
}

.example-all-label {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.example-all-count {
    flex: 0 0 auto;
    font-size: 0.75rem;
    font-weight: 400;
    opacity: 0.6;
}

.example-all-help {
    flex: 0 0 auto;
    width: 1.25rem;
    height: 1.25rem;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: transparent;
    color: inherit;
    font-size: 0.7rem;
    line-height: 1;
    cursor: help;
}
</style>
