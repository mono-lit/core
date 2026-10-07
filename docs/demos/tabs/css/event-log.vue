<script setup>
import { ref } from 'vue'

const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'klaim', label: 'Klaim', badge: '12' },
    { id: 'target', label: 'Target' },
]
const active = ref('overview')
const empty = 'No events yet...'
const log = ref(empty)

function pick(id) {
    if (id === active.value) return
    const old = active.value
    active.value = id
    const line = '[click] value=' + JSON.stringify(id) + ' old=' + JSON.stringify(old)
    log.value = log.value === empty ? line : line + '\n' + log.value
}
</script>

<template>
    <div>
        <div mono-tabs role="tablist">
            <button
                v-for="tab in tabs"
                :key="tab.id"
                type="button"
                mono-tab
                :aria-selected="active === tab.id"
                role="tab"
                @click="pick(tab.id)"
            >
                <span mono-label>{{ tab.label }}</span>
                <span v-if="tab.badge" mono-badge>{{ tab.badge }}</span>
            </button>
        </div>
        <br>
        <DemoLog :text="log" />
    </div>
</template>
