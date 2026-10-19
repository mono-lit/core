<script setup>
import '@mono-lit/helper/ui/input'
import { ref } from 'vue'

// `label-position`: top (default) · notched (on the border for outlined, inset
// for filled / underlined) · left · right. Messages always stay under the box;
// `--mono-input-label-width` fixes the side column so stacked fields line up.
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
      <mono-input label-position="top" :variant="variant" :size="size" label="Top (default)" placeholder="Type here"></mono-input>
      <mono-input label-position="notched" :variant="variant" :size="size" label="Notched" helper-text="Helper text stays under the box." placeholder="Type here"></mono-input>
      <mono-input label-position="left" :variant="variant" :size="size" label="Left" required tooltip="Side labels keep the required mark and the tooltip." placeholder="Type here"></mono-input>
      <mono-input label-position="right" :variant="variant" :size="size" label="Right" placeholder="Type here"></mono-input>
      <div style="display: grid; gap: .75rem; --mono-input-label-width: 7rem;">
        <mono-input label-position="left" :variant="variant" :size="size" label="Name" placeholder="Type here"></mono-input>
        <mono-input label-position="left" :variant="variant" :size="size" label="Department" validation-state="invalid" validation-message="Pick a department." placeholder="Type here"></mono-input>
      </div>
    </div>
  </div>
</template>
