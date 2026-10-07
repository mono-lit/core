<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/chip'
import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/checkbox'
import { controlMonoTable } from '@mono-lit/helper'
import type { ChipColor } from '@mono-lit/helper/ui/chip'

type Row = {
  id: string
  name: string
  email: string
  area: string
  div: string
  target: number
  pct: number
  outlet: number
  status: 'aktif' | 'nonaktif' | 'cuti'
  approved: boolean
}

const SEED: Row[] = [
  { id: 'SM-001', name: 'Andi Pratama', email: 'andi@ekajaya.co.id', area: 'Jakarta Utara', div: 'Modern Trade', target: 180_000_000, pct: 92, outlet: 24, status: 'aktif', approved: true },
  { id: 'SM-002', name: 'Budi Santoso', email: 'budi@ekajaya.co.id', area: 'Jakarta Barat', div: 'E-Commerce', target: 120_000_000, pct: 64, outlet: 12, status: 'cuti', approved: true },
  { id: 'SM-003', name: 'Citra Dewi', email: 'citra@ekajaya.co.id', area: 'Surabaya', div: 'Key Account', target: 210_000_000, pct: 103, outlet: 31, status: 'aktif', approved: false },
  { id: 'SM-004', name: 'Dian Rahayu', email: 'dian@ekajaya.co.id', area: 'Medan', div: 'General Trade', target: 95_000_000, pct: 48, outlet: 9, status: 'nonaktif', approved: true },
  { id: 'SM-005', name: 'Eko Prasetyo', email: 'eko@ekajaya.co.id', area: 'Bandung Kota', div: 'Modern Trade', target: 160_000_000, pct: 78, outlet: 19, status: 'aktif', approved: false },
  { id: 'SM-006', name: 'Fira Mahdalena', email: 'fira@ekajaya.co.id', area: 'Jakarta Utara', div: 'E-Commerce', target: 140_000_000, pct: 88, outlet: 21, status: 'aktif', approved: true },
  { id: 'SM-007', name: 'Gilang Ramadhan', email: 'gilang@ekajaya.co.id', area: 'Yogyakarta', div: 'Key Account', target: 175_000_000, pct: 55, outlet: 14, status: 'cuti', approved: true },
  { id: 'SM-008', name: 'Hana Pertiwi', email: 'hana@ekajaya.co.id', area: 'Semarang', div: 'General Trade', target: 110_000_000, pct: 120, outlet: 27, status: 'aktif', approved: true },
  { id: 'SM-009', name: 'Ivan Kurniawan', email: 'ivan@ekajaya.co.id', area: 'Makassar', div: 'Modern Trade', target: 130_000_000, pct: 41, outlet: 8, status: 'nonaktif', approved: true },
  { id: 'SM-010', name: 'Joko Widodo', email: 'joko@ekajaya.co.id', area: 'Surabaya', div: 'E-Commerce', target: 200_000_000, pct: 97, outlet: 29, status: 'aktif', approved: false },
  { id: 'SM-011', name: 'Kartika Sari', email: 'kartika@ekajaya.co.id', area: 'Jakarta Barat', div: 'Key Account', target: 150_000_000, pct: 72, outlet: 17, status: 'aktif', approved: true },
  { id: 'SM-012', name: 'Lestari Ningrum', email: 'lestari@ekajaya.co.id', area: 'Medan', div: 'General Trade', target: 88_000_000, pct: 35, outlet: 6, status: 'cuti', approved: true },
  { id: 'SM-013', name: 'Maulana Yusuf', email: 'maulana@ekajaya.co.id', area: 'Bandung Kota', div: 'Modern Trade', target: 165_000_000, pct: 85, outlet: 22, status: 'aktif', approved: true },
  { id: 'SM-014', name: 'Nina Rahayu', email: 'nina@ekajaya.co.id', area: 'Jakarta Utara', div: 'E-Commerce', target: 145_000_000, pct: 59, outlet: 13, status: 'aktif', approved: false },
  { id: 'SM-015', name: 'Oscar Prasetya', email: 'oscar@ekajaya.co.id', area: 'Yogyakarta', div: 'Key Account', target: 190_000_000, pct: 108, outlet: 33, status: 'aktif', approved: true },
  { id: 'SM-016', name: 'Putri Andini', email: 'putri@ekajaya.co.id', area: 'Semarang', div: 'General Trade', target: 102_000_000, pct: 51, outlet: 11, status: 'nonaktif', approved: true },
]

