<script setup>
import { ref, computed } from 'vue'

const items = [
    { id: 'email', title: 'Email', icon: 'i-mdi-email-outline' },
    { id: 'sms', title: 'SMS', icon: 'i-mdi-comment-outline' },
    { id: 'push', title: 'Push notifications', icon: 'i-mdi-bell-outline' },
    { id: 'webhook', title: 'Webhook', icon: 'i-mdi-hook' },
    { id: 'slack', title: 'Slack', icon: 'i-mdi-briefcase-outline' },
]
const selected = ref(new Set(['email', 'sms']))

function toggle(id) {
    if (selected.value.has(id)) selected.value.delete(id)
    else selected.value.add(id)
    selected.value = new Set(selected.value)
}

const out = computed(() => {
    const labels = items.filter((it) => selected.value.has(it.id)).map((it) => it.title.toLowerCase())
    return labels.length ? labels.join(', ') : '(none)'
})

const wrapStyle =
    'border: 1px solid var(--theme-border); border-radius: 12px; padding: 0.85rem; background: var(--theme-surface); max-width: 280px;'
</script>

<template>
    <div :style="wrapStyle">
        <nav mono-menu>
            <ul mono-list role="listbox" aria-multiselectable="true">
                <li
                    v-for="it in items"
                    :key="it.id"
                    mono-item
                    :mono-active="selected.has(it.id) ? '' : null"
                >
                    <button
                        type="button"
                        mono-action
                        role="option"
                        :aria-selected="selected.has(it.id)"
                        @click="toggle(it.id)"
                    >
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph :class="it.icon"></span>
                        </span>
                        <span mono-content><span mono-title>{{ it.title }}</span></span>
                    </button>
                </li>
            </ul>
        </nav>
    </div>
    <div style="margin-top: 0.6rem; font-size: 0.78rem; opacity: 0.7;">
        Selected: <code>{{ out }}</code>. With
        <code>multiple="true"</code>, click toggles each item independently and
        <code>modelValue</code> is an array of ids.
    </div>
</template>
