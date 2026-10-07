<script setup lang="ts">
import { ref } from 'vue'
import '@mono-lit/helper/ui/table'

type Dept = { Id: number; Code: string; Name: string; Head: string }

const core = ref<Dept[]>([
  { Id: 19, Code: 'MKT', Name: 'Marketing', Head: 'Rina' },
  { Id: 16, Code: 'MPE', Name: 'Marketplace', Head: 'Dimas' },
  { Id: 21, Code: 'MRS', Name: 'Market Research', Head: 'Ayu' },
  { Id: 25, Code: 'SLS', Name: 'Sales', Head: 'Bagus' },
])

const support = ref<Dept[]>([
  { Id: 22, Code: 'TMM', Name: 'Trade Marketing', Head: 'Sari' },
  { Id: 31, Code: 'FIN', Name: 'Finance', Head: 'Nadia' },
  { Id: 34, Code: 'HRD', Name: 'People', Head: 'Yoga' },
  { Id: 38, Code: 'ENG', Name: 'Engineering', Head: 'Prita' },
])

// Zebra off / table see-through — both are one token, applied on any ancestor.
const striped = ref(true)
const solid = ref(true)
</script>

<template>
  <!-- Striping needs no component and no row classes: `.mono-table` alternates
       on its own. Rows that are not records opt out with `data-mono-stripe-skip`
       so they neither take a stripe nor shift the alternation below them. -->
  <div style="width: 100%; box-sizing: border-box">
    <div class="example-toolbar">
      <label class="example-toggle">
        <input v-model="striped" type="checkbox" />
        <span>Striped</span>
      </label>
      <label class="example-toggle">
        <input v-model="solid" type="checkbox" />
        <span>Opaque rows</span>
      </label>
    </div>

    <div
      class="example-card"
      :style="{
        '--mono-table-zebra': striped ? undefined : 'var(--card)',
        '--mono-table-surface': solid ? undefined : 'transparent',
      }"
    >
      <div mono-table-scroll class="example-scroll">
        <table mono-table>
          <thead>
            <tr>
              <th>Id</th>
              <th>Code</th>
              <th>Department</th>
              <th>Head</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in core" :key="row.Id">
              <td>{{ row.Id }}</td>
              <td>{{ row.Code }}</td>
              <td>{{ row.Name }}</td>
              <td>{{ row.Head }}</td>
            </tr>

            <tr data-mono-stripe-skip class="example-sep">
              <td colspan="4">Support functions</td>
            </tr>

            <tr v-for="row in support" :key="row.Id">
              <td>{{ row.Id }}</td>
              <td>{{ row.Code }}</td>
              <td>{{ row.Name }}</td>
              <td>{{ row.Head }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.example-toolbar {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}
.example-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: var(--foreground);
  cursor: pointer;
}
.example-card {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
/* Deliberately NO background here: the table paints its own rows, so striping
   has to read correctly without a card behind it. Untick "Opaque rows" to see
   what it looked like before — the page shows through every other row. */
.example-scroll {
  width: 100%;
}
.example-sep :deep(td),
.example-sep td {
  background: var(--muted);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}
</style>
