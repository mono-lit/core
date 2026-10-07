<script setup>
import { ref } from 'vue'

const open = ref(new Set([0]))

function toggle(idx) {
    if (open.value.has(idx)) open.value.delete(idx)
    else open.value.add(idx)
    open.value = new Set(open.value)
}
</script>

<template>
    <div style="width: 100%; display: grid; gap: 0.55rem;">
        <div
            mono-accordion
            :mono-open="open.has(0) ? '' : null"
        >
            <button
                type="button"
                mono-head
                :aria-expanded="open.has(0)"
                @click="toggle(0)"
            >
                <span mono-glyph aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    </svg>
                </span>
                <span mono-heading>
                    <span mono-title>Project files</span>
                    <span mono-description>3 folders, 12 files</span>
                </span>
                <span mono-arrow aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>
            <div mono-body role="region"><div>
                Drop files here or use the picker — uploads stream straight to S3.
            </div></div>
        </div>
        <div
            mono-accordion mono-color="warning"
            :mono-open="open.has(1) ? '' : null"
        >
            <button
                type="button"
                mono-head
                :aria-expanded="open.has(1)"
                @click="toggle(1)"
            >
                <span mono-glyph aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                    </svg>
                </span>
                <span mono-heading>
                    <span mono-title>Notifications</span>
                    <span mono-description>5 unread alerts</span>
                </span>
                <span mono-arrow aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>
            <div mono-body role="region"><div>
                Email digest, in-app banners and Slack push are configured separately.
            </div></div>
        </div>
        <div
            mono-accordion mono-color="danger"
            :mono-open="open.has(2) ? '' : null"
        >
            <button
                type="button"
                mono-head
                :aria-expanded="open.has(2)"
                @click="toggle(2)"
            >
                <span mono-glyph aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </span>
                <span mono-heading>
                    <span mono-title>Security</span>
                    <span mono-description>Last reviewed 12 days ago</span>
                </span>
                <span mono-arrow aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>
            <div mono-body role="region"><div>
                Two-factor auth, SSO, session timeout and audit log retention live here.
            </div></div>
        </div>
    </div>
</template>
