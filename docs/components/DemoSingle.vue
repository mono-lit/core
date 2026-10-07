<script setup lang="ts">
import { computed, type Component } from 'vue'
import DemoPreview from './DemoPreview.vue'

const props = defineProps<{
  /** Manifest folder name, e.g. "menu", "sidebar". */
  name: string
  /** Demo id within the folder, e.g. "basic", "nested-elements". */
  id: string
}>()

const cssModules = import.meta.glob('../demos/*/css/*.vue', {
  eager: true,
}) as Record<string, { default: Component }>

const cssRaw = import.meta.glob('../demos/*/css/*.vue', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const vueModules = import.meta.glob('../demos/*/vue/*.vue', {
  eager: true,
}) as Record<string, { default: Component }>

const vueRaw = import.meta.glob('../demos/*/vue/*.vue', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

// The Shadow variant is DERIVED from the same vue/ source by the mono-shadow-demos
// Vite plugin (import rewritten to the shadow build + tag → mono-shadow-<name>).
// We import each vue demo a second time with the `?shadow` / `?shadow-raw` queries;
// non-qualifying components resolve to a null module (no Shadow tab).
const shadowModules = import.meta.glob('../demos/*/vue/*.vue', {
  query: '?shadow',
  eager: true,
}) as Record<string, { default: Component | null }>

const shadowRaw = import.meta.glob('../demos/*/vue/*.vue', {
  query: '?shadow-raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const demo = computed(() => {
  const cssKey = `../demos/${props.name}/css/${props.id}.vue`
  const vueKey = `../demos/${props.name}/vue/${props.id}.vue`

  if (
    !cssModules[cssKey] &&
    !vueModules[vueKey] &&
    import.meta.env.DEV
  ) {
    console.warn(
      `[DemoSingle] ${props.name}/${props.id}: no source found in either css/ or vue/`,
    )
  }

  return {
    vueComponent: vueModules[vueKey]?.default,
    vueCode: vueRaw[vueKey],
    cssComponent: cssModules[cssKey]?.default,
    cssCode: cssRaw[cssKey],
    shadowComponent: shadowModules[vueKey]?.default ?? undefined,
    shadowCode: shadowRaw[vueKey],
  }
})
</script>

<template>
  <DemoPreview
    :vue-component="demo.vueComponent"
    :vue-code="demo.vueCode"
    :css-component="demo.cssComponent"
    :css-code="demo.cssCode"
    :shadow-component="demo.shadowComponent"
    :shadow-code="demo.shadowCode"
  />
</template>
