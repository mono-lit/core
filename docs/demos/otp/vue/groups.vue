<script setup>
    import '@mono-lit/helper/ui/otp'
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <!-- One size repeats: 3 → 3-3. -->
        <mono-otp groups="3" label="groups=&quot;3&quot;"></mono-otp>
        <!-- A list is taken as given. -->
        <mono-otp length="6" groups="2,2,2" separator="·" label="groups=&quot;2,2,2&quot; separator=&quot;·&quot;"></mono-otp>
        <!-- An empty separator leaves only the gap. -->
        <mono-otp type="alphanumeric" length="8" :groups.prop="[4, 4]" separator="" label="[4, 4] with no separator"></mono-otp>
        <!-- placeholder: one character per box, or one for all. -->
        <mono-otp length="6" groups="3" placeholder="123456" label="A placeholder per box"></mono-otp>
    </div>
</template>
