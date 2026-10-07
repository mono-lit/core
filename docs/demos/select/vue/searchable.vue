<script setup lang="ts">
import '@mono-lit/helper/ui/select'
import { ref, onMounted } from 'vue'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

const ds = ref<any>(null)
const selected = ref<unknown>(null)

onMounted(async () => {
  // A small page size — typing queries the SERVER (debounced) so the dropdown
  // shows the full matching result set, not just the loaded page.
  const { dataSource } = await monoCreateFetcher({
    baseUrl: 'https://services.odata.org/TripPinRESTierService/(S(monohelperdocs000000001))',
    url: '/People',
  }).response({
    options: { key: 'UserName', select: ['UserName', 'FirstName', 'LastName', 'Gender'], paginate: true, pageSize: 8 },
  })

  ds.value = dataSource
})
</script>

<template>
  <ClientOnly>
    <div style="width: 100%; display: grid; gap: 0.6rem;">
      <mono-select
        :data-source.prop="ds"
        searchable
        search-value="LastName,FirstName"
        load-more="scroll"
        key-value="UserName"
        display-value="LastName"
        label="Person (searchable)"
        placeholder="Pick a person"
        search-placeholder="Search first or last name…"
        :model-value="selected"
        @change="selected = $event.detail.modelValue"
      ></mono-select>

      <div style="font-family: 'DM Mono', ui-monospace, monospace; font-size: 0.8rem; opacity: 0.7;">
        selected UserName → {{ selected ?? '—' }}
      </div>
    </div>
  </ClientOnly>
</template>
