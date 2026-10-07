<script setup>
const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
</script>

<template>
    <div class="example-wrap">
        <p class="example-note">
            The same alignment without Lit — attribute-styled markup reaches the identical
            per-size rules, so a hand-written field lands on
            <code>--mono-control-height-&lt;size&gt;</code> too.
        </p>

        <div v-for="s in sizes" :key="s" class="example-row">
            <span class="example-size">{{ s }}</span>

            <div mono-input :mono-size="s === 'md' ? null : s">
                <label mono-label>Text</label>
                <div mono-field>
                    <input mono-native type="text" placeholder="Input" />
                </div>
            </div>

            <div mono-select :mono-size="s === 'md' ? null : s">
                <label mono-label>Select</label>
                <button type="button" mono-trigger aria-haspopup="listbox" aria-expanded="false">
                    <span mono-value mono-placeholder>Select</span>
                    <span mono-actions>
                        <span mono-arrow role="button" tabindex="-1" aria-label="Toggle options"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                    </span>
                </button>
            </div>

            <div mono-date :mono-size="s === 'md' ? null : s">
                <label mono-label>Date</label>
                <div mono-field>
                    <span mono-prefix aria-hidden="true"><span mono-icon class="mono-icon i-mdi-calendar-outline"></span></span>
                    <input mono-native type="text" placeholder="Date" />
                </div>
            </div>

            <div mono-button :mono-size="s === 'md' ? null : s">
                <button mono-native type="button">
                    <div mono-content>
                        <span mono-icon mono-empty></span>
                        <span mono-text>Button</span>
                    </div>
                </button>
            </div>
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

.example-row [mono-input],
.example-row [mono-select],
.example-row [mono-date] {
    flex: 1 1 9rem;
    min-width: 0;
}

.example-row [mono-button] {
    flex: 0 0 auto;
}
</style>