const initials = (n: string) =>
  n
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

const rupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

const avatarClass = (name: string) => {
  const index = name.charCodeAt(0) % 8
  return `example-avatar-color-${index}`
}

const progressClass = (pct: number) => {
  if (pct >= 100) return 'example-progress-success'
  if (pct >= 75) return 'example-progress-primary'
  if (pct >= 50) return 'example-progress-warning'
  return 'example-progress-danger'
}

const statusColor = (s: Row['status']) =>
  s === 'aktif' ? 'success' : s === 'nonaktif' ? 'danger' : 'warning'

const statusLabel = (s: Row['status']) =>
  s === 'aktif' ? 'Aktif' : s === 'nonaktif' ? 'Non-Aktif' : 'Cuti'

const DIV_COLOR: Record<string, ChipColor> = {
  'Modern Trade': 'primary',
  'E-Commerce': 'info',
  'Key Account': 'success',
  // `mono-chip` has no `secondary` — `neutral` is its muted tone.
  'General Trade': 'neutral',
}

const data = ref<Row[]>([...SEED])

// Pass the array straight to controlMonoTable — it wraps it in an in-memory source.
const table = controlMonoTable<Row>(data.value, {
  pageSize: 8,
  searchValue: ['id', 'name', 'email', 'area'],
})

const rows = ref<Row[]>([])
const total = ref(0)
const selected = ref<Set<string>>(new Set())

const statusFilter = ref<'all' | 'aktif' | 'nonaktif' | 'cuti' | 'approve'>('all')
const divFilter = ref('')

const off = table.subscribe(() => {
  rows.value = [...table.items]
  total.value = table.totalCount
})

const counts = computed(() => ({
  all: data.value.length,
  aktif: data.value.filter((r) => r.status === 'aktif').length,
  nonaktif: data.value.filter((r) => r.status === 'nonaktif').length,
  cuti: data.value.filter((r) => r.status === 'cuti').length,
  approve: data.value.filter((r) => !r.approved && r.status === 'aktif').length,
}))

const STAT_CARDS = [
  { key: 'all', label: 'Semua' },
  { key: 'aktif', label: '● Aktif' },
  { key: 'nonaktif', label: '● Non-Aktif' },
  { key: 'cuti', label: '● Cuti' },
  { key: 'approve', label: '✅ Perlu Approval' },
] as const

const STAT_ACCENT: Record<string, string> = {
  all: '![border-top-width:3px] ![border-top-color:var(--secondary-foreground)]',
  aktif: '![border-top-width:3px] ![border-top-color:var(--success)]',
  nonaktif: '![border-top-width:3px] ![border-top-color:var(--destructive)]',
  cuti: '![border-top-width:3px] ![border-top-color:var(--warning)]',
  approve: '![border-top-width:3px] ![border-top-color:var(--info)]',
}

const PILLS = [
  { key: 'all', label: 'Semua' },
  { key: 'aktif', label: 'Aktif' },
  { key: 'nonaktif', label: 'Non-Aktif' },
  { key: 'cuti', label: 'Cuti' },
] as const

const DIVISIONS = ['Modern Trade', 'E-Commerce', 'Key Account', 'General Trade']

function applyFilter() {
  const s = statusFilter.value
  const d = divFilter.value

  if (s === 'all' && !d) {
    table.setFilter(null)
    return
  }

  table.setFilter((r: Row) => {
    const matchStatus =
      s === 'all' ||
      (s === 'approve' ? !r.approved && r.status === 'aktif' : r.status === s)

    const matchDivision = !d || r.div === d

    return matchStatus && matchDivision
  })
}

watch([statusFilter, divFilter], applyFilter)

