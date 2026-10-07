<script setup>
import { ref } from 'vue'

const open = ref(true)
</script>

<template>
    <div style="width: 100%;">
        <div mono-accordion mono-color="success" :mono-open="open ? '' : null">
            <button
                type="button"
                mono-head
                :aria-expanded="open"
                @click="open = !open"
            >
                <span mono-glyph aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
                        <path d="M13 5v2"></path>
                        <path d="M13 11v2"></path>
                        <path d="M13 17v2"></path>
                    </svg>
                </span>
                <span mono-heading>
                    <span mono-title>Order #A7-1142</span>
                    <span mono-description>Paid · 3 items · shipped on May 2</span>
                </span>
                <span mono-actions>
                    <span style="font-size: 0.7rem; font-weight: 700; color: var(--theme-success); padding: 2px 8px; border-radius: 99px; background: color-mix(in srgb, var(--theme-success) 14%, var(--card));">PAID</span>
                </span>
                <span mono-arrow aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>
            <div mono-body role="region">
                <div style="display: grid; gap: 0.5rem;">
                    <div>
                        <div style="font-weight: 600;">Mechanical keyboard — Cobalt blue switches</div>
                        <div style="font-size: 0.74rem; color: var(--muted-foreground);">Qty 1 · Rp 1.450.000</div>
                    </div>
                    <div>
                        <div style="font-weight: 600;">Aluminium wrist rest</div>
                        <div style="font-size: 0.74rem; color: var(--muted-foreground);">Qty 1 · Rp 285.000</div>
                    </div>
                    <div>
                        <div style="font-weight: 600;">USB-C braided cable, 1.5m</div>
                        <div style="font-size: 0.74rem; color: var(--muted-foreground);">Qty 2 · Rp 90.000</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
