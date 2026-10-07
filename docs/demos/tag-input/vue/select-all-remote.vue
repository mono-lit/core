<script setup lang="ts">
import '@mono-lit/helper/ui/tag-input'
import { ref, onMounted } from 'vue'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

// 830 orders, ten at a time. Ticking "All" here is the whole point of the demo:
// what is on screen is one page of a table nobody is going to scroll to the end
// of, so the row drains the source instead of selecting the ten it can see.
const PAGE_SIZE = 10

const ds = ref<any>(null)
const total = ref(0)
const selected = ref<unknown[]>([])

onMounted(async () => {
  const { dataSource } = await monoCreateFetcher({
    baseUrl: 'https://services.odata.org/V4/Northwind/Northwind.svc',
    url: '/Orders',
  }).response({
    options: {
      key: 'OrderID',
      select: ['OrderID', 'ShipName'],
      paginate: true,
      pageSize: PAGE_SIZE,
    },
  })
  ds.value = dataSource
  await dataSource.load()
  total.value = dataSource.totalCount()
})

const change = (e: any) => {
  selected.value = e.detail.currentValue ?? []
}
</script>

<template>
  <ClientOnly>
    <div style="display: grid; gap: 1rem; width: 100%">
      <mono-tag-input
        :data-source.prop="ds"
        :immediate.prop="true"
        checkable
        load-more="scroll"
        key-value="OrderID"
        display-value="ShipName"
        search-value="ShipName"
        label="Orders"
        placeholder="Pick orders…"
        :chip.prop="{ behaviour: 'inline' }"
        clearable
        @change="change"
      ></mono-tag-input>

      <span style="font-size: 0.82rem; opacity: 0.7">
        {{ selected.length }} of {{ total || '…' }} selected — type to narrow the
        list first and "All" drains only what matches.
      </span>
    </div>
  </ClientOnly>
</template>
