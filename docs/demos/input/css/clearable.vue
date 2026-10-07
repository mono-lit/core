<script setup>
import { ref } from 'vue'

const value = ref('Erase me')
</script>

<template>
    <div style="width: 100%">
        <!-- The element renders [mono-clear] only while there is a value. -->
        <div mono-input mono-clearable>
            <label mono-label>Clearable</label>
            <div mono-field>
                <input mono-native type="text" placeholder="Type then clear" v-model="value" />
                <button v-if="value" mono-clear type="button" aria-label="Clear input" @click="value = ''">
                    <span mono-icon class="mono-icon i-mdi-close" aria-hidden="true"></span>
                </button>
            </div>
            <div mono-message-wrap>
                <div mono-message="helper">The clear button appears when the field has a value.</div>
            </div>
        </div>
    </div>
</template>
