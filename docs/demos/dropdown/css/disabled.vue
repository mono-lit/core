<script setup>
const triggerStyle =
    'padding: 0.45rem 0.9rem; border-radius: 8px; border: 1px solid var(--theme-border); background: var(--theme-surface); color: var(--theme-text); cursor: pointer; font: inherit; font-weight: 600; font-size: 0.82rem;'
</script>

<template>
    <div style="padding: 4rem 1rem; display: flex; justify-content: center;">
        <div mono-dropdown mono-disabled>
            <span mono-activator>
                <button type="button" :style="triggerStyle" disabled>Disabled</button>
            </span>
            <div mono-panel role="dialog" aria-hidden="true">
                <div mono-body>You won't see this — the activator refuses to open.</div>
            </div>
        </div>
    </div>
</template>
