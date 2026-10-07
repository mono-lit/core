<script setup>
import { ref } from 'vue'

const active = ref('deep-c')
const open = ref(new Set(['catalog', 'products']))

function toggle(id) {
    if (open.value.has(id)) open.value.delete(id)
    else open.value.add(id)
    open.value = new Set(open.value)
}
function pick(id) { active.value = id }

const wrapStyle =
    'box-sizing: border-box; width: 100%; border: 1px solid var(--theme-border); border-radius: 12px; padding: 0.85rem; background: var(--theme-surface); max-width: 320px;'
</script>

<template>
    <div :style="wrapStyle">
        <nav mono-menu>
            <ul mono-list role="listbox">
                <li mono-subheader>Shop</li>

                <li
                    mono-item
                    mono-group
                    :mono-open="open.has('catalog') ? '' : null"
                >
                    <button
                        type="button"
                        mono-group-header
                        :aria-expanded="open.has('catalog')"
                        @click="toggle('catalog')"
                    >
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-package-variant"></span>
                        </span>
                        <span mono-content><span mono-title>Catalog</span></span>
                        <span mono-chevron>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </span>
                    </button>
                    <ul mono-list mono-group-body>
                        <li mono-item :mono-active="active === 'overview' ? '' : null">
                            <button type="button" mono-action role="option" :aria-selected="active === 'overview'" @click="pick('overview')">
                                <span mono-icon aria-hidden="true">
                                    <span mono-glyph class="i-mdi-note-text-outline"></span>
                                </span>
                                <span mono-content><span mono-title>Overview</span></span>
                            </button>
                        </li>

                        <li mono-item mono-group :mono-open="open.has('products') ? '' : null">
                            <button
                                type="button"
                                mono-group-header
                                :aria-expanded="open.has('products')"
                                @click="toggle('products')"
                            >
                                <span mono-icon aria-hidden="true">
                                    <span mono-glyph class="i-mdi-cart-outline"></span>
                                </span>
                                <span mono-content><span mono-title>Products</span></span>
                                <span mono-chevron>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </span>
                            </button>
                            <ul mono-list mono-group-body>
                                <li mono-item :mono-active="active === 'beauty' ? '' : null">
                                    <button type="button" mono-action role="option" :aria-selected="active === 'beauty'" @click="pick('beauty')">
                                        <span mono-icon aria-hidden="true">
                                            <span mono-glyph class="i-mdi-lipstick"></span>
                                        </span>
                                        <span mono-content><span mono-title>Beauty</span></span>
                                    </button>
                                </li>

                                <li mono-item mono-group :mono-open="open.has('skincare') ? '' : null">
                                    <button
                                        type="button"
                                        mono-group-header
                                        :aria-expanded="open.has('skincare')"
                                        @click="toggle('skincare')"
                                    >
                                        <span mono-icon aria-hidden="true">
                                            <span mono-glyph class="i-mdi-bottle-tonic-outline"></span>
                                        </span>
                                        <span mono-content><span mono-title>Skincare</span></span>
                                        <span mono-chevron>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                        </span>
                                    </button>
                                    <ul mono-list mono-group-body>
                                        <li mono-item :mono-active="active === 'deep-a' ? '' : null">
                                            <button type="button" mono-action role="option" :aria-selected="active === 'deep-a'" @click="pick('deep-a')">
                                                <span mono-icon aria-hidden="true">
                                                    <span mono-glyph class="i-mdi-emoticon-happy-outline"></span>
                                                </span>
                                                <span mono-content><span mono-title>Face care</span></span>
                                            </button>
                                        </li>
                                        <li mono-item :mono-active="active === 'deep-b' ? '' : null">
                                            <button type="button" mono-action role="option" :aria-selected="active === 'deep-b'" @click="pick('deep-b')">
                                                <span mono-icon aria-hidden="true">
                                                    <span mono-glyph class="i-mdi-spa-outline"></span>
                                                </span>
                                                <span mono-content><span mono-title>Body care</span></span>
                                            </button>
                                        </li>
                                        <li mono-item :mono-active="active === 'deep-c' ? '' : null">
                                            <button type="button" mono-action role="option" :aria-selected="active === 'deep-c'" @click="pick('deep-c')">
                                                <span mono-icon aria-hidden="true">
                                                    <span mono-glyph class="i-mdi-hair-dryer-outline"></span>
                                                </span>
                                                <span mono-content><span mono-title>Hair care</span></span>
                                                <span mono-badge="danger">NEW</span>
                                            </button>
                                        </li>
                                    </ul>
                                </li>

                                <li mono-item :mono-active="active === 'accessories' ? '' : null">
                                    <button type="button" mono-action role="option" :aria-selected="active === 'accessories'" @click="pick('accessories')">
                                        <span mono-icon aria-hidden="true">
                                            <span mono-glyph class="i-mdi-ribbon"></span>
                                        </span>
                                        <span mono-content><span mono-title>Accessories</span></span>
                                    </button>
                                </li>
                            </ul>
                        </li>

                        <li mono-divider role="separator"></li>
                        <li mono-item :mono-active="active === 'pricing' ? '' : null">
                            <button type="button" mono-action role="option" :aria-selected="active === 'pricing'" @click="pick('pricing')">
                                <span mono-icon aria-hidden="true">
                                    <span mono-glyph class="i-mdi-cash"></span>
                                </span>
                                <span mono-content><span mono-title>Pricing</span></span>
                                <span mono-badge="primary">12</span>
                            </button>
                        </li>
                    </ul>
                </li>

                <li mono-divider role="separator"></li>
                <li mono-subheader>Account</li>
                <li mono-item :mono-active="active === 'profile' ? '' : null">
                    <button type="button" mono-action role="option" :aria-selected="active === 'profile'" @click="pick('profile')">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-account"></span>
                        </span>
                        <span mono-content><span mono-title>Profile</span></span>
                    </button>
                </li>
                <li mono-item :mono-active="active === 'settings' ? '' : null">
                    <button type="button" mono-action role="option" :aria-selected="active === 'settings'" @click="pick('settings')">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-cog"></span>
                        </span>
                        <span mono-content><span mono-title>Settings</span></span>
                    </button>
                </li>
            </ul>
        </nav>
    </div>
    <div style="margin-top: 0.6rem; font-size: 0.78rem; opacity: 0.7;">
        Active: <code>{{ active }}</code>. Each <code>&lt;mono-menu-list&gt;</code>
        is a single row; nest them as deep as you like and any other HTML can sit
        inside too — content is captured into the row's body slot.
    </div>
</template>
