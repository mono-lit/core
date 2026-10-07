<script setup>
import { ref } from 'vue'

const value = ref('')
const log = ref('No events yet...')
let last = ''

function onChange() {
    const next = value.value
    const line = '[change] value=' + JSON.stringify(next) + ' old=' + JSON.stringify(last)
    log.value = log.value === 'No events yet...' ? line : line + '\n' + log.value
    last = next
}
</script>

<template>
    <div>
        <div style="display: grid; gap: 0.5rem;">
            <label mono-radio>
                <input mono-input type="radio" name="logset" value="a" v-model="value" @change="onChange" />
                <span mono-circle aria-hidden="true"></span>
                <span mono-label><span mono-label-text>Option A</span></span>
            </label>
            <label mono-radio>
                <input mono-input type="radio" name="logset" value="b" v-model="value" @change="onChange" />
                <span mono-circle aria-hidden="true"></span>
                <span mono-label><span mono-label-text>Option B</span></span>
            </label>
            <label mono-radio>
                <input mono-input type="radio" name="logset" value="c" v-model="value" @change="onChange" />
                <span mono-circle aria-hidden="true"></span>
                <span mono-label><span mono-label-text>Option C</span></span>
            </label>
        </div>
        <br>
        <DemoLog :text="log" max-height="100px" />
    </div>
</template>
