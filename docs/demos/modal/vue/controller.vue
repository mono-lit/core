<script setup>
    import '@mono-lit/helper/ui/modal'
    import '@mono-lit/helper/ui/button'
    import { controlMonoModal } from '@mono-lit/helper'
    import { onBeforeUnmount, ref } from 'vue'

    const log = ref([])
    const say = (line) => (log.value = [line, ...log.value].slice(0, 4))

    // The controller owns the props and the open state. `:control-modal.prop`
    // binds the element; its own attributes lose to `props`. Its events live in
    // `props` too — `onOpen` / `onClose` are attached to the bound element as
    // listeners, with the same event a template `@close` would get.
    const modal = controlMonoModal({
        props: {
            title: 'Driven by a controller',
            size: 'sm',
            width: 'md',
            color: 'primary',
            onOpen: () => say('onOpen'),
            onClose: (event) => say(`onClose (${event.detail.source})`),
        },
    })

    const stop = modal.subscribe(() => say(`isOpen: ${modal.isOpen}`))
    onBeforeUnmount(() => { stop(); modal.dispose() })

    const retitle = () => modal.setProps({ title: `Retitled at ${new Date().toLocaleTimeString()}`, color: 'success' })
</script>

<template>
    <div style="display: grid; gap: 0.55rem;">
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <mono-button @click="modal.open()">Open</mono-button>
            <mono-button variant="outline" @click="retitle()">setProps (title, color)</mono-button>
        </div>
        <div style="font-size: 0.78rem; opacity: 0.7;">{{ log.join(' · ') || 'no changes yet' }}</div>

        <mono-modal :control-modal.prop="modal" title="attribute title (loses)">
            <p style="margin: 0;">Close me with ✕, the overlay or Escape — the controller's <code>isOpen</code> follows.</p>
            <mono-button slot="footer" size="sm" variant="tonal" color="secondary" @click="modal.close()">Close</mono-button>
        </mono-modal>
    </div>
</template>
