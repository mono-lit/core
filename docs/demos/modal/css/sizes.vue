<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const sizeMeta = {
    xs: { label: 'Extra small', title: 'size=\"xs\"', body: 'Tightest type and padding.' },
    sm: { label: 'Small', title: 'size=\"sm\"', body: 'Compact type and padding.' },
    md: { label: 'Medium', title: 'size=\"md\" (default)', body: 'The default content scale.' },
    lg: { label: 'Large', title: 'size=\"lg\"', body: 'Roomier type and padding.' },
    xl: { label: 'Extra large', title: 'size=\"xl\"', body: 'Larger still.' },
    xxl: { label: 'XXL', title: 'size=\"xxl\"', body: 'Largest step. Every panel here is the same WIDTH — only the content scale changes.' },
}
const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
const openSize = ref(null)

function onKey(e) {
    if (e.key === 'Escape') openSize.value = null
}

onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
    <div style="width: 100%; display: flex; flex-wrap: wrap; gap: 0.55rem;">
        <div v-for="s in sizes" :key="s" mono-button mono-size="sm"><button mono-native type="button" @click="openSize = s">{{ sizeMeta[s].label }}</button></div>

        <div
            v-for="s in sizes"
            :key="`m-${s}`"
            mono-modal
            :mono-size="s"
            :mono-open="openSize === s ? '' : null"
            role="dialog"
            aria-modal="true"
            :aria-hidden="openSize !== s"
        >
            <div mono-overlay @click="openSize = null"></div>
            <div mono-panel-wrap @click="openSize = null">
                <div mono-panel @click.stop>
                    <div mono-header>
                        <div mono-title>{{ sizeMeta[s].title }}</div>
                        <button type="button" mono-close aria-label="Close" @click="openSize = null">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div mono-body>
                        <p style="margin: 0;">{{ sizeMeta[s].body }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
