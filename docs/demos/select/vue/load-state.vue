<script setup lang="ts">
import '@mono-lit/helper/ui/select'
import { ref, shallowRef, watch, onMounted } from 'vue'
import { monoFetchOdata } from '@mono-lit/utility/fetching'

// The real TripPin People feed. Ticked, the request also asks for `Nickname` —
// a column People does not have — so the server answers 400 and the field shows
// the error. Untick it and press ↻: the same source reloads with a valid
// `$select` and the field works normally.
const FIELDS = ['UserName', 'FirstName', 'LastName']
const broken = ref(true)
const selectFor = (bad: boolean) => (bad ? [...FIELDS, 'Nickname'] : FIELDS)

// `shallowRef`: a deep reactive proxy around a DataSource can break devextreme.
const ds = shallowRef<any>(null)

async function bindSource() {
  const { dataSource } = await monoFetchOdata({
    baseUrl: 'https://services.odata.org/TripPinRESTierService/(S(monohelperdocs000000001))',
    url: '/People',
    options: { key: 'UserName', select: FIELDS, paginate: true, pageSize: 10 },
  })
  dataSource.select(selectFor(broken.value))
  ds.value = dataSource // binding it starts the first load
}

// ↻ reloads the SAME source, so the fix goes onto it.
watch(broken, (bad) => ds.value?.select(selectFor(bad)))

onMounted(bindSource)
</script>

<template>
  <ClientOnly>
    <div style="display: grid; gap: 1rem; width: 100%;">
      <DemoControls>
        <DemoCheck v-model="broken">Request a column that doesn't exist (<code>Nickname</code>)</DemoCheck>
        <button type="button" class="example-btn" @click="bindSource">Bind a new source</button>
      </DemoControls>

      <mono-select
        :data-source.prop="ds"
        key-value="UserName"
        display-value="LastName"
        label="Person"
        placeholder="Pick a person"
      ></mono-select>

      <mono-select
        :data-source.prop="ds"
        searchable
        key-value="UserName"
        display-value="FirstName"
        label="Person (searchable)"
        placeholder="Search a person"
        loading-text="Fetching people…"
        retry-label="Try again"
      ></mono-select>
    </div>
  </ClientOnly>
</template>

<style scoped>
.example-btn {
  padding: 0.3rem 0.7rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--card);
  color: var(--foreground);
  font-size: 0.8rem;
  cursor: pointer;
}
</style>
