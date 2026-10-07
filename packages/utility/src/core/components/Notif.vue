<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { MonoNotifActionTypes, MonoNotifButton } from '../types/notif-action'

const router = useRouter()

const props = defineProps<{
    item: MonoNotifActionTypes
}>()

const isPromise = computed(() => props.item.type === 'promise')

const cardStyle = computed<any>(() => ({
    background: '#ffffff',
    padding: '0.75rem',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
    borderRadius: '0.25rem',
    width: '21.25rem',
    border: isPromise.value ? '1px solid #d1d5db' : '0',
    boxSizing: 'border-box',
}))

const buttons = computed<MonoNotifButton[]>(() => props.item.props?.buttons ?? [])
const hasSingleButton = computed(() => buttons.value.length === 1)
const btnLabel = (btn?: MonoNotifButton) => btn?.text ?? btn?.label ?? ''

const onClickBtn = async (btn?: MonoNotifButton) => {
    if (!btn?.to) {
        props.item.clear()
        return
    }

    await router.push(String(btn.to))
    props.item.clear()
}
</script>

<template>
    <div :style="cardStyle">
        <div style="display:flex; flex-direction:row; gap:0.5rem; align-items:flex-start;">
            <svg v-if="item.type === 'success'" viewBox="0 0 24 24" width="24" height="24"
                :style="{ flex: 'none', color: '#16a34a' }" fill="currentColor" aria-hidden="true">
                <path
                    d="M20 12a8 8 0 0 1-8 8a8 8 0 0 1-8-8a8 8 0 0 1 8-8c.76 0 1.5.11 2.2.31l1.57-1.57A9.8 9.8 0 0 0 12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10M7.91 10.08L6.5 11.5L11 16L21 6l-1.41-1.42L11 13.17z" />
            </svg>

            <svg v-if="item.type === 'error'" viewBox="0 0 24 24" width="24" height="24"
                :style="{ flex: 'none', color: '#dc2626' }" fill="currentColor" aria-hidden="true">
                <path
                    d="M12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8m0-18C6.47 2 2 6.47 2 12s4.47 10 10 10s10-4.47 10-10S17.53 2 12 2m2.59 6L12 10.59L9.41 8L8 9.41L10.59 12L8 14.59L9.41 16L12 13.41L14.59 16L16 14.59L13.41 12L16 9.41z" />
            </svg>

            <svg v-if="item.type === 'info'" viewBox="0 0 24 24" width="24" height="24"
                :style="{ flex: 'none', color: '#2563eb' }" fill="currentColor" aria-hidden="true">
                <path
                    d="M11 7v2h2V7zm3 10v-2h-1v-4h-3v2h1v2h-1v2zm8-5c0 5.5-4.5 10-10 10S2 17.5 2 12S6.5 2 12 2s10 4.5 10 10m-2 0c0-4.42-3.58-8-8-8s-8 3.58-8 8s3.58 8 8 8s8-3.58 8-8" />
            </svg>

            <svg v-if="item.type === 'warning'" viewBox="0 0 24 24" width="24" height="24"
                :style="{ flex: 'none', color: '#ca8a04' }" fill="currentColor" aria-hidden="true">
                <path
                    d="M11 15h2v2h-2zm0-8h2v6h-2zm1-5C6.47 2 2 6.5 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m0 18a8 8 0 0 1-8-8a8 8 0 0 1 8-8a8 8 0 0 1 8 8a8 8 0 0 1-8 8" />
            </svg>

            <!-- promise spinner: inline SVG SMIL rotation — no CSS / no <style> / no build config -->
            <svg v-if="item.type === 'promise'" viewBox="0 0 24 24" width="24" height="24"
                :style="{ flex: 'none', color: '#4f46e5' }" fill="currentColor" aria-hidden="true">
                <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12"
                        dur="0.8s" repeatCount="indefinite" />
                </path>
            </svg>

            <p style="font-size:0.875rem; margin:0;" :aria-live="item.ariaLive" :role="item.ariaRole">
                {{ item.message }}
            </p>
        </div>

        <div
            style="display:flex; flex-direction:row; justify-content:flex-end; gap:0.75rem; margin-top:0.75rem;">
            <button v-for="(btn, idx) in buttons" :key="idx" type="button" @click="onClickBtn(btn)" :style="{
                textTransform: 'capitalize', padding: '0.375rem 0.75rem', borderRadius: '0.25rem',
                border: '1px solid #d1d5db', background: btn.color ?? 'transparent',
                color: btn.color ? '#ffffff' : '#374151', cursor: 'pointer', font: 'inherit', fontSize: '0.875rem',
            }">
                {{ btnLabel(btn) }}
            </button>

            <button v-if="hasSingleButton" type="button" @click="item.clear()" :style="{
                textTransform: 'capitalize', padding: '0.375rem 0.75rem', borderRadius: '0.25rem',
                border: '1px solid #ef9a9a', background: 'rgba(229,57,53,0.12)',
                color: '#c62828', cursor: 'pointer', font: 'inherit', fontSize: '0.875rem',
            }">
                Batal
            </button>
        </div>
    </div>
</template>
