<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/dropdown-table'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/chip'
import { controlMonoDataDropdown } from '@mono-lit/helper'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

type PersonRow = { UserName: string; FirstName: string; LastName: string; Gender: string }

// Remote OData source. Selecting rows keeps only their keys; a preset value's
// display text is resolved with store.load({ filter:[UserName,'in',[…]] }) (never byKey,
// which caches) — and the panel's mono-table-search does server-side OData search.
const dd = controlMonoDataDropdown<PersonRow>(null, {
  keyExpr: 'UserName',
  displayExpr: 'LastName',
  multiple: true,
  searchValue: ['UserName', 'FirstName', 'LastName'],
  pageSize: 8,
})

const rows = ref<PersonRow[]>([])
const off = dd.table.subscribe(() => {
  rows.value = [...dd.table.items]
})

const selected = ref<string[]>([])

onMounted(async () => {
  const { dataSource } = await monoCreateFetcher({
    baseUrl: 'https://services.odata.org/TripPinRESTierService/(S(monohelperdocs000000001))',
    url: '/People',
  }).response({
    options: { key: 'UserName', select: ['UserName', 'FirstName', 'LastName', 'Gender'], paginate: true, pageSize: 8 },
  })
  dd.bind(dataSource)
  await dd.table.load()
})

onBeforeUnmount(() => {
  off()
  dd.dispose()
})
</script>

<template>
  <div class="example-demo" style="width: 100%">
    <mono-dropdown-table :control-data-dropdown.prop="dd" label="People" placeholder="Pick people…"
      clearable multiple :max-visible="4" color="secondary" :dropdown.prop="{ width: 440, maxHeight: 300 }"
      :model-value.prop="selected" @change="selected = $event.detail.modelValue">
      <mono-table-search :control-table.prop="dd.table" slot="search" placeholder="Search username or name…" />

      <table mono-table>
        <thead>
          <tr>
            <th>
              <mono-table-th :control-table.prop="dd.table" field="Gender" caption="Gender" sort>Gender</mono-table-th>
            </th>
            <th>
              <mono-table-th :control-table.prop="dd.table" field="LastName" caption="Name" :sort.prop="{ order: 'asc' }">Name</mono-table-th>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.UserName" :data-row-key="String(r.UserName)">
            <td>
              <mono-chip size="xs" color="primary" variant="soft">{{ r.Gender }}</mono-chip>
            </td>
            <td>{{ r.FirstName }} {{ r.LastName }}</td>
          </tr>
        </tbody>
      </table>

      <mono-table-paging :control-table.prop="dd.table" slot="footer" simple />
    </mono-dropdown-table>

    <p class="example-value">Selected usernames: <strong>{{ selected.join(', ') || '—' }}</strong></p>
  </div>
</template>

<style scoped>
.example-demo {
  max-width: 440px;
}
.example-value {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--foreground);
  opacity: 0.75;
}
</style>
