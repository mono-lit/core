<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/textarea'
import '@mono-lit/helper/ui/select'
import '@mono-lit/helper/ui/tag-input'
import '@mono-lit/helper/ui/date'
import '@mono-lit/helper/ui/dropdown-table'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/slider'
import '@mono-lit/helper/ui/otp'
import '@mono-lit/helper/ui/file-upload'
import '@mono-lit/helper/ui/rich-text-editor'
import '@mono-lit/helper/ui/checkbox'
import '@mono-lit/helper/ui/radio'
import '@mono-lit/helper/ui/switch'
import '@mono-lit/helper/ui/button'
import { controlMonoDataDropdown } from '@mono-lit/helper'
import { controlMonoForm } from '@mono-lit/helper/ui/form'

// Every control that supports `controlMonoForm`, in one form. Each opts in
// with `:control-form` + `key-form` — no `:model-value`, no `@change`: the
// form owns the values and the validation. Rules run live (per keystroke);
// Submit runs every rule with `form.validate()`.

const roles = [
  { label: 'Engineer', value: 'engineer' },
  { label: 'Designer', value: 'designer' },
  { label: 'Product manager', value: 'pm' },
  { label: 'Analyst', value: 'analyst' },
]

const skills = [
  { label: 'Vue', value: 'vue' },
  { label: 'Lit', value: 'lit' },
  { label: 'TypeScript', value: 'ts' },
  { label: 'CSS', value: 'css' },
  { label: 'SQL', value: 'sql' },
]

type Person = { Id: number; Name: string; Team: string }
const people: Person[] = [
  { Id: 1, Name: 'Ada Lovelace', Team: 'Platform' },
  { Id: 2, Name: 'Alan Turing', Team: 'Research' },
  { Id: 3, Name: 'Grace Hopper', Team: 'Compilers' },
  { Id: 4, Name: 'Katherine Johnson', Team: 'Analytics' },
  { Id: 5, Name: 'Barbara Liskov', Team: 'Platform' },
]

// The dropdown-table's own data controller (rows, paging, search) — the form
// only owns its VALUE, like every other control.
const ddState = ref<Record<string, any>>({})
const managerDd = controlMonoDataDropdown<Person>(people, {
  keyExpr: 'Id',
  displayExpr: 'Name',
  pageSize: 5,
  state: ddState,
  props: {
    dropdownTable: { placeholder: 'Pick a manager…' },
    th: [
      { field: 'Name', caption: 'Name' },
      { field: 'Team', caption: 'Team' },
    ],
  },
})
const managerRows = ref<Person[]>([])
const offRows = managerDd.table.subscribe(() => {
  managerRows.value = [...managerDd.table.items]
})
managerDd.table.load()

const state = ref<Record<string, any>>({})

