<script setup>
import { ref } from 'vue'

const tonal = ref(false)
</script>

<template>
    <div style="width: 100%;">
        <div
            mono-card mono-clickable
            :class="tonal ? 'tonal' : 'elevated'"
            tabindex="0"
            role="button"
            @click="tonal = !tonal"
        >
            <div mono-header>
                <div mono-header-content>
                    <h3 mono-title>Toggle me</h3>
                </div>
            </div>
            <div mono-body>
                <p>Click to switch between elevated and tonal variants.</p>
            </div>
        </div>
        <br>
        <br>
        <div class="event-demo-status">{{ tonal ? 'tonal' : 'elevated' }}</div>
    </div>
</template>
