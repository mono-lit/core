<script setup>
    import '@mono-lit/helper/ui/drawer'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const open = ref(false)
    const openHeader = ref(false)

    function approve() {
        alert('Approved.')
        open.value = false
    }
</script>

<template>
    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
        <mono-button @click="open = true">Open detail drawer</mono-button>
        <mono-button variant="outline" @click="openHeader = true">Custom header</mono-button>

        <mono-drawer
            position="right"
            size="md"
            color="info"
            :model-value="open"
            @toggle="open = $event.detail.modelValue"
        >
            <!-- `title` and `subtitle` each replace ONE line of the default header;
                 the ✕ stays. -->
            <span slot="title" style="display: inline-flex; align-items: center; gap: 0.55rem;">
                <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span>Claim KLM-2025-0053</span>
            </span>
            <span slot="subtitle">Waiting on supervisor approval</span>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-bottom: 1rem;">
                <div style="padding: 0.6rem 0.8rem; border: 1px solid var(--theme-border); border-radius: 8px;">
                    <div style="font-size: 0.65rem; font-weight: 700; opacity: 0.55; text-transform: uppercase; letter-spacing: 0.08em;">Salesman</div>
                    <div style="font-weight: 700;">Ahmad Fauzi</div>
                </div>
                <div style="padding: 0.6rem 0.8rem; border: 1px solid var(--theme-border); border-radius: 8px;">
                    <div style="font-size: 0.65rem; font-weight: 700; opacity: 0.55; text-transform: uppercase; letter-spacing: 0.08em;">Amount</div>
                    <div style="font-weight: 700; font-family: monospace;">Rp 2.500.000</div>
                </div>
            </div>
            <p style="margin: 0;">
                Submitted on 10 Apr 2025. Currently waiting on supervisor approval.
            </p>

            <span slot="footer" style="display: flex; gap: 0.45rem; flex: 1; justify-content: space-between;">
                <mono-button variant="outline" color="danger" size="sm" @click="open = false">Reject</mono-button>
                <mono-button color="success" size="sm" @click="approve">Approve</mono-button>
            </span>
        </mono-drawer>

        <mono-drawer
            position="right"
            size="md"
            :model-value="openHeader"
            @toggle="openHeader = $event.detail.modelValue"
        >
            <!-- `header` replaces the whole title + subtitle column (it beats the
                 `title` / `subtitle` slots and props); the ✕ still stays beside it. -->
            <div slot="header" style="display: flex; align-items: center; gap: 0.6rem;">
                <span style="font-size: 1.1rem;">📦</span>
                <span style="font-weight: 700;">Shipment #4821</span>
                <span
                    style="font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 999px; background: color-mix(in oklab, var(--success) 18%, var(--popover)); color: var(--success);"
                >In transit</span>
            </div>

            <p style="margin: 0;">A fully custom header row.</p>
        </mono-drawer>
    </div>
</template>
