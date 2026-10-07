<script setup>
    import '@mono-lit/helper/ui/drawer'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const open = ref(false)
    // The level handed to the drawer. 1500 is the bar below, so 1600 puts the drawer
    // over it and 1400 tucks it underneath.
    const z = ref(1600)

    const openAt = (value) => {
        z.value = value
        open.value = true
    }
</script>

<template>
    <div>
        <mono-button color="primary" @click="openAt(1600)">Open above the bar</mono-button>
        <mono-button color="secondary" variant="outline" @click="openAt(1400)">Open below the bar</mono-button>

        <!-- Stands in for whatever the host app already pins on screen: a sticky
             header, a cookie banner, a third-party chat widget. -->
        <div
            v-if="open"
            style="position: fixed; left: 0; right: 0; bottom: 0; z-index: 1500;
                   padding: 0.75rem 1rem; background: var(--primary); color: var(--primary-foreground);
                   font-size: 0.85rem; text-align: center;"
        >
            App bar — <code style="color: inherit;">z-index: 1500</code>
        </div>

        <mono-drawer
            title="Manual z-index"
            position="right"
            color="primary"
            :z-index="z"
            :model-value="open"
            @close="open = false"
        >
            <p style="margin: 0;">
                This drawer is at <code>z-index: {{ z }}</code>, so it renders
                <strong>{{ z > 1500 ? 'above' : 'below' }}</strong> the app bar.
                Leave <code>z-index</code> unset and mono's popup stack picks the level
                instead, keeping the newest layer on top.
            </p>
        </mono-drawer>
    </div>
</template>
