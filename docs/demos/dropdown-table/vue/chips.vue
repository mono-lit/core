<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/dropdown-table'
import '@mono-lit/helper/ui/table'
import { controlMonoDataDropdown } from '@mono-lit/helper'
import type { DropdownTableChipProps } from '@mono-lit/helper/ui/dropdown-table'

// `chip` is the same object <mono-tag-input> takes. Every key maps 1:1 to a
// mono-chip prop; leave one out and it follows the field — `color` tracks the
// field color, `variant` tracks the field variant.
//
// `behaviour` is the odd one out: it is about LAYOUT, not paint. `flex` wraps
// the chips onto new lines; `inline` keeps them on one line in a strip that
// scrolls sideways, moved only by the ‹ › buttons before the clear button / caret.
type Person = { Id: number; Name: string; Role: string }

const people: Person[] = [
  { Id: 1, Name: 'Ada Lovelace', Role: 'Analyst' },
  { Id: 2, Name: 'Alan Turing', Role: 'Engineer' },
  { Id: 3, Name: 'Grace Hopper', Role: 'Admiral' },
  { Id: 4, Name: 'Katherine Johnson', Role: 'Physicist' },
  { Id: 5, Name: 'Edsger Dijkstra', Role: 'Engineer' },
  { Id: 6, Name: 'Barbara Liskov', Role: 'Professor' },
  { Id: 7, Name: 'Donald Knuth', Role: 'Author' },
  { Id: 8, Name: 'Margaret Hamilton', Role: 'Director' },
]

const dd = controlMonoDataDropdown<Person>(people, {
  keyExpr: 'Id',
  displayExpr: 'Name',
  multiple: true,
  pageSize: 5,
  searchValue: ['Name', 'Role'],
})

const rows = ref<Person[]>([])
const off = dd.subscribe(() => {
  rows.value = [...dd.table.items]
})
dd.table.load()

const selected = ref<number[]>([1, 2, 3, 4, 5, 6])

// Typed off `DropdownTableChipProps` rather than left as bare `ref('inline')` —
// that infers `Ref<string>`, which the `chip` prop rejects.
type ChipProps = DropdownTableChipProps
const behaviour = ref<NonNullable<ChipProps['behaviour']>>('inline')
const rounded = ref<ChipProps['rounded'] | ''>('')
const color = ref<ChipProps['color'] | ''>('')
const dot = ref(false)
// Disabled drops ✕ and ⌄ (the field refuses every gesture) but keeps ‹ ›, which
// still page the strip so a long selection can be read; nothing shifts.
const disabled = ref(false)

// The limits ride on the same chip object. `max` caps what the user can SELECT
// (a pick past it is rejected — nothing is disabled); `maxVisible` caps what is
// DRAWN before "+N more", in the strip as much as in the wrapped layout. 0 = off.
const max = ref(0)
const maxVisible = ref(0)

const chip = computed<ChipProps>(() => ({
  behaviour: behaviour.value,
  dot: dot.value,
  ...(rounded.value ? { rounded: rounded.value } : {}),
  ...(color.value ? { color: color.value } : {}),
  ...(max.value ? { max: max.value } : {}),
  maxVisible: maxVisible.value,
}))

onBeforeUnmount(() => {
  off()
  dd.dispose()
})
</script>

<template>
  <div class="example-demo" style="width: 100%">
    <DemoControls>
      <DemoSelect
        v-model="behaviour"
        label="Behaviour"
        :options="[
          { value: 'flex', label: 'flex (wrap)' },
          { value: 'inline', label: 'inline (scroll)' },
        ]"
      />
      <DemoSelect v-model="rounded" label="chip.rounded" :options="[{ value: '', label: 'default (sm)' }, 'none', 'md', 'lg', 'full']" />
      <DemoSelect v-model="color" label="Chip color" colors="chip" empty="follow field" />
      <DemoCheck v-model="dot" label="Dot" />
      <DemoCheck v-model="disabled" label="Disabled" />
      <DemoSelect v-model="max" label="chip.max" :options="[{ value: 0, label: 'none' }, 3, 6]" number />
      <DemoSelect v-model="maxVisible" label="chip.maxVisible" :options="[{ value: 0, label: 'all' }, 2, 4]" number />
    </DemoControls>

    <mono-dropdown-table
      :control-data-dropdown.prop="dd"
      color="success"
      label="Chips follow the field colour"
      placeholder="Pick people…"
      clearable
      multiple
      :disabled="disabled"
      :dropdown.prop="{ width: 460 }"
      :chip.prop="chip"
      :model-value.prop="selected"
      @change="selected = $event.detail.modelValue"
    >
      <mono-table-search :control-table.prop="dd.table" slot="search" placeholder="Search name or role…" />

      <table mono-table>
        <thead>
          <tr>
            <th style="width: 2.6rem; text-align: center">
              <mono-table-checkbox
                type="all"
                mode="all"
                :control-table.prop="dd.table"
                size="sm"
                aria-label-text="Select all people"
              />
            </th>
            <th>
              <mono-table-th :control-table.prop="dd.table" field="Name" caption="Name" sort>Name</mono-table-th>
            </th>
            <th>
              <mono-table-th :control-table.prop="dd.table" field="Role" caption="Role" sort>Role</mono-table-th>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.Id" :data-row-key="String(r.Id)">
            <td style="text-align: center">
              <mono-table-checkbox :control-table.prop="dd.table" :item.prop="r" size="sm" />
            </td>
            <td>{{ r.Name }}</td>
            <td>{{ r.Role }}</td>
          </tr>
        </tbody>
      </table>

      <mono-table-paging :control-table.prop="dd.table" slot="footer" simple />
    </mono-dropdown-table>

    <p class="example-value">Selected ids: <strong>{{ selected.join(', ') || '—' }}</strong></p>
  </div>
</template>

<style scoped>
.example-demo {
  max-width: 460px;
}
.example-value {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--foreground);
  opacity: 0.75;
}
</style>
