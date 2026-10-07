<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
    <div style="width: 100%;">
        <div
            mono-card mono-clickable
            tabindex="0"
            role="button"
            @click="count++"
        >
            <div mono-header>
                <div mono-header-content>
                    <h3 mono-title>Click me</h3>
                </div>
            </div>
            <div mono-body>
                <p>Each click increments the counter.</p>
            </div>
        </div>
        <br>
        <br>
        <div class="event-demo-status">clicked {{ count }} times</div>
    </div>
</template>
