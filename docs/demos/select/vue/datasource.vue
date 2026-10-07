<script setup lang="ts">
import '@mono-lit/helper/ui/select'
import { ref, onMounted } from 'vue'
import { monoFetchOdata } from '@mono-lit/utility/fetching'

const ds = ref<any>(null)
const current = ref<unknown>(null)

let fetchPeople = async () => {
  const { dataSource } = await monoFetchOdata({
    baseUrl: 'https://services.odata.org/TripPinRESTierService/(S(monohelperdocs000000001))',
    url: '/People',
    options: {
      key: 'UserName',
      select: ['UserName', 'FirstName', 'LastName', 'Gender'],
      paginate: true,
      pageSize: 5,
    },
  })

  ds.value = dataSource

}

onMounted(async () => {
  await fetchPeople()
})

// Filter the source externally — the bound mono-select updates via the
// DataSource's "changed" event, no re-binding needed.
const reload = async () => {
  ds.value?.filter([
    ["contains(LastName, 'W')"],
    'or',
    ["contains(FirstName, 'A')"]
  ])
  await ds.value?.load()
}

const change = (e: any) => {
  current.value = e.detail.currentValue
}
</script>

<template>
  <ClientOnly>
    <div style="display: grid; gap: 1rem; width: 100%;">
      <mono-select :data-source.prop="ds" load-more="scroll" key-value="UserName" display-value="LastName" label="Person"
        placeholder="Pick a person" @change="change"></mono-select>

      <div style="display: flex; gap: 0.75rem; align-items: center; font-size: 0.82rem;">
        <button type="button" @click="reload()"
          style="padding: 0.35rem 0.7rem; border: 1px solid var(--theme-border, #d0e4f0); border-radius: 6px; background: var(--card); color: var(--foreground); cursor: pointer;">
          Filter for "W" in last name or "A" in first name
        </button>
        <span style="opacity: 0.7;">selected: {{ current ?? '—' }}</span>
      </div>
    </div>
  </ClientOnly>
</template>
