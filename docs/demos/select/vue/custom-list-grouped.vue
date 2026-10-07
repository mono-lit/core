<script setup lang="ts">
// `slot="list"` with GROUPING — the headers come to you in the same flat sequence as the rows.
//
// Grouping is still entirely mono's: it decides which groups exist, drops the ones whose leaves the
// search filtered away, and hands you one entry per rendered line. You only draw them — and note
// what is NOT in this file: no state bindings, no handlers, no indentation. mono stamps the
// selected and keyboard-cursor states onto your lines, owns every click, and steps each header in
// from the depth it stamps, on the same ladder its own headers use.
//
// Two props turn grouping on, and BOTH are needed:
//   · `group: true`      — bucket the rows client-side (a boolean, not a field name)
//   · `displayGroup: []` — one label accessor per level; a string reads that field off a leaf row,
//                          a function computes the label. This is what actually makes it grouped.
import '@mono-lit/helper/ui/select'
import { ref, onUnmounted } from 'vue'
import { controlMonoForm } from '@mono-lit/helper'

const depts = [
  { Code: 'MKT', Nama: 'Marketing', Divisi: 'Commercial', Bagian: 'Brand', _headcount: 12 },
  { Code: 'MRS', Nama: 'Market Research', Divisi: 'Commercial', Bagian: 'Brand', _headcount: 4 },
  { Code: 'TMM', Nama: 'Trade Marketing', Divisi: 'Commercial', Bagian: 'Trade', _headcount: 9 },
  { Code: 'SLS', Nama: 'Sales', Divisi: 'Commercial', Bagian: 'Trade', _headcount: 31 },
  { Code: 'MTR', Nama: 'MTI & NKA', Divisi: 'Operations', Bagian: 'Distribusi', _headcount: 7 },
  { Code: 'DSC', Nama: 'Demand Supply', Divisi: 'Operations', Bagian: 'Distribusi', _headcount: 15 },
  { Code: 'CBD', Nama: 'Community & Beauty', Divisi: 'Operations', Bagian: 'Field', _headcount: 6 },
]

const form = controlMonoForm({
  inputs: {
    Dept: {
      component: 'mono-select',
      value: '',
      props: {
        label: 'Departemen',
        placeholder: 'Pilih…',
        items: depts,
        keyValue: 'Code',
        displayValue: (d: any) => `${d.Nama} (${d.Code})`,
        group: true,
        displayGroup: ['Divisi', 'Bagian'],
        searchable: true,
      },
    },
  },
})

// Straight from the controller — ONE flat sequence, headers at level 0 and 1 with their leaves at
// level 2, in display order. `items()` is a plain object mono mutates in place, so `subscribe()` is
// what turns it into something Vue re-renders on.
const value = ref<string>('')
const rows = ref<any[]>([])

const read = () => {
  rows.value = form.items().Dept.list
  value.value = form.items().Dept.currentValue as string
}

read()
onUnmounted(form.subscribe(read))

// A group's total, from `items` — every leaf below the header, so a level-0 header sums its whole
// subtree without you walking the list yourself.
const headcount = (e: any) =>
  (e.items ?? []).reduce((sum: number, i: any) => sum + (i._headcount ?? 0), 0)
</script>

<template>
  <ClientOnly>
    <div style="width: 100%; display: grid; gap: 0.6rem;">
      <mono-select :control-form="form" key-form="Dept">
        <div slot="list">
          <!-- ONE FLAT LOOP branching on `type` — never a loop inside a loop. mono renders one line
               per entry, headers included, and pairs a click by counting: your Nth child is its Nth
               entry. Nesting the groups would break that count. -->
          <div v-for="e in rows" :key="e.key">
            <!-- A group header. `items` is every leaf beneath it, so the rollup is free. -->
            <template v-if="e.type === 'group'">
              {{ e.label }}
              <span style="opacity: 0.55;">({{ e.items.length }} dept · {{ headcount(e) }} org)</span>
            </template>

            <!-- A leaf. Nothing here says how deep it sits: a select indents its headers and not
                 its options, and a slotted line follows that same rule without asking. -->
            <template v-else>
              <span class="example-list-name">{{ e.item.Nama }}</span>
              <span class="example-list-badge">{{ e.item._headcount }} org</span>
            </template>
          </div>
        </div>
      </mono-select>

      <div style="font-family: 'DM Mono', ui-monospace, monospace; font-size: 0.8rem; opacity: 0.7;">
        value → {{ value || '—' }}
      </div>
    </div>
  </ClientOnly>
</template>

<style scoped>
.example-list-name {
    flex: 1 1 auto;
    min-width: 0;
}

.example-list-badge {
    flex: 0 0 auto;
    padding: 0.05rem 0.4rem;
    border-radius: 999px;
    background: var(--theme-surface-soft);
    border: 1px solid var(--theme-border);
    font-size: 0.68rem;
    opacity: 0.75;
}
</style>
