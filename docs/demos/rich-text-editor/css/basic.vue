<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

// Hand-written markup, no Lit: the attributes mirror the element's props one for
// one and rich-text-editor.css paints the chrome. The few lines here only mount
// SunEditor into the frame — the element's own logic — so the field paints
// exactly like the Light / Shadow tabs. The `--se-*` remap is delivered by the
// page sheet on `[mono-rte-mount] .sun-editor`, which is what themes the editor.
const value = ref('<p>Hello <strong>SunEditor</strong> — edit me.</p>')
const mount = ref(null)
let editor = null

onMounted(async () => {
  // dynamic, not static: SunEditor reads `window` at module scope, and the docs
  // render this file on the server too
  const [{ default: suneditor }, plugins] = await Promise.all([import('suneditor'), import('suneditor/plugins')])
  await import('suneditor/css/editor')
  const target = document.createElement('div')
  mount.value.replaceChildren(target)
  editor = suneditor.create(target, {
    value: value.value,
    // the element's `standard` preset, by hand
    plugins: [plugins.blockStyle, plugins.font, plugins.fontSize, plugins.fontColor, plugins.backgroundColor, plugins.align, plugins.list_bulleted, plugins.list_numbered, plugins.table, plugins.link, plugins.image, plugins.video, plugins.blockquote, plugins.codeBlock, plugins.hr],
    buttonList: [['undo', 'redo'], '|', ['blockStyle', 'font', 'fontSize'], '|', ['bold', 'underline', 'italic', 'strike'], ['fontColor', 'backgroundColor'], '|', ['align', 'list_bulleted', 'list_numbered', 'outdent', 'indent'], '|', ['table', 'link', 'image', 'video'], '|', ['blockquote', 'codeBlock', 'hr'], '|', ['removeFormat'], '|', ['codeView', 'fullScreen']],
    toolbar_sticky: -1,
    minHeight: '10rem',
    placeholder: 'Write something…',
    events: {
      onChange: (html) => { value.value = html },
    },
  })
})
onBeforeUnmount(() => editor?.destroy())
</script>

<template>
  <div style="width: 100%">
    <div mono-rich-text-editor :mono-has-value="value ? '' : null">
      <label mono-rte-label>Description</label>
      <div mono-rte-field>
        <div mono-rte-mount ref="mount"></div>
      </div>
      <div mono-rte-message-outlet>
        <div mono-rte-footer>
          <div mono-rte-message-wrap>
            <div mono-rte-message="helper">The standard toolbar: fonts, colours, tables, media, code view.</div>
          </div>
        </div>
      </div>
    </div>
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
