<script setup>
import { onMounted, ref } from 'vue'

const checked = ref(false)
const inputEl = ref(null)

onMounted(() => {
    if (inputEl.value) inputEl.value.indeterminate = true
})

function toggleIndeterminate() {
    if (inputEl.value) inputEl.value.indeterminate = !inputEl.value.indeterminate
}

function onChange() {
    if (inputEl.value) inputEl.value.indeterminate = false
}
</script>

<template>
    <div>
        <label mono-checkbox>
            <input mono-input
                ref="inputEl"
                type="checkbox"
                v-model="checked"
                @change="onChange"
            >
            <span mono-box aria-hidden="true"></span>
            <div mono-label>
                <span mono-label-text>Indeterminate</span>
            </div>
        </label>
        <br>
        <br>
        <div class="checkbox-controls">
            <button type="button" class="demo-button" @click="toggleIndeterminate">
                Toggle Indeterminate
            </button>
        </div>
    </div>
</template>
