<script setup>
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import { controlMonoTable } from '@mono-lit/helper'

// Rows with NESTED (Job.Name) and COLLECTION (Contacts[]) data. A field / searchValue
// entry can be a path: dot for nested, [n] for index, [*] for "any element".
const data = ref([
  { Id: 1, Name: 'Ada Lovelace', Job: { Name: 'Analyst' },  Contacts: [{ Name: 'Byron', Kind: 'kin' }, { Name: 'Babbage', Kind: 'peer' }] },
  { Id: 2, Name: 'Alan Turing',  Job: { Name: 'Engineer' }, Contacts: [{ Name: 'Church', Kind: 'peer' }] },
  { Id: 3, Name: 'Grace Hopper', Job: { Name: 'Admiral' },  Contacts: [{ Name: 'Mauchly', Kind: 'peer' }, { Name: 'Eckert', Kind: 'peer' }] },
  { Id: 4, Name: 'Katherine J.', Job: { Name: 'Analyst' },  Contacts: [{ Name: 'Goble', Kind: 'kin' }] },
  { Id: 5, Name: 'Edsger Dijkstra', Job: { Name: 'Engineer' }, Contacts: [{ Name: 'Dahl', Kind: 'peer' }] },
])

// searchValue mixes a plain key, a nested path, and a WILDCARD collection path —
// all resolved client-side (this is an array source).
const state = ref({})

const table = controlMonoTable(data.value, {
  keyExpr: 'Id',
  pageSize: 8,
  searchValue: ['Name', 'Job.Name', 'Contacts.[*].Name'],
  state,
  // A path expression works as a `field` here exactly as it does on the element.
  props: {
    th: [
      { field: 'Id', caption: 'ID', sort: true },
      { field: 'Name', caption: 'Name', sort: { order: 'asc' } },
      { field: 'Job.Name', caption: 'Job', sort: true, headerFilter: true },
      { field: 'Contacts.[*].Name', caption: 'Contacts', headerFilter: true },
    ],
  },
})

const rows = ref([])
const off = table.subscribe(() => { rows.value = [...table.items] })
table.load()

const contactNames = (row) => (row.Contacts || []).map((c) => c.Name).join(', ')

onBeforeUnmount(() => { off(); table.dispose() })
</script>

<template>
  <mono-card bordered width="100%" style="--mono-card-padding: 0; overflow: hidden;">
    <div class="example-toolbar">
      <div class="example-hint">
        Search runs over <code>['Name', 'Job.Name', 'Contacts.[*].Name']</code> — try
        <strong>Analyst</strong> (nested job), <strong>Babbage</strong> (a wildcard contact),
        or <strong>peer</strong> won't match (only Name is searched inside contacts). Sort /
        header-filter the <strong>Job.Name</strong> column too.
      </div>
      <mono-table-search :control-table.prop="table" placeholder="Search nested + collection…" />
    </div>

    <div mono-table-scroll>
      <table mono-table>
        <thead>
          <tr>
            <th v-for="c in state.th" :key="c.field">
              <mono-table-th :control-table.prop="table" :field="c.field" />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.Id">
            <td>{{ row.Id }}</td>
            <td>{{ row.Name }}</td>
            <td>{{ row.Job?.Name }}</td>
            <td>{{ contactNames(row) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div mono-table-foot>
      <mono-table-info :control-table.prop="table" />
      <mono-table-paging :control-table.prop="table" />
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
</style>
