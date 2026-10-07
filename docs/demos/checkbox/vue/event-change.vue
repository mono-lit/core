<script setup>
    import '@mono-lit/helper/ui/checkbox'
    import { ref } from 'vue'

    const checked = ref(false)
</script>

<template>
    <div>
        <mono-checkbox
            :model-value="checked"
            @change="checked = $event.detail.modelValue"
            label="Toggle me"
        />
          <br>
           <br>
        <div class=" event-demo-status">{{ checked ? 'checked' : 'unchecked' }}</div>
    </div>
</template>
