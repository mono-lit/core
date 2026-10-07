<script setup>
    import '@mono-lit/helper/ui/input'
    import { ref } from 'vue'

    const email = ref('')
    const shout = ref('')

    // A function format is the escape hatch for anything the pattern grammar cannot say.
    const upper = (ctx) => ctx.value.toUpperCase()
</script>

<template>
    <div style="display: grid; gap: 1rem; width: 100%">
        <!-- `{}` is the hole the typed text goes in; everything else is literal. Because
             `format-value` carries the same pattern, the VALUE is the whole address — an email
             without its domain is not an email. -->
        <mono-input
            label="Work email"
            placeholder="Type the part before the @"
            helper-text="format-display=&quot;{}@gmail.com&quot;"
            format-display="{}@gmail.com"
            format-value="{}@gmail.com"
            :model-value="email"
            @input="email = $event.detail.modelValue"
        ></mono-input>

        <!-- Function form. It needs `.prop`, because a function cannot cross an HTML attribute. -->
        <mono-input
            label="Code"
            placeholder="Type in any case"
            helper-text="A function format — display only, so the value keeps what was typed."
            :format-display.prop="upper"
            :model-value="shout"
            @input="shout = $event.detail.modelValue"
        ></mono-input>

        <p style="margin: 0; font-size: 0.78rem; opacity: 0.75">
            email value: <strong>{{ email || '—' }}</strong> ·
            code value: <strong>{{ shout || '—' }}</strong>
        </p>
    </div>
</template>
