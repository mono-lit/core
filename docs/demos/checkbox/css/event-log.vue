<script setup>
import { ref } from 'vue'

const checked = ref(false)
const log = ref('No events yet...')

function onChange() {
    const line = '[change] ' + (checked.value ? 'CHECKED' : 'UNCHECKED')
    log.value = log.value === 'No events yet...' ? line : line + '\n' + log.value
}
</script>

<template>
    <div>
        <label mono-checkbox>
            <input mono-input type="checkbox" v-model="checked" @change="onChange">
            <span mono-box aria-hidden="true"></span>
            <div mono-label>
                <span mono-label-text>Watched checkbox</span>
            </div>
        </label>
        <br>
        <br>
        <div>
            <DemoLog :text="log" max-height="80px" />
        </div>
    </div>
</template>
