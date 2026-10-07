<script setup>
import { ref } from 'vue'

const loading = ref(false)
const disabled = ref(false)

function trigger() {
    loading.value = true
    disabled.value = true
    setTimeout(() => {
        loading.value = false
        disabled.value = false
    }, 1500)
}
</script>

<template>
    <div>
        <div mono-button>
            <button mono-native type="button">
                <div mono-content>
                    <span mono-icon mono-empty></span>
                    <span mono-text>Normal</span>
                </div>
            </button>
        </div>
        <div mono-button>
            <button mono-native type="button" disabled>
                <div mono-content>
                    <span mono-icon mono-empty></span>
                    <span mono-text>Disabled</span>
                </div>
            </button>
        </div>
        <!-- Loading: the ring is drawn in the [mono-icon] box. mono-spinning paints it;
             mono-empty collapses the box again once loading ends, so the button keeps
             its idle width. -->
        <div mono-button :mono-loading="loading ? '' : null">
            <button mono-native type="button" :disabled="disabled" :aria-busy="loading ? 'true' : 'false'" @click="trigger">
                <div mono-content>
                    <span mono-icon :mono-spinning="loading ? '' : null" :mono-empty="loading ? null : ''"></span>
                    <span mono-text>Click to Load</span>
                </div>
            </button>
        </div>
        <div mono-button mono-sized style="width: 100%;">
            <button mono-native type="button">
                <div mono-content>
                    <span mono-icon mono-empty></span>
                    <span mono-text>Full Width</span>
                </div>
            </button>
        </div>
    </div>
</template>
