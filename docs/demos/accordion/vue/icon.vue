<script setup>
import '@mono-lit/helper/ui/accordion'
</script>

<template>
    <div style="display: grid; gap: 0.55rem; width: 100%;">
        <mono-accordion title="Project files" subtitle="3 folders, 12 files" model-value>
            <svg
                slot="icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
            Drop files here or use the picker — uploads stream straight to S3.
        </mono-accordion>

        <mono-accordion title="Notifications" subtitle="5 unread alerts" color="warning">
            <svg
                slot="icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
            </svg>
            Email digest, in-app banners and Slack push are configured separately.
        </mono-accordion>

        <mono-accordion title="Security" subtitle="Last reviewed 12 days ago" color="danger">
            <svg
                slot="icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Two-factor auth, SSO, session timeout and audit log retention live here.
        </mono-accordion>
    </div>
</template>
