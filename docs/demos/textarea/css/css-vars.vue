<script setup>
import { ref } from 'vue'

const value = ref('Focus me to see the custom accent.')
</script>

<template>
  <!-- Accent + border set on the wrapper cascade into the textarea inside. -->
  <div style="box-sizing: border-box; width: 100%; --mono-textarea-focus-color: #7c3aed; --mono-textarea-border-color: #e9d5ff;">
    <div mono-textarea>
      <label mono-label>Bio</label>
      <textarea
        mono-native
        placeholder="Tell us a bit about yourself"
        rows="3"
        v-model="value"
      ></textarea>
      <div mono-footer>
        <div mono-message-wrap>
          <div mono-message="helper">Focus color + border themed via --mono-textarea-*.</div>
        </div>
      </div>
    </div>
  </div>
</template>
