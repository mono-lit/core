<script setup>
import { reactive, onMounted, onUnmounted } from 'vue'

// Hand-written markup, no Lit: the attributes mirror the element's props one for
// one and dropdown-table.css paints them. The few lines here only open, pick and
// clear — the element's own logic — so the field paints exactly like the Light /
// Shadow tabs' basic demo. The panel's table is a plain `<table mono-table>`; the
// element portals its panel to <body> and places it `fixed` under the field —
// hand-written, it opens in flow right under the field instead.
const people = [
  { Id: 1, Name: 'Ada Lovelace', Role: 'Analyst' },
  { Id: 2, Name: 'Alan Turing', Role: 'Engineer' },
  { Id: 3, Name: 'Grace Hopper', Role: 'Admiral' },
  { Id: 4, Name: 'Katherine Johnson', Role: 'Physicist' },
  { Id: 5, Name: 'Edsger Dijkstra', Role: 'Engineer' },
]
const field = reactive({ open: false, query: '', picked: null, active: null })
const nameOf = (id) => people.find((p) => p.Id === id)?.Name ?? id
const rows = () => people.filter((p) => !field.query || `${p.Name} ${p.Role}`.toLowerCase().includes(field.query.toLowerCase()))

function pick(id) {
  field.active = id
  field.picked = id
  field.open = false
}
function clear() {
  field.picked = null
  field.open = false
}
// an outside click closes an open panel, like the element does
function onDocumentClick(event) {
  if (event.target.closest('[mono-dropdown-table]')) return
  field.open = false
}
onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <div class="example-demo" style="width: 100%">
    <div mono-dropdown-table mono-clearable :mono-open="field.open ? '' : null" :mono-has-value="field.picked != null ? '' : null">
      <label mono-dd-label>Owner</label>
      <div mono-dd-control>
        <div mono-dd-trigger role="combobox" tabindex="0" :aria-expanded="field.open" @click="field.open = !field.open" @keydown.enter.prevent="field.open = !field.open" @keydown.escape="field.open = false">
          <span mono-dd-value :mono-dd-placeholder="field.picked != null ? null : ''">
            <span v-if="field.picked != null">{{ nameOf(field.picked) }}</span>
            <template v-else>Pick a person…</template>
          </span>
          <span mono-dd-actions>
            <span v-if="field.picked != null" mono-dd-clear role="button" tabindex="-1" aria-label="Clear" @click.stop="clear"><span mono-icon class="mono-icon i-mdi-close"></span></span>
            <span v-else mono-dd-arrow role="button" tabindex="-1" aria-label="Toggle" :aria-expanded="field.open" @click.stop="field.open = !field.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
          </span>
        </div>

        <!-- in flow under the field (the element's copy is portaled + fixed) -->
        <div v-if="field.open" mono-dd-panel role="dialog" tabindex="-1" style="position: static; width: 100%; margin-top: 0.375rem">
          <div mono-dd-region="search">
            <div mono-input mono-size="sm">
              <div mono-field><input mono-native type="search" placeholder="Search name or role…" v-model="field.query" /></div>
            </div>
          </div>
          <div mono-dd-region="body">
            <table mono-table>
              <thead>
                <tr><th>Name</th><th>Role</th></tr>
              </thead>
              <tbody>
                <tr v-for="r in rows()" :key="r.Id" :data-row-key="String(r.Id)" :mono-selected="field.picked === r.Id ? '' : null" :mono-dd-active="field.active === r.Id ? '' : null" @click="pick(r.Id)">
                  <td>{{ r.Name }}</td>
                  <td>{{ r.Role }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div mono-dd-region="foot">{{ rows().length }} of {{ people.length }}</div>
        </div>
      </div>
      <div mono-dd-message="helper">Single-select over a local array.</div>
    </div>

    <p class="example-value">Selected id: <strong>{{ field.picked ?? '—' }}</strong></p>
  </div>
</template>

<style scoped>
.example-demo {
  max-width: 360px;
}
.example-value {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--foreground);
  opacity: 0.75;
}
</style>
