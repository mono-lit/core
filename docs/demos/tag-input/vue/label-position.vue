<script setup>
import '@mono-lit/helper/ui/tag-input'
import { ref } from 'vue'

// `label-position`: top (default) · notched (on the border for outlined, inset
// for filled / underlined) · left · right. Messages always stay under the box;
// `--mono-tag-input-label-width` fixes the side column so stacked fields line up.
// one stable array — an inline ['vue'] literal is a new value every render
const tags = ref(['vue'])
const items = [
  { label: 'Vue', value: 'vue' },
  { label: 'Lit', value: 'lit' },
  { label: 'React', value: 'react' },
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
      <mono-tag-input label-position="top" :variant="variant" :size="size" label="Top (default)" :items.prop="items" key-value="value" display-value="label" :model-value.prop="tags" @change="tags = $event.detail.modelValue" placeholder="Add a skill"></mono-tag-input>
      <mono-tag-input label-position="notched" :variant="variant" :size="size" label="Notched" helper-text="Helper text stays under the box." :items.prop="items" key-value="value" display-value="label" :model-value.prop="tags" @change="tags = $event.detail.modelValue" placeholder="Add a skill"></mono-tag-input>
      <mono-tag-input label-position="left" :variant="variant" :size="size" label="Left" required tooltip="Side labels keep the required mark and the tooltip." :items.prop="items" key-value="value" display-value="label" :model-value.prop="tags" @change="tags = $event.detail.modelValue" placeholder="Add a skill"></mono-tag-input>
      <mono-tag-input label-position="right" :variant="variant" :size="size" label="Right" :items.prop="items" key-value="value" display-value="label" :model-value.prop="tags" @change="tags = $event.detail.modelValue" placeholder="Add a skill"></mono-tag-input>
      <div style="display: grid; gap: .75rem; --mono-tag-input-label-width: 7rem;">
        <mono-tag-input label-position="left" :variant="variant" :size="size" label="Name" :items.prop="items" key-value="value" display-value="label" :model-value.prop="tags" @change="tags = $event.detail.modelValue" placeholder="Add a skill"></mono-tag-input>
        <mono-tag-input label-position="left" :variant="variant" :size="size" label="Department" validation-state="invalid" validation-message="Pick a department." :items.prop="items" key-value="value" display-value="label" :model-value.prop="tags" @change="tags = $event.detail.modelValue" placeholder="Add a skill"></mono-tag-input>
      </div>
    </div>
  </div>
</template>
