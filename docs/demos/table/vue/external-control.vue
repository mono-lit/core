<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/chip'
import '@mono-lit/helper/ui/button'
import { controlMonoTable } from '@mono-lit/helper'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

type PersonRow = {
  UserName: string
  FirstName: string
  LastName: string
  Gender: string
}

const table = controlMonoTable<PersonRow>(null, { keyExpr: 'UserName' })

const ds = ref<any>(null)
const rows = ref<PersonRow[]>([])
const total = ref(0)
const loading = ref(false)

const off = table.subscribe(() => {
  rows.value = [...table.items]
  total.value = table.totalCount
  loading.value = table.loading
})

onMounted(async () => {
  const { dataSource } = await monoCreateFetcher({
    baseUrl: 'https://services.odata.org/TripPinRESTierService/(S(monohelperdocs000000001))',
    url: '/People',
  }).response({
    options: {
      key: 'UserName',
      select: ['UserName', 'FirstName', 'LastName', 'Gender'],
      paginate: true,
      pageSize: 8,
    },
  })

  ds.value = dataSource
  table.bind(dataSource)

  await table.load()
})

onBeforeUnmount(() => {
  off()
  table.dispose()
})

async function filterMkt() {
  if (!ds.value) return

  ds.value.filter(['LastName', 'contains', 'W'])
  ds.value.pageIndex(0)

  await ds.value.load()
  await table.reload()
}

async function clearFilter() {
  if (!ds.value) return

  ds.value.filter(null)
  ds.value.pageIndex(0)

  await ds.value.load()
  await table.reload()
}

function reload() {
  table.reload()
}
</script>

<template>
  <div class="example-demo">
    <div class="example-actions">
      <mono-button size="sm" variant="outline" @click="filterMkt">
        Filter name contains "W"
      </mono-button>

      <mono-button size="sm" variant="outline" @click="clearFilter">
        Clear filter
      </mono-button>

      <mono-button size="sm" variant="outline" @click="reload">
        Reload
      </mono-button>
    </div>

    <mono-card bordered width="100%" mono-color="info" class="example-card">
      <div mono-table-scroll>
        <table mono-table>
          <thead>
            <tr>
              <th>Gender</th>
              <th>Name</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="row in rows" :key="row.UserName">
              <td>
                <mono-chip size="xs" color="info" variant="soft">
                  {{ row.Gender }}
                </mono-chip>
              </td>

              <td>
                {{ row.FirstName }} {{ row.LastName }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!rows.length" mono-table-empty>
        <div mono-empty-title>
          {{ loading ? 'Loading…' : 'No rows' }}
        </div>
      </div>

      <div mono-table-foot>
        <mono-table-info :control-table.prop="table" />
        <mono-table-paging :control-table.prop="table" />
      </div>
    </mono-card>
  </div>
</template>

<style scoped>
.example-demo {
  display: grid;
  gap: 0.75rem;
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.example-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  min-width: 0;
  max-width: 100%;
}

.example-card {
  --mono-card-padding: 0;
  width: 100%;
  overflow: hidden;
  min-width: 0;
  max-width: 100%;
}

@media (max-width: 640px) {
  .example-actions {
    align-items: stretch;
  }

  .example-actions mono-button {
    width: 100%;
  }
}
</style>