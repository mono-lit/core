<script setup>
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/select'
import '@mono-lit/helper/ui/textarea'
import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/chip'
import '@mono-lit/helper/ui/table'
import { controlMonoForm } from '@mono-lit/helper/ui/form'

const genders = ref([
  { label: 'Male', value: 'M' },
  { label: 'Female', value: 'F' },
])

// The form writes a snapshot here on every change, so the template below can
// read validation state with no manual subscription.
const state = ref({})

const form = controlMonoForm({
  // Default timing for every rule. `live` = on each keystroke (input),
  // `change` = on commit/blur (change).
  validation: { type: 'live' },
  state,
  inputs: {
    Name: {
      component: 'mono-input',
      value: '',
      validates: [
        { type: 'required', message: 'Nama wajib diisi' },
        { type: 'min', value: 3, message: 'Minimal 3 huruf' },
      ],
    },
    Email: {
      component: 'mono-input',
      value: '',
      // `change` — quiet until you leave the field, so it doesn't shout while typing.
      validates: [{ type: 'email', message: 'Format email salah', timing: 'change' }],
    },
    Gender: {
      component: 'mono-select',
      value: null,
      props: { items: genders.value, keyValue: 'value', displayValue: 'label' },
      validates: [{ type: 'required', message: 'Pilih gender' }],
    },
    Note: {
      component: 'mono-textarea',
      value: '',
      validates: [{ type: 'max', value: 40, message: 'Maksimal 40 karakter' }],
    },
  },
})

const submitted = ref(null)
async function onSubmit() {
  // Runs EVERY rule regardless of timing.
  const ok = await form.validate()
  submitted.value = ok ? form.values() : null
}

onBeforeUnmount(() => form.dispose())
</script>

<template>
  <div class="example-form-demo">
    <mono-card bordered width="100%">
      <h3 slot="title">Profil</h3>
      <p slot="subtitle">Rules run live; the email rule waits for a commit.</p>

      <form class="example-form" @submit.prevent="onSubmit">
        <!-- No :model-value, no @change — the form owns the value. -->
        <div class="example-form-grid">
          <mono-input :control-form="form" key-form="Name" label="Nama" placeholder="Nama lengkap" />
          <mono-input :control-form="form" key-form="Email" label="Email" placeholder="you@mail.com" />
        </div>
        <mono-select :control-form="form" key-form="Gender" label="Gender" placeholder="Pilih…" />
        <mono-textarea :control-form="form" key-form="Note" label="Catatan" rows="2" />
      </form>

      <div slot="actions" class="example-form-actions">
        <mono-button size="sm" variant="outline" color="neutral" type="button"
          @click="form.reset(); submitted = null">Reset</mono-button>
        <mono-button size="sm" color="primary" @click="onSubmit">Simpan</mono-button>
      </div>
    </mono-card>

    <div class="example-form-readout">
      <mono-card bordered width="100%" class="example-form-readout-card">
        <h3 slot="title" class="example-form-title">form.items() — live</h3>
        <div mono-table-scroll><table mono-table class="example-form-table">
          <thead>
            <tr><th>key</th><th>currentValue</th><th>valid</th><th>message</th></tr>
          </thead>
          <tbody>
            <tr v-for="(item, key) in state" :key="key" :data-row="key">
              <td>{{ key }}</td>
              <td class="example-form-val">{{ item.currentValue === '' ? '—' : item.currentValue }}</td>
              <td>
                <mono-chip size="xs" :color="item.validate.success ? 'success' : 'danger'">
                  {{ item.validate.success ? 'valid' : 'invalid' }}
                </mono-chip>
              </td>
              <td class="example-form-msg">{{ item.validate.message || '—' }}</td>
            </tr>
          </tbody>
        </table></div>
      </mono-card>

      <mono-card bordered width="100%" class="example-form-readout-card">
        <h3 slot="title" class="example-form-title">submitted</h3>
        <pre class="example-form-pre" data-submitted>{{ submitted ?? '— belum valid —' }}</pre>
      </mono-card>
    </div>
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
  gap: calc(var(--mono-spacing) * 4);
  width: 100%;
}
.example-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: calc(var(--mono-spacing) * 4);
}
.example-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: calc(var(--mono-spacing) * 2);
  width: 100%;
}
.example-form-readout {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: calc(var(--mono-spacing) * 4);
  align-items: start;
}
/* The readout cards hold a table and a code block edge to edge. */
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
.example-form-pre {
  margin: 0;
  padding: calc(var(--mono-spacing) * 3) calc(var(--mono-spacing) * 4);
  max-height: 12rem;
  overflow: auto;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: var(--mono-text-xs);
  line-height: var(--mono-leading-relaxed);
  color: var(--foreground);
  background: var(--muted);
}
@container (max-width: 960px) {
  .example-form-readout {
    grid-template-columns: 1fr;
  }
}
@container (max-width: 520px) {
  .example-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
