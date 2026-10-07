<script setup>
import { ref } from 'vue'

const contact = ref('email')
</script>

<template>
    <div style="display: grid; gap: 0.75rem;">
        <label mono-radio>
            <input mono-input type="radio" name="contact" value="email" v-model="contact" />
            <span mono-circle aria-hidden="true"></span>
            <span mono-label>
                <span mono-label-text>📧 Email me</span>
                <span mono-description>Send a daily digest to your inbox.</span>
            </span>
        </label>
        <label mono-radio>
            <input mono-input type="radio" name="contact" value="sms" v-model="contact" />
            <span mono-circle aria-hidden="true"></span>
            <span mono-label>
                <span mono-label-text>📱 Text me</span>
                <span mono-description>Send updates to your phone via SMS.</span>
            </span>
        </label>
    </div>
</template>
