<script setup>
    import '@mono-lit/helper/ui/chip'
    import { reactive, computed } from 'vue'

    const filters = reactive([
        { label: 'JavaScript', selected: false },
        { label: 'TypeScript', selected: false },
        { label: 'Python', selected: false },
        { label: 'Rust', selected: false },
    ])

    const selectedLabels = computed(() => filters.filter((f) => f.selected).map((f) => f.label))

    function onToggle(filter, event) {
        filter.selected = event.detail.modelValue
    }
</script>

<template>
    <div>
        <template v-for="filter in filters" :key="filter.label">
            <mono-chip
                color="primary"
                clickable
                :model-value="filter.selected"
                @click="onToggle(filter, $event)"
            >
                {{ filter.label }}
            </mono-chip>
            <br>
        </template>
        <br>
        <div class="event-demo-status">
            selected: {{ selectedLabels.length ? selectedLabels.join(', ') : 'none' }}
        </div>
    </div>
</template>
