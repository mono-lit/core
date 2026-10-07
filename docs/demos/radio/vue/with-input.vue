<script setup>
// Does a radio actually read as a peer of an input at the same `size`?
// One block per step with the radio stacked directly BELOW its input — the
// arrangement that made the old `xs` circle look like a speck, so it is the one
// worth checking against.
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/radio'
import { ref } from 'vue'

const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']

// One selection per size row. `model-value` is the GROUP's value compared against
// each radio's `value` — it is not a boolean, and two radios with neither set would
// both match and both render selected.
const selected = ref(Object.fromEntries(sizes.map((s) => [s, 'one'])))

function pick(size, event) {
    selected.value = { ...selected.value, [size]: event.detail.modelValue }
}
</script>

<template>
    <div class="example-demo">
        <div v-for="s in sizes" :key="s" class="example-block">
            <span class="example-label">{{ s }}</span>

            <mono-input :size="s" class="example-field" :placeholder="`Input (${s})`"></mono-input>

            <div class="example-row">
                <mono-radio
                    :size="s"
                    label="Radio"
                    value="one"
                    :model-value="selected[s]"
                    @change="pick(s, $event)"
                ></mono-radio>
                <mono-radio
                    :size="s"
                    label="With description"
                    sublabel="Secondary line"
                    value="two"
                    :model-value="selected[s]"
                    @change="pick(s, $event)"
                ></mono-radio>
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

/* The radio sits under the field with their left edges aligned, so the circle can
   be compared straight down against the input's own border. */
.example-row {
    display: flex;
    align-items: flex-start;
    gap: 1.5rem;
    flex-wrap: wrap;
}
</style>
