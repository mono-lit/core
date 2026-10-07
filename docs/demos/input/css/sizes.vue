<script setup>
const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
const labels = { xs: 'Extra small', sm: 'Small', md: 'Medium', lg: 'Large', xl: 'Extra large', xxl: '2X large' }
</script>

<template>
    <div style="display: grid; gap: 1rem; width: 100%;">
        <!-- `mono-size` mirrors the prop; `md` is the default, so the element emits no attribute for it. -->
        <div v-for="s in sizes" :key="s" mono-input :mono-size="s === 'md' ? null : s">
            <label mono-label>{{ labels[s] }}</label>
            <div mono-field>
                <input mono-native type="text" :placeholder="labels[s] + ' input'" />
            </div>
        </div>
    </div>
</template>
