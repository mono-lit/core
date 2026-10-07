<script setup>
import '@mono-lit/helper/ui/button'
import { ref } from 'vue'
const am = ref(false)
</script>

<template>
    <div>
        <mono-button @click="am = !am">Default Button</mono-button>
        <br>
        <mono-button color="primary">{{ am ? 'Active' : 'Primary' }}</mono-button>
        <br>
        <mono-button color="success">Success</mono-button>
        <br>
        <mono-button color="danger">Danger</mono-button>
        <br>
        <mono-button color="warning">Warning</mono-button>
        <br>
        <mono-button color="info">Info</mono-button>
    </div>
</template>
