<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/switch'
import '@mono-lit/helper/ui/button'
import { controlMonoTable } from '@mono-lit/helper'
import { initMono } from '@mono-lit/utility/runtime'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

// Same editing UX as the array demo, but bound to a DataSource (the writable
// IndexedDB mock). `apply()` updates the loaded page OPTIMISTICALLY — mutates it in
// place + store.push, adjusts totalCount — with no reload. Use it right after your
// own change API (POST/PUT/DELETE) succeeds so the grid reflects the persisted row.
// `editableTrigger: 'double-click'` keeps single clicks free for the row's own
// Edit / Delete buttons; the grid ignores clicks on controls either way.
const table = controlMonoTable(null, { keyExpr: 'Id', pageSize: 10, editableTrigger: 'double-click' })

const rows = ref([])
const pending = ref([])
const total = ref(0)
const off = table.subscribe(() => {
  rows.value = [...table.items]
  pending.value = [...table.pendingData]
  total.value = table.totalCount
})

const rk = (row) => table.rowKey(row)
const isNew = (row) => row._Type === 'Editable'
const sync = () => {
  rows.value = [...table.items]
  pending.value = [...table.pendingData]
  total.value = table.totalCount
}

// Overlay staged edits/deletes onto the display until Apply commits them.
const editPatch = computed(() => {
  const m = new Map()
  for (const o of pending.value) if (o.op === 'edit') m.set(String(o.key), o.row)
  return m
})
const deletedKeys = computed(
  () => new Set(pending.value.filter((o) => o.op === 'delete').map((o) => String(o.key))),
)
const displayRows = computed(() =>
  rows.value
    .filter((r) => isNew(r) || !deletedKeys.value.has(String(r.Id)))
    .map((r) => {
      if (isNew(r)) return r
      const patch = editPatch.value.get(String(r.Id))
      return patch ? { ...r, ...patch } : r
    }),
)

// --- Add ------------------------------------------------------------------
let nextId = 100
function addInline() {
  table.form({ key: 'Id', showForm: true }).add()
  const row = table.items[0]
  if (row?._Type === 'Editable') {
    row.Id = nextId++
    row.Role = 'New'
  }
  sync()
}

// --- Edit an existing row inline -----------------------------------------
function beginEdit(row) {
  table.beginEditRow(rk(row))
}
function saveEdit(row) {
  const change = table.changes().find((c) => c.rowKey === rk(row))
  if (change && Object.keys(change.patch).length) {
    table.form({ key: 'Id' }).edit(row.Id, change.patch)
  }
  table.discardChanges()
  table.cancelEdit()
  sync()
}
function cancelRowEdit() {
  table.discardChanges()
  table.cancelEdit()
  sync()
}

// --- Delete / Revert ------------------------------------------------------
function stageDelete(row) {
  table.form({ key: 'Id' }).delete(row.Id)
  sync()
}
function revertRow(row) {
  table.form().revert(table.rowKey(row))
  sync()
}

// --- Apply / Discard ------------------------------------------------------
async function apply() {
  await table.form().apply()
  sync()
}
function discard() {
  table.form().discardAll()
  sync()
}

const hasPending = computed(() => pending.value.length > 0)
const opLabel = (o) =>
  o.op === 'add'
    ? `add: ${o.rows.map((r) => r.Id).join(', ')}`
    : o.op === 'edit'
      ? `edit ${o.key}: ${JSON.stringify(o.row)}`
      : `delete ${o.key}`

