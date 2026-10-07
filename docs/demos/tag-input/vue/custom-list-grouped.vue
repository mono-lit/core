<script setup lang="ts">
// `slot="list"` with GROUPING — the headers come to you in the same flat sequence as the rows.
//
// Grouping is still entirely mono's: it decides which groups exist, drops the ones whose leaves the
// search filtered away, and hands you one entry per rendered line. You only draw them — and note
// what is NOT in this file: no checkbox, no select-all, no handler, and no indentation. mono
// injects the row checkboxes AND the header's select-all, a click on a header selects every leaf
// beneath it, and each line is indented from the depth mono stamps on it.
//
// Two props turn grouping on, and BOTH are needed:
//   · `group: true`      — bucket the rows client-side (a boolean, not a field name)
//   · `displayGroup: []` — one label accessor per level; a string reads that field off a leaf row,
//                          a function computes the label. This is what actually makes it grouped.
import '@mono-lit/helper/ui/tag-input'
import { ref, onUnmounted } from 'vue'
import { controlMonoForm } from '@mono-lit/helper'

const depts = [
  { Code: 'MKT', Nama: 'Marketing', Divisi: 'Commercial', Bagian: 'Brand' },
  { Code: 'MRS', Nama: 'Market Research', Divisi: 'Commercial', Bagian: 'Brand' },
  { Code: 'TMM', Nama: 'Trade Marketing', Divisi: 'Commercial', Bagian: 'Trade' },
  { Code: 'SLS', Nama: 'Sales', Divisi: 'Commercial', Bagian: 'Trade' },
  { Code: 'MTR', Nama: 'MTI & NKA', Divisi: 'Operations', Bagian: 'Distribusi' },
  { Code: 'DSC', Nama: 'Demand Supply', Divisi: 'Operations', Bagian: 'Distribusi' },
  { Code: 'CBD', Nama: 'Community & Beauty', Divisi: 'Operations', Bagian: 'Field' },
]

const form = controlMonoForm({
  inputs: {
    DeptTujuan: {
      component: 'mono-tag-input',
      value: [],
      props: {
        label: 'Departemen Tujuan',
        placeholder: 'Pilih…',
        items: depts,
        keyValue: 'Code',
        displayValue: (d: any) => `${d.Nama} (${d.Code})`,
        group: true,
        displayGroup: ['Divisi', 'Bagian'],
        checkable: true,
        // The same prop that gives mono's own headers a select-all gives yours one.
        groupSelectAll: true,
        searchable: true,
      },
    },
  },
})

// Straight from the controller — ONE flat sequence, headers at level 0 and 1 with their leaves at
// level 2, in display order. `items()` is a plain object mono mutates in place, so `subscribe()` is
// what turns it into something Vue re-renders on.
const value = ref<string[]>([])
const rows = ref<any[]>([])

const read = () => {
  rows.value = form.items().DeptTujuan.list
  value.value = form.items().DeptTujuan.currentValue as string[]
}

read()
onUnmounted(form.subscribe(read))
</script>

<template>
  <ClientOnly>
    <div style="width: 100%; display: grid; gap: 0.6rem;">
      <mono-tag-input :control-form="form" key-form="DeptTujuan">
        <div slot="list">
          <!-- ONE FLAT LOOP branching on `type` — never a loop inside a loop. mono renders one line
               per entry, headers included, and pairs a click by counting: your Nth child is its Nth
               entry. Nesting the groups would break that count. -->
          <div v-for="e in rows" :key="e.key">
            <!-- A group header. `items` is every leaf beneath it, so the count is free. Clicking it
                 selects them all — mono's doing, not yours. -->
            <template v-if="e.type === 'group'">
              {{ e.label }}
              <span style="opacity: 0.55;">({{ e.items.length }})</span>
            </template>

            <!-- A leaf. Nothing here says how deep it sits: mono stamps the depth and its own
                 stylesheet steps the line in, the same ladder its own rows use. -->
            <template v-else>{{ e.item.Nama }} ({{ e.item.Code }})</template>
          </div>
        </div>
      </mono-tag-input>

      <div style="font-family: 'DM Mono', ui-monospace, monospace; font-size: 0.8rem; opacity: 0.7;">
        value → {{ value.length ? value.join(', ') : '—' }}
      </div>
    </div>
  </ClientOnly>
</template>
