<script setup>
import '@mono-lit/helper/ui/menu'
import { ref } from 'vue'

const active = ref('beauty')

const items = [
    {
        id: 'products',
        title: 'Products',
        icon: 'i-mdi-package-variant',
        items: [
            { id: 'beauty', title: 'Beauty', icon: 'i-mdi-lipstick' },
            {
                id: 'skincare',
                title: 'Skincare',
                icon: 'i-mdi-bottle-tonic-outline',
                items: [
                    { id: 'face', title: 'Face', icon: 'i-mdi-emoticon-happy-outline' },
                    { id: 'body', title: 'Body', icon: 'i-mdi-spa-outline' },
                ],
            },
            { id: 'haircare', title: 'Haircare', icon: 'i-mdi-hair-dryer-outline' },
        ],
    },
    { id: 'pricing', title: 'Pricing', icon: 'i-mdi-cash' },
]

const wrapStyle =
    'border: 1px solid var(--theme-border); border-radius: 12px; padding: 0.85rem; background: var(--theme-surface); max-width: 320px;'
</script>

<template>
    <div :style="wrapStyle">
        <mono-menu
            :items.prop="items"
            :model-value="active"
            @change="active = $event.detail.modelValue"
        />
    </div>
    <div style="margin-top: 0.6rem; font-size: 0.78rem; opacity: 0.7;">
        Items with a <code>items</code> array auto-render as an indented sub-list.
        Each level adds 1× <code>--menu-indent</code> and a faint guide rail.
    </div>
</template>
