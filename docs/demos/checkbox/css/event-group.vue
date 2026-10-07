<script setup>
import { computed, ref, watch } from 'vue'

const fruits = ['Apples', 'Oranges', 'Bananas']
const values = ref([])
const selectAllEl = ref(null)

const allChecked = computed(() => values.value.length === fruits.length)
const someChecked = computed(() => values.value.length > 0 && !allChecked.value)

watch(someChecked, (v) => {
    if (selectAllEl.value) selectAllEl.value.indeterminate = v
}, { immediate: true })

function toggleAll(e) {
    values.value = e.target.checked ? [...fruits] : []
}
</script>

<template>
    <div>
        <label mono-checkbox>
            <input mono-input type="checkbox"
                ref="selectAllEl"
                :checked="allChecked"
                @change="toggleAll"
            >
            <span mono-box aria-hidden="true"></span>
            <div mono-label>
                <span mono-label-text>Select all</span>
            </div>
        </label>
        <br>
        <template v-for="fruit in fruits" :key="fruit">
            <label mono-checkbox style="margin-left: 1.25rem;">
                <input mono-input type="checkbox" v-model="values" :value="fruit">
                <span mono-box aria-hidden="true"></span>
                <div mono-label>
                    <span mono-label-text>{{ fruit }}</span>
                </div>
            </label>
            <br>
        </template>
    </div>
</template>
