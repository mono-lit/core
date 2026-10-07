<script setup lang="ts">
import { ref, computed } from 'vue'
import '@mono-lit/helper/ui/button-dropdown'

const log = ref<string[]>([])
const note = (msg: string) => log.value.unshift(msg)

// Each entry takes every <mono-button> prop — `color`, `variant`, `disabled`,
// `loading`, `icon-position`, … — plus a label, an icon and its own click.
const all = [
  { label: 'Save', icon: 'i-mdi-content-save', color: 'primary', onClick: () => note('Save') },
  { label: 'Edit', icon: 'i-mdi-pencil', color: 'secondary', variant: 'outline', onClick: () => note('Edit') },
  { label: 'Duplicate', icon: 'i-mdi-content-copy', variant: 'outline', onClick: () => note('Duplicate') },
  { label: 'Archive', icon: 'i-mdi-archive', variant: 'outline', disabled: true, onClick: () => note('Archive') },
  { label: 'Delete', icon: 'i-mdi-delete', color: 'danger', variant: 'outline', onClick: () => note('Delete') },
]

const count = ref(1)
const min = ref(1)

const buttons = computed(() => all.slice(0, count.value))
const collapsed = computed(() => buttons.value.length > min.value)
</script>

<template>
  <div style="width: 100%">
    <DemoControls>
      <DemoSelect v-model="count" label="buttons" :options="[1, 2, 3, 4, 5]" number />
      <DemoSelect v-model="min" label="min" :options="[1, 2, 3, 4, 5]" number />
      <span class="example-note">
        {{ buttons.length }} &le; {{ min }} ?
        <strong>{{ collapsed ? 'collapsed → ⋮ menu' : 'inline' }}</strong>
      </span>
    </DemoControls>

    <!-- `color` / `variant` style the ⋮ TRIGGER. Inside the menu every row is a
         flat white strip and each entry's own `color` tints its icon instead —
         collapse the list and watch Delete's icon stay red while its button
         stops being an outlined danger button. Inline, they keep full styling.

         `bottom-start` because this trigger sits at the left edge; the default
         `bottom-end` right-aligns the panel, which suits a toolbar or table row. -->
    <mono-button-dropdown
      :buttons.prop="buttons"
      :min="min"
      color="secondary"
      variant="outline"
      placement="bottom-start"
      @click="note(`click #${$event.detail.index} ${$event.detail.item.label}`)"
    />

    <p class="example-log">
      <strong>events</strong>
      <code>{{ log.slice(0, 4).join('  ·  ') || '—' }}</code>
    </p>
  </div>
</template>

<style scoped>
.example-note {
  font-size: 0.75rem;
  opacity: 0.75;
}
.example-log {
  display: grid;
  grid-template-columns: 4.5rem 1fr;
  gap: 0.6rem;
  margin: 1rem 0 0;
  font-size: 0.74rem;
  opacity: 0.8;
}
.example-log code {
  word-break: break-all;
}
</style>
