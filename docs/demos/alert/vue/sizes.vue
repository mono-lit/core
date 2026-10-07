<script setup lang="ts">
import '@mono-lit/helper/ui/alert'
</script>

<template>
    <div style="width: 100%;">
        <mono-alert size="xs" icon="i-mdi-bell-outline" title="xs" subtitle="Every metric is md times a factor."></mono-alert>
        <mono-alert size="sm" icon="i-mdi-bell-outline" title="sm" subtitle="Every metric is md times a factor."></mono-alert>
        <mono-alert icon="i-mdi-bell-outline" title="md (default)" subtitle="Every metric is md times a factor."></mono-alert>
        <mono-alert size="lg" icon="i-mdi-bell-outline" title="lg" subtitle="Every metric is md times a factor."></mono-alert>
        <mono-alert size="xl" icon="i-mdi-bell-outline" title="xl" subtitle="Every metric is md times a factor."></mono-alert>
        <mono-alert size="xxl" icon="i-mdi-bell-outline" title="xxl" subtitle="Every metric is md times a factor."></mono-alert>
    </div>
</template>
