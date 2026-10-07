<script setup>
const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
</script>

<template>
    <div class="example-demo">
        <div v-for="s in sizes" :key="s" class="example-block">
            <span class="example-label">{{ s }}</span>

            <div mono-input :mono-size="s === 'md' ? null : s" class="example-field">
                <div mono-field>
                    <input mono-native type="text" :placeholder="`Input (${s})`" />
                </div>
            </div>

            <div class="example-row">
                <label mono-checkbox :mono-size="s === 'md' ? null : s">
                    <input mono-input type="checkbox" checked />
                    <span mono-box aria-hidden="true"></span>
                    <div mono-label>
                        <span mono-label-text>Checkbox</span>
                    </div>
                </label>

                <label mono-checkbox :mono-size="s === 'md' ? null : s">
                    <input mono-input type="checkbox" />
                    <span mono-box aria-hidden="true"></span>
                    <div mono-label>
                        <span mono-label-text>With description</span>
                        <span mono-description>Secondary line</span>
                    </div>
                </label>
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

.example-row {
    display: flex;
    align-items: flex-start;
    gap: 1.5rem;
    flex-wrap: wrap;
}
</style>
