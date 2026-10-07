<script setup>
import { ref } from 'vue'

const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
const active = ref(sizes.map(() => 0))
</script>

<template>
    <div style="display: grid; gap: 1.5rem;">
        <div
            v-for="(size, idx) in sizes"
            :key="size"
            mono-tabs
            :mono-size="size"
            role="tablist"
        >
            <button
                v-for="(label, i) in ['Overview', 'Details', 'History']"
                :key="label"
                type="button"
                mono-tab
                :aria-selected="active[idx] === i"
                role="tab"
                @click="active[idx] = i"
            >
                <span mono-label>{{ label }}</span>
            </button>
        </div>
    </div>
</template>
