<script setup>
    import '@mono-lit/helper/ui/textarea'
    import { ref } from 'vue'

    const value = ref('')
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1rem;">
        <mono-textarea
            label="Reason for leave"
            placeholder="Describe briefly"
            helper-text="Visible to your manager."
            tooltip="Medical details are not required. HR may ask for a certificate for absences longer than two days."
            :model-value="value"
            @input="value = $event.detail.modelValue"
        ></mono-textarea>

        <mono-textarea
            label="Audit note"
            model-value="Approved by the finance team."
            disabled
            :tooltip.prop="{ content: 'Locked after approval.', placement: 'right', color: 'danger' }"
        ></mono-textarea>
    </div>
</template>
