<script setup>
import { ref } from 'vue'

const selected = ref(false)
</script>

<template>
    <div>
        <div mono-chip mono-clickable :mono-selected="selected || null" @click="selected = !selected">
            <span mono-main role="button" tabindex="0">
                <span mono-content>
                    <span mono-label>Toggle me</span>
                </span>
            </span>
        </div>
        <br>
        <br>
        <div class="event-demo-status">{{ selected ? 'selected' : 'unselected' }}</div>
    </div>
</template>
