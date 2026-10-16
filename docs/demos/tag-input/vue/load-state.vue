<script setup lang="ts">
import '@mono-lit/helper/ui/tag-input'
import { ref, shallowRef, watch, onMounted } from 'vue'
import { monoFetchOdata } from '@mono-lit/utility/fetching'

// The real TripPin Airports feed. Ticked, the request also asks for `Altitude` —
// a column Airports does not have — so the server answers 400 and the field
// shows the error. Untick it and press ↻: the same source reloads with a valid
// `$select` and the field works normally.
const FIELDS = ['IcaoCode', 'Name']
const broken = ref(true)
const selectFor = (bad: boolean) => (bad ? [...FIELDS, 'Altitude'] : FIELDS)

// `shallowRef`: a deep reactive proxy around a DataSource can break devextreme.
const ds = shallowRef<any>(null)

async function bindSource() {
  const { dataSource } = await monoFetchOdata({
    baseUrl: 'https://services.odata.org/TripPinRESTierService/(S(monohelperdocs000000001))',
    url: '/Airports',
    options: { key: 'IcaoCode', select: FIELDS, paginate: true, pageSize: 10 },
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
        <DemoCheck v-model="broken">Request a column that doesn't exist (<code>Altitude</code>)</DemoCheck>
        <button type="button" class="example-btn" @click="bindSource">Bind a new source</button>
      </DemoControls>

      <mono-tag-input
        :data-source.prop="ds"
        key-value="IcaoCode"
        display-value="Name"
        label="Airports"
        placeholder="Pick airports"
      ></mono-tag-input>
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