const form = controlMonoForm({
  validation: { type: 'live' },
  state,
  inputs: {
    FullName: {
      component: 'mono-input',
      value: '',
      validates: [
        { type: 'required', message: 'Your name is required' },
        { type: 'min', value: 3, message: 'At least 3 characters' },
      ],
    },
    Email: {
      component: 'mono-input',
      value: '',
      validates: [
        { type: 'required', message: 'Email is required' },
        { type: 'email', message: 'That is not an email address' },
      ],
    },
    Password: {
      component: 'mono-input',
      value: '',
      validates: [
        { type: 'required', message: 'Choose a password' },
        { type: 'min', value: 8, message: 'At least 8 characters' },
        { type: 'pattern', value: /\d/, message: 'Include at least one digit' },
      ],
    },
    Age: {
      component: 'mono-input',
      value: '',
      validates: [
        { type: 'required', message: 'Age is required' },
        {
          type: 'custom',
          validate: ({ value }) => (Number(value) >= 18 && Number(value) <= 99) || 'Between 18 and 99',
        },
      ],
    },
    Role: {
      component: 'mono-select',
      value: null,
      props: { items: roles, keyValue: 'value', displayValue: 'label' },
      validates: [{ type: 'required', message: 'Pick a role' }],
    },
    Skills: {
      component: 'mono-tag-input',
      value: [],
      props: { items: skills, keyValue: 'value', displayValue: 'label' },
      validates: [
        { type: 'required', message: 'Add your skills' },
        { type: 'min', value: 2, message: 'Pick at least 2 skills' },
      ],
    },
    StartDate: {
      component: 'mono-date',
      value: '',
      validates: [{ type: 'required', message: 'When do you start?' }],
    },
    Manager: {
      component: 'mono-dropdown-table',
      value: null,
      validates: [{ type: 'required', message: 'Pick your manager' }],
    },
    Experience: {
      component: 'mono-slider',
      value: 0,
      validates: [
        { type: 'custom', validate: ({ value }) => Number(value) >= 1 || 'At least 1 year of experience' },
      ],
    },
    InviteCode: {
      component: 'mono-otp',
      value: '',
      validates: [
        { type: 'required', message: 'Enter your invite code' },
        { type: 'min', value: 6, message: 'The invite code has 6 characters' },
      ],
    },
    Bio: {
      component: 'mono-textarea',
      value: '',
      validates: [{ type: 'max', value: 200, message: 'Keep it under 200 characters' }],
    },
    CoverLetter: {
      component: 'mono-rich-text-editor',
      value: '',
      props: { toolbar: 'basic', minHeight: '7rem' },
      validates: [{ type: 'required', message: 'Write a short cover letter' }],
    },
    Resume: {
      component: 'mono-file-upload',
      value: [],
      validates: [{ type: 'required', message: 'Attach your resume' }],
    },
    Contract: {
      component: 'mono-radio',
      value: '',
      validates: [{ type: 'required', message: 'Choose a contract type' }],
    },
    Remote: {
      component: 'mono-switch',
      value: false,
    },
    Terms: {
      component: 'mono-checkbox',
      value: false,
      validates: [{ type: 'custom', validate: ({ value }) => value === true || 'You must accept the terms' }],
    },
  },
})

// checkbox / radio / switch have no validation-message prop yet: read the
// message from `state` and render it yourself.
const ownMessage = (key: string): string => {
  const item = state.value[key]
  return item && !item.validate.success ? item.validate.message : ''
}

// Every field-like control shares `validation-position`: try the three.
const validationPosition = ref<'bottom' | 'icon' | 'float'>('bottom')

const submitted = ref<Record<string, unknown> | null>(null)
const failed = ref(false)

async function onSubmit() {
  const ok = await form.validate()
  failed.value = !ok
  submitted.value = ok ? serializable(form.values()) : null
}

function onReset() {
  form.reset()
  submitted.value = null
  failed.value = false
}

// file-upload's value is a list of `{ file, name, size, … }` items, and a File
// doesn't survive JSON.stringify — show the names.
function serializable(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(values)) {
    const isFiles = Array.isArray(v) && v.some((f) => f instanceof File || f?.file instanceof File)
    out[k] = isFiles ? (v as Array<{ name: string }>).map((f) => f.name) : v
  }
  return out
}

const invalidCount = computed(() => Object.values(state.value).filter((i: any) => !i.validate.success).length)

onBeforeUnmount(() => {
  offRows()
  managerDd.dispose()
  form.dispose()
})
</script>

