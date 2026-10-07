<script setup>
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/select'
import '@mono-lit/helper/ui/date'
import '@mono-lit/helper/ui/tag-input'
import '@mono-lit/helper/ui/button'

const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']

const options = [
    { label: 'Operations', value: 'ops' },
    { label: 'Finance', value: 'fin' },
]
</script>

<template>
    <div class="example-wrap">
        <p class="example-note">
            Every control in a row is the same <code>size</code>, so every field paints
            exactly <code>--theme-control-height-&lt;size&gt;</code> — 24 / 30 / 36 / 40 /
            46 / 52px. Labels sit on one line too, so the blocks match top and bottom.
        </p>

        <div v-for="s in sizes" :key="s" class="example-row">
            <span class="example-size">{{ s }}</span>

            <mono-input :size="s" label="Text" placeholder="Input" clearable />

            <mono-select
                :size="s"
                label="Select"
                placeholder="Select"
                clearable
                :items.prop="options"
                key-value="value"
                display-value="label"
            />

            <mono-date :size="s" label="Date" placeholder="Date" />

            <mono-tag-input :size="s" label="Tags" placeholder="Tags" />

            <mono-button :size="s" color="primary">Button</mono-button>
        </div>
    </div>
</template>

<style scoped>
.example-wrap {
    display: grid;
    gap: 1rem;
    width: 100%;
}

.example-note {
    margin: 0;
    font-size: 0.78rem;
    color: var(--muted-foreground);
}

/* `end` so the fields line up on their bottom edge — the labels above them are a
   single line at every size, so the tops line up as a consequence, not by luck. */
.example-row {
    display: flex;
    align-items: end;
    gap: 0.6rem;
    flex-wrap: wrap;
    min-width: 0;
}

.example-size {
    flex: 0 0 2.5rem;
    align-self: end;
    padding-bottom: 0.55rem;
    font-family: ui-monospace, monospace;
    font-size: 0.72rem;
    color: color-mix(in oklab, var(--muted-foreground) 70%, transparent);
}

.example-row mono-input,
.example-row mono-select,
.example-row mono-date,
.example-row mono-tag-input {
    flex: 1 1 9rem;
    min-width: 0;
}

.example-row mono-button {
    flex: 0 0 auto;
}
</style>
