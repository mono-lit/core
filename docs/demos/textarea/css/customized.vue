<script setup>
import { ref } from 'vue'

const value = ref('')
const max = 500
</script>

<template>
    <div style="width: 100%">
        <div mono-textarea class="max-w-md">
            <label mono-label class="font-bold text-base">Customized via class names</label>
            <textarea
                mono-native class="text-base"
                placeholder="Wider, bolder, italic message"
               
                maxlength="500"
                v-model="value"
            ></textarea>
            <div>
                <div mono-footer>
                    <div mono-message-wrap>
                        <div mono-message="helper" class="italic">Width, label weight, field font and message style are overridden by composing utility classes onto the root markup.</div>
                    </div>
                    <div mono-counter>{{ value.length }}/{{ max }}</div>
                </div>
            </div>
        </div>
    </div>
</template>
