<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/switch'
import '@mono-lit/helper/ui/button'
import { controlMonoTable } from '@mono-lit/helper'
import { initMono } from '@mono-lit/utility/runtime'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

// A DataSource-backed table (not a local ref). Edits are STAGED, then a manual
// Save flushes them to the source with `store.update` (OData PATCH). Here the
// source is the mono IndexedDB mock, activated in-page via initMono — a real
// round-trip that persists across a page refresh.
// `editableTrigger: 'double-click'` — the table-wide way to set it (no
// `editable-trigger` needed on any header). Default is 'click'.
const table = controlMonoTable(null, { keyExpr: 'Id', pageSize: 10, editableTrigger: 'double-click' })

const rows = ref([])
const loading = ref(false)
const status = ref('')
const off = table.subscribe(() => {
  rows.value = [...table.items]
  loading.value = table.loading
})

const rk = (row) => String(row.Id)

onMounted(async () => {
  // Register the writable IndexedDB mock (browser-only) — only intercepts URLs
  // under the 'tbl-mock' base, so other demos' real endpoints are untouched.
  initMono({
    name: '@mono-lit/helper',
    type: 'vue',
    apps: [],
    mockIndexedDB: {
      dbName: 'mono-helper-docs-mock',
      version: 1,
      schema: {
        'tbl-mock': {
          people: {
            fields: {
              Id: 'number|primary',
              Name: 'string',
              Age: 'number',
              Role: 'string',
              Active: 'boolean',
            },
            seed: [
              { Id: 1, Name: 'Ada Lovelace', Age: 36, Role: 'Analyst', Active: true },
              { Id: 2, Name: 'Alan Turing', Age: 41, Role: 'Engineer', Active: true },
              { Id: 3, Name: 'Grace Hopper', Age: 45, Role: 'Admiral', Active: false },
              { Id: 4, Name: 'Katherine J.', Age: 52, Role: 'Physicist', Active: true },
              { Id: 5, Name: 'Edsger Dijkstra', Age: 38, Role: 'Engineer', Active: false },
            ],
          },
        },
      },
    },
  })

  const { dataSource } = await monoCreateFetcher({ url: '/tbl-mock/people' }).response({
    options: { select: ['Id', 'Name', 'Age', 'Role', 'Active'], paginate: true, pageSize: 10 },
  })
  table.bind(dataSource)
  await table.load()
})

async function save() {
  status.value = ''
  try {
    await table.saveChanges()
    status.value = 'Saved to the DataSource (IndexedDB).'
  } catch (e) {
    status.value = 'Save failed: ' + (e?.message ?? String(e))
  }
}

onBeforeUnmount(() => { off(); table.dispose() })
</script>