const isSelected = (id: string) => selected.value.has(id)

function toggleRow(id: string, e: CustomEvent<{ modelValue: boolean }>) {
  const next = new Set(selected.value)

  if (e?.detail?.modelValue) {
    next.add(id)
  } else {
    next.delete(id)
  }

  selected.value = next
}

const allOnPageSelected = computed(() => {
  return rows.value.length > 0 && rows.value.every((r) => selected.value.has(r.id))
})

function toggleAll(e: CustomEvent<{ modelValue: boolean }>) {
  const next = new Set(selected.value)
  const checked = !!e?.detail?.modelValue

  rows.value.forEach((r) => {
    if (checked) {
      next.add(r.id)
    } else {
      next.delete(r.id)
    }
  })

  selected.value = next
}

function approve(row: Row) {
  data.value = data.value.map((r) =>
    r.id === row.id ? { ...r, approved: true } : r,
  )

  table.setData(data.value)
}

function remove(row: Row) {
  data.value = data.value.filter((r) => r.id !== row.id)

  const next = new Set(selected.value)
  next.delete(row.id)
  selected.value = next

  table.setData(data.value)
}

function clearSelection() {
  selected.value = new Set()
}

onMounted(() => {
  table.load()
})

onBeforeUnmount(() => {
  off()
  table.dispose()
})
</script>

<template>
  <div class="example-sales-page">
    <div class="example-page-header">
      <div>
        <div class="example-page-title">Daftar Salesman</div>
        <div class="example-page-subtitle">Kelola data, target, dan status salesman.</div>
      </div>

      <mono-button color="primary" size="sm">
        ＋ Tambah Salesman
      </mono-button>
    </div>

    <div class="example-stat-grid">
      <mono-card
        v-for="c in STAT_CARDS"
        :key="c.key"
        hoverable
        bordered
        class="example-stat-card"
        :css-class="({ root: STAT_ACCENT[c.key] })"
        @click="(statusFilter = c.key)"
      >
        <div class="example-stat-value">
          {{ counts[c.key] }}
        </div>

        <div class="example-stat-label">
          {{ c.label }}
        </div>
      </mono-card>
    </div>

    <mono-card bordered width="100%" class="example-table-card">
      <div class="example-table-toolbar">
        <mono-table-search
          :control-table.prop="table"
          placeholder="Cari nama, area, ID…"
          class="example-table-search"
        />

        <div class="example-filter-pills">
          <mono-chip
            v-for="p in PILLS"
            :key="p.key"
            size="sm"
            color="primary"
            :variant="statusFilter === p.key ? 'solid' : 'outline'"
            class="example-filter-pill"
            @click="statusFilter = p.key"
          >
            {{ p.label }}
          </mono-chip>
        </div>

        <select v-model="divFilter" mono-sel class="example-division-filter">
          <option value="">Semua Divisi</option>
          <option v-for="d in DIVISIONS" :key="d" :value="d">
            {{ d }}
          </option>
        </select>
      </div>

      <div v-if="selected.size" class="example-bulk-bar">
        <strong class="example-bulk-text">
          {{ selected.size }} dipilih
        </strong>

        <mono-button
          size="sm"
          variant="outline"
          color="secondary"
          @click="clearSelection"
        >
          ✕ Batal
        </mono-button>
      </div>

      <div mono-table-scroll>
        <table mono-table mono-wide class="example-salesman-table">
          <thead>
            <tr>
              <th mono-sticky-left class="example-col-check">
                <mono-checkbox
                  :model-value="allOnPageSelected"
                  @change="toggleAll"
                />
              </th>

              <th class="example-col-id">ID</th>
              <th class="example-col-salesman">Salesman</th>
              <th class="example-col-area">Area</th>
              <th class="example-col-division">Divisi</th>
              <th class="example-col-target">Target / Pencapaian</th>
              <th class="example-col-outlet">Outlet</th>
              <th class="example-col-status">Status</th>
              <th class="example-col-action">Aksi</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="row in rows"
              :key="row.id"
              :mono-selected="isSelected(row.id) ? '' : null"
            >
              <td mono-sticky-left class="example-cell-center">
                <mono-checkbox
                  :model-value="isSelected(row.id)"
                  @change="(e: CustomEvent<{ modelValue: boolean }>) => toggleRow(row.id, e)"
                />
              </td>

              <td class="example-cell-id">
                {{ row.id }}
              </td>

              <td>
                <div class="example-salesman-cell">
                  <span class="example-avatar" :class="avatarClass(row.name)">
                    {{ initials(row.name) }}
                  </span>

                  <span class="example-salesman-text">
                    <span class="example-salesman-name">
                      {{ row.name }}
                    </span>

                    <span class="example-salesman-email">
                      {{ row.email }}
                    </span>
                  </span>
                </div>
              </td>

              <td>{{ row.area }}</td>

              <td>
                <mono-chip size="xs" :color="DIV_COLOR[row.div]" variant="soft">
                  {{ row.div }}
                </mono-chip>
              </td>

              <td>
                <div class="example-target-text">
                  {{ rupiah(row.target) }}

                  <span class="example-target-percent" :class="progressClass(row.pct)">
                    · {{ row.pct }}%
                  </span>
                </div>

                <progress
                  class="example-target-progress"
                  :class="progressClass(row.pct)"
                  :value="Math.min(row.pct, 100)"
                  max="100"
                />
              </td>

              <td class="example-cell-center">
                🏪 <strong>{{ row.outlet }}</strong>
              </td>

              <td>
                <mono-chip size="xs" :color="statusColor(row.status)" variant="soft">
                  {{ statusLabel(row.status) }}
                </mono-chip>
              </td>

              <td>
                <div class="example-action-cell">
                  <mono-button
                    v-if="!row.approved && row.status === 'aktif'"
                    size="xs"
                    color="success"
                    variant="tonal"
                    @click="approve(row)"
                  >
                    ✅
                  </mono-button>

                  <mono-button
                    size="xs"
                    color="danger"
                    variant="tonal"
                    @click="remove(row)"
                  >
                    🗑️
                  </mono-button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-show="Number(rows.length) <= 0" mono-table-empty>
        <div mono-empty-title>Data tidak ditemukan</div>
        <div mono-empty-sub>Coba ubah filter atau kata kunci.</div>
      </div>

      <div mono-table-foot class="example-table-footer">
        <div class="example-footer-left">
          <mono-table-page-size
            :control-table.prop="table"
            label="Tampilkan"
          />

          <mono-table-info
            :control-table.prop="table"
            template="{from}–{to} dari {total}"
          />
        </div>

        <mono-table-paging :control-table.prop="table" />
      </div>
    </mono-card>
  </div>
