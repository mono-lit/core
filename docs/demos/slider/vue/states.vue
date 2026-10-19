<script setup>
    import '@mono-lit/helper/ui/slider'
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <mono-slider label="Disabled" disabled :model-value.prop="[20, 60]" helper-text="Not adjustable now."></mono-slider>
        <mono-slider label="Readonly" readonly :model-value.prop="45" helper-text="Focusable, but it never moves."></mono-slider>
        <mono-slider label="Required" required :model-value.prop="30"></mono-slider>
        <mono-slider label="Invalid" validation-state="invalid" validation-message="The range is too wide." :model-value.prop="[5, 95]"></mono-slider>
        <mono-slider label="Valid" validation-state="valid" validation-message="Looks good." :model-value.prop="[30, 60]"></mono-slider>
    </div>
</template>
