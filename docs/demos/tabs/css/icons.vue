<script setup>
import { ref } from 'vue'

const active = ref(0)
</script>

<template>
    <div style="width: fit-content;" mono-tabs role="tablist">
        <button
            type="button"
            mono-tab
            :aria-selected="active === 0"
            role="tab"
            @click="active = 0"
        >
            <span mono-icon aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="6" y1="20" x2="6" y2="13"></line>
                    <line x1="12" y1="20" x2="12" y2="9"></line>
                    <line x1="18" y1="20" x2="18" y2="4"></line>
                    <line x1="3" y1="20" x2="21" y2="20"></line>
                </svg>
            </span>
            <span mono-label>Overview</span>
        </button>
        <button
            type="button"
            mono-tab
            :aria-selected="active === 1"
            role="tab"
            @click="active = 1"
        >
            <span mono-icon aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"></path>
                    <circle cx="12" cy="9" r="2.5"></circle>
                </svg>
            </span>
            <span mono-label>Klaim</span>
            <span mono-badge>12</span>
        </button>
        <button
            type="button"
            mono-tab
            :aria-selected="active === 2"
            role="tab"
            @click="active = 2"
        >
            <span mono-icon aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 17 9 11 13 15 21 7"></polyline>
                    <polyline points="14 7 21 7 21 14"></polyline>
                </svg>
            </span>
            <span mono-label>Target</span>
        </button>
        <button
            type="button"
            mono-tab
            :aria-selected="active === 3"
            role="tab"
            @click="active = 3"
        >
            <span mono-icon aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
            </span>
            <span mono-label>Settings</span>
        </button>
    </div>
</template>
