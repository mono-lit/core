<script setup>
import '@mono-lit/helper/ui/rich-text-editor'
import '@mono-lit/helper/ui/select'
import { ref } from 'vue'

const preset = ref('basic')
const presets = [
  { label: 'basic — the essentials', value: 'basic' },
  { label: 'standard — the default', value: 'standard' },
  { label: 'full — every built-in', value: 'full' },
  { label: "default — SunEditor's own list", value: 'default' },
]
// A SunEditor `buttonList`: groups of button names, `'|'` between groups.
const custom = [['undo', 'redo'], '|', ['bold', 'italic', 'fontColor'], '|', ['table', 'link', 'image'], '|', ['codeView']]
</script>

<template>
  <div class="example-stack">
    <mono-select size="sm" label="preset" :items.prop="presets" key-value="value" display-value="label"
      :model-value="preset" @change="preset = $event.detail.modelValue" style="max-width: 20rem" />
    <mono-rich-text-editor :label="`toolbar=&quot;${preset}&quot;`" :toolbar="preset" min-height="8rem" />

    <mono-rich-text-editor label="A custom buttonList (.prop)" :toolbar.prop="custom" min-height="8rem" />

    <mono-rich-text-editor
      label='toolbar="bold italic underline | link"'
      toolbar="bold italic underline | link"
      min-height="6rem"
    />
  </div>
</template>

<style scoped>
.example-stack {
  display: grid;
  gap: calc(var(--mono-spacing) * 4);
  width: 100%;
}
</style>
