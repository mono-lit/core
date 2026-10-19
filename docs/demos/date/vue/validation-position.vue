<script setup>
import '@mono-lit/helper/ui/date'
import { ref } from 'vue'

// `validation-position`: bottom (default) — the message under the box ·
// icon — a state icon inside the box, hover it for the message · float — the
// message floats under the box only while the field is hovered or focused.
// In icon / float the row under the box keeps the helper text.
const state = ref('error')
const messages = { invalid: 'This value is not allowed.', error: 'This date is not allowed.', warning: 'This value looks unusual.', valid: 'Looks good!', success: 'Looks good!' }
</script>

<template>
  <div style="width: 100%;">
    <DemoControls>
      <DemoSelect v-model="state" label="State" :options="['error', 'success']" />
    </DemoControls>

    <div style="display: grid; gap: 1.5rem;">
      <mono-date validation-position="bottom" label="Bottom (default)" helper-text="Helper text" :validation-state="state" :validation-message="messages[state]" placeholder="Select a date"></mono-date>
      <mono-date validation-position="icon" label="Icon — hover the icon" helper-text="Helper text stays" :validation-state="state" :validation-message="messages[state]" placeholder="Select a date"></mono-date>
      <mono-date validation-position="float" label="Float — hover or focus the field" helper-text="Helper text stays" :validation-state="state" :validation-message="messages[state]" placeholder="Select a date"></mono-date>
    </div>
  </div>
</template>
