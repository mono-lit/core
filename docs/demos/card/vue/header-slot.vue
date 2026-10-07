<script setup lang="ts">
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/button'
</script>

<template>
    <div class="example-card-header-grid">
        <!-- 1. props -->
        <mono-card bordered title="Props" subtitle="title + subtitle attributes">
            <p>The simplest header: two attributes.</p>
        </mono-card>

        <!-- 2. slots: each replaces ONE line -->
        <mono-card bordered title="ignored — the slot wins">
            <span slot="title">Slot <strong>title</strong></span>
            <span slot="subtitle">Rich subtitle with <a href="#header">a link</a></span>
            <p>A slot beats the prop of the same line.</p>
        </mono-card>

        <!-- 3. header: replaces the icon, title AND subtitle -->
        <mono-card bordered title="ignored" subtitle="ignored too">
            <!-- ignored as well: the header owns the icon's place -->
            <span slot="icon" class="i-mdi-star"></span>
            <div slot="header" class="example-card-header-custom">
                <span class="i-mdi-account-circle example-card-header-icon"></span>
                <strong>Custom header</strong>
                <mono-button size="xs" variant="outline">Follow</mono-button>
            </div>
            <p><code>slot="header"</code> wins over the icon, the title/subtitle slots and the props.</p>
        </mono-card>
    </div>
</template>

<style>
.example-card-header-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
    gap: 1rem;
    width: 100%;
}

.example-card-header-custom {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.example-card-header-custom > mono-button {
    margin-inline-start: auto;
}

.example-card-header-icon {
    font-size: 1.25rem;
}
</style>
