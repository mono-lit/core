<script setup>
    import '@mono-lit/helper/ui/tabs'
    import { ref } from 'vue'

    const items = [
        { id: 'inbox', label: 'Inbox', badge: 12 },
        { id: 'sent', label: 'Sent', badge: 3 },
        { id: 'drafts', label: 'Drafts', badge: 28 },
        { id: 'trash', label: 'Trash' },
    ]

    const active = ref('inbox')
</script>

<template>
    <mono-tabs style="width: fit-content;"
        :items.prop="items"
        :model-value="active"
        @change="active = $event.detail.modelValue"
    ></mono-tabs>
</template>
