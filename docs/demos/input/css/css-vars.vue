<script setup>
import { ref } from 'vue'

const value = ref('')
</script>

<template>
    <!-- The focus colour and the resting border set on a wrapper cascade into the input inside. -->
    <div style="width: 100%; --mono-input-ring-color: #7c3aed; --mono-input-border-color: #e9d5ff;">
        <div mono-input>
            <label mono-label>Full name</label>
            <div mono-field>
                <input mono-native type="text" placeholder="Focus me to see the accent" v-model="value" />
            </div>
            <div mono-message-wrap>
                <div mono-message="helper">Focus colour + border themed via --mono-input-*.</div>
            </div>
        </div>
    </div>
</template>
