<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'

// The same picker as the Vue tab; the hand-written markup takes the colour as
// the `mono-color` attribute (primary is the default and emits nothing) and the
// variant as `mono-variant` (outlined is the default and emits nothing). Same
// contract as the basic demo: the attributes mirror the element's props one for
// one and dropdown-table.css paints them; the few lines here only open, pick and
// clear. The panel opens in flow under the field (the element's is portaled).
const color = ref('primary')

const people = [
  { Id: 1, Name: 'Ada Lovelace', Role: 'Analyst' },
  { Id: 2, Name: 'Alan Turing', Role: 'Engineer' },
  { Id: 3, Name: 'Grace Hopper', Role: 'Admiral' },
  { Id: 4, Name: 'Katherine Johnson', Role: 'Physicist' },
  { Id: 5, Name: 'Edsger Dijkstra', Role: 'Engineer' },
]
const fields = reactive({ outlined: { open: false, query: '', picked: null, active: null }, filled: { open: false, query: '', picked: null, active: null }, underlined: { open: false, query: '', picked: null, active: null } })
const nameOf = (id) => people.find((p) => p.Id === id)?.Name ?? id
const rows = (field) => people.filter((p) => !field.query || `${p.Name} ${p.Role}`.toLowerCase().includes(field.query.toLowerCase()))

