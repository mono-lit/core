<script setup>
import '@mono-lit/helper/ui/menu'
import { ref } from 'vue'

const selected = ref(['email', 'sms'])

const items = [
    { id: 'email', title: 'Email', icon: 'i-mdi-email-outline' },
    { id: 'sms', title: 'SMS', icon: 'i-mdi-comment-outline' },
    { id: 'push', title: 'Push notifications', icon: 'i-mdi-bell-outline' },
    { id: 'webhook', title: 'Webhook', icon: 'i-mdi-hook' },
    { id: 'slack', title: 'Slack', icon: 'i-mdi-briefcase-outline' },
]

const wrapStyle =
    'border: 1px solid var(--theme-border); border-radius: 12px; padding: 0.85rem; background: var(--theme-surface); max-width: 280px;'
</script>

<template>
    <div :style="wrapStyle">
        <mono-menu
            :items.prop="items"
            :multiple="true"
            :model-value.prop="selected"
            @change="selected = $event.detail.modelValue"
        />
    </div>
    <div style="margin-top: 0.6rem; font-size: 0.78rem; opacity: 0.7;">
        Selected: <code>{{ JSON.stringify(selected) }}</code>. With
        <code>multiple="true"</code>, click toggles each item independently and
        <code>modelValue</code> is an array of ids.
    </div>
</template>
