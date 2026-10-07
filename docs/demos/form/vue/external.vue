<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/switch'
import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/chip'
import '@mono-lit/helper/ui/table'
import { controlMonoForm } from '@mono-lit/helper/ui/form'

// Plain Vue refs — controlMonoForm reads them through `.value`, so nothing special is
// needed to hand it external state.
const isAdmin = ref(false)
const state = ref({})

const form = controlMonoForm({
  validation: { type: 'change' },
  external: { isAdmin },
  state,
  inputs: {
    Title: { component: 'mono-input', value: 'Laporan Q3' },
    Salary: {
      component: 'mono-input',
      value: 0,
      // Reads `external.isAdmin` — re-runs whenever the form refreshes.
      watcher: ({ external, setProp }) => {
        setProp({
          component: 'mono-input',
          key: 'Salary',
          props: {
            disabled: !external.isAdmin,
            helperText: external.isAdmin ? 'Editable sebagai admin' : 'Admin only',
          },
        })
      },
    },
  },
})

// The imperative half: any Vue watch can drive the form from outside.
watch(isAdmin, () => form.refresh(), { immediate: true })

function markServerError() {
  // e.g. a 422 coming back from the API
  form.setValidation({
    component: 'mono-input',
    key: 'Title',
    validation: { success: false, message: 'Judul sudah dipakai (dari server)' },
  })
}

onBeforeUnmount(() => form.dispose())
</script>

<template>
  <div class="example-form-demo">
    <mono-card bordered width="100%">
      <h3 slot="title">Laporan</h3>
      <div slot="actions" class="example-form-bar">
        <mono-switch size="sm" label="isAdmin" sublabel="a plain Vue ref" :model-value="isAdmin"
          @change="isAdmin = $event.detail.modelValue" />
        <mono-button size="sm" variant="outline" color="danger" data-server-error
          @click="markServerError">Simulasikan error server</mono-button>
      </div>

      <form class="example-form" @submit.prevent="form.validate()">
        <mono-input :control-form="form" key-form="Title" label="Judul" />
        <mono-input :control-form="form" key-form="Salary" label="Gaji" type="number" />
      </form>
    </mono-card>

    <mono-card bordered width="100%" class="example-form-readout-card">
      <h3 slot="title" class="example-form-title">form.items()</h3>
      <div mono-table-scroll><table mono-table class="example-form-table">
        <thead>
          <tr><th>key</th><th>currentValue</th><th>props.disabled</th><th>valid</th><th>message</th></tr>
        </thead>
        <tbody>
          <tr v-for="(item, key) in state" :key="key" :data-row="key">
            <td>{{ key }}</td>
            <td class="example-form-val">{{ item.currentValue === '' ? '—' : item.currentValue }}</td>
            <td :data-disabled="!!item.props.disabled">
              <mono-chip size="xs" :color="item.props.disabled ? 'neutral' : 'info'" variant="outline">
                {{ item.props.disabled ? 'disabled' : 'enabled' }}
              </mono-chip>
            </td>
            <td :data-ok="item.validate.success">
              <mono-chip size="xs" :color="item.validate.success ? 'success' : 'danger'">
                {{ item.validate.success ? 'valid' : 'invalid' }}
              </mono-chip>
            </td>
            <td class="example-form-msg">{{ item.validate.message || '—' }}</td>
          </tr>
        </tbody>
      </table></div>
    </mono-card>
  </div>
</template>

<style scoped>
.example-form-demo {
  container-type: inline-size;
  display: grid;
  gap: calc(var(--mono-spacing) * 4);
  width: 100%;
}
.example-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: calc(var(--mono-spacing) * 4);
}
.example-form-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--mono-spacing) * 4);
  width: 100%;
  flex-wrap: wrap;
}
.example-form-readout-card {
  --mono-card-padding: 0;
  /* the head sits right on the content: its divider is the spacing; the title
     type goes through the card's own knob so both builds paint it */
  --mono-card-gap: 0;
  --mono-card-title-font: var(--mono-text-xs);
  overflow: hidden;
}
.example-form-readout-card :deep([mono-title]) {
  padding: calc(var(--mono-spacing) * 3) calc(var(--mono-spacing) * 4) 0;
  color: var(--muted-foreground);
}
.example-form-readout-card .example-form-title {
  margin: calc(var(--mono-spacing) * 3) calc(var(--mono-spacing) * 4) 0;
  font-weight: var(--mono-font-weight-semibold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}
.example-form-table {
  --mono-table-font: var(--mono-text-xs);
}
.example-form-val {
  font-variant-numeric: tabular-nums;
}
.example-form-msg {
  min-width: 10rem;
  white-space: normal;
  color: var(--muted-foreground);
}
@container (max-width: 520px) {
  .example-form {
    grid-template-columns: 1fr;
  }
}
</style>
