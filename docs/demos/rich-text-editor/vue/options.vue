<script setup>
import '@mono-lit/helper/ui/rich-text-editor'
import '@mono-lit/helper/ui/button'
import { ref } from 'vue'

// Anything SunEditor's `create()` takes, merged LAST over what the props
// produce. Handlers under `events` run before mono's own, and can still
// `return false` to cancel SunEditor's default.
const options = {
  charCounter: true,
  charCounter_type: 'byte-html',
  wordCounter: true,
  image: {
    // Where the image plugin uploads to; the response must follow SunEditor's contract.
    uploadUrl: '/api/upload-image',
    uploadSizeLimit: 2 * 1024 * 1024,
  },
  events: {
    onPaste: () => {
      log.value.unshift('onPaste (consumer handler ran first)')
    },
  },
}

const log = ref([])
const editorEl = ref(null)
function onReady(e) {
  // The live SunEditor instance — `editor.$.html`, `editor.$.viewer`, …
  log.value.unshift(`ready (instance: ${typeof e.detail.editor.$.html.get})`)
}
</script>

<template>
  <div class="example-stack">
    <mono-rich-text-editor
      ref="editorEl"
      label="Raw SunEditor options (.prop)"
      :options.prop="options"
      min-height="7rem"
      @ready="onReady"
      @focus="log.unshift('focus')"
      @blur="log.unshift('blur')"
      @input="log.unshift('input')"
      @change="log.unshift('change')"
    />
    <div class="example-actions">
      <mono-button size="sm" variant="outline" @click="editorEl.insertHtml('<b>inserted</b> ')">insertHtml()</mono-button>
      <mono-button size="sm" variant="outline" @click="editorEl.codeView()">codeView()</mono-button>
      <mono-button size="sm" variant="outline" @click="editorEl.fullScreen()">fullScreen()</mono-button>
      <mono-button size="sm" variant="outline" @click="editorEl.setHtml('<p>Replaced.</p>')">setHtml()</mono-button>
    </div>
    <ol class="example-log">
      <li v-for="(entry, i) in log.slice(0, 8)" :key="i">{{ entry }}</li>
      <li v-if="!log.length" class="example-muted">nothing yet — focus the editor</li>
    </ol>
  </div>
</template>

<style scoped>
.example-stack {
  display: grid;
  gap: calc(var(--mono-spacing) * 3);
  width: 100%;
}
.example-actions {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--mono-spacing) * 2);
}
.example-log {
  margin: 0;
  padding: calc(var(--mono-spacing) * 3) calc(var(--mono-spacing) * 4) calc(var(--mono-spacing) * 3) calc(var(--mono-spacing) * 8);
  border-radius: var(--mono-radius-md);
  background: var(--muted);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: var(--mono-text-xs);
  line-height: var(--mono-leading-relaxed);
  color: var(--foreground);
}
.example-muted {
  list-style: none;
  margin-left: calc(var(--mono-spacing) * -4);
  color: var(--muted-foreground);
}
</style>
