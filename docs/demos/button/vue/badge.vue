<script setup lang="ts">
import '@mono-lit/helper/ui/button'
</script>

<template>
    <div>
        <mono-button badge="3" badge-color="red" color="primary">Notifications</mono-button>
        <br>
        <mono-button badge="99+" badge-color="green" color="success">Messages</mono-button>
        <br>
        <mono-button badge="5" badge-color="orange" color="warning">Warnings</mono-button>
        <br>
        <mono-button badge="NEW" badge-color="cobalt" color="info">Updates</mono-button>
    </div>
</template>
