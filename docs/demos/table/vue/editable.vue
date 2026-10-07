<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/textarea'
import '@mono-lit/helper/ui/checkbox'
import '@mono-lit/helper/ui/switch'
import '@mono-lit/helper/ui/select'
import '@mono-lit/helper/ui/date'
import '@mono-lit/helper/ui/tag-input'
import '@mono-lit/helper/ui/dropdown-table'
import '@mono-lit/helper/ui/button'
import { controlMonoTable, controlMonoDataDropdown } from '@mono-lit/helper'

// The backing array. It is NOT mutated while you edit — only when you click Save.
const data = ref([
  { id: 1, name: 'Ada Lovelace', age: 36, role: 'Analyst', active: true, remarks: 'Founding contributor.', verified: true, team: 'research', joined: '2021-03-01', skills: ['math', 'notes'], manager: 6 },
  { id: 2, name: 'Alan Turing', age: 41, role: 'Engineer', active: true, remarks: 'Cryptanalysis lead.', verified: true, team: 'engineering', joined: '2020-06-15', skills: ['math', 'code'], manager: 7 },
  { id: 3, name: 'Grace Hopper', age: 45, role: 'Admiral', active: false, remarks: 'Compiler pioneer.', verified: false, team: 'operations', joined: '2019-01-20', skills: ['code'], manager: 8 },
  { id: 4, name: 'Katherine J.', age: 52, role: 'Physicist', active: true, remarks: 'Orbital mechanics.', verified: true, team: 'research', joined: '2022-09-10', skills: ['math'], manager: 6 },
  { id: 5, name: 'Edsger Dijkstra', age: 38, role: 'Engineer', active: false, remarks: 'Algorithms.', verified: false, team: 'engineering', joined: '2018-11-05', skills: ['code', 'design'], manager: 7 },
])

// Options for the select + tag-input editors.
const teams = ref([
  { label: 'Research', value: 'research' },
  { label: 'Engineering', value: 'engineering' },
  { label: 'Operations', value: 'operations' },
])
const skillOptions = ref([
  { label: 'Math', value: 'math' },
  { label: 'Notes', value: 'notes' },
  { label: 'Code', value: 'code' },
  { label: 'Design', value: 'design' },
])
const teamLabel = (v) => teams.value.find((t) => t.value === v)?.label ?? v
const skillLabels = (vals) =>
  (vals || []).map((v) => skillOptions.value.find((s) => s.value === v)?.label ?? v).join(', ')

// The `manager` column is edited with a <mono-dropdown-table> — a grid inside the
// cell's editor. One shared controller is enough because only ONE row edits at a
// time, and the editor is rendered with v-if (not v-show) so exactly one instance
// is ever mounted; with v-show all five would push their own value into the same
// controller and the visible one would show the last row's manager.
const managers = [
  { Id: 6, Name: 'Barbara Liskov', Dept: 'Research' },
  { Id: 7, Name: 'Donald Knuth', Dept: 'Engineering' },
  { Id: 8, Name: 'Margaret Hamilton', Dept: 'Operations' },
  { Id: 9, Name: 'Frances Allen', Dept: 'Research' },
  { Id: 10, Name: 'Jean Bartik', Dept: 'Engineering' },
  { Id: 11, Name: 'Radia Perlman', Dept: 'Engineering' },
  { Id: 12, Name: 'Shafi Goldwasser', Dept: 'Research' },
]
const dd = controlMonoDataDropdown(managers, {
  keyExpr: 'Id',
  displayExpr: 'Name',
  pageSize: 4,
  searchValue: ['Name', 'Dept'],
})
const ddRows = ref([])
const ddOff = dd.grid.subscribe(() => { ddRows.value = [...dd.grid.items] })
dd.grid.load()
const managerLabel = (v) =>
  managers.find((m) => String(m.Id) === String(v))?.Name ?? '—'

// Staged edits live here (mirror of table.changes()) — a separate ref, so you can
// see exactly what's pending before it's committed to `data`.
const changes = ref([])
const changeView = computed(() => changes.value.map((c) => ({ id: c.key, ...c.patch })))

// `editableTrigger` can be set here as the table-wide default; the header's
// `:editable-trigger` below overrides it so the demo can flip it live.
const table = controlMonoTable(data.value, { keyExpr: 'id', pageSize: 8, editableTrigger: 'click' })

/** Bound to `<mono-table-th :editable-trigger>` — 'click' | 'double-click'. */
const trigger = ref('click')

