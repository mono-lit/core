<script setup>
import '@mono-lit/helper/ui/button'

const STEPS = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'full']
</script>

<template>
    <div style="display: grid; gap: 1rem">
        <!-- One prop for corners. Unset follows the theme's per-size radius. -->
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center">
            <mono-button v-for="step in STEPS" :key="step" :rounded="step">
                {{ step }}
            </mono-button>
            <mono-button>unset</mono-button>
        </div>

        <!-- A FAB is just a fixed square with a full radius — and unlike the old
             `fab` prop, it can be any colour or variant. -->
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center">
            <mono-button width="56" height="56" rounded="full" icon-only color="primary">
                <span slot="icon" class="mono-icon i-mdi-plus"></span>
            </mono-button>
            <mono-button width="56" height="56" rounded="full" icon-only color="danger" variant="outline">
                <span slot="icon" class="mono-icon i-mdi-delete"></span>
            </mono-button>
            <mono-button width="40" height="40" rounded="full" icon-only color="success" variant="tonal">
                <span slot="icon" class="mono-icon i-mdi-check"></span>
            </mono-button>
        </div>
    </div>
</template>
