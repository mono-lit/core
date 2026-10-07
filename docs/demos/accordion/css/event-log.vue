<script setup>
import { ref } from 'vue'

const empty = 'No events yet...'
const open = ref(false)
const log = ref(empty)

function toggle() {
    const oldOpen = open.value
    const next = !oldOpen
    open.value = next
    const line = '[click] open=' + next + ' old=' + oldOpen
    log.value = log.value === empty ? line : line + '\n' + log.value
}
</script>

<template>
    <div style="width: 100%;">
        <div mono-accordion :mono-open="open ? '' : null">
            <button
                type="button"
                mono-head
                :aria-expanded="open"
                @click="toggle"
            >
                <span mono-glyph aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                        <circle cx="18" cy="5" r="3" fill="currentColor"></circle>
                    </svg>
                </span>
                <span mono-heading>
                    <span mono-title>Event accordion</span>
                    <span mono-description>Toggle me to see events fire.</span>
                </span>
                <span mono-arrow aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>
            <div mono-body role="region"><div>
                Body content. Each open/close click fires a <code>click</code> log entry with
                the new and old open states.
            </div></div>
        </div>
        <br>
        <DemoLog :text="log" />
    </div>
</template>
