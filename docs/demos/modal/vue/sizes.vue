<script setup>
    import '@mono-lit/helper/ui/modal'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const active = ref(null)

    // `size` scales the CONTENT — header/title type, body type, padding, the close
    // button and the corner radius. Every one of these panels is the same width;
    // use `width` when you want a different measure.
    const sizes = [
        ['xs', 'Extra small'],
        ['sm', 'Small'],
        ['md', 'Medium (default)'],
        ['lg', 'Large'],
        ['xl', 'Extra large'],
        ['xxl', 'Extra extra large'],
    ]
</script>

<template>
    <div style="width: 100%; display: flex; flex-wrap: wrap; gap: 0.55rem;">
        <mono-button v-for="[size, label] in sizes" :key="size" size="sm" @click="active = size">
            {{ label }}
        </mono-button>

        <mono-modal
            v-for="[size, label] in sizes"
            :key="size"
            :size="size"
            :title="`${label} — size=&quot;${size}&quot;`"
            :model-value="active === size"
            @close="active = null"
        >
            <p style="margin: 0;">
                The panel is the same width at every size — only the type scale and the
                padding change. Reach for <code>width</code> to change the measure.
            </p>
        </mono-modal>
    </div>
</template>
