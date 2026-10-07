<script setup>
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const saved = ref(0)
    const phase = ref('idle')
    const forced = ref(false)

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

    async function save() {
        await wait(1500)
        saved.value++
    }
</script>

<template>
    <div class="example-async-loading-demo">
        <!-- The handler's promise IS the loading window: the button spins for
             exactly as long as `save()` takes, with no loading flag to manage. -->
        <div class="example-async-loading-row">
            <mono-button :handler.prop="save">Save</mono-button>
            <span class="example-async-loading-note">:handler.prop — spinner follows the promise</span>
        </div>

        <!-- Same thing from a plain listener, for consumers that would rather
             not bind a function prop. -->
        <div class="example-async-loading-row">
            <mono-button color="secondary" @click="(e) => e.detail.waitUntil(save())">
                Save via listener
            </mono-button>
            <span class="example-async-loading-note">e.detail.waitUntil(promise)</span>
        </div>

        <!-- Debounce collapses the burst, then the surviving call drives the
             spinner through the handler. `pending` → `running` → `idle`. -->
        <div class="example-async-loading-row">
            <mono-button
                color="success"
                debounce="400"
                :handler.prop="save"
                @loading-change="phase = $event.detail.phase"
            >
                Debounced save
            </mono-button>
            <span class="example-async-loading-note">phase: <code>{{ phase }}</code></span>
        </div>

        <!-- `loading` stays a read-only input: an override that always wins,
             and never fights the component's own state. It renders exactly
             like the self-driven state above — same spinner, same place —
             so which mechanism switched loading on is not something the
             user can see. -->
        <div class="example-async-loading-row">
            <mono-button :loading.prop="forced" @click="saved++">Manual override</mono-button>
            <mono-button size="sm" variant="outline" @click="forced = !forced">
                {{ forced ? 'Release' : 'Force' }} :loading
            </mono-button>
        </div>

        <p class="example-async-loading-count">saved {{ saved }}×</p>
    </div>
</template>

<style>
.example-async-loading-demo {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    align-items: flex-start;
}

.example-async-loading-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.example-async-loading-note {
    font-size: 0.85rem;
    opacity: 0.7;
}

.example-async-loading-count {
    margin: 0;
    font-size: 0.85rem;
    opacity: 0.6;
}
</style>
