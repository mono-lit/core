<script setup lang="ts">
// `slot="list"` — you render the option rows, mono keeps the panel and the behaviour.
//
// The slot is for MARKUP. Nothing in the template below touches the value: mono paints the selected
// and keyboard-cursor states off attributes it stamps on your lines, and owns every click — so a
// line you render is indistinguishable from one mono renders itself.
//
// REQUIRES `controlMonoForm`. The rows you loop are not the array you passed in: they are the
// control's RESOLVED list, after the search box and after a DataSource has loaded. That list only
// exists inside the element, so it is reported back up onto `form.items()[key].list`.
//
// A flat list here; grouping has its own demo below.
import '@mono-lit/helper/ui/select'
import { ref, onUnmounted } from 'vue'
import { controlMonoForm } from '@mono-lit/helper'

// `_note` and `_headcount` are the extra facts this demo exists for: neither has a place in
// `display-value`, which is a plain string, and Lit escapes markup — so before this slot there was
// no way to hang a badge and a tooltip off one option.
const depts = [
  { Code: 'MKT', Nama: 'Marketing', _headcount: 12 },
  { Code: 'MRS', Nama: 'Market Research', _headcount: 4, _note: 'Digabung ke Marketing per Q3.' },
  { Code: 'TMM', Nama: 'Trade Marketing', _headcount: 9 },
  { Code: 'SLS', Nama: 'Sales', _headcount: 31 },
  { Code: 'MTR', Nama: 'MTI & NKA', _headcount: 7 },
  { Code: 'DSC', Nama: 'Demand Supply', _headcount: 15, _note: 'Butuh approval Kepala Divisi.' },
  { Code: 'CBD', Nama: 'Community & Beauty', _headcount: 6 },
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
        searchable: true,
      },
    },
  },
})

// Straight from the controller. `items()` is a plain object mono mutates in place — it takes no
// framework dependency — so `subscribe()` is what turns it into something Vue re-renders on. Seed
// it once for the first paint; `subscribe` returns its own unsubscribe, which `onUnmounted` takes.
const value = ref<string>('')
const rows = ref<any[]>([])

const read = () => {
  rows.value = form.items().Dept.list
  value.value = form.items().Dept.currentValue as string
}

read()
onUnmounted(form.subscribe(read))
</script>

<template>
  <ClientOnly>
    <div style="width: 100%; display: grid; gap: 0.6rem;">
      <mono-select :control-form="form" key-form="Dept">
        <!-- ONE wrapper holding the loop. mono places this as the list body and never reaches
             inside it — your nodes stay where Vue put them, which is what keeps `v-for` safe. -->
        <div slot="list">
          <!-- ONE element per entry, in mono's order. That is the whole pairing rule: a click is
               traced back to its item by counting, so your Nth child is its Nth row. Single-select,
               so a click sets the value and closes — mono's doing, not yours. -->
          <div v-for="e in rows" :key="e.key">
            <span class="example-list-name">{{ e.item.Nama }}</span>

            <span class="example-list-badge">{{ e.item._headcount }} org</span>

            <!-- The reason this slot exists: markup per option. A native `title`, so there is no
                 tooltip component, no portal and no positioning code. -->
            <span
              v-if="e.item._note"
              class="i-mdi-help-circle-outline example-list-hint"
              :title="e.item._note"
            ></span>
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
/* Only what this demo adds. The line's layout, font, padding, height, hover, selected tint and
   keyboard cursor are mono's own option styling, which a slotted line inherits — and any rule
   here still outranks it. */
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

.example-list-hint {
    flex: 0 0 auto;
    cursor: help;
    opacity: 0.6;
}
</style>
