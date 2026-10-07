<script setup>
    import '@mono-lit/helper/ui/button'

    const work = () => new Promise((resolve) => setTimeout(resolve, 1600))
</script>

<template>
    <div class="example-loading-icon">
        <!-- The spinner takes the icon's place, so it follows `icon-position`. -->
        <mono-button color="primary" :handler.prop="work">
            <span slot="icon" class="i-mdi-content-save"></span>
            Leading icon
        </mono-button>

        <mono-button color="primary" icon-position="right" :handler.prop="work">
            <span slot="icon" class="i-mdi-arrow-right"></span>
            Trailing icon
        </mono-button>

        <!-- No icon: the button grows a leading spinner in the slot an icon would have used. -->
        <mono-button color="secondary" variant="outline" :handler.prop="work">
            No icon
        </mono-button>

        <!-- Icon-only: the icon is the whole content, so the spinner simply replaces it. -->
        <mono-button icon-only color="primary" :handler.prop="work">
            <span slot="icon" class="i-mdi-refresh"></span>
        </mono-button>
    </div>
</template>

<style scoped>
.example-loading-icon {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
}
</style>
