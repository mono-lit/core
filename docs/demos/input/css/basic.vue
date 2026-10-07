<script setup>
import { ref } from 'vue'

const value = ref('')
</script>

<template>
    <div style="width: 100%">
        <div mono-input>
            <label mono-label>Full name</label>
            <div mono-field>
                <input mono-native type="text" placeholder="Type your name" v-model="value" />
            </div>
            <div mono-message-wrap>
                <div mono-message="helper">Letters, spaces and hyphens only.</div>
            </div>
        </div>
    </div>
</template>
