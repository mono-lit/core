<script setup>
import { ref } from 'vue'

const value = ref('')
const log = ref('No events yet...')
let last = ''

function append(line) {
    log.value = log.value === 'No events yet...' ? line : line + '\n' + log.value
}

function onInput(e) {
    const next = e.target.value
    append('[input] value=' + JSON.stringify(next) + ' old=' + JSON.stringify(last))
    last = next
}

function onChange(e) {
    append('[change] value=' + JSON.stringify(e.target.value))
}

function onClear() {
    const old = value.value
    value.value = ''
    append('[clear] value="" old=' + JSON.stringify(old))
    last = ''
}
</script>

<template>
    <div style="width: 100%">
        <div mono-input mono-clearable>
            <label mono-label>Event Input</label>
            <div mono-field>
                <input mono-native type="text" placeholder="Type, blur, then clear" v-model="value" @input="onInput" @change="onChange" />
                <button v-if="value" mono-clear type="button" aria-label="Clear input" @click="onClear">
                    <span mono-icon class="mono-icon i-mdi-close" aria-hidden="true"></span>
                </button>
            </div>
        </div>
        <br>
        <DemoLog :text="log" max-height="100px" />
    </div>
</template>
