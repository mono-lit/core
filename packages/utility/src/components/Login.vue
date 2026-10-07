<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMyCookie } from '../token'

const { host, tokenName, origin = window.location.origin } = defineProps<{
    host?: string
    tokenName: string
    refreshTokenName?: string,
    origin?: string
}>()

const cookie = useMyCookie()

function setupIframeAuthBridge() {
    window.addEventListener('message', (event) => {
        if (event.origin !== host) return
        const data = event.data as { type: string; value: string, exp: number }

        if (!data) return


        const isSet = cookie.add({
            name: data.type,
            value: data.value,
            milis: data.exp,
            split: tokenName == data.type,
        })

        if (isSet) {
            setTimeout(() => {
                window.location.reload()
            }, 1000)
        }

    })
}

setupIframeAuthBridge()

const iframeSrc = computed(() => {
    const devOrigin = origin
    return `${host}?dev=${encodeURIComponent(devOrigin)}`
})

/* ---------- loading state ---------- */
const iframeLoaded = ref(false)
const onIframeLoad = () => {
    iframeLoaded.value = true
}
</script>

<template>
    <div style="
      position: relative;
      width: 450px;
      height: 450px;
    ">
        <!-- IFRAME (under the loader until loaded) -->
        <iframe :src="iframeSrc" @load="onIframeLoad" style="
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        border: none;
        overflow: hidden;
        transition: opacity 150ms ease-in-out;
      " :style="{
        opacity: iframeLoaded ? 1 : 0,
        zIndex: 0,
    }" scrolling="no"></iframe>

        <!-- LOADING OVERLAY -->
        <div v-if="!iframeLoaded" style="
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1;
        pointer-events: none;
      ">
            <!-- simple spinner svg -->
            <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35"
                viewBox="0 0 24 24"><!-- Icon from Material Line Icons by Vjacheslav Trushkin - https://github.com/cyberalien/line-md/blob/master/license.txt -->
                <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                    <path stroke-dasharray="16" stroke-dashoffset="16" d="M12 3c4.97 0 9 4.03 9 9">
                        <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.3s" values="16;0" />
                        <animateTransform attributeName="transform" dur="1.5s" repeatCount="indefinite" type="rotate"
                            values="0 12 12;360 12 12" />
                    </path>
                    <path stroke-dasharray="64" stroke-dashoffset="64" stroke-opacity=".3"
                        d="M12 3c4.97 0 9 4.03 9 9c0 4.97 -4.03 9 -9 9c-4.97 0 -9 -4.03 -9 -9c0 -4.97 4.03 -9 9 -9Z">
                        <animate fill="freeze" attributeName="stroke-dashoffset" dur="1.2s" values="64;0" />
                    </path>
                </g>
            </svg>
        </div>
    </div>
</template>


<style>
@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
