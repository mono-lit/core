<script setup>
import { ref } from 'vue'

const value = ref(false)
const log = ref('No events yet...')
let last = false

function onChange() {
    const next = value.value
    const line = '[change] value=' + next + ' old=' + last
    log.value = log.value === 'No events yet...' ? line : line + '\n' + log.value
    last = next
}
</script>

<template>
    <div>
        <label mono-switch>
            <input mono-input type="checkbox" role="switch" v-model="value" @change="onChange" />
            <span mono-track aria-hidden="true"><span mono-thumb></span></span>
            <span mono-label>
                <span mono-label-text>Event Switch</span>
                <span mono-description>Toggle me to see events fire.</span>
            </span>
        </label>
        <br>
        <DemoLog :text="log" max-height="100px" />
    </div>
</template>
