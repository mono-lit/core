<script setup>
import '@mono-lit/helper/ui/button'
import { computed, ref } from 'vue'

// `slot="prepend"` / `slot="append"` render BESIDE the native control, never
// inside it — a <button> may not contain interactive content. That is what makes
// an affix independently clickable: a click in one has no path to the button's
// own handler, so no stopPropagation is needed on your side.
const border = ref(true)
const busy = ref(false)

const affix = computed(() => ({ divider: border.value }))

const log = ref([])
const note = (what) => {
  log.value = [what, ...log.value].slice(0, 4)
}

async function download() {
  busy.value = true
  note('main action ran')
  await new Promise((r) => setTimeout(r, 1200))
  busy.value = false
}
</script>

<template>
  <div style="width: 100%;">
    <DemoControls>
      <DemoCheck v-model="border" label="Divider" />
      <span class="example-hint">Click the icon or the caret — neither runs the button.</span>
    </DemoControls>

    <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: center;">
      <mono-button
        variant="outline"
        color="success"
        :loading="busy"
        :handler.prop="download"
        :prepend.prop="affix"
        :append.prop="affix"
      >
        <span slot="prepend" class="example-affix" @click="note('prepend clicked')">
          <span class="mono-icon i-mdi-file-document-outline" aria-hidden="true"></span>
        </span>
        Download Template
        <span slot="append" class="example-affix" @click="note('append clicked')">
          <span class="mono-icon i-mdi-chevron-down" aria-hidden="true"></span>
        </span>
      </mono-button>

      <!-- An affix can hold a whole control. Its own `click` is stopped at the
           boundary, so it never looks like the outer button's action. -->
      <mono-button variant="outline" color="primary" :append.prop="{ divider: true }">
        Split action
        <span slot="append">
          <mono-button size="xs" variant="text" @click="note('inner button clicked')">
            More
          </mono-button>
        </span>
      </mono-button>
    </div>

    <p class="example-value">
      <strong>{{ log[0] ?? 'nothing yet' }}</strong>
      <span v-if="log.length > 1"> — earlier: {{ log.slice(1).join(', ') }}</span>
    </p>
  </div>
</template>

<style scoped>
.example-hint {
  opacity: 0.7;
}
.example-affix {
  display: inline-flex;
  align-items: center;
}
.example-value {
  margin-top: 0.9rem;
  font-size: 0.8rem;
  color: var(--theme-text, #1a2d42);
  opacity: 0.75;
}
</style>
