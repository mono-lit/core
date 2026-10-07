<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
    <div>
        <div mono-chip mono-clickable @click="count++">
            <span mono-main role="button" tabindex="0">
                <span mono-content>
                    <span mono-label>Click me</span>
                </span>
            </span>
        </div>
        <br>
        <br>
        <div class="event-demo-status">clicked {{ count }} times</div>
    </div>
</template>
