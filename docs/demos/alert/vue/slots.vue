<script setup lang="ts">
import '@mono-lit/helper/ui/alert'
</script>

<template>
    <div style="width: 100%;">
        <!-- title / subtitle slots: each replaces one line -->
        <mono-alert color="info" icon="i-mdi-information-outline">
            <span slot="title">A <strong>rich</strong> title</span>
            <span slot="subtitle">The subtitle can carry <a href="#slots">a link</a> or any markup.</span>
        </mono-alert>

        <!-- slot="body" replaces the icon, title and subtitle — the whole content -->
        <mono-alert color="warning" variant="tonal" title="ignored" subtitle="ignored" clearable>
            <div slot="body">
                <p><strong>Maintenance tonight.</strong> The dashboard is read-only from 22:00 to 23:30.</p>
                <ul>
                    <li>Exports are paused.</li>
                    <li>Scheduled reports run afterwards.</li>
                </ul>
            </div>
        </mono-alert>

        <!-- plain children are the body too -->
        <mono-alert>Plain children fill the whole alert, just like <code>slot="body"</code>.</mono-alert>
    </div>
</template>
