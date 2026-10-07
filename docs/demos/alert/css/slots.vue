<script setup lang="ts">
// Raw markup has no element to hide itself: the ✕ does it with one line.
function hide(event: Event) {
    ;(event.currentTarget as HTMLElement).closest('[mono-alert]')!.setAttribute('hidden', '')
}
</script>

<template>
    <div style="width: 100%;">
        <div mono-alert mono-color="info" role="alert">
            <span mono-icon aria-hidden="true"><span class="i-mdi-information-outline" mono-glyph></span></span>
            <div mono-title><span>A <strong>rich</strong> title</span></div>
            <div mono-subtitle><span>The subtitle can carry <a href="#slots">a link</a> or any markup.</span></div>
        </div>

        <div mono-alert mono-color="warning" mono-variant="tonal" mono-clearable role="alert">
            <div mono-body>
                <p><strong>Maintenance tonight.</strong> The dashboard is read-only from 22:00 to 23:30.</p>
                <ul>
                    <li>Exports are paused.</li>
                    <li>Scheduled reports run afterwards.</li>
                </ul>
            </div>
            <button type="button" mono-clear aria-label="Close" @click="hide">
                <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
                    <path
                        fill-rule="evenodd"
                        d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z"
                        clip-rule="evenodd"
                    />
                </svg>
            </button>
        </div>

        <div mono-alert role="alert">
            <div mono-body>Plain children fill the whole alert, just like <code>slot="body"</code>.</div>
        </div>
    </div>
</template>
