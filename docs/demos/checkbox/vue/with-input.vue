<script setup>
// Does a checkbox actually read as a peer of an input at the same `size`?
// One block per step with the checkbox stacked directly BELOW its input — the
// arrangement that made the old `xs` box look like a speck, so it is the one
// worth checking against.
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/checkbox'

const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
</script>

<template>
    <div class="example-demo">
        <div v-for="s in sizes" :key="s" class="example-block">
            <span class="example-label">{{ s }}</span>

            <mono-input :size="s" class="example-field" :placeholder="`Input (${s})`"></mono-input>

            <div class="example-row">
                <mono-checkbox :size="s" label="Checkbox" model-value></mono-checkbox>
                <mono-checkbox :size="s" label="With sublabel" sublabel="Secondary line"></mono-checkbox>
            </div>
        </div>
    </div>
</template>

<style scoped>
.example-demo {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    width: 100%;
}

.example-block {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    align-items: flex-start;
}

.example-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    opacity: 0.55;
}

.example-field {
    width: 100%;
    max-width: 22rem;
}

/* The checkbox sits under the field with their left edges aligned, so the box can
   be compared straight down against the input's own border. */
.example-row {
    display: flex;
    align-items: flex-start;
    gap: 1.5rem;
    flex-wrap: wrap;
}
</style>
