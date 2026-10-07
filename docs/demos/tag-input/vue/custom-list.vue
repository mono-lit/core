<script setup lang="ts">
// `slot="list"` — you render the option rows, mono keeps the panel and the behaviour.
//
// The slot is for MARKUP. Nothing in the template below touches the value: mono injects its own
// checkbox into each line, paints the selected and keyboard-cursor states, and owns every click —
// so a line you render is indistinguishable from one mono renders itself.
//
// REQUIRES `controlMonoForm`. The rows you loop are not the array you passed in: they are the
// control's RESOLVED list, after the search box and after a DataSource has loaded. That list only
// exists inside the element, so it is reported back up onto `form.items()[key].list`.
//
// A flat list here; grouping has its own demo below.
import '@mono-lit/helper/ui/tag-input'
import { ref, onUnmounted } from 'vue'
import { controlMonoForm } from '@mono-lit/helper'

// `_owners` is the extra fact this demo exists for: it has no place in `display-value`, which is a
// plain string, and Lit escapes markup — so before this slot there was no way to hang an icon and
// a tooltip off one option.
const depts = [
  { Code: 'MKT', Nama: 'Marketing', _owners: ['Kidung Jagad Wening'] },
  { Code: 'MRS', Nama: 'Market Research' },
  { Code: 'TMM', Nama: 'Trade Marketing', _owners: ['Sekar Ayu', 'Bagas P.'] },
  { Code: 'SLS', Nama: 'Sales' },
  { Code: 'MTR', Nama: 'MTI & NKA' },
  { Code: 'DSC', Nama: 'Demand Supply Customer Operation' },
  { Code: 'CBD', Nama: 'Community Demand & Beauty' },
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
        // Still the prop that decides whether rows carry a checkbox — for mono's own rows and for
        // the ones you render here alike.
        checkable: true,
        searchable: true,
      },
    },
  },
})

// Straight from the controller. `items()` is a plain object mono mutates in place — it takes no
// framework dependency — so `subscribe()` is what turns it into something Vue re-renders on. Seed
// it once for the first paint; `subscribe` returns its own unsubscribe, which `onUnmounted` takes.
const value = ref<string[]>([])
const rows = ref<any[]>([])

const read = () => {
  rows.value = form.items().DeptTujuan.list
  value.value = form.items().DeptTujuan.currentValue as string[]
}

read()
onUnmounted(form.subscribe(read))

const ownersHint = (item: any) =>
  `Dari Opsi "Activity" Departemen ini memiliki hak untuk ikut ke dalam Big Project:\n${item._owners.join(', ')}`
</script>

<template>
  <ClientOnly>
    <div style="width: 100%; display: grid; gap: 0.6rem;">
      <mono-tag-input :control-form="form" key-form="DeptTujuan">
        <!-- ONE wrapper holding the loop. mono places this as the list body and never reaches
             inside it — your nodes stay where Vue put them, which is what keeps `v-for` safe. -->
        <div slot="list">
          <!-- ONE element per entry, in mono's order. That is the whole pairing rule: a click is
               traced back to its item by counting, so your Nth child is its Nth row. -->
          <div v-for="e in rows" :key="e.key">
            <span class="example-list-name">{{ e.item.Nama }} ({{ e.item.Code }})</span>

            <!-- The reason this slot exists: markup per option. A native `title`, so there is no
                 tooltip component, no portal and no positioning code. -->
            <span
              v-if="e.item._owners"
              class="i-mdi-help-circle-outline example-list-hint"
              :title="ownersHint(e.item)"
            ></span>
          </div>
        </div>
      </mono-tag-input>

      <div style="font-family: 'DM Mono', ui-monospace, monospace; font-size: 0.8rem; opacity: 0.7;">
        value → {{ value.length ? value.join(', ') : '—' }}
      </div>
    </div>
  </ClientOnly>
</template>

<style scoped>
/* Only what this demo adds. The line's layout, font, padding, divider, hover, selected tint and
   keyboard cursor are mono's own option styling, which a slotted line inherits — and any rule
   here still outranks it. */
.example-list-name {
    flex: 1 1 auto;
    min-width: 0;
}

.example-list-hint {
    flex: 0 0 auto;
    cursor: help;
    opacity: 0.6;
}
</style>
