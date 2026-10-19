<script setup>
import '@mono-lit/helper/ui/select'
import { ref } from 'vue'

// `label-position`: top (default) · notched (on the border for outlined, inset
// for filled / underlined) · left · right. Messages always stay under the box;
// `--mono-select-label-width` fixes the side column so stacked fields line up.
const items = [
  { label: 'Low', value: 'low' },
  { label: 'Normal', value: 'normal' },
  { label: 'High', value: 'high' },
]
const variant = ref('outlined')
const size = ref('md')
</script>

<template>
  <div style="width: 100%;">
    <DemoControls>
      <DemoSelect v-model="variant" label="Variant" :options="['outlined', 'filled', 'underlined']" />
      <DemoSelect v-model="size" label="Size" :options="['xs', 'sm', 'md', 'lg', 'xl', 'xxl']" />
    </DemoControls>

    <div style="display: grid; gap: 1.25rem;">
      <mono-select label-position="top" :variant="variant" :size="size" label="Top (default)" :items.prop="items" key-value="value" display-value="label" placeholder="Pick one"></mono-select>
      <mono-select label-position="notched" :variant="variant" :size="size" label="Notched" helper-text="Helper text stays under the box." :items.prop="items" key-value="value" display-value="label" placeholder="Pick one"></mono-select>
      <mono-select label-position="left" :variant="variant" :size="size" label="Left" required tooltip="Side labels keep the required mark and the tooltip." :items.prop="items" key-value="value" display-value="label" placeholder="Pick one"></mono-select>
      <mono-select label-position="right" :variant="variant" :size="size" label="Right" :items.prop="items" key-value="value" display-value="label" placeholder="Pick one"></mono-select>
      <div style="display: grid; gap: .75rem; --mono-select-label-width: 7rem;">
        <mono-select label-position="left" :variant="variant" :size="size" label="Name" :items.prop="items" key-value="value" display-value="label" placeholder="Pick one"></mono-select>
        <mono-select label-position="left" :variant="variant" :size="size" label="Department" validation-state="invalid" validation-message="Pick a department." :items.prop="items" key-value="value" display-value="label" placeholder="Pick one"></mono-select>
      </div>
    </div>
  </div>
</template>
