<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/chip'
import '@mono-lit/helper/ui/button'
import { controlMonoTable } from '@mono-lit/helper'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'
import type { ChipColor } from '@mono-lit/helper/ui/chip'

type TableColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'

type PersonRow = {
  UserName: string
  FirstName: string
  LastName: string
  Gender: string
}

const COLORS = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'] as const

const color = ref<TableColor>('primary')

// The table's colour scale and the chip's are not the same set: `mono-chip` has
// no `secondary` (see `ChipColor`), so map that one across rather than passing a
// value chip.css would render unstyled.
const chipColor = computed<ChipColor>(() =>
  color.value === 'secondary' ? 'neutral' : color.value,
)

const table = controlMonoTable<PersonRow>(null, {
  keyExpr: 'UserName',
  searchValue: ['UserName', 'FirstName', 'LastName'],
})

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
      pageSize: 10,
    },
  })

  table.bind(dataSource)
  await table.load()
})

onBeforeUnmount(() => {
  off()
  table.dispose()
})
</script>

<template>
  <div class="example-colors">
    <div class="example-color-actions">
      <mono-button
        v-for="c in COLORS"
        :key="c"
        size="sm"
        :variant="c === color ? 'solid' : 'outline'"
        :color="c"
        @click="color = c"
      >
        {{ c }}
      </mono-button>
    </div>

    <mono-card
      bordered
      width="100%"
      class="example-card"
      :mono-color="color === 'primary' ? null : color"
    >
      <div class="example-toolbar">
        <strong class="example-title">
          People
        </strong>

        <mono-table-search
          :control-table.prop="table"
          placeholder="Search username or name…"
        />
      </div>

      <div mono-table-scroll>
        <table mono-table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Gender</th>
              <th>Name</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="row in rows" :key="row.UserName">
              <td>{{ row.UserName }}</td>

              <td>
                <mono-chip size="xs" :color="chipColor" variant="soft">
                  {{ row.Gender }}
                </mono-chip>
              </td>

              <td>{{ row.FirstName }} {{ row.LastName }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!rows.length" mono-table-empty>
        <div mono-empty-title>
          {{ loading ? 'Loading…' : 'No people found' }}
        </div>

        <div v-if="!loading" mono-empty-sub>
          Try a different search.
        </div>
      </div>

      <div mono-table-foot>
        <div class="example-footer-left">
          <mono-table-page-size
            :control-table.prop="table"
            label="Rows:"
          />

          <mono-table-info :control-table.prop="table" />
        </div>

        <mono-table-paging :control-table.prop="table" />
      </div>
    </mono-card>
  </div>
</template>

<style scoped>
.example-colors {
  display: grid;
  gap: 0.75rem;
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.example-color-actions {
  display: flex;
  gap: 0.4rem;
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

.example-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.72rem 1rem;
  flex-wrap: wrap;
  min-width: 0;
  max-width: 100%;
}

.example-title {
  font-size: 0.9rem;
  color: var(--foreground);
}

.example-footer-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  min-width: 0;
}

@media (max-width: 640px) {
  .example-toolbar {
    align-items: stretch;
  }

  .example-toolbar mono-table-search {
    max-width: 100%;
  }

  .example-color-actions mono-button {
    width: 100%;
  }
}
</style>