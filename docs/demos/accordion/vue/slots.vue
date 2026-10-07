<script setup>
import '@mono-lit/helper/ui/accordion'
</script>

<template>
    <div style="width: 100%;">
        <mono-accordion color="success" model-value>
            <svg
                slot="icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
                <path d="M13 5v2"></path>
                <path d="M13 11v2"></path>
                <path d="M13 17v2"></path>
            </svg>
            <span slot="title">Order #A7-1142</span>
            <span slot="subtitle">Paid · 3 items · shipped on May 2</span>
            <span slot="actions">
                <span style="font-size: 0.7rem; font-weight: 700; color: var(--theme-success); padding: 2px 8px; border-radius: 99px; background: color-mix(in srgb, var(--theme-success) 14%, var(--card));">PAID</span>
            </span>
            <div slot="body" style="display: grid; gap: 0.5rem;">
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
        </mono-accordion>

        <!-- slot="header" replaces the whole left side: the icon AND the title +
             subtitle. Actions and the chevron stay, and the head is still the toggle. -->
        <mono-accordion color="primary" style="margin-top: 0.75rem;">
            <div slot="header" style="display: flex; align-items: center; gap: 0.625rem;">
                <span style="display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: 99px; background: var(--primary); color: var(--primary-foreground); font-size: 0.75rem; font-weight: 700;">RK</span>
                <span style="display: flex; flex-direction: column;">
                    <strong>Rina Kusuma</strong>
                    <span style="font-size: 0.74rem; color: var(--muted-foreground);">rina@example.com · joined 2024</span>
                </span>
            </div>
            <span slot="actions">
                <span style="font-size: 0.7rem; font-weight: 700; color: var(--theme-primary); padding: 2px 8px; border-radius: 99px; background: color-mix(in srgb, var(--theme-primary) 14%, var(--card));">ADMIN</span>
            </span>
            <div slot="body">
                Custom header markup replaces the icon, title and subtitle. The badge in
                <code>actions</code> and the chevron are untouched, and clicking anywhere on the
                row still toggles the body.
            </div>
        </mono-accordion>
    </div>
</template>
