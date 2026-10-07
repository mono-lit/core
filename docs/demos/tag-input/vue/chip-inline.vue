<script setup>
import '@mono-lit/helper/ui/tag-input'
import { computed, ref } from 'vue'

// `flex` (the default) wraps the chips onto new lines, so the field grows taller
// as tags are added. `inline` keeps them on ONE line in a strip that scrolls
// sideways — the field then holds its height however many tags it carries.
//
// The strip moves ONLY via the ‹ › buttons: there is no scrollbar, and the
// wheel, click-dragging and the arrow keys all leave it alone. Each button shows
// only while there is somewhere to scroll toward.
const behaviour = ref('inline')

// The full option list stays constant; `tags` is only what is SELECTED. Both
// fields bind the same ref, so removing a chip in one updates the other and
// un-selects that row in the suggestion list.
const options = [
  'alpha', 'beta', 'gamma', 'delta', 'epsilon',
  'zeta', 'eta', 'theta', 'iota', 'kappa',
]

const tags = ref([...options])

const chip = computed(() => ({ behaviour: behaviour.value }))
</script>

<template>
  <div style="width: 100%;">
    <DemoControls>
      <DemoSelect
        v-model="behaviour"
        label="Behaviour"
        :options="[
          { value: 'flex', label: 'flex (wrap)' },
          { value: 'inline', label: 'inline (scroll)' },
        ]"
      />
      <span class="example-hint">
        Add or remove tags and watch the field height.
      </span>
    </DemoControls>

    <div style="display: grid; gap: 1rem;">
      <mono-tag-input
        label="Ten tags"
        placeholder="Add tag"
        clearable
        :items.prop="options"
        :model-value.prop="tags"
        :chip.prop="chip"
        @change="tags = $event.detail.modelValue"
      ></mono-tag-input>

      <!-- `max-visible` applies to BOTH layouts: the first 3 chips draw, the
           rest collapse into a "+N more" chip — in the strip while inline — and
           clicking it opens the panel listing them. -->
      <mono-tag-input
        color="success"
        variant="filled"
        label="…with max-visible=3 (+N more in the strip too)"
        placeholder="Add tag"
        clearable
        :max-visible="3"
        :items.prop="options"
        :model-value.prop="tags"
        :chip.prop="chip"
        @change="tags = $event.detail.modelValue"
      ></mono-tag-input>

      <!-- Disabled / readonly drop ✕ and ⌄ (the field refuses every gesture)
           but keep ‹ ›, which still page the strip so a long selection can be
           read. The gutter stays, so nothing shifts when the state toggles. -->
      <mono-tag-input
        label="…disabled (‹ › still page)"
        placeholder="Cannot edit"
        clearable
        disabled
        :items.prop="options"
        :model-value.prop="tags"
        :chip.prop="chip"
      ></mono-tag-input>
    </div>
  </div>
</template>

<style scoped>
.example-hint {
  opacity: 0.7;
}
</style>
