<script setup>
import { ref } from 'vue'

const value = ref('')
</script>

<template>
    <div style="width: 100%">
        <!-- `class` is free for your own utilities: the parts are styled by attribute. -->
        <div mono-input mono-clearable class="max-w-md">
            <label mono-label class="font-bold text-base">Customized via class names</label>
            <div mono-field>
                <input mono-native type="text" class="text-lg" placeholder="Wider, bolder, italic message" v-model="value" />
                <button v-if="value" mono-clear type="button" aria-label="Clear input" @click="value = ''">
                    <span mono-icon class="mono-icon i-mdi-close" aria-hidden="true"></span>
                </button>
            </div>
            <div mono-message-wrap>
                <div mono-message="helper" class="italic">Width, label weight, font size and message style are overridden by composing utility classes onto the root markup.</div>
            </div>
        </div>
    </div>
</template>
