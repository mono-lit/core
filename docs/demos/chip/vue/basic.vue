<script setup>
import '@mono-lit/helper/ui/chip'
</script>

<template>
    <div>
        <mono-chip color="primary">
            <div class="flex items-center gap-2">
                <div>
                    Primary Badge
                </div>
                <div>
                    4
                </div>
            </div>

        </mono-chip>
        <br>
        <mono-chip color="secondary">Secondary Badge</mono-chip>
        <br>
        <mono-chip color="success">Success Badge</mono-chip>
        <br>
        <mono-chip color="danger">Danger Badge</mono-chip>
        <br>
        <mono-chip color="warning">Warning Badge</mono-chip>
        <br>
        <mono-chip color="info">Info Badge</mono-chip>
    </div>
</template>
