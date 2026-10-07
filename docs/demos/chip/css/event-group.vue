<script setup>
import { ref, computed } from 'vue'

const filters = ['JavaScript', 'TypeScript', 'Python', 'Rust']
const selected = ref(new Set())

function toggle(f) {
    if (selected.value.has(f)) selected.value.delete(f)
    else selected.value.add(f)
    selected.value = new Set(selected.value)
}

const status = computed(() => {
    const arr = filters.filter((f) => selected.value.has(f))
    return 'selected: ' + (arr.length ? arr.join(', ') : 'none')
})
</script>

<template>
    <div>
        <template v-for="f in filters" :key="f">
            <div mono-chip mono-clickable :mono-selected="selected.has(f) || null" @click="toggle(f)">
                <span mono-main role="button" tabindex="0">
                    <span mono-content><span mono-label>{{ f }}</span></span>
                </span>
            </div>
            <br>
        </template>
        <br>
        <div class="event-demo-status">{{ status }}</div>
    </div>
</template>