</template>

<style scoped>
.example-sales-page {
  display: grid;
  gap: 1rem;
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.example-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  min-width: 0;
}

.example-page-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--primary);
}

.example-page-subtitle {
  font-size: 0.78rem;
  color: var(--muted-foreground);
}

.example-stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.6rem;
  min-width: 0;
}

.example-stat-card {
  --mono-card-padding: 0.7rem 1rem;
  cursor: pointer;
  min-width: 0;
}

.example-stat-value {
  font-size: 1.35rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--primary);
  line-height: 1;
}

.example-stat-label {
  font-size: 0.72rem;
  color: var(--muted-foreground);
  margin-top: 3px;
}

.example-table-card {
  --mono-card-padding: 0;
  overflow: hidden;
  min-width: 0;
  max-width: 100%;
}

.example-table-toolbar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.8rem 1rem;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--border);
  min-width: 0;
  max-width: 100%;
}

.example-table-search {
  max-width: 240px;
}

.example-filter-pills {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  min-width: 0;
}

.example-filter-pill {
  cursor: pointer;
}

.example-division-filter {
  margin-left: auto;
}

.example-bulk-bar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 1rem;
  background: color-mix(in oklab, var(--secondary-foreground) 7%, var(--card));
  border-bottom: 1px solid var(--border);
  font-size: 0.8rem;
}

