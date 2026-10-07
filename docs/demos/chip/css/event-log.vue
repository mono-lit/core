<script setup>
import { ref } from 'vue'

const selected = ref(false)
const lines = ref([])

function onClick() {
    selected.value = !selected.value
    lines.value.unshift('[click] selected=' + selected.value)
}

function onClose(e) {
    e.stopPropagation()
    lines.value.unshift('[close] label=Close me')
}
</script>

<template>
    <div>
        <div mono-chip mono-clickable :mono-selected="selected || null" @click="onClick">
            <span mono-main role="button" tabindex="0">
                <span mono-content><span mono-label>Click me</span></span>
            </span>
        </div>
        <br>
        <div mono-chip mono-color="danger" mono-removable>
            <span mono-main>
                <span mono-content>
                    <span mono-label>Close me</span>
                    <button mono-close type="button" aria-label="Close" @click="onClose">
                        <span mono-glyph class="i-mdi-close" aria-hidden="true"></span>
                    </button>
                </span>
            </span>
        </div>
        <br>
        <br>
        <DemoLog :lines="lines" max-height="80px" />
    </div>
</template>