const rows = ref([])
const off = table.subscribe(() => {
  rows.value = [...table.items]
  changes.value = table.changes()
})
table.load()

const rk = (row) => String(row.id)

// Save: push the staged changes INTO `data` (map by key), then setData + clear.
function save() {
  const byId = new Map(table.changes().map((c) => [String(c.key), c.patch]))
  data.value = data.value.map((r) => {
    const patch = byId.get(String(r.id))
    return patch ? { ...r, ...patch } : r
  })
  table.setData(data.value)
  table.discardChanges()
}

onBeforeUnmount(() => { off(); table.dispose(); ddOff(); dd.dispose() })
</script>

<template>
  <mono-card bordered width="100%" style="--mono-card-padding: 0; overflow: hidden;">
    <div class="example-toolbar">
      <div class="example-hint">
        <strong>{{ trigger === 'click' ? 'Click' : 'Double-click' }} a row</strong> to edit — every
        column uses a different mono editor, and the caret lands in the
        <strong>cell you clicked</strong>. The grid binds the trigger itself; the
        <code>&lt;tr&gt;</code> only needs <code>:data-row-key</code>. Edits stage into
        <code>changes</code>; <code>data</code> only updates on Save. Click outside the row to stop
        editing. Every editable column carries a <strong>marker</strong> in its header
        (<code>required</code>) — the same red <code>*</code> the form controls use.
      </div>
      <div class="example-actions">
        <DemoSelect v-model="trigger" label="open on" :options="['click', 'double-click']" />
        <span v-show="table.hasChanges()" class="example-pending">{{ table.pendingCount() }} pending</span>
        <mono-button size="sm" variant="outline" color="neutral" :disabled="!table.hasChanges()"
          @click="table.discardChanges()">Discard</mono-button>
        <mono-button size="sm" color="primary" :disabled="!table.hasChanges()" @click="save">Save</mono-button>
      </div>
    </div>

    <div mono-table-scroll>
      <!-- Column widths declared right on each <mono-table-th> (:width) — no
           separate <colgroup> needed. `mono-table-fixed` makes them strict. -->
      <table mono-table mono-fixed>
        <thead>
          <tr>
            <th><mono-table-th :control-table.prop="table" field="id" caption="ID" sort :width="48">ID</mono-table-th></th>
            <!-- `editable-trigger` is table-wide; declaring it on one header is enough. -->
            <th><mono-table-th :control-table.prop="table" field="name" caption="Name"
                :sort.prop="{ order: 'asc' }" :editable="true" :required="true" :editable-trigger="trigger"
                width="10rem">Name</mono-table-th></th>
            <th><mono-table-th :control-table.prop="table" field="age" caption="Age" sort
                :editable="true" :required="true" :width="64">Age</mono-table-th></th>
            <th><mono-table-th :control-table.prop="table" field="role" caption="Role" sort
                :editable="true" :required="true" :header-filter="true" width="8rem">Role</mono-table-th></th>
            <th><mono-table-th :control-table.prop="table" field="active" caption="Active"
                :editable="true" :required="true" :width="96">Active</mono-table-th></th>
            <th><mono-table-th :control-table.prop="table" field="remarks" caption="Remarks"
                :editable="true" :required="true" width="16rem">Remarks</mono-table-th></th>
            <th><mono-table-th :control-table.prop="table" field="verified" caption="Verified"
                :editable="true" :required="true" :width="96">Verified</mono-table-th></th>
            <th><mono-table-th :control-table.prop="table" field="team" caption="Team"
                :editable="true" :required="true" :header-filter="true" width="10rem">Team</mono-table-th></th>
            <th><mono-table-th :control-table.prop="table" field="joined" caption="Joined"
                :editable="true" :required="true" width="9rem">Joined</mono-table-th></th>
            <th><mono-table-th :control-table.prop="table" field="skills" caption="Skills"
                :editable="true" :required="true" width="14rem">Skills</mono-table-th></th>
            <th><mono-table-th :control-table.prop="table" field="manager" caption="Manager"
                :editable="true" :required="true" width="12rem">Manager</mono-table-th></th>
          </tr>
        </thead>

        <tbody>
          <!-- No @dblclick needed — `editable-trigger` on the header binds it. -->
          <tr v-for="row in rows" :key="row.id" :data-row-key="rk(row)"
            :mono-editing="table.isEditingRow(rk(row)) ? '' : null" :class="{ 'example-dirty': table.isRowDirty(rk(row)) }">
            <td>{{ row.id }}</td>

            <!-- name: mono-input (text) -->
            <td>
              <mono-input v-show="table.isEditingCell(rk(row), 'name')" size="sm" data-edit-cell="name"
                :model-value="String(table.cellValue(rk(row), 'name', row.name) ?? '')"
                @change="e => table.stageCell(rk(row), 'name', e.detail.modelValue)"
                @keydown="e => table.editorKeydown(e, rk(row), 'name')" />
              <span v-show="!table.isEditingCell(rk(row), 'name')">{{ table.cellValue(rk(row), 'name', row.name)
                }}</span>
            </td>

            <!-- age: mono-input (number) -->
            <td>
              <mono-input v-show="table.isEditingCell(rk(row), 'age')" size="sm" type="number" data-edit-cell="age"
                :model-value="String(table.cellValue(rk(row), 'age', row.age) ?? '')"
                @change="e => table.stageCell(rk(row), 'age', Number(e.detail.modelValue))"
                @keydown="e => table.editorKeydown(e, rk(row), 'age')" />
              <span v-show="!table.isEditingCell(rk(row), 'age')">{{ table.cellValue(rk(row), 'age', row.age) }}</span>
            </td>

            <!-- role: mono-input (text) -->
            <td>
              <mono-input v-show="table.isEditingCell(rk(row), 'role')" size="sm" data-edit-cell="role"
                :model-value="String(table.cellValue(rk(row), 'role', row.role) ?? '')"
                @change="e => table.stageCell(rk(row), 'role', e.detail.modelValue)"
                @keydown="e => table.editorKeydown(e, rk(row), 'role')" />
              <span v-show="!table.isEditingCell(rk(row), 'role')">{{ table.cellValue(rk(row), 'role', row.role)
                }}</span>
            </td>

            <!-- active: mono-switch (boolean) -->
            <td>
              <mono-switch v-show="table.isEditingCell(rk(row), 'active')" size="sm" data-edit-cell="active"
                :model-value="!!table.cellValue(rk(row), 'active', row.active)"
                @change="e => table.stageCell(rk(row), 'active', e.detail.modelValue)"
                @keydown="e => table.editorKeydown(e, rk(row), 'active')" />
              <span v-show="!table.isEditingCell(rk(row), 'active')">{{ table.cellValue(rk(row), 'active', row.active) ?
                'Yes' : 'No' }}</span>
            </td>

            <!-- remarks: mono-textarea -->
            <td>
              <mono-textarea v-show="table.isEditingCell(rk(row), 'remarks')" size="sm" rows="2"
                data-edit-cell="remarks"
                :model-value="String(table.cellValue(rk(row), 'remarks', row.remarks) ?? '')"
                @change="e => table.stageCell(rk(row), 'remarks', e.detail.modelValue)"
                @keydown="e => table.editorKeydown(e, rk(row), 'remarks')" />
              <span v-show="!table.isEditingCell(rk(row), 'remarks')">{{ table.cellValue(rk(row), 'remarks',
                row.remarks) }}</span>
            </td>

            <!-- verified: mono-checkbox (boolean) -->
            <td>
              <mono-checkbox v-show="table.isEditingCell(rk(row), 'verified')" size="sm" data-edit-cell="verified"
                :model-value="!!table.cellValue(rk(row), 'verified', row.verified)"
                @change="e => table.stageCell(rk(row), 'verified', e.detail.modelValue)"
                @keydown="e => table.editorKeydown(e, rk(row), 'verified')" />
              <span v-show="!table.isEditingCell(rk(row), 'verified')">{{ table.cellValue(rk(row), 'verified',
                row.verified) ? '✓' : '—' }}</span>
            </td>

            <!-- team: mono-select (single) -->
            <td>
              <mono-select v-show="table.isEditingCell(rk(row), 'team')" size="sm"
                data-edit-cell="team" :items.prop="teams" key-value="value" display-value="label"
                :model-value="table.cellValue(rk(row), 'team', row.team)"
                @change="e => table.stageCell(rk(row), 'team', e.detail.modelValue)"
                @keydown="e => table.editorKeydown(e, rk(row), 'team')" />
              <span v-show="!table.isEditingCell(rk(row), 'team')">{{ teamLabel(table.cellValue(rk(row), 'team',
                row.team)) }}</span>
            </td>

            <!-- joined: mono-date -->
            <td>
              <mono-date v-show="table.isEditingCell(rk(row), 'joined')" size="sm"
                data-edit-cell="joined" :model-value="String(table.cellValue(rk(row), 'joined', row.joined) ?? '')"
                @change="e => table.stageCell(rk(row), 'joined', e.detail.modelValue)"
                @keydown="e => table.editorKeydown(e, rk(row), 'joined')" />
              <span v-show="!table.isEditingCell(rk(row), 'joined')">{{ table.cellValue(rk(row), 'joined', row.joined)
                }}</span>
            </td>

            <!-- skills: mono-tag-input (multi) -->
            <td>
              <mono-tag-input v-show="table.isEditingCell(rk(row), 'skills')" size="sm"
                data-edit-cell="skills" :items.prop="skillOptions" key-value="value" display-value="label"
                :model-value.prop="table.cellValue(rk(row), 'skills', row.skills)"
                @change="e => table.stageCell(rk(row), 'skills', e.detail.modelValue)"
                @keydown="e => table.editorKeydown(e, rk(row), 'skills')" />
              <span v-show="!table.isEditingCell(rk(row), 'skills')">{{ skillLabels(table.cellValue(rk(row), 'skills',
                row.skills)) }}</span>
            </td>

            <!-- manager: mono-dropdown-table (a grid inside the cell editor).
                 v-if, not v-show — see the `dd` comment in the script. The panel
                 portals to <body> with [data-mono-popup-portal], which the grid's
                 outside-click exit whitelists, so picking a row in the panel does
                 NOT end the row edit. Opening the panel focuses its search box. -->
            <td>
              <mono-dropdown-table v-if="table.isEditingCell(rk(row), 'manager')" size="sm"
                data-edit-cell="manager" :control-data-dropdown.prop="dd" placeholder="Pick…"
                :dropdown.prop="{ width: 280, maxHeight: 232 }"
                :model-value.prop="table.cellValue(rk(row), 'manager', row.manager)"
                @change="e => table.stageCell(rk(row), 'manager', e.detail.modelValue)">
                <mono-table-search :control-table.prop="dd.grid" slot="search"
                  placeholder="Search manager…" />
                <table mono-table>
                  <thead>
                    <tr>
                      <th><mono-table-th :control-table.prop="dd.grid" field="Name" caption="Name"
                          sort>Name</mono-table-th></th>
                      <th><mono-table-th :control-table.prop="dd.grid" field="Dept" caption="Dept"
                          sort>Dept</mono-table-th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="m in ddRows" :key="m.Id" :data-row-key="String(m.Id)">
                      <td>{{ m.Name }}</td>
                      <td>{{ m.Dept }}</td>
                    </tr>
                  </tbody>
                </table>
                <mono-table-paging :control-table.prop="dd.grid" slot="footer" simple />
              </mono-dropdown-table>
              <span v-else>{{ managerLabel(table.cellValue(rk(row), 'manager', row.manager)) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div mono-table-foot>
      <mono-table-info :control-table.prop="table" />
      <mono-table-paging :control-table.prop="table" />
    </div>

    <!-- The two refs, side by side, so the staged-vs-committed flow is visible. -->
    <div class="example-refs">
      <div>
        <div class="example-refs-title">changes ref (staged, not yet in data)</div>
        <pre class="example-pre">{{ changeView.length ? changeView : '—' }}</pre>
      </div>
      <div>
        <div class="example-refs-title">data ref (only updates on Save)</div>
        <pre class="example-pre">{{ data }}</pre>
      </div>
    </div>
  </mono-card>
</template>

<style scoped>
.example-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.72rem 1rem;
  flex-wrap: wrap;
}

.example-hint {
  font-size: 0.8rem;
  color: var(--foreground);
  opacity: 0.75;
  max-width: 34rem;
}

.example-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.example-pending {
  font-size: 0.74rem;
  opacity: 0.7;
}

/* Mark a dirty row with COLOUR, not weight: changing font-weight re-metrics
   every glyph in the row, shifting the text a beat after you start typing. */
.example-dirty td {
  color: var(--primary);
}
/* Editors fill their column and flatten into the cell automatically — the
   library detects a mono form control in a <td>. No local CSS needed. */

.example-refs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--border);
}

.example-refs-title {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.6;
  margin-bottom: 0.3rem;
}

.example-pre {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.4;
  max-height: 12rem;
  overflow: auto;
  background: var(--muted);
  border-radius: 0.5rem;
  padding: 0.5rem 0.65rem;
}

@media (max-width: 640px) {
  .example-refs {
    grid-template-columns: 1fr;
  }
}
</style>
