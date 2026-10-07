<script setup>
import '@mono-lit/helper/ui/input'
</script>

<template>
    <div style="display: grid; gap: 1rem; width: 100%;">
        <mono-input type="text" label="Text" placeholder="Plain text"></mono-input>
        <mono-input type="email" label="Email" placeholder="you@example.com"></mono-input>
        <mono-input type="password" label="Password" placeholder="••••••••"></mono-input>
        <mono-input type="number" label="Number" placeholder="42" :min="0" :max="100" :step="1"></mono-input>
        <mono-input type="tel" label="Phone" placeholder="+1 555 0100"></mono-input>
        <mono-input type="url" label="Website" placeholder="https://"></mono-input>
        <mono-input type="date" label="Date"></mono-input>
        <mono-input type="time" label="Time"></mono-input>
        <mono-input type="search" label="Search" placeholder="Search…"></mono-input>
    </div>
</template>
