<script setup>
import '@mono-lit/helper/ui/card'
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%;">
        <mono-card bordered title="Fixed 320px" width="320px">
            A card constrained to 320px wide.
        </mono-card>
        <mono-card bordered title="Max-width 480px" max-width="480px">
            Caps at 480px and shrinks on narrower screens.
        </mono-card>
        <mono-card bordered title="Full width" width="100%">
            <code>width="100%"</code> 
        </mono-card>
    </div>
</template>
