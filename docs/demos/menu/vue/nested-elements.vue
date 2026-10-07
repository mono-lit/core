<script setup>
import '@mono-lit/helper/ui/menu'
import { ref } from 'vue'

const active = ref('deep-c')

const wrapStyle =
    'box-sizing: border-box; width: 100%; border: 1px solid var(--theme-border); border-radius: 12px; padding: 0.85rem; background: var(--theme-surface); max-width: 320px;'
</script>

<template>
    <div :style="wrapStyle">
        <mono-menu
            :model-value="active"
            @change="active = $event.detail.modelValue"
        >
            <div slot="body">
                <mono-menu-list type="subheader" id="sh-shop" title="Shop"></mono-menu-list>

                <mono-menu-list type="group" id="catalog" title="Catalog" icon="i-mdi-package-variant" default-open>
                    <mono-menu-list type="children" id="overview" title="Overview" icon="i-mdi-note-text-outline"></mono-menu-list>

                    <mono-menu-list type="group" id="products" title="Products" icon="i-mdi-cart-outline" default-open>
                        <mono-menu-list type="children" id="beauty" title="Beauty" icon="i-mdi-lipstick"></mono-menu-list>

                        <mono-menu-list type="group" id="skincare" title="Skincare" icon="i-mdi-bottle-tonic-outline">
                            <mono-menu-list type="children" id="deep-a" title="Face care" icon="i-mdi-emoticon-happy-outline"></mono-menu-list>
                            <mono-menu-list type="children" id="deep-b" title="Body care" icon="i-mdi-spa-outline"></mono-menu-list>
                            <mono-menu-list type="children" id="deep-c" title="Hair care" icon="i-mdi-hair-dryer-outline" badge="NEW" badge-color="danger"></mono-menu-list>
                        </mono-menu-list>

                        <mono-menu-list type="children" id="accessories" title="Accessories" icon="i-mdi-ribbon"></mono-menu-list>
                    </mono-menu-list>

                    <mono-menu-list type="divider" id="d-1"></mono-menu-list>
                    <mono-menu-list type="children" id="pricing" title="Pricing" icon="i-mdi-cash" badge="12" badge-color="primary"></mono-menu-list>
                </mono-menu-list>

                <mono-menu-list type="divider" id="d-2"></mono-menu-list>
                <mono-menu-list type="subheader" id="sh-account" title="Account"></mono-menu-list>
                <mono-menu-list type="children" id="profile" title="Profile" icon="i-mdi-account"></mono-menu-list>
                <mono-menu-list type="children" id="settings" title="Settings" icon="i-mdi-cog"></mono-menu-list>
            </div>
        </mono-menu>
    </div>
    <div style="margin-top: 0.6rem; font-size: 0.78rem; opacity: 0.7;">
        Active: <code>{{ active }}</code>. Each <code>&lt;mono-menu-list&gt;</code>
        is a single row; nest them as deep as you like and any other HTML can sit
        inside too — content is captured into the row's body slot.
    </div>
</template>
