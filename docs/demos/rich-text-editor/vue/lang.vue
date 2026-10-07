<script setup>
import '@mono-lit/helper/ui/rich-text-editor'
import '@mono-lit/helper/ui/select'
import { ref } from 'vue'

// A code loads SunEditor's pack on demand (`suneditor/langs/<code>`); a language
// object can be passed with `.prop` instead.
const language = ref('ko')
const codes = ['en', 'ko', 'ja', 'zh-CN', 'de', 'fr', 'es', 'pt-BR', 'ru', 'tr', 'he', 'fa'].map((c) => ({ label: c, value: c }))
</script>

<template>
  <div class="example-stack">
    <mono-select size="sm" label="language" :items.prop="codes" key-value="value" display-value="label"
      :model-value="language" @change="language = $event.detail.modelValue" style="max-width: 14rem" />
    <mono-rich-text-editor :language="language" label="Hover the toolbar for the translated tooltips" min-height="6rem" />
    <mono-rich-text-editor
      text-direction="rtl"
      language="he"
      label='text-direction="rtl"'
      toolbar="basic"
      model-value="<p>טקסט מימין לשמאל</p>"
      min-height="5rem"
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
