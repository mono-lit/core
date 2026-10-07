<script setup>
    import '@mono-lit/helper/ui/modal'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const openParts = ref(false)
    const openHeader = ref(false)
</script>

<template>
    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
        <mono-button color="primary" @click="openParts = true">Title &amp; subtitle slots</mono-button>
        <mono-button color="primary" variant="outline" @click="openHeader = true">Custom header &amp; footer</mono-button>

        <!-- `title` and `subtitle` each replace ONE line of the default header;
             the other line (and the ✕) stay. -->
        <mono-modal :model-value="openParts" @close="openParts = false">
            <span slot="title" style="display: inline-flex; align-items: center; gap: 0.4rem;">
                <span>🔐</span> Two-factor authentication
            </span>
            <span slot="subtitle">
                Protect your account with a <strong>second step</strong> at sign-in.
            </span>

            <p style="margin: 0;">
                The default (unnamed) slot is the body — <code>slot="body"</code> works too.
            </p>
        </mono-modal>

        <mono-modal :model-value="openHeader" @close="openHeader = false">
            <!-- `header` replaces the whole title + subtitle column (it beats the
                 `title` / `subtitle` slots and props). The ✕ stays — `dismissible="false"`
                 is what removes it. `head` is the older spelling and still works;
                 if both are present, `header` wins. -->
            <div
                slot="header"
                style="display: flex; align-items: center; gap: 0.6rem; width: 100%;"
            >
                <span style="font-size: 1.1rem;">📦</span>
                <span style="font-weight: 700;">Shipment #4821</span>
                <span
                    style="margin-left: auto; font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 999px; background: color-mix(in oklab, var(--success) 18%, var(--popover)); color: var(--success);"
                >In transit</span>
            </div>

            <p style="margin: 0;">
                A <code>slot="header"</code> keeps the close button beside it.
            </p>

            <div slot="footer" style="display: flex; gap: 0.5rem; width: 100%;">
                <span style="margin-right: auto; font-size: 0.78rem; opacity: 0.7; align-self: center;">
                    Updated 2 min ago
                </span>
                <mono-button size="sm" variant="outline" color="secondary" @click="openHeader = false">
                    Close
                </mono-button>
                <mono-button size="sm" color="primary" @click="openHeader = false">Track</mono-button>
            </div>
        </mono-modal>
    </div>
</template>
