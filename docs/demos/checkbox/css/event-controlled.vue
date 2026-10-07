<script setup>
import { ref } from 'vue'

const checked = ref(false)
</script>

<template>
    <div class="flex flex-col gap-2">
        <label mono-checkbox>
            <input mono-input type="checkbox" v-model="checked">
            <span mono-box aria-hidden="true"></span>
            <div mono-label>
                <span mono-label-text>Controlled checkbox</span>
            </div>
        </label>
        <br>
        <br>
        <div class="checkbox-controls">
            <button type="button" class="demo-button" @click="checked = !checked">Toggle</button>
            <br>
            <button type="button" class="demo-button" @click="checked = true">Set On</button>
            <br>
            <button type="button" class="demo-button" @click="checked = false">Set Off</button>
        </div>
    </div>
</template>