function pick(field, id) {
  field.active = id
  field.picked = id
  field.open = false
}
function clear(field) {
  field.picked = null
  field.open = false
}
// an outside click closes an open panel, like the element does
function onDocumentClick(event) {
  if (event.target.closest('[mono-dropdown-table]')) return
  for (const f of Object.values(fields)) f.open = false
}
onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <div style="width: 100%;">
    <DemoControls>
      <DemoSelect v-model="color" label="Color" colors="form" />
    </DemoControls>

    <div style="display: grid; gap: 1rem;">
      <div mono-dropdown-table mono-clearable :mono-color="color === 'primary' ? null : color" :mono-open="fields.outlined.open ? '' : null" :mono-has-value="fields.outlined.picked != null ? '' : null">
        <label mono-dd-label>Outlined</label>
        <div mono-dd-control>
          <div mono-dd-trigger role="combobox" tabindex="0" :aria-expanded="fields.outlined.open" @click="fields.outlined.open = !fields.outlined.open" @keydown.enter.prevent="fields.outlined.open = !fields.outlined.open" @keydown.escape="fields.outlined.open = false">
            <span mono-dd-value :mono-dd-placeholder="fields.outlined.picked != null ? null : ''">
              <span v-if="fields.outlined.picked != null">{{ nameOf(fields.outlined.picked) }}</span>
              <template v-else>Pick a person…</template>
            </span>
            <span mono-dd-actions>
              <span v-if="fields.outlined.picked != null" mono-dd-clear role="button" tabindex="-1" aria-label="Clear" @click.stop="clear(fields.outlined)"><span mono-icon class="mono-icon i-mdi-close"></span></span>
              <span v-else mono-dd-arrow role="button" tabindex="-1" aria-label="Toggle" :aria-expanded="fields.outlined.open" @click.stop="fields.outlined.open = !fields.outlined.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
            </span>
          </div>

          <!-- in flow under the field (the element's copy is portaled + fixed) -->
          <div v-if="fields.outlined.open" mono-dd-panel role="dialog" tabindex="-1" style="position: static; width: 100%; margin-top: 0.375rem">
            <div mono-dd-region="search">
              <div mono-input mono-size="sm">
                <div mono-field><input mono-native type="search" placeholder="Search…" v-model="fields.outlined.query" /></div>
              </div>
            </div>
            <div mono-dd-region="body">
              <table mono-table>
                <thead>
                  <tr><th>Name</th><th>Role</th></tr>
                </thead>
                <tbody>
                  <tr v-for="r in rows(fields.outlined)" :key="r.Id" :data-row-key="String(r.Id)" :mono-selected="fields.outlined.picked === r.Id ? '' : null" :mono-dd-active="fields.outlined.active === r.Id ? '' : null" @click="pick(fields.outlined, r.Id)">
                    <td>{{ r.Name }}</td>
                    <td>{{ r.Role }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div mono-dropdown-table mono-variant="filled" mono-clearable :mono-color="color === 'primary' ? null : color" :mono-open="fields.filled.open ? '' : null" :mono-has-value="fields.filled.picked != null ? '' : null">
        <label mono-dd-label>Filled</label>
        <div mono-dd-control>
          <div mono-dd-trigger role="combobox" tabindex="0" :aria-expanded="fields.filled.open" @click="fields.filled.open = !fields.filled.open" @keydown.enter.prevent="fields.filled.open = !fields.filled.open" @keydown.escape="fields.filled.open = false">
            <span mono-dd-value :mono-dd-placeholder="fields.filled.picked != null ? null : ''">
              <span v-if="fields.filled.picked != null">{{ nameOf(fields.filled.picked) }}</span>
              <template v-else>Pick a person…</template>
            </span>
            <span mono-dd-actions>
              <span v-if="fields.filled.picked != null" mono-dd-clear role="button" tabindex="-1" aria-label="Clear" @click.stop="clear(fields.filled)"><span mono-icon class="mono-icon i-mdi-close"></span></span>
              <span v-else mono-dd-arrow role="button" tabindex="-1" aria-label="Toggle" :aria-expanded="fields.filled.open" @click.stop="fields.filled.open = !fields.filled.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
            </span>
          </div>

          <!-- in flow under the field (the element's copy is portaled + fixed) -->
          <div v-if="fields.filled.open" mono-dd-panel role="dialog" tabindex="-1" style="position: static; width: 100%; margin-top: 0.375rem">
            <div mono-dd-region="search">
              <div mono-input mono-size="sm">
                <div mono-field><input mono-native type="search" placeholder="Search…" v-model="fields.filled.query" /></div>
              </div>
            </div>
            <div mono-dd-region="body">
              <table mono-table>
                <thead>
                  <tr><th>Name</th><th>Role</th></tr>
                </thead>
                <tbody>
                  <tr v-for="r in rows(fields.filled)" :key="r.Id" :data-row-key="String(r.Id)" :mono-selected="fields.filled.picked === r.Id ? '' : null" :mono-dd-active="fields.filled.active === r.Id ? '' : null" @click="pick(fields.filled, r.Id)">
                    <td>{{ r.Name }}</td>
                    <td>{{ r.Role }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div mono-dropdown-table mono-variant="underlined" mono-clearable :mono-color="color === 'primary' ? null : color" :mono-open="fields.underlined.open ? '' : null" :mono-has-value="fields.underlined.picked != null ? '' : null">
        <label mono-dd-label>Underlined</label>
        <div mono-dd-control>
          <div mono-dd-trigger role="combobox" tabindex="0" :aria-expanded="fields.underlined.open" @click="fields.underlined.open = !fields.underlined.open" @keydown.enter.prevent="fields.underlined.open = !fields.underlined.open" @keydown.escape="fields.underlined.open = false">
            <span mono-dd-value :mono-dd-placeholder="fields.underlined.picked != null ? null : ''">
              <span v-if="fields.underlined.picked != null">{{ nameOf(fields.underlined.picked) }}</span>
              <template v-else>Pick a person…</template>
            </span>
            <span mono-dd-actions>
              <span v-if="fields.underlined.picked != null" mono-dd-clear role="button" tabindex="-1" aria-label="Clear" @click.stop="clear(fields.underlined)"><span mono-icon class="mono-icon i-mdi-close"></span></span>
              <span v-else mono-dd-arrow role="button" tabindex="-1" aria-label="Toggle" :aria-expanded="fields.underlined.open" @click.stop="fields.underlined.open = !fields.underlined.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
            </span>
          </div>

          <!-- in flow under the field (the element's copy is portaled + fixed) -->
          <div v-if="fields.underlined.open" mono-dd-panel role="dialog" tabindex="-1" style="position: static; width: 100%; margin-top: 0.375rem">
            <div mono-dd-region="search">
              <div mono-input mono-size="sm">
                <div mono-field><input mono-native type="search" placeholder="Search…" v-model="fields.underlined.query" /></div>
              </div>
            </div>
            <div mono-dd-region="body">
              <table mono-table>
                <thead>
                  <tr><th>Name</th><th>Role</th></tr>
                </thead>
                <tbody>
                  <tr v-for="r in rows(fields.underlined)" :key="r.Id" :data-row-key="String(r.Id)" :mono-selected="fields.underlined.picked === r.Id ? '' : null" :mono-dd-active="fields.underlined.active === r.Id ? '' : null" @click="pick(fields.underlined, r.Id)">
                    <td>{{ r.Name }}</td>
                    <td>{{ r.Role }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
