<!--
  Event handlers from the controller.

  A control's `props` take its events as `on<Event>` keys — `onChange`, `onInput`,
  `onClear`… — the same spelling Vue uses for a listener prop. The
  form attaches each one to the element as a DOM listener (never as a property),
  so a store can own a control's behaviour next to its configuration and the
  template carries nothing but the binding.

  The handler receives exactly what a template `@change` would: the element's
  event, with the model on `event.detail`. A template listener on the same
  element still fires too — they are two listeners, not a replacement.

  `setProp()` adds a handler at runtime (a new function replaces the old one,
  `null` removes it), under the same precedence as any other prop: a static
  `inputs[key].props` handler wins over one set through `setProp()`.
-->
<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/select'
import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/card'
import { controlMonoForm } from '@mono-lit/helper/ui/form'

const log = ref<string[]>([])
const say = (line: string) => (log.value = [line, ...log.value].slice(0, 6))

const form = controlMonoForm({
  inputs: {
    Name: {
      component: 'mono-input',
      value: '',
      props: {
        label: 'Name',
        placeholder: 'Type, then blur',
        clearable: true,
        // Typed from InputEvents: `event.detail.modelValue` completes.
        onInput: (event) => say(`Name input → "${event.detail.modelValue}"`),
        onChange: (event) => say(`Name change → "${event.detail.modelValue}"`),
        onClear: () => say('Name cleared'),
      },
    },
    City: {
      component: 'mono-select',
      value: null,
      props: {
        label: 'City',
        items: [{ label: 'Jakarta', value: 'JKT' }, { label: 'Bandung', value: 'BDG' }, { label: 'Surabaya', value: 'SBY' }],
        clearable: true,
        onChange: (event) => say(`City change → ${event.detail.modelValue}`),
        onClear: () => say('City cleared'),
      },
    },
    Note: {
      component: 'mono-input',
      value: '',
      props: { label: 'Note', placeholder: 'No handler until you add one' },
    },
  },
})

// Runtime: hand `Note` a handler through `setProp`, or take it away with `null`.
const watching = ref(false)
const watchNote = () => {
  form.setProp({ key: 'Note', props: { onInput: (event) => say(`Note input → "${event.detail.modelValue}"`) } })
  watching.value = true
}
const unwatchNote = () => {
  form.setProp({ key: 'Note', props: { onInput: null } })
  watching.value = false
}

onBeforeUnmount(() => form.dispose())
</script>

<template>
  <div class="example-form-demo">
    <form class="example-form" @submit.prevent>
      <mono-input :control-form="form" key-form="Name" />
      <mono-select :control-form="form" key-form="City" />
      <mono-input :control-form="form" key-form="Note" :helper-text="watching ? 'onInput attached through setProp' : ''" />

      <div class="example-form-actions">
        <mono-button size="sm" variant="outline" :disabled="watching" @click="watchNote()">Note: setProp onInput</mono-button>
        <mono-button size="sm" variant="outline" color="neutral" :disabled="!watching" @click="unwatchNote()">Note: onInput = null</mono-button>
      </div>
    </form>

    <mono-card bordered width="100%" class="example-form-log-card">
      <h3 slot="title" class="example-form-title">events</h3>
      <ol class="example-form-log">
        <li v-for="(line, i) in log" :key="i">{{ line }}</li>
        <li v-if="!log.length" class="example-form-muted">nothing yet — type in a field</li>
      </ol>
    </mono-card>
  </div>
</template>

<style scoped>
.example-form-demo {
  container-type: inline-size;
  display: grid;
  gap: calc(var(--mono-spacing) * 4);
  width: 100%;
  max-width: 28rem;
}
.example-form {
  display: grid;
  gap: calc(var(--mono-spacing) * 4);
}
.example-form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--mono-spacing) * 2);
}
.example-form-log-card {
  --mono-card-padding: 0;
  /* the head sits right on the content: its divider is the spacing; the title
     type goes through the card's own knob so both builds paint it */
  --mono-card-gap: 0;
  --mono-card-title-font: var(--mono-text-xs);
  overflow: hidden;
}
.example-form-log-card :deep([mono-title]) {
  padding: calc(var(--mono-spacing) * 3) calc(var(--mono-spacing) * 4) 0;
  color: var(--muted-foreground);
}
.example-form-log-card .example-form-title {
  margin: calc(var(--mono-spacing) * 3) calc(var(--mono-spacing) * 4) 0;
  font-weight: var(--mono-font-weight-semibold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}
.example-form-log {
  margin: 0;
  padding: calc(var(--mono-spacing) * 3) calc(var(--mono-spacing) * 4) calc(var(--mono-spacing) * 3) calc(var(--mono-spacing) * 8);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: var(--mono-text-xs);
  line-height: var(--mono-leading-relaxed);
  color: var(--foreground);
}
.example-form-log li + li {
  margin-top: var(--mono-spacing);
}
.example-form-muted {
  list-style: none;
  margin-left: calc(var(--mono-spacing) * -4);
  font-family: inherit;
  color: var(--muted-foreground);
}
</style>
