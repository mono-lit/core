<script setup lang="ts">
import '@mono-lit/helper/ui/card'

// `size` is the CONTENT scale — padding, title/subtitle type, the header and
// actions gaps, and the header icon box. Every card below fills the same container,
// so the only thing changing between them is the density inside.
//
// Corner radius is NOT part of this scale: that is the `rounded` prop's job.
//
// The icon is an iconify class (`i-mdi-*`), not a text glyph: `.card-icon > *` is
// sized by `--mono-card-icon-inner-size`, and only a background-image icon actually
// scales with it — a character keeps whatever font-size it inherited, so the box
// would grow while the glyph stayed put.
const sizes = [
    ['xs', 'Extra small'],
    ['sm', 'Small'],
    ['md', 'Medium (default)'],
    ['lg', 'Large'],
    ['xl', 'Extra large'],
    ['xxl', 'Extra extra large'],
] as const
</script>

<template>
    <div style="display: grid; gap: 0.75rem; width: 100%;">
        <mono-card v-for="[size, label] in sizes" :key="size" :size="size"  color="primary">
            <span slot="icon" class="i-mdi-star flex items-center justify-center"></span>
            <h3 slot="title">{{ label }}</h3>
            <p slot="subtitle">size="{{ size }}"</p>
            <p style="margin: 0;">
                Same width at every step — only the padding, type, gaps and icon scale.
            </p>
        </mono-card>
    </div>
</template>
