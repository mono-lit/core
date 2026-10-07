<script setup>
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const clicks = ref(0)
    const throttled = ref(0)
    const debounced = ref(0)

    function reset() {
        clicks.value = 0
        throttled.value = 0
        debounced.value = 0
    }
</script>

<template>
    <div class="example-rate-limit-demo">
        <p class="example-rate-limit-hint">
            Click each button five times as fast as you can. The raw one counts
            every click; the other two go busy on the first and stay that way —
            but keep clicking the debounced one and it won't fire until you stop.
        </p>

        <div class="example-rate-limit-row">
            <mono-button color="secondary" @click="clicks++">Raw</mono-button>
            <span class="example-rate-limit-count"><code>click</code> × {{ clicks }}</span>
        </div>

        <!-- Object form: the full p-throttle option set. Over-limit calls are
             queued and replayed one per interval — never dropped. -->
        <div class="example-rate-limit-row">
            <mono-button
                :throttle.prop="{ limit: 1, interval: 1000 }"
                @throttle="throttled++"
            >
                Throttled 1/s
            </mono-button>
            <span class="example-rate-limit-count"><code>throttle</code> × {{ throttled }}</span>
        </div>

        <!-- Number shorthand: `debounce="500"` is `{ wait: 500 }`. Runs once,
             500ms after the click that was accepted. -->
        <div class="example-rate-limit-row">
            <mono-button debounce="500" @debounce="debounced++">
                Debounced 500ms
            </mono-button>
            <span class="example-rate-limit-count"><code>debounce</code> × {{ debounced }}</span>
        </div>

        <p class="example-rate-limit-hint">
            A spinning button is a disabled button: from the moment a click is
            accepted, further clicks do nothing. A debounce still <em>hears</em>
            them though — each one pushes its deadline out, so it runs once,
            after you stop.
        </p>

        <mono-button size="sm" variant="outline" @click="reset">Reset</mono-button>
    </div>
</template>

<style>
.example-rate-limit-demo {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    align-items: flex-start;
}

.example-rate-limit-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.example-rate-limit-count {
    font-size: 0.85rem;
    opacity: 0.7;
}

.example-rate-limit-hint {
    margin: 0;
    font-size: 0.85rem;
    opacity: 0.6;
    max-width: 46ch;
}
</style>
