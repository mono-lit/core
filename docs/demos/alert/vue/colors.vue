<script setup lang="ts">
import '@mono-lit/helper/ui/alert'
</script>

<template>
    <div style="width: 100%;">
        <mono-alert variant="tonal" title="neutral (default)" subtitle="The plain alert."></mono-alert>
        <mono-alert variant="tonal" color="primary" title="primary" subtitle="variant: tonal"></mono-alert>
        <mono-alert variant="tonal" color="secondary" title="secondary" subtitle="variant: tonal"></mono-alert>
        <mono-alert variant="tonal" color="success" icon="i-mdi-check-circle-outline" title="success" subtitle="variant: tonal"></mono-alert>
        <mono-alert variant="tonal" color="danger" icon="i-mdi-alert-circle-outline" title="danger" subtitle="variant: tonal"></mono-alert>
        <mono-alert variant="tonal" color="warning" icon="i-mdi-alert-outline" title="warning" subtitle="variant: tonal"></mono-alert>
        <mono-alert variant="tonal" color="info" icon="i-mdi-information-outline" title="info" subtitle="variant: tonal"></mono-alert>
        <mono-alert variant="tonal" color="teal" title="teal" subtitle="variant: tonal"></mono-alert>
        <mono-alert variant="tonal" color="purple" title="purple" subtitle="variant: tonal"></mono-alert>
        <mono-alert variant="tonal" color="dark" title="dark" subtitle="variant: tonal"></mono-alert>
    </div>
</template>
