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
</script>

<template>
    <div style="width: 100%">
        <div mono-textarea>
            <label mono-label>Event Textarea</label>
            <textarea
                mono-native
                placeholder="Type, then blur"
                rows="3"
                v-model="value"
                @input="onInput"
                @change="onChange"
            ></textarea>
        </div>
        <br>
        <DemoLog :text="log" />
    </div>
</template>
