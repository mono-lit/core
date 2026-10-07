<script setup>
import { ref } from 'vue'

// The same picker as the Vue tab; the hand-written markup takes the colour as
// the `mono-color` attribute (neutral is the default and emits nothing, and so
// is the `elevated` variant).
const color = ref('neutral')
</script>

<template>
    <div style="width: 100%;">
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="card" />
        </DemoControls>

        <div style="display: grid; gap: 1rem;">
            <div mono-card :mono-color="color === 'neutral' ? null : color">
                <div mono-header>
                    <div mono-header-content>
                        <h3 mono-title>Elevated</h3>
                    </div>
                </div>
                <div mono-body>
                    <p>Default card with shadow.</p>
                </div>
            </div>
            <div mono-card mono-variant="outlined" :mono-color="color === 'neutral' ? null : color">
                <div mono-header>
                    <div mono-header-content>
                        <h3 mono-title>Outlined</h3>
                    </div>
                </div>
                <div mono-body>
                    <p>Card with stronger border and no shadow.</p>
                </div>
            </div>
            <div mono-card mono-variant="flat" :mono-color="color === 'neutral' ? null : color">
                <div mono-header>
                    <div mono-header-content>
                        <h3 mono-title>Flat</h3>
                    </div>
                </div>
                <div mono-body>
                    <p>Card without elevation.</p>
                </div>
            </div>
            <div mono-card mono-variant="tonal" :mono-color="color === 'neutral' ? null : color">
                <div mono-header>
                    <div mono-header-content>
                        <h3 mono-title>Tonal</h3>
                    </div>
                </div>
                <div mono-body>
                    <p>Card with soft background tint.</p>
                </div>
            </div>
            <div mono-card mono-variant="glass" :mono-color="color === 'neutral' ? null : color">
                <div mono-header>
                    <div mono-header-content>
                        <h3 mono-title>Glass</h3>
                    </div>
                </div>
                <div mono-body>
                    <p>Translucent, blurred pane.</p>
                </div>
            </div>
        </div>
    </div>
</template>
