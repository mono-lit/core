<script setup>
import '@mono-lit/helper/ui/rich-text-editor'
// The CONTENT sheet — what saved HTML needs to look the same outside the
// editor (tables, alignment, code blocks). Wrap the HTML in `.sun-editor-editable`.
import 'suneditor/css/contents'
import { ref } from 'vue'

const html = ref(
  '<h3>Release notes</h3><p>Written in the editor, <strong>rendered</strong> beside it.</p><ul><li>one</li><li>two</li></ul>',
)
</script>

<template>
  <div class="example-split">
    <mono-rich-text-editor
      label="Edit"
      toolbar="basic"
      :model-value="html"
      min-height="8rem"
      @change="html = $event.detail.modelValue"
    />
    <div>
      <div class="example-caption">Rendered with <code>suneditor/css/contents</code></div>
      <div class="sun-editor-editable example-preview" v-html="html"></div>
    </div>
  </div>
</template>

<style scoped>
.example-split {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  gap: calc(var(--mono-spacing) * 4);
  width: 100%;
}
.example-caption {
  font-size: var(--mono-text-sm);
  line-height: var(--mono-leading-snug);
  font-weight: var(--mono-font-weight-medium);
  color: var(--foreground);
  margin-bottom: calc(var(--mono-spacing) * 3);
}
.example-caption code {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-weight: var(--mono-font-weight-normal);
  color: var(--muted-foreground);
}
.example-preview {
  padding: calc(var(--mono-spacing) * 3);
  border: var(--mono-border-width) dashed var(--border);
  border-radius: var(--mono-radius-md);
  background: var(--background);
  color: var(--foreground);
  min-height: 8rem;
}
</style>
