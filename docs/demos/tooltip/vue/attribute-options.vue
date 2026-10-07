<script setup>
import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/input'

// Every option has a `mono-tooltip-<option>` attribute. It beats the global
// createMonoTooltip options for that one element.
</script>

<template>
    <div class="example-tooltip-attrs-row">
        <mono-button mono-tooltip-content="Below" mono-tooltip-placement="bottom" variant="outline">placement</mono-button>
        <mono-button mono-tooltip-content="Danger zone" mono-tooltip-color="danger" color="danger">color</mono-button>
        <mono-button mono-tooltip-content="Popover surface" mono-tooltip-variant="popover" variant="outline">variant</mono-button>
        <mono-button mono-tooltip-content="Large" mono-tooltip-size="lg" variant="outline">size</mono-button>
        <mono-button mono-tooltip-content="Click to toggle" mono-tooltip-trigger="click" variant="outline">trigger</mono-button>
        <mono-button mono-tooltip-content="After 600ms" mono-tooltip-delay="600 100" variant="outline">delay</mono-button>
        <mono-button mono-tooltip-content="No arrow" mono-tooltip-arrow="false" variant="outline">arrow</mono-button>
        <mono-button
            mono-tooltip-content="<b>Bold</b> and a <a href='#attribute-options'>link</a>"
            mono-tooltip-html
            mono-tooltip-interactive
            variant="outline"
        >html + interactive</mono-button>
    </div>
    <div class="example-tooltip-attrs-field">
        <mono-input
            placeholder="Keyboard focus shows it"
            mono-tooltip-content="Only letters and digits"
            mono-tooltip-placement="right"
            mono-tooltip-trigger="focus"
        />
    </div>
</template>

<style>
.example-tooltip-attrs-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
}

.example-tooltip-attrs-field {
    max-width: 16rem;
    margin-top: 1rem;
}
</style>
