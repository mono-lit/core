<script setup>
import { ref, computed } from 'vue'

const lines = ref([])

function append(line) {
    lines.value = [line, ...lines.value]
}

function onKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        append('[click] via keyboard')
    }
}

const display = computed(() => lines.value.length ? lines.value.join('\n') : 'No events yet...')
</script>

<template>
    <div style="width: 100%;">
        <div
            mono-card mono-clickable
            tabindex="0"
            role="button"
            @click="append('[click] via mouse')"
            @keydown="onKeydown"
        >
            <div mono-header>
                <div mono-header-content>
                    <h3 mono-title>Click or press Enter</h3>
                </div>
            </div>
            <div mono-body>
                <p>Each interaction is logged below.</p>
            </div>
        </div>
        <br>
        <br>
        <DemoLog :text="display" max-height="80px" />
    </div>
</template>
