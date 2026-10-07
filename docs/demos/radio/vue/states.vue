<script setup>
    import '@mono-lit/helper/ui/radio'
</script>

<template>
    <div style="display: grid; gap: 0.5rem;">
        <mono-radio label="Selected" value="a" model-value="a"></mono-radio>
        <mono-radio label="Unselected" value="b" model-value=""></mono-radio>
        <mono-radio label="Disabled, unselected" value="c" disabled></mono-radio>
        <mono-radio label="Disabled, selected" value="d" model-value="d" disabled></mono-radio>
    </div>
</template>
