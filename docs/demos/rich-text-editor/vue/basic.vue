<script setup>
import '@mono-lit/helper/ui/rich-text-editor'
import { ref } from 'vue'

// The value is HTML. `change` fires when SunEditor commits an edit; an
// emptied editor reports `''`, never `<p><br></p>`.
const value = ref('<p>Hello <strong>SunEditor</strong> — edit me.</p>')
</script>

<template>
  <div style="width: 100%">
    <mono-rich-text-editor
      label="Description"
      placeholder="Write something…"
      helper-text="The standard toolbar: fonts, colours, tables, media, code view."
      :model-value="value"
      @change="value = $event.detail.modelValue"
    />
    <pre class="example-html">{{ value || '—' }}</pre>
  </div>
</template>

<style scoped>
.example-html {
  margin: calc(var(--mono-spacing) * 3) 0 0;
  padding: calc(var(--mono-spacing) * 2) calc(var(--mono-spacing) * 3);
  border-radius: var(--mono-radius-md);
  background: var(--muted);
  color: var(--foreground);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: var(--mono-text-xs);
  line-height: var(--mono-leading-relaxed);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
