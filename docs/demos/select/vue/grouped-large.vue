<script setup lang="ts">
import '@mono-lit/helper/ui/select'
import { ref } from 'vue'

const selected = ref<unknown>(null)

const teams = ['Platform', 'Frontend', 'Design', 'Data', 'Ops']
const roles = ['Lead', 'Senior', 'Mid', 'Junior']

// 1,200 flat records, generated with map and pre-sorted by team → role so the
// two group levels read cleanly while scrolling. `group` buckets them in the
// browser; `load-more="scroll"` reveals a chunk at a time so the big list never
// renders all at once.
const items = Array.from({ length: 1200 }, (_, i) => i).map((i) => {
  const team = teams[i % teams.length]
  const role = roles[Math.floor(i / teams.length) % roles.length]
  return { id: i + 1, name: `${team} ${role} #${i + 1}`, team, role }
})
items.sort((a, b) => a.team.localeCompare(b.team) || a.role.localeCompare(b.role))

// Level 0 = team (string field), level 1 = role (function).
const displayGroup = ['team', (row: any) => row.role]
</script>

<template>
  <div style="width: 100%; display: grid; gap: 0.6rem;">
    <mono-select
      :items.prop="items"
      group
      group-sticky
      load-more="scroll"
      page-size="60"
      dropdown-max-height="18rem"
      :display-group.prop="displayGroup"
      display-value="name"
      key-value="id"
      label="Team member (1,200 · grouped · sticky)"
      placeholder="Pick a member"
      :model-value="selected"
      @change="selected = $event.detail.modelValue"
    ></mono-select>

    <div style="font-family: 'DM Mono', ui-monospace, monospace; font-size: 0.8rem; opacity: 0.7;">
      {{ items.length }} items · selected id → {{ selected ?? '—' }}
    </div>
  </div>
</template>
