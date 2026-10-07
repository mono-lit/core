<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/chip'
import { controlMonoTable } from '@mono-lit/helper'

type Row = {
  id: string
  name: string
  email: string
  dept: string
  role: string
  location: string
  salary: number
  status: 'active' | 'leave' | 'inactive'
}

const NAMES = ['Andi Pratama', 'Budi Santoso', 'Citra Dewi', 'Dian Rahayu', 'Eko Prasetyo', 'Fira Mahdalena', 'Gilang Ramadhan', 'Hana Pertiwi', 'Ivan Kurniawan', 'Joko Widodo', 'Kartika Sari', 'Lestari Ningrum', 'Maulana Yusuf', 'Nina Rahayu', 'Oscar Prasetya', 'Putri Andini']
const DEPTS = ['Sales', 'Engineering', 'Finance', 'Operations']
const ROLES = ['Manager', 'Staff', 'Supervisor', 'Lead']
const LOCS = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Makassar']
const STATUSES = ['active', 'leave', 'inactive'] as const

const data: Row[] = NAMES.map((name, i) => ({
  id: 'EMP-' + String(i + 1).padStart(3, '0'),
  name,
  email: name.split(' ')[0].toLowerCase() + '@ekajaya.co.id',
  dept: DEPTS[i % DEPTS.length],
  role: ROLES[i % ROLES.length],
  location: LOCS[i % LOCS.length],
  salary: (8 + (i % 12)) * 1_000_000,
  status: STATUSES[i % STATUSES.length],
}))

const table = controlMonoTable<Row>(data, { pageSize: 8, searchValue: ['id', 'name', 'email'] })

const rows = ref<Row[]>([])
const off = table.subscribe(() => {
  rows.value = [...table.items]
})

const rupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID')
const statusColor = (s: Row['status']) =>
  s === 'active' ? 'success' : s === 'inactive' ? 'danger' : 'warning'
const statusLabel = (s: Row['status']) =>
  s === 'active' ? 'Active' : s === 'inactive' ? 'Inactive' : 'On leave'

onMounted(() => {
  table.load()
})

onBeforeUnmount(() => {
  off()
  table.dispose()
})
</script>

<template>
  <mono-card bordered width="100%" class="example-fixed-card">
    <div class="example-fixed-toolbar">
      <strong class="example-fixed-title">Employees</strong>
      <mono-table-search :control-table.prop="table" placeholder="Search id, name, email…" />
    </div>

    <div mono-table-scroll>
      <table mono-table mono-fixed class="example-fixed-table">
        <thead>
          <tr>
            <th mono-sticky-left class="example-col-name">
              <mono-table-sort :control-table.prop="table" field="name">Name</mono-table-sort>
            </th>
            <th mono-sticky-left class="example-col-id">
              <mono-table-sort :control-table.prop="table" field="id">ID</mono-table-sort>
            </th>
            <th class="example-col-email">Email</th>
            <th class="example-col-dept"><mono-table-sort :control-table.prop="table" field="dept">Department</mono-table-sort></th>
            <th class="example-col-role">Role</th>
            <th class="example-col-location"><mono-table-sort :control-table.prop="table" field="location">Location</mono-table-sort></th>
            <th class="example-col-salary"><mono-table-sort :control-table.prop="table" field="salary">Salary</mono-table-sort></th>
            <th mono-sticky-right class="example-col-status">
              <mono-table-sort :control-table.prop="table" field="status">Status</mono-table-sort>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td mono-sticky-left class="example-cell-name">{{ row.name }}</td>
            <td mono-sticky-left class="example-col-id">{{ row.id }}</td>
            <td>{{ row.email }}</td>
            <td>{{ row.dept }}</td>
            <td>{{ row.role }}</td>
            <td>{{ row.location }}</td>
            <td>{{ rupiah(row.salary) }}</td>
            <td mono-sticky-right class="example-cell-status">
              <mono-chip size="xs" :color="statusColor(row.status)" variant="soft">
                {{ statusLabel(row.status) }}
              </mono-chip>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div mono-table-foot>
      <mono-table-info :control-table.prop="table" />
      <mono-table-paging :control-table.prop="table" />
    </div>
  </mono-card>
</template>

<style scoped>
.example-fixed-card {
  --mono-card-padding: 0;
  width: 100%;
  overflow: hidden;
}

.example-fixed-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.72rem 1rem;
  flex-wrap: wrap;
}

.example-fixed-title {
  font-size: 0.9rem;
  color: var(--foreground);
}

.example-fixed-table {
  width: 82rem;
}

.example-col-name {
  width: 12rem;
}

/* second pinned-left column: offset by the first column's width */
.example-col-id {
  width: 7rem;
  --mono-table-sticky-left: 12rem;
}

.example-col-email {
  width: 15rem;
}

.example-col-dept {
  width: 10rem;
}

.example-col-role {
  width: 9rem;
}

.example-col-location {
  width: 10rem;
}

.example-col-salary {
  width: 10rem;
}

.example-col-status {
  width: 9rem;
}

.example-cell-name {
  font-weight: 600;
  color: var(--foreground);
}

.example-cell-status {
  text-align: center;
}

@media (max-width: 640px) {
  .example-fixed-toolbar {
    align-items: stretch;
  }

  .example-fixed-toolbar mono-table-search {
    max-width: 100%;
  }
}
</style>
