<script setup>
import '@mono-lit/helper/ui/tag-input'
import { ref } from 'vue'

// Items in their natural shape — no { label, value } pre-mapping.
const skills = [
  { id: 'vue',     name: 'Vue',     tier: 'core' },
  { id: 'lit',     name: 'Lit',     tier: 'core' },
  { id: 'react',   name: 'React',   tier: 'core' },
  { id: 'angular', name: 'Angular', tier: 'core' },
  { id: 'svelte',  name: 'Svelte',  tier: 'alt' },
]

const tagsById = ref(['vue', 'lit'])
const tagRows = ref([])
const labelWithTier = (item) => `${item.name} (${item.tier})`
</script>

<template>
  <div style="width: 100%; display: grid; gap: 1rem;">
    <div>
      <div style="font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--theme-text); opacity: 0.55; margin-bottom: 0.4rem;">
        key-value="id" + display-value="name" → modelValue = array of ids
      </div>
      <mono-tag-input
        label="Skills"
        placeholder="Pick or type"
        :items.prop="skills"
        key-value="id"
        display-value="name"
        :model-value.prop="tagsById"
        @change="tagsById = $event.detail.modelValue"
      ></mono-tag-input>
      <div style="font-family: 'DM Mono', ui-monospace, monospace; font-size: 0.78rem; margin-top: 0.35rem; color: var(--theme-text); opacity: 0.7;">
        modelValue → {{ JSON.stringify(tagsById) }}
      </div>
    </div>

    <div>
      <div style="font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--theme-text); opacity: 0.55; margin-bottom: 0.4rem;">
        Function display-value, no key-value → modelValue = array of whole rows
      </div>
      <mono-tag-input
        label="Skills (with tier)"
        placeholder="Pick or type"
        :items.prop="skills"
        :display-value.prop="labelWithTier"
        :model-value.prop="tagRows"
        @change="tagRows = $event.detail.modelValue"
      ></mono-tag-input>
      <pre style="font-size: 0.72rem; margin-top: 0.35rem; padding: 0.5rem 0.7rem; background: var(--theme-surface-soft); border-radius: 6px; overflow-x: auto;">modelValue → {{ JSON.stringify(tagRows, null, 2) }}</pre>
    </div>
  </div>
</template>