<template>
  <mono-card bordered width="100%" style="--mono-card-padding: 0; overflow: hidden;">
    <div class="example-toolbar">
      <div class="example-hint">
        <strong>Double-click a row</strong> to edit — this grid opts into
        <code>editableTrigger: 'double-click'</code>. Edits are staged — nothing is
        sent until you press Save.
      </div>
      <div class="example-actions">
        <span v-show="table.hasChanges()" class="ds-pending">{{ table.pendingCount() }} pending</span>
        <mono-button size="sm" variant="outline" color="neutral"
          :disabled="!table.hasChanges()" @click="table.discardChanges()">Discard</mono-button>
        <mono-button size="sm" color="primary"
          :disabled="!table.hasChanges()" @click="save">Save</mono-button>
      </div>
    </div>

    <div mono-table-scroll>
      <!-- `mono-table-fixed` + explicit widths: with `table-layout: auto` the
           span→editor swap changes each column's intrinsic width and the whole
           grid re-solves, which reads as a horizontal snap on every click. -->
      <table mono-table mono-fixed>
        <caption><mono-table-loading :control-table.prop="table" /></caption>
        <thead>
          <tr>
            <th>
              <mono-table-th :control-table.prop="table" field="Id" caption="ID" sort :width="70">ID</mono-table-th>
            </th>
            <th>
              <mono-table-th :control-table.prop="table" field="Name" caption="Name"
                :sort.prop="{ order: 'asc' }" :editable="true" width="14rem">Name</mono-table-th>
            </th>
            <th>
              <mono-table-th :control-table.prop="table" field="Age" caption="Age"
                sort :editable="true" :width="90">Age</mono-table-th>
            </th>
            <th>
              <mono-table-th :control-table.prop="table" field="Role" caption="Role"
                sort :editable="true"  width="10rem">Role</mono-table-th>
            </th>
            <th>
              <mono-table-th :control-table.prop="table" field="Active" caption="Active"
                :editable="true" :width="110">Active</mono-table-th>
            </th>
          </tr>
        </thead>

        <tbody>
          <!-- No @dblclick needed — `editableTrigger` on the controller binds it. -->
          <tr v-for="row in rows" :key="row.Id" :data-row-key="rk(row)"
              :mono-editing="table.isEditingRow(rk(row)) ? '' : null" :class="{ 'example-dirty': table.isRowDirty(rk(row)) }">
            <td>{{ row.Id }}</td>

            <td>
              <mono-input v-show="table.isEditingCell(rk(row), 'Name')" size="sm"
                data-edit-cell="Name" :model-value="String(table.cellValue(rk(row), 'Name', row.Name) ?? '')"
                @change="e => table.stageCell(rk(row), 'Name', e.detail.modelValue)"
                @keydown="e => table.editorKeydown(e, rk(row), 'Name')" />
              <span v-show="!table.isEditingCell(rk(row), 'Name')">{{ table.cellValue(rk(row), 'Name', row.Name) }}</span>
            </td>

            <td>
              <mono-input v-show="table.isEditingCell(rk(row), 'Age')" size="sm" type="number"
                data-edit-cell="Age" :model-value="String(table.cellValue(rk(row), 'Age', row.Age) ?? '')"
                @change="e => table.stageCell(rk(row), 'Age', Number(e.detail.modelValue))"
                @keydown="e => table.editorKeydown(e, rk(row), 'Age')" />
              <span v-show="!table.isEditingCell(rk(row), 'Age')">{{ table.cellValue(rk(row), 'Age', row.Age) }}</span>
            </td>

            <td>
              <mono-input v-show="table.isEditingCell(rk(row), 'Role')" size="sm"
                data-edit-cell="Role" :model-value="String(table.cellValue(rk(row), 'Role', row.Role) ?? '')"
                @change="e => table.stageCell(rk(row), 'Role', e.detail.modelValue)"
                @keydown="e => table.editorKeydown(e, rk(row), 'Role')" />
              <span v-show="!table.isEditingCell(rk(row), 'Role')">{{ table.cellValue(rk(row), 'Role', row.Role) }}</span>
            </td>

            <td>
              <mono-switch v-show="table.isEditingCell(rk(row), 'Active')" size="sm"
                data-edit-cell="Active" :model-value="!!table.cellValue(rk(row), 'Active', row.Active)"
                @change="e => table.stageCell(rk(row), 'Active', e.detail.modelValue)"
                @keydown="e => table.editorKeydown(e, rk(row), 'Active')" />
              <span v-show="!table.isEditingCell(rk(row), 'Active')">{{ table.cellValue(rk(row), 'Active', row.Active) ? 'Yes' : 'No' }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-show="!rows.length && !loading" mono-table-empty>
      <div mono-empty-title>No rows</div>
    </div>

    <div v-show="status" class="example-status">{{ status }}</div>
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
}
.example-actions {
  display: flex;
  gap: 0.5rem;
}
.example-status {
  padding: 0.5rem 1rem;
  font-size: 0.78rem;
  color: var(--foreground);
  opacity: 0.8;
  border-top: 1px solid var(--border);
}
/* Mark a dirty row with COLOUR, not weight: changing font-weight re-metrics
   every glyph in the row, shifting the text a beat after you start typing. */
.example-dirty td {
  color: var(--primary);
}
</style>
