<script setup>
import '@mono-lit/helper/ui/checkbox'
import { reactive, computed } from 'vue'

const fruits = reactive([
  { label: 'Apples', checked: false },
  { label: 'Oranges', checked: false },
  { label: 'Bananas', checked: false },
])

const allChecked = computed(() => fruits.every((f) => f.checked))
const someChecked = computed(() => fruits.some((f) => f.checked))
const isIndeterminate = computed(() => someChecked.value && !allChecked.value)

function onSelectAll(event) {
  const next = event.detail.modelValue

  fruits.forEach((fruit) => {
    fruit.checked = next
  })
}

function onFruitChange(fruit, event) {
  fruit.checked = event.detail.modelValue
}
</script>

<template>
  <div>
    <mono-checkbox :model-value="allChecked" :indeterminate="isIndeterminate" label="Select all"
      @change="onSelectAll" />

    <br>

    <template v-for="fruit in fruits" :key="fruit.label">
      <mono-checkbox :model-value="fruit.checked" :label="fruit.label" style="margin-left: 1.25rem;"
        @change="onFruitChange(fruit, $event)" />
      <br>
    </template>

  </div>
</template>