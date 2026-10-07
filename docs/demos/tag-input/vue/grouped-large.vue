<script setup lang="ts">
import '@mono-lit/helper/ui/tag-input'
import { ref } from 'vue'

const tags = ref<unknown[]>([])

const teams = ['Platform', 'Frontend', 'Design', 'Data', 'Ops']
const roles = ['Lead', 'Senior', 'Mid', 'Junior']

// 1,200 flat records, generated with map and pre-sorted by team → role.
// `group` buckets them in the browser; `load-more="scroll"` reveals a chunk at
// a time so the big list never renders all at once.
const items = Array.from({ length: 1200 }, (_, i) => i).map((i) => {
  const team = teams[i % teams.length]
  const role = roles[Math.floor(i / teams.length) % roles.length]
  return { id: i + 1, name: `${team} ${role} #${i + 1}`, team, role }
})
items.sort((a, b) => a.team.localeCompare(b.team) || a.role.localeCompare(b.role))

const displayGroup = ['team', (row: any) => row.role]
</script>

<template>
  <div style="width: 100%;  display: grid; gap: 0.6rem;">
    <mono-tag-input
      :items.prop="items"
      group
      group-sticky
      checkable
      allow-custom="false"
      load-more="scroll"
      page-size="60"
      dropdown-max-height="18rem"
      :display-group.prop="displayGroup"
      display-value="name"
      key-value="id"
      label="Team members (1,200 · grouped · sticky)"
      placeholder="Add members…"
      @change="tags = $event.detail.modelValue"
    ></mono-tag-input>

    <div style="font-family: 'DM Mono', ui-monospace, monospace; font-size: 0.8rem; opacity: 0.7;">
      {{ items.length }} items · {{ tags.length }} selected
    </div>
  </div>
</template>