<template>
  <div style="width: 100%;">
    <DemoControls>
      <DemoSelect v-model="validationPosition" label="Validation position" :options="['bottom', 'icon', 'float']" />
    </DemoControls>

    <form class="example-complete" novalidate @submit.prevent="onSubmit" @reset.prevent="onReset">
      <fieldset class="example-complete-section">
        <legend>Account</legend>
        <div class="example-complete-grid">
          <mono-input :control-form="form" key-form="FullName" :validation-position="validationPosition" label="Full name" placeholder="Ada Lovelace" required />
          <mono-input :control-form="form" key-form="Email" :validation-position="validationPosition" type="email" label="Email" placeholder="ada@example.com" required />
          <mono-input :control-form="form" key-form="Password" :validation-position="validationPosition" type="password" label="Password" helper-text="8+ characters, one digit" required />
          <mono-input :control-form="form" key-form="Age" :validation-position="validationPosition" type="number" label="Age" placeholder="18–99" required />
        </div>
      </fieldset>

      <fieldset class="example-complete-section">
        <legend>Role</legend>
        <div class="example-complete-grid">
          <mono-select :control-form="form" key-form="Role" :validation-position="validationPosition" label="Role" placeholder="Pick a role" required />
          <mono-tag-input :control-form="form" key-form="Skills" :validation-position="validationPosition" label="Skills" placeholder="Add a skill" required />
          <mono-date :control-form="form" key-form="StartDate" :validation-position="validationPosition" label="Start date" placeholder="Select a date" required />
          <mono-dropdown-table
            :control-data-dropdown.prop="managerDd"
            :control-form="form"
            key-form="Manager"
            :validation-position="validationPosition"
            label="Manager"
            required
          >
            <table mono-table>
              <thead>
                <tr>
                  <th v-for="c in ddState.th" :key="c.field">
                    <mono-table-th :control-table.prop="managerDd.table" :field="c.field" />
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in managerRows" :key="r.Id" :data-row-key="String(r.Id)">
                  <td>{{ r.Name }}</td>
                  <td>{{ r.Team }}</td>
                </tr>
              </tbody>
            </table>
          </mono-dropdown-table>
        </div>
        <mono-slider :control-form="form" key-form="Experience" label="Years of experience" :min="0" :max="20" />
        <mono-otp :control-form="form" key-form="InviteCode" :validation-position="validationPosition" label="Invite code" type="alphanumeric" length="6" groups="3" helper-text="From your invitation email" required />
      </fieldset>

      <fieldset class="example-complete-section">
        <legend>About you</legend>
        <mono-textarea :control-form="form" key-form="Bio" :validation-position="validationPosition" label="Short bio" placeholder="A few words about you" show-counter :max-length="200" />
        <mono-rich-text-editor :control-form="form" key-form="CoverLetter" label="Cover letter" required />
        <mono-file-upload :control-form="form" key-form="Resume" label="Resume" accept=".pdf,.doc,.docx" required />
      </fieldset>

      <fieldset class="example-complete-section">
        <legend>Terms</legend>
        <div class="example-complete-choice">
          <span class="example-complete-label">Contract type</span>
          <mono-radio :control-form="form" key-form="Contract" value="fulltime" label="Full-time" />
          <mono-radio :control-form="form" key-form="Contract" value="contract" label="Contract" />
          <mono-radio :control-form="form" key-form="Contract" value="intern" label="Internship" />
          <span v-if="ownMessage('Contract')" class="example-complete-error">{{ ownMessage('Contract') }}</span>
        </div>
        <mono-switch :control-form="form" key-form="Remote" label="Open to remote work" />
        <div class="example-complete-choice">
          <mono-checkbox :control-form="form" key-form="Terms" label="I accept the terms and conditions" />
          <span v-if="ownMessage('Terms')" class="example-complete-error">{{ ownMessage('Terms') }}</span>
        </div>
      </fieldset>

      <div class="example-complete-actions">
        <mono-button type="submit">Submit</mono-button>
        <mono-button type="reset" variant="outline">Reset</mono-button>
        <span v-if="failed" class="example-complete-error">{{ invalidCount }} field(s) need attention.</span>
      </div>
    </form>

    <DemoReadout v-if="submitted">
      <pre class="example-complete-json">{{ JSON.stringify(submitted, null, 2) }}</pre>
    </DemoReadout>
  </div>
</template>

<style scoped>
.example-complete {
  display: grid;
  gap: calc(var(--mono-spacing) * 6);
  width: 100%;
}
.example-complete-section {
  display: grid;
  gap: calc(var(--mono-spacing) * 4);
  min-width: 0;
  margin: 0;
  padding: calc(var(--mono-spacing) * 4);
  border: 1px solid var(--border);
  border-radius: var(--mono-radius-lg);
}
.example-complete-section > legend {
  padding-inline: calc(var(--mono-spacing) * 1.5);
  font-size: var(--mono-text-sm);
  font-weight: var(--mono-font-weight-semibold);
  color: var(--foreground);
}
.example-complete-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: calc(var(--mono-spacing) * 4);
}
.example-complete-choice {
  display: grid;
  gap: calc(var(--mono-spacing) * 2);
}
.example-complete-label {
  font-size: var(--mono-text-sm);
  font-weight: var(--mono-font-weight-medium);
  color: var(--foreground);
}
.example-complete-error {
  font-size: var(--mono-text-sm);
  color: var(--destructive);
}
.example-complete-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: calc(var(--mono-spacing) * 3);
}
.example-complete-json {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
