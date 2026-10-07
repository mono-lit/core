<script setup lang="ts">
import { computed, type Component } from 'vue'
import DemoPreview from './DemoPreview.vue'
import type { DemoEntry } from '../manifests/types'

const props = defineProps<{
  name: string
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

const manifestModules = import.meta.glob('../manifests/*.ts', {
  eager: true,
}) as Record<string, { demos?: DemoEntry[]; default?: { demos?: DemoEntry[] } }>

function lookupManifest(name: string): DemoEntry[] {
  for (const path in manifestModules) {
    if (path.endsWith(`/${name}.ts`)) {
      const mod = manifestModules[path]
      return mod.demos ?? mod.default?.demos ?? []
    }
  }
  return []
}

const demos = computed(() => {
  const entries = lookupManifest(props.name)
  return entries.map((entry) => {
    const cssKey = `../demos/${props.name}/css/${entry.id}.vue`
    const vueKey = `../demos/${props.name}/vue/${entry.id}.vue`

    const cssComponent = cssModules[cssKey]?.default
    const cssCode = cssRaw[cssKey]
    const vueComponent = vueModules[vueKey]?.default
    const vueCode = vueRaw[vueKey]

    if (!cssComponent && !vueComponent && import.meta.env.DEV) {
      console.warn(
        `[ComponentDocs] ${props.name}/${entry.id}: no source found in either css/ or vue/`,
      )
    }

    return {
      id: entry.id,
      title: entry.title,
      description: entry.description,
      vueComponent,
      vueCode,
      cssComponent,
      cssCode,
    }
  })
})
</script>

<template>
  <div class="component-docs">
    <DemoPreview
      v-for="d in demos"
      :key="d.id"
      :title="d.title"
      :description="d.description"
      :vue-component="d.vueComponent"
      :vue-code="d.vueCode"
      :css-component="d.cssComponent"
      :css-code="d.cssCode"
    />
  </div>
</template>
