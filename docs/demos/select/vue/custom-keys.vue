<script setup>
import '@mono-lit/helper/ui/select'
import { ref } from 'vue'

// Items in their natural shape — no { label, value } pre-mapping.
const users = [
  { id: 9, first: 'John', last: 'Doe', team: 'Platform' },
  { id: 11, first: 'Jane', last: 'Reyes', team: 'Frontend' },
  { id: 14, first: 'Lina', last: 'Cho', team: 'Design' },
]

const selectedId = ref(11)
const selectedRow = ref(null)
const fullName = (u) => `${u.first} ${u.last}`
</script>

<template>
  <div style="width: 100%; display: grid; gap: 1rem;">
    <div>
      <div style="font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--theme-text); opacity: 0.55; margin-bottom: 0.4rem;">
        key-value="id" + display-value="first" → modelValue = id
      </div>
      <mono-select
        label="Owner"
        placeholder="Pick a user"
        :items.prop="users"
        key-value="id"
        display-value="first"
        :model-value="selectedId"
        @change="selectedId = $event.detail.modelValue"
      ></mono-select>
      <div style="font-family: 'DM Mono', ui-monospace, monospace; font-size: 0.78rem; margin-top: 0.35rem; color: var(--theme-text); opacity: 0.7;">
        modelValue → {{ JSON.stringify(selectedId) }}
      </div>
    </div>

    <div>
      <div style="font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--theme-text); opacity: 0.55; margin-bottom: 0.4rem;">
        Function display-value, no key-value → modelValue = whole item
      </div>
      <mono-select
        label="Owner (full name)"
        placeholder="Pick a user"
        :items.prop="users"
        :display-value.prop="fullName"
        :model-value.prop="selectedRow"
        @change="selectedRow = $event.detail.modelValue"
      ></mono-select>
      <pre style="font-size: 0.72rem; margin-top: 0.35rem; padding: 0.5rem 0.7rem; background: var(--theme-surface-soft); border-radius: 6px; overflow-x: auto;">modelValue → {{ JSON.stringify(selectedRow, null, 2) }}</pre>
    </div>
  </div>
</template>
