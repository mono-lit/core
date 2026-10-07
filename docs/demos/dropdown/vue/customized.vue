<script setup>
import '@mono-lit/helper/ui/dropdown'

const triggerStyle =
    'padding: 0.45rem 0.9rem; border-radius: 8px; border: 1px solid var(--border); background: var(--background); color: var(--foreground); cursor: pointer; font: inherit; font-weight: 600; font-size: 0.82rem;'
</script>

<template>
    <div style="padding: 4rem 1rem; display: flex; justify-content: center;">
        <mono-dropdown
            placement="bottom-start"
            color="success"
            :css-class.prop="{
                panel: 'shadow-xl',
                body: 'italic',
            }"
        >
            <button slot="main" type="button" :style="triggerStyle">Customized</button>
            <div slot="body">
                Italic body, beefier shadow — overrides applied via the
                <code>cssClass</code> prop. Theme accent unchanged.
            </div>
        </mono-dropdown>
    </div>
</template>
