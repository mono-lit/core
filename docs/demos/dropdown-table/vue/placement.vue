<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/dropdown-table'
import '@mono-lit/helper/ui/table'
import { controlMonoDataDropdown } from '@mono-lit/helper'

type Person = { Id: number; Name: string; Role: string }

const people: Person[] = [
  { Id: 1, Name: 'Ada Lovelace', Role: 'Analyst' },
  { Id: 2, Name: 'Alan Turing', Role: 'Engineer' },
  { Id: 3, Name: 'Grace Hopper', Role: 'Admiral' },
  { Id: 4, Name: 'Katherine Johnson', Role: 'Physicist' },
  { Id: 5, Name: 'Edsger Dijkstra', Role: 'Engineer' },
  { Id: 6, Name: 'Barbara Liskov', Role: 'Professor' },
  { Id: 7, Name: 'Donald Knuth', Role: 'Author' },
  { Id: 8, Name: 'Margaret Hamilton', Role: 'Director' },
]

/** One controller per field — a controller owns a single selection. */
function makeDd() {
  const dd = controlMonoDataDropdown<Person>(people, {
    keyExpr: 'Id',
    displayExpr: 'Name',
    pageSize: 20,
    searchValue: ['Name', 'Role'],
  })
  const rows = ref<Person[]>([])
  const off = dd.table.subscribe(() => {
    rows.value = [...dd.table.items]
  })
  dd.table.load()
  return { dd, rows, dispose: () => { off(); dd.dispose() } }
}

// DESTRUCTURE — don't keep the refs inside the returned object. Vue only
// auto-unwraps a ref that is a top-level setup binding (or a property of a
// `reactive()` object), so `start.rows` in the template would hand `v-for` the
// Ref ITSELF; iterating that yields its internal keys and renders blank rows.
const { dd: startDd, rows: startRows, dispose: disposeStart } = makeDd()
const { dd: endDd, rows: endRows, dispose: disposeEnd } = makeDd()
const { dd: pinnedDd, rows: pinnedRows, dispose: disposePinned } = makeDd()

const flip = ref(true)
const shift = ref(true)

onBeforeUnmount(() => {
  disposeStart()
  disposeEnd()
  disposePinned()
})
</script>

<template>
  <div class="example-placement">
    <DemoControls gap="0.6rem">
      <DemoCheck v-model="flip">flip <em>(open upward when there's no room below)</em></DemoCheck>
      <DemoCheck v-model="shift">shift <em>(slide inward near a screen edge)</em></DemoCheck>
    </DemoControls>

    <p class="example-hint">
      Scroll this box so a field sits near the bottom of the window, then open it — the panel
      flips above the field, and shrinks to the space left when neither side fits. The right-hand
      field also stays on screen instead of overflowing.
    </p>

    <!-- A tall scroller so a field can be dragged to either viewport edge. -->
    <div class="example-scroller">
      <div class="example-row">
        <mono-dropdown-table :control-data-dropdown.prop="startDd" label="Left edge" placeholder="Pick a person…"
          clearable :flip="flip" :shift="shift" :dropdown.prop="{ width: 460, maxHeight: 300 }">
          <mono-table-search :control-table.prop="startDd.table" slot="search" placeholder="Search…" />
          <table mono-table>
            <thead><tr><th>Name</th><th>Role</th></tr></thead>
            <tbody>
              <tr v-for="r in startRows" :key="r.Id" :data-row-key="String(r.Id)">
                <td>{{ r.Name }}</td><td>{{ r.Role }}</td>
              </tr>
            </tbody>
          </table>
        </mono-dropdown-table>

        <mono-dropdown-table :control-data-dropdown.prop="endDd" label="Right edge" placeholder="Pick a person…"
          clearable :flip="flip" :shift="shift" :dropdown.prop="{ width: 460, maxHeight: 300 }">
          <mono-table-search :control-table.prop="endDd.table" slot="search" placeholder="Search…" />
          <table mono-table>
            <thead><tr><th>Name</th><th>Role</th></tr></thead>
            <tbody>
              <tr v-for="r in endRows" :key="r.Id" :data-row-key="String(r.Id)">
                <td>{{ r.Name }}</td><td>{{ r.Role }}</td>
              </tr>
            </tbody>
          </table>
        </mono-dropdown-table>
      </div>

      <div class="example-spacer">scroll ↓</div>

      <div class="example-row">
        <mono-dropdown-table :control-data-dropdown.prop="pinnedDd" label="Forced upward (placement=&quot;top-start&quot;)"
          placeholder="Pick a person…" clearable placement="top-start" :flip="flip" :shift="shift"
          :dropdown.prop="{ width: 460, maxHeight: 300 }">
          <mono-table-search :control-table.prop="pinnedDd.table" slot="search" placeholder="Search…" />
          <table mono-table>
            <thead><tr><th>Name</th><th>Role</th></tr></thead>
            <tbody>
              <tr v-for="r in pinnedRows" :key="r.Id" :data-row-key="String(r.Id)">
                <td>{{ r.Name }}</td><td>{{ r.Role }}</td>
              </tr>
            </tbody>
          </table>
        </mono-dropdown-table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.example-placement {
  width: 100%;
}
.example-placement em {
  opacity: 0.7;
}
.example-hint {
  margin: 0 0 0.9rem;
  font-size: 0.8rem;
  opacity: 0.75;
}
.example-scroller {
  max-height: 320px;
  overflow: auto;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 0.6rem;
}
.example-row {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}
.example-row > * {
  flex: 0 1 260px;
}
.example-spacer {
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  opacity: 0.45;
}
</style>
