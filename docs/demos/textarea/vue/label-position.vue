<script setup>
import '@mono-lit/helper/ui/textarea'
import { ref } from 'vue'

// `label-position`: top (default) · notched (on the border for outlined, inset
// for filled / underlined) · left · right. Messages always stay under the box;
// `--mono-textarea-label-width` fixes the side column so stacked fields line up.
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
      <mono-textarea label-position="top" :variant="variant" :size="size" label="Top (default)" placeholder="Write something"></mono-textarea>
      <mono-textarea label-position="notched" :variant="variant" :size="size" label="Notched" helper-text="Helper text stays under the box." placeholder="Write something"></mono-textarea>
      <mono-textarea label-position="left" :variant="variant" :size="size" label="Left" required tooltip="Side labels keep the required mark and the tooltip." placeholder="Write something"></mono-textarea>
      <mono-textarea label-position="right" :variant="variant" :size="size" label="Right" placeholder="Write something"></mono-textarea>
      <div style="display: grid; gap: .75rem; --mono-textarea-label-width: 7rem;">
        <mono-textarea label-position="left" :variant="variant" :size="size" label="Name" placeholder="Write something"></mono-textarea>
        <mono-textarea label-position="left" :variant="variant" :size="size" label="Department" validation-state="invalid" validation-message="Pick a department." placeholder="Write something"></mono-textarea>
      </div>
    </div>
  </div>
</template>