.example-bulk-text {
  color: var(--secondary-foreground);
}

.example-salesman-table {
  width: max-content;
  min-width: 940px;
}

.example-col-check {
  width: 40px;
  text-align: center;
}

.example-col-id {
  width: 5.5rem;
}

.example-col-salesman {
  min-width: 16rem;
}

.example-col-area {
  width: 9rem;
}

.example-col-division {
  width: 9rem;
}

.example-col-target {
  width: 14rem;
}

.example-col-outlet {
  width: 6rem;
  text-align: center;
}

.example-col-status {
  width: 7rem;
}

.example-col-action {
  width: 9rem;
  text-align: center;
}

.example-cell-center {
  text-align: center;
}

.example-cell-id {
  font-weight: 600;
  color: var(--secondary-foreground);
  font-variant-numeric: tabular-nums;
}

.example-salesman-cell {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.example-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #fff;
  font-size: 0.66rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.example-avatar-color-0 {
  background: #2563a8;
}

.example-avatar-color-1 {
  background: #3aaa8c;
}

.example-avatar-color-2 {
  background: #ea580c;
}

.example-avatar-color-3 {
  background: #8b5cf6;
}

.example-avatar-color-4 {
  background: #0891b2;
}

.example-avatar-color-5 {
  background: #65a30d;
}

.example-avatar-color-6 {
  background: #db2777;
}

.example-avatar-color-7 {
  background: #ca8a04;
}

.example-salesman-text {
  min-width: 0;
}

.example-salesman-name {
  display: block;
  font-weight: 600;
  color: var(--foreground);
}

.example-salesman-email {
  display: block;
  font-size: 0.7rem;
  color: color-mix(in oklab, var(--muted-foreground) 80%, transparent);
}

.example-target-text {
  font-size: 0.74rem;
  font-weight: 600;
  margin-bottom: 3px;
}

.example-target-percent {
  font-weight: 700;
}

.example-target-progress {
  width: 100%;
  height: 5px;
  border: 0;
  border-radius: 3px;
  overflow: hidden;
  appearance: none;
  -webkit-appearance: none;
  background: color-mix(in oklab, var(--secondary-foreground) 16%, var(--card));
}

.example-target-progress::-webkit-progress-bar {
  background: color-mix(in oklab, var(--secondary-foreground) 16%, var(--card));
  border-radius: 3px;
}

.example-target-progress::-webkit-progress-value {
  border-radius: 3px;
}

.example-target-progress::-moz-progress-bar {
  border-radius: 3px;
}

.example-progress-success {
  color: var(--success);
}

.example-progress-primary {
  color: var(--secondary-foreground);
}

.example-progress-warning {
  color: var(--warning);
}

.example-progress-danger {
  color: var(--destructive);
}

.example-target-progress.example-progress-success::-webkit-progress-value {
  background: var(--success);
}

.example-target-progress.example-progress-primary::-webkit-progress-value {
  background: var(--secondary-foreground);
}

.example-target-progress.example-progress-warning::-webkit-progress-value {
  background: var(--warning);
}

.example-target-progress.example-progress-danger::-webkit-progress-value {
  background: var(--destructive);
}

.example-target-progress.example-progress-success::-moz-progress-bar {
  background: var(--success);
}

.example-target-progress.example-progress-primary::-moz-progress-bar {
  background: var(--secondary-foreground);
}

.example-target-progress.example-progress-warning::-moz-progress-bar {
  background: var(--warning);
}

.example-target-progress.example-progress-danger::-moz-progress-bar {
  background: var(--destructive);
}

.example-action-cell {
  display: flex;
  gap: 0.3rem;
  justify-content: center;
}

.example-table-footer {
  min-width: 0;
  max-width: 100%;
}

.example-footer-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  min-width: 0;
}

@media (max-width: 640px) {
  .example-division-filter {
    margin-left: 0;
    width: 100%;
  }

  .example-table-search {
    max-width: 100%;
  }

  .example-table-toolbar {
    align-items: stretch;
  }

  .example-filter-pills {
    width: 100%;
  }
}
</style>