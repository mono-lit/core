<script setup>
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/select'
import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/chip'
import '@mono-lit/helper/ui/table'
import { controlMonoForm } from '@mono-lit/helper/ui/form'

const genders = ref([
  { label: 'Male', value: 'M' },
  { label: 'Female', value: 'F' },
  { label: 'Other', value: 'X' },
])

const state = ref({})
const log = ref([])
const note = (m) => { log.value = [m, ...log.value].slice(0, 6) }

const form = controlMonoForm({
  validation: { type: 'live' },
  state,
  inputs: {
    Age: {
      component: 'mono-input',
      value: 20,
      validates: [{ type: 'required', message: 'Umur wajib diisi' }],
    },

    // This watcher runs for EVERY change in the form — its own (peerKey === 'Name')
    // and every other field's (peerKey === that field). That fan-out is what
    // replaces a separate peer-watcher registry.
    Name: {
      component: 'mono-input',
      value: '',
      validates: [{ type: 'required', message: 'Nama wajib diisi' }],
      // `peerEvent` is the real input / change CustomEvent that caused
      // this run — reach `.type`, `.target`, `.detail` or stop it from here.
      watcher: ({ peerKey, peerCurrentValue, peerEvent, setProp }) => {
        if (peerKey === 'Age') {
          const minor = Number(peerCurrentValue) < 18
          setProp({
            component: 'mono-input',
            key: 'Name',
            props: { disabled: minor, helperText: minor ? 'Dikunci: umur < 18' : '' },
          })
          note(`Age → ${peerCurrentValue} (${peerEvent?.type ?? 'programmatic'}): Name ${minor ? 'disabled' : 'enabled'}`)
        }
      },
    },

    // Cross-field validation the other way: Gender is validated against Age.
    Gender: {
      component: 'mono-select',
      value: null,
      props: { items: genders.value, keyValue: 'value', displayValue: 'label' },
      watcher: ({ peerKey, values, setValidation }) => {
        if (peerKey !== 'Age' && peerKey !== 'Gender') return
        if (values.Gender === 'X' && Number(values.Age) < 21) {
          setValidation({
            component: 'mono-select',
            key: 'Gender',
            validation: { success: false, message: 'Wrong Gender untuk umur < 21' },
          })
          note('Gender marked invalid by watcher')
        } else if (values.Gender) {
          setValidation({ key: 'Gender', validation: { success: true, message: '' } })
        }
      },
    },

    // Classic pair check via `type: 'custom'` — it receives { value, values }.
    Password: { component: 'mono-input', value: '' },
    Confirm: {
      component: 'mono-input',
      value: '',
      validates: [
        {
          type: 'custom',
          validate: ({ value, values }) => value === values.Password || 'Tidak sama dengan Password',
        },
      ],
    },
  },
})

onBeforeUnmount(() => form.dispose())
</script>

<template>
  <div class="example-form-demo">
    <mono-card bordered width="100%">
      <h3 slot="title">Watchers</h3>
      <p slot="subtitle">
        Set <strong>Age</strong> below 18 — <code>Name</code>'s own watcher sees
        <code>peerKey === 'Age'</code> and disables it via <code>setProp</code>. Pick
        <strong>Other</strong> with an age under 21 and <code>setValidation</code> marks the
        select invalid. The log shows <code>peerEvent.type</code> — the DOM event that caused each run.
      </p>

      <form class="example-form" @submit.prevent="form.validate()">
        <mono-input :control-form="form" key-form="Age" label="Age" type="number" />
        <mono-input :control-form="form" key-form="Name" label="Name" placeholder="Nama lengkap" />
        <mono-select :control-form="form" key-form="Gender" label="Gender" placeholder="Pilih…" />
        <span class="example-form-spacer" aria-hidden="true"></span>
        <mono-input :control-form="form" key-form="Password" label="Password" type="password" />
        <mono-input :control-form="form" key-form="Confirm" label="Confirm" type="password" />
      </form>
    </mono-card>

    <div class="example-form-readout">
      <mono-card bordered width="100%" class="example-form-readout-card">
        <h3 slot="title" class="example-form-title">form.items()</h3>
        <div mono-table-scroll><table mono-table class="example-form-table">
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
        <h3 slot="title" class="example-form-title">watcher log</h3>
        <ul class="example-form-log">
          <li v-for="(l, i) in log" :key="i">{{ l }}</li>
          <li v-if="!log.length" class="example-form-muted">nothing yet — change Age or Gender</li>
        </ul>
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: calc(var(--mono-spacing) * 4);
}
.example-form-readout {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: calc(var(--mono-spacing) * 4);
  align-items: start;
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
.example-form-log {
  margin: 0;
  padding: calc(var(--mono-spacing) * 3) calc(var(--mono-spacing) * 4) calc(var(--mono-spacing) * 3) calc(var(--mono-spacing) * 8);
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
  color: var(--muted-foreground);
}
@container (max-width: 960px) {
  .example-form-readout {
    grid-template-columns: 1fr;
  }
}
@container (max-width: 520px) {
  .example-form {
    grid-template-columns: 1fr;
  }
  .example-form-spacer {
    display: none;
  }
}
</style>
