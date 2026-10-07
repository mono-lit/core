<script setup>
import '@mono-lit/helper/ui/rich-text-editor'
import { ref, onMounted } from 'vue'

// Plugin classes straight from SunEditor — your bundler owns the chunk, and
// only what you import ships. Bind them with `.prop`.
//
// Imported LAZILY, on the client: SunEditor's modules read `window` at import
// time, so a static `import { font } from 'suneditor/plugins'` in a component
// that is server-rendered (Nuxt, VitePress) throws before the page exists.
const picked = ref(undefined)
onMounted(async () => {
  const { font, fontSize, fontColor, link, table } = await import('suneditor/plugins')
  picked.value = [font, fontSize, fontColor, link, table]
})
</script>

<template>
  <div class="example-stack">
    <!-- Plugin classes: everything the standard toolbar names that is NOT in
         this list (image, video, align, …) is dropped from the toolbar, not rejected. -->
    <mono-rich-text-editor
      v-if="picked"
      label=":plugins.prop = [font, fontSize, fontColor, link, table]"
      :plugins.prop="picked"
      min-height="7rem"
    />

    <!-- Names, looked up in SunEditor's built-in set — mono loads it on demand,
         so this form needs no import of your own and is server-safe as written. -->
    <mono-rich-text-editor label='plugins="link, align, list"' plugins="link, align, list" min-height="7rem" />

    <!-- No plugins at all: the core buttons only. -->
    <mono-rich-text-editor label='plugins="none"' plugins="none" min-height="6rem" />
  </div>
</template>

<style scoped>
.example-stack {
  display: grid;
  gap: 1rem;
  width: 100%;
}
</style>
