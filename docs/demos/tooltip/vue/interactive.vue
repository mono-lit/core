<script setup>
import { onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/button'
import { controlMonoTooltip } from '@mono-lit/helper'

// `interactive` keeps it open while the pointer is over the bubble, so its
// content can be clicked. `allowHTML` renders string content as markup — only
// ever pass trusted HTML.
const html = controlMonoTooltip('[data-tip="html"]', {
    content: '<strong>Keyboard:</strong> <kbd>Ctrl</kbd> + <kbd>S</kbd><br><a href="#interactive">Read more</a>',
    allowHTML: true,
    interactive: true,
    variant: 'popover',
})

// A function is called with the anchor on every show — one controller, per-row text.
const rows = controlMonoTooltip('.example-tooltip-user', {
    content: (el) => `${el.dataset.name} · ${el.dataset.role}`,
    placement: 'right',
})

// …or return a Node.
const node = controlMonoTooltip('[data-tip="node"]', {
    content: () => {
        const box = document.createElement('div')
        const title = document.createElement('div')
        title.style.fontWeight = '600'
        title.textContent = 'Build #482'
        const sub = document.createElement('div')
        sub.style.opacity = '0.8'
        sub.textContent = 'passed in 3m 12s'
        box.append(title, sub)
        return box
    },
})

onBeforeUnmount(() => [html, rows, node].forEach((t) => t.destroy()))
</script>

<template>
    <div class="example-tooltip-interactive-row">
        <mono-button data-tip="html">interactive HTML</mono-button>
        <mono-button data-tip="node" variant="outline">node content</mono-button>
    </div>
    <ul class="example-tooltip-users">
        <li class="example-tooltip-user" data-name="Ana" data-role="Admin">Ana</li>
        <li class="example-tooltip-user" data-name="Budi" data-role="Editor">Budi</li>
        <li class="example-tooltip-user" data-name="Citra" data-role="Viewer">Citra</li>
    </ul>
</template>

<style>
.example-tooltip-interactive-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
}

.example-tooltip-users {
    display: flex;
    gap: 1.5rem;
    margin: 1rem 0 0;
    padding: 0;
    list-style: none;
}

.example-tooltip-user {
    margin: 0;
    cursor: default;
    text-decoration: underline dotted;
}
</style>
