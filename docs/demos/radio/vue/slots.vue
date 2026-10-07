<script setup>
    import '@mono-lit/helper/ui/radio'
    import { ref } from 'vue'

    const selected = ref('email')

    function pick(event) {
        selected.value = event.detail.modelValue
    }
</script>

<template>
    <div style="display: grid; gap: 0.75rem;">
        <mono-radio
            value="email"
            :model-value="selected"
            @change="pick"
        >
            <span slot="label">📧 Email me</span>
            <span slot="sublabel">Send a daily digest to your inbox.</span>
        </mono-radio>
        <mono-radio
            value="sms"
            :model-value="selected"
            @change="pick"
        >
            <span slot="label">📱 Text me</span>
            <span slot="sublabel">Send updates to your phone via SMS.</span>
        </mono-radio>
    </div>
</template>
