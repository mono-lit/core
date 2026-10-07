<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/switch'
import '@mono-lit/helper/ui/card'
import { controlMonoForm } from '@mono-lit/helper/ui/form'

// Both fields start hidden, then `setProp` toggles them at runtime — the whole
// point of the prop. Note neither declares `visible` in `inputs[key].props`:
// a static prop ALWAYS wins, so declaring it there would freeze the toggle.
const showTax = ref(false)
const showNote = ref(false)

const form = controlMonoForm({
  inputs: {
    Name: { component: 'mono-input', value: 'Denis' },
    TaxId: { component: 'mono-input', value: '' },
    Note: { component: 'mono-input', value: '' },
  },
})

function apply(key: string, visible: boolean) {
  form.setProp({ component: 'mono-input', key, props: { visible } })
}

apply('TaxId', false)
apply('Note', false)

function toggle(key: 'TaxId' | 'Note', e: Event) {
  const on = (e as CustomEvent<{ modelValue: boolean }>).detail.modelValue
  if (key === 'TaxId') showTax.value = on
  else showNote.value = on
  apply(key, on)
}

onBeforeUnmount(() => form.dispose())
</script>

<template>
  <div class="example-form-demo">
    <div class="example-form-toggles">
      <mono-switch
        label="Show Tax ID"
        sublabel="visible-type: none — the row collapses"
        :model-value="showTax"
        @change="toggle('TaxId', $event)"
      />
      <mono-switch
        label="Show Note"
        sublabel="visible-type: invisible — the row keeps its space"
        :model-value="showNote"
        @change="toggle('Note', $event)"
      />
    </div>

    <!-- The card frame makes the difference obvious: `none` collapses the row,
         `invisible` keeps its space so nothing below it moves. -->
    <mono-card bordered width="100%">
      <form class="example-form" @submit.prevent>
        <mono-input :control-form="form" key-form="Name" label="Name" />
        <mono-input
          :control-form="form"
          key-form="Note"
          label="Note"
          placeholder="Optional"
          visible-type="invisible"
        />
        <mono-input
          :control-form="form"
          key-form="TaxId"
          label="Tax ID"
          placeholder="Only for businesses"
          visible-type="none"
        />
      </form>
      <p slot="footer" class="example-form-foot">Everything below the fields stays put when “Note” toggles.</p>
    </mono-card>
  </div>
</template>

<style scoped>
.example-form-demo {
  display: grid;
  gap: calc(var(--mono-spacing) * 4);
  width: 100%;
  max-width: 28rem;
}
.example-form-toggles {
  display: grid;
  gap: calc(var(--mono-spacing) * 3);
}
.example-form {
  display: grid;
  gap: calc(var(--mono-spacing) * 4);
}
.example-form-foot {
  margin: 0;
  font-size: var(--mono-text-xs);
  color: var(--muted-foreground);
}
</style>
