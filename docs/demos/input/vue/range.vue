<script setup>
    import '@mono-lit/helper/ui/input'
    import { ref } from 'vue'

    const limit = ref('5')
    const achievement = ref('80')
    const volume = ref('40')

    // The value is stored in millions; the readout shows rupiah.
    const rupiah = ({ value }) => 'Rp ' + (Number(value) * 1e6).toLocaleString('id-ID')
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.25rem">
        <mono-input
            type="range"
            label="Limit budget klaim"
            min="0"
            max="20"
            step="0.5"
            :format-display.prop="rupiah"
            :model-value="limit"
            @input="limit = $event.detail.modelValue"
        ></mono-input>

        <mono-input
            type="range"
            label="Pencapaian minimum"
            min="0"
            max="100"
            format-display="{}%"
            :model-value="achievement"
            @input="achievement = $event.detail.modelValue"
        ></mono-input>

        <mono-input
            type="range"
            color="success"
            aria-label="Volume"
            :model-value="volume"
            @input="volume = $event.detail.modelValue"
        ></mono-input>
    </div>
</template>
