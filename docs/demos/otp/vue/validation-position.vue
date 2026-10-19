<script setup>
import '@mono-lit/helper/ui/otp'
import { ref } from 'vue'

// `validation-position`: bottom (default) · icon — a state icon after the boxes, hover it for
// the message · float — the message floats under the boxes while the field is hovered or focused.
const state = ref('invalid')
const messages = { invalid: 'That code is wrong.', warning: 'The code expires soon.', valid: 'Code verified.' }
</script>

<template>
  <div style="width: 100%;">
    <DemoControls>
      <DemoSelect v-model="state" label="State" :options="['invalid', 'warning', 'valid']" />
    </DemoControls>

    <div style="display: grid; gap: 1.5rem;">
      <mono-otp validation-position="bottom" label="Bottom (default)" helper-text="Helper text" length="4" model-value="12" :validation-state="state" :validation-message="messages[state]"></mono-otp>
      <mono-otp validation-position="icon" label="Icon — hover the icon" helper-text="Helper text stays" length="4" model-value="12" :validation-state="state" :validation-message="messages[state]"></mono-otp>
      <mono-otp validation-position="float" label="Float — hover or focus the boxes" helper-text="Helper text stays" length="4" model-value="12" :validation-state="state" :validation-message="messages[state]"></mono-otp>
    </div>
  </div>
</template>
