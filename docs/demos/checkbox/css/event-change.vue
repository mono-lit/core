<script setup>
import { ref } from 'vue'

const checked = ref(false)
</script>

<template>
    <div>
        <label mono-checkbox>
            <input mono-input type="checkbox" v-model="checked">
            <span mono-box aria-hidden="true"></span>
            <div mono-label>
                <span mono-label-text>Toggle me</span>
            </div>
        </label>

        <br>
        <br>
        <div class="event-demo-status">{{ checked ? 'checked' : 'unchecked' }}</div>
    </div>
</template>
