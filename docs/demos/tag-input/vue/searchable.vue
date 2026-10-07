<script setup lang="ts">
import '@mono-lit/helper/ui/tag-input'
import { ref, onMounted } from 'vue'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

const ds = ref<any>(null)
const tags = ref<unknown[]>([])

onMounted(async () => {
  // `search-value` enables server search: typing runs an OData query (debounced)
  // so the dropdown shows matches from the whole dataset, then tick to add tags.
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
      <mono-tag-input
        :data-source.prop="ds"
        search-value="LastName,FirstName"
        load-more="scroll"
        checkable
        allow-custom="false"
        key-value="UserName"
        display-value="LastName"
        label="People (search the server)"
        placeholder="Type to search…"
        @change="tags = $event.detail.modelValue"
      ></mono-tag-input>

      <div style="font-family: 'DM Mono', ui-monospace, monospace; font-size: 0.8rem; opacity: 0.7;">
        selected usernames → {{ tags.length ? tags.join(', ') : '—' }}
      </div>
    </div>
  </ClientOnly>
</template>
