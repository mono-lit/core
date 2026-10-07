<script setup>
import '@mono-lit/helper/ui/chip'
</script>

<template>
    <div>
        <!-- `main` is the badge BOX — the part that carries the fill, the border
             and the corner. `root` is the layout wrapper around it, so a box
             utility belongs on `main`. -->
        <mono-chip
            color="primary"
            :css-class="{
                main: 'shadow-md',
                label: 'font-bold tracking-wide',
            }"
        >
            Bold &amp; shadowed
        </mono-chip>
        <br>
        <mono-chip
            color="success"
            :css-class="{
                main: 'px-4 py-2',
                label: 'text-base',
            }"
        >
            Roomier padding
        </mono-chip>
        <br>
        <!-- Shape is a PROP, not a utility: `rounded` writes the corner the box
             actually reads. -->
        <mono-chip
            color="danger"
            rounded="none"
            removable
            close-label="Remove"
            :css-class="{
                close: 'text-lg',
            }"
        >
            Square removable
        </mono-chip>
    </div>
</template>
