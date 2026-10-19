<script setup>
import '@mono-lit/helper/ui/date'
import { ref } from 'vue'

// `label-position`: top (default) · notched (on the border for outlined, inset
// for filled / underlined) · left · right. Messages always stay under the box;
// `--mono-date-label-width` fixes the side column so stacked fields line up.
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
      <mono-date label-position="top" :variant="variant" :size="size" label="Top (default)" placeholder="Select a date"></mono-date>
      <mono-date label-position="notched" :variant="variant" :size="size" label="Notched" helper-text="Helper text stays under the box." placeholder="Select a date"></mono-date>
      <mono-date label-position="left" :variant="variant" :size="size" label="Left" required tooltip="Side labels keep the required mark and the tooltip." placeholder="Select a date"></mono-date>
      <mono-date label-position="right" :variant="variant" :size="size" label="Right" placeholder="Select a date"></mono-date>
      <div style="display: grid; gap: .75rem; --mono-date-label-width: 7rem;">
        <mono-date label-position="left" :variant="variant" :size="size" label="Name" placeholder="Select a date"></mono-date>
        <mono-date label-position="left" :variant="variant" :size="size" label="Department" validation-state="error" validation-message="Pick a department." placeholder="Select a date"></mono-date>
      </div>
    </div>
  </div>
</template>
