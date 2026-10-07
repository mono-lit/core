<script setup lang="ts">
import '@mono-lit/helper/ui/tag-input'
import { ref, onMounted } from 'vue'
import { monoFetchOdata } from '@mono-lit/utility/fetching'

const ds = ref<any>(null)
const tags = ref<unknown[]>([])

let fetchPeople = async () => {
  const { dataSource } = await monoFetchOdata({
    baseUrl: 'https://services.odata.org/TripPinRESTierService/(S(monohelperdocs000000001))',
    url: '/People',
    options: {
      key: 'UserName',
      select: ['UserName', 'LastName'],
      paginate: true,
      pageSize: 5,
    },
  })

  ds.value = dataSource
}

onMounted(async () => {
  await fetchPeople()
})

const change = (e: any) => {
  tags.value = e.detail.currentValue
}
</script>

<template>
  <ClientOnly>
    <div style="display: grid; gap: 1rem; width: 100%;">
      <mono-tag-input
        :data-source.prop="ds"
        :immediate.prop="true"
        load-more="scroll"
        key-value="UserName"
        display-value="LastName"
        label="People"
        placeholder="Add a person…"
        @change="change"
      ></mono-tag-input>

      <span style="font-size: 0.82rem; opacity: 0.7;">
        selected usernames: {{ tags.length ? tags.join(', ') : '—' }}
      </span>
    </div>
  </ClientOnly>
</template>