onMounted(async () => {
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

onBeforeUnmount(() => { off(); table.dispose() })
</script>

<template>
  <mono-card bordered width="100%" style="--mono-card-padding: 0; overflow: hidden;">
    <div class="example-toolbar">
      <div class="example-hint">
        DataSource-backed. <strong>Add / Edit / Delete</strong> stage into
        <code>table.pendingData</code>; <strong>Apply</strong> reflects them in the
        grid optimistically (no reload). Row count: {{ total }}.
      </div>
      <div class="example-form">
        <mono-button size="sm" color="primary" :disabled="table.editingKey != null" @click="addInline">Add row (inline)</mono-button>
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
            <th><mono-table-th :control-table.prop="table" field="Id" caption="ID" sort :width="70">ID</mono-table-th></th>
            <th><mono-table-th :control-table.prop="table" field="Name" caption="Name" :sort.prop="{ order: 'asc' }" :editable="true" width="14rem">Name</mono-table-th></th>
            <th><mono-table-th :control-table.prop="table" field="Age" caption="Age" sort :editable="true" :width="90">Age</mono-table-th></th>
            <th><mono-table-th :control-table.prop="table" field="Role" caption="Role" sort :editable="true"  width="10rem">Role</mono-table-th></th>
            <th><mono-table-th :control-table.prop="table" field="Active" caption="Active" :editable="true" :width="110">Active</mono-table-th></th>
            <!-- Pinned right: the row actions stay reachable however far the grid is
                 scrolled. The class goes on the <th> AND every body <td>. -->
            <th mono-sticky-right style="width: 11rem">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in displayRows" :key="rk(row)" :data-row-key="rk(row)"
            :mono-editing="table.isEditingRow(rk(row)) ? '' : null" :class="{ 'example-new': isNew(row) }">
            <td>{{ row.Id }}</td>

            <!-- Name -->
            <td>
              <mono-input v-show="table.isEditingCell(rk(row), 'Name')" size="sm" data-edit-cell="Name"
                :model-value="String(table.cellValue(rk(row), 'Name', row.Name) ?? '')"
                @change="e => table.stageCell(rk(row), 'Name', e.detail.modelValue)"
                @keydown="e => table.editorKeydown(e, rk(row), 'Name')" />
              <span v-show="!table.isEditingCell(rk(row), 'Name')">{{ row.Name || '—' }}</span>
            </td>

            <!-- Age -->
            <td>
              <mono-input v-show="table.isEditingCell(rk(row), 'Age')" size="sm" type="number" data-edit-cell="Age"
                :model-value="String(table.cellValue(rk(row), 'Age', row.Age) ?? '')"
                @change="e => table.stageCell(rk(row), 'Age', Number(e.detail.modelValue))"
                @keydown="e => table.editorKeydown(e, rk(row), 'Age')" />
              <span v-show="!table.isEditingCell(rk(row), 'Age')">{{ row.Age }}</span>
            </td>

            <!-- Role -->
            <td>
              <mono-input v-show="table.isEditingCell(rk(row), 'Role')" size="sm" data-edit-cell="Role"
                :model-value="String(table.cellValue(rk(row), 'Role', row.Role) ?? '')"
                @change="e => table.stageCell(rk(row), 'Role', e.detail.modelValue)"
                @keydown="e => table.editorKeydown(e, rk(row), 'Role')" />
              <span v-show="!table.isEditingCell(rk(row), 'Role')">{{ row.Role || '—' }}</span>
            </td>

            <!-- Active -->
            <td>
              <mono-switch v-show="table.isEditingCell(rk(row), 'Active')" size="sm" data-edit-cell="Active"
                :model-value="!!table.cellValue(rk(row), 'Active', row.Active)"
                @change="e => table.stageCell(rk(row), 'Active', e.detail.modelValue)"
                @keydown="e => table.editorKeydown(e, rk(row), 'Active')" />
              <span v-show="!table.isEditingCell(rk(row), 'Active')">{{ row.Active ? 'Yes' : 'No' }}</span>
            </td>

            <td mono-sticky-right class="example-row-actions">
              <template v-if="isNew(row)">
                <mono-button size="xs" variant="tonal" color="warning" @click="revertRow(row)">Revert</mono-button>
              </template>
              <template v-else-if="table.isEditingRow(rk(row))">
                <mono-button size="xs" color="primary" @click="saveEdit(row)">Save</mono-button>
                <mono-button size="xs" variant="tonal" @click="cancelRowEdit">Cancel</mono-button>
              </template>
              <template v-else>
                <mono-button size="xs" variant="tonal" :disabled="table.editingKey != null" @click="beginEdit(row)">Edit</mono-button>
                <mono-button size="xs" variant="tonal" color="danger" :disabled="table.editingKey != null" @click="stageDelete(row)">Delete</mono-button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="example-apply">
      <span v-show="hasPending" class="example-pending">{{ pending.length }} staged op(s)</span>
      <mono-button size="sm" variant="outline" color="neutral" :disabled="!hasPending" @click="discard">Discard</mono-button>
      <mono-button size="sm" color="primary" :disabled="!hasPending" @click="apply">Apply</mono-button>
    </div>

    <div class="example-refs">
      <div class="example-refs-title">table.pendingData (staged, not yet applied)</div>
      <pre class="example-pre">{{ pending.length ? pending.map(opLabel) : '—' }}</pre>
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
  max-width: 30rem;
}
.example-form {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
/* The action cell is PINNED (`mono-table-sticky-right`), so it has to stay a
   real table-cell — `display: flex` here would take it out of the row's layout
   and break the sticky offset. Space the buttons with a margin instead, and let
   `nowrap` keep them on one line. */
.example-row-actions {
  white-space: nowrap;
}

.example-row-actions mono-button + mono-button {
  margin-left: 0.35rem;
}
.example-new td {
  background: var(--muted);
}
/* A sticky cell paints its own background, so the staged-row tint has to be
   restated for it or the stripe stops at the pinned column. */
.example-new td.mono-table-sticky-right {
  background: var(--muted);
}
/* Editors fill their column and flatten into the cell automatically — the
   library detects a mono form control in a <td>. No local CSS needed. */
.example-apply {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-top: 1px solid var(--border);
}
.example-pending {
  font-size: 0.74rem;
  opacity: 0.7;
  margin-right: auto;
}
.example-refs {
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
  max-height: 10rem;
  overflow: auto;
  background: var(--muted);
  border-radius: 0.5rem;
  padding: 0.5rem 0.65rem;
  white-space: pre-wrap;
}
</style>
