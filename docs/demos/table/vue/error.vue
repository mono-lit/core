<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import { controlMonoTable } from '@mono-lit/helper'

type Person = {
  Id: number
  Name: string
  Role: string
  Email: string
  Department: string
  City: string
  Phone: string
}

// Wide on purpose — more columns than the box, plus a pinned action column, so
// the table scrolls both ways and the bar has something to stay in view over.
const PEOPLE: Person[] = [
  { Id: 1, Name: 'Ada Lovelace', Role: 'Analyst', Email: 'ada@example.com', Department: 'Research', City: 'London', Phone: '+44 20 7946 0001' },
  { Id: 2, Name: 'Alan Turing', Role: 'Engineer', Email: 'alan@example.com', Department: 'Computing', City: 'Manchester', Phone: '+44 16 1234 0002' },
  { Id: 3, Name: 'Grace Hopper', Role: 'Admiral', Email: 'grace@example.com', Department: 'Navy', City: 'Arlington', Phone: '+1 703 555 0003' },
  { Id: 4, Name: 'Katherine Johnson', Role: 'Physicist', Email: 'katherine@example.com', Department: 'Flight', City: 'Hampton', Phone: '+1 757 555 0004' },
  { Id: 5, Name: 'Margaret Hamilton', Role: 'Engineer', Email: 'margaret@example.com', Department: 'Software', City: 'Cambridge', Phone: '+1 617 555 0005' },
  { Id: 6, Name: 'Radia Perlman', Role: 'Engineer', Email: 'radia@example.com', Department: 'Networks', City: 'Redmond', Phone: '+1 425 555 0006' },
  { Id: 7, Name: 'Barbara Liskov', Role: 'Professor', Email: 'barbara@example.com', Department: 'CSAIL', City: 'Cambridge', Phone: '+1 617 555 0007' },
  { Id: 8, Name: 'Frances Allen', Role: 'Fellow', Email: 'frances@example.com', Department: 'Compilers', City: 'Yorktown', Phone: '+1 914 555 0008' },
  { Id: 9, Name: 'Shafi Goldwasser', Role: 'Professor', Email: 'shafi@example.com', Department: 'Crypto', City: 'Berkeley', Phone: '+1 510 555 0009' },
  { Id: 10, Name: 'Lynn Conway', Role: 'Architect', Email: 'lynn@example.com', Department: 'VLSI', City: 'Ann Arbor', Phone: '+1 734 555 0010' },
]

const COLUMNS: Array<keyof Person> = ['Name', 'Role', 'Email', 'Department', 'City', 'Phone']

// A source you can break on demand. A real backend would be more realistic and
// far less useful in a demo — you cannot press a button to take a server down.
// `failWith` is whatever the store rejects with, because the point of the bar is
// that it shows the ERROR'S OWN text rather than a message the library made up.
const failWith = ref<unknown>(null)

function makeSource() {
  let loading = false
  const listeners = new Map<string, Set<() => void>>()
  const emit = (name: string) => listeners.get(name)?.forEach((fn) => fn())

  return {
    load: () =>
      new Promise<Person[]>((resolve, reject) => {
        loading = true
        emit('loadingChanged')
        setTimeout(() => {
          loading = false
          emit('loadingChanged')
          if (failWith.value !== null) {
            reject(failWith.value)
            return
          }
          emit('changed')
          resolve(PEOPLE)
        }, 320)
      }),
    // The devextreme shape: a rejected load leaves the LAST successful rows in
    // the source. Clearing them from the table is the controller's doing.
    items: () => PEOPLE,
    totalCount: () => PEOPLE.length,
    pageIndex: () => 0,
    pageSize: () => PEOPLE.length,
    paginate: () => false,
    filter: () => null,
    sort: () => null,
    on: (name: string, fn: () => void) => {
      if (!listeners.has(name)) listeners.set(name, new Set())
      listeners.get(name)!.add(fn)
    },
    off: (name: string, fn: () => void) => listeners.get(name)?.delete(fn),
    isLoaded: () => true,
    isLoading: () => loading,
  }
}

const table = controlMonoTable<Person>(null, { keyExpr: 'Id' })

const rows = ref<Person[]>([])
const caught = ref<string>('')
const off = table.subscribe(() => {
  rows.value = [...table.items]
  // Only to show what the controller is holding — the bar reads this itself.
  caught.value = table.error ? `${table.error.source}: ${table.error.message}` : ''
})

onMounted(async () => {
  table.bind(makeSource())
  await table.load().catch(() => {})
})

onBeforeUnmount(() => off())

// devextreme's ODataStore shape: `extend(Error(xhr.statusText), { httpStatus, … })`.
// Over HTTP/2 the statusText is EMPTY, so a 403 used to read as "Error" — the
// constructor's name, all the text the error had.
const dx = (message: string, extra: object) => Object.assign(new Error(message), extra)

// The shapes a store can reject with. Every one has to produce a readable line;
// one with an HTTP status gets the preset for it, and anything the SERVER said
// beyond the status rides along as the muted detail.
const FAILURES: Array<{ label: string; value: () => unknown }> = [
  { label: '403 (blank statusText)', value: () => dx('', { httpStatus: 403 }) },
  { label: '401', value: () => dx('Unauthorized', { httpStatus: 401 }) },
  {
    label: '500 + server body',
    value: () =>
      dx('Internal Server Error', {
        httpStatus: 500,
        errorDetails: { message: 'Object reference not set to an instance of an object' },
      }),
  },
  { label: 'network', value: () => new TypeError('Failed to fetch') },
  { label: 'Error', value: () => new Error('The server refused the connection') },
  { label: 'string', value: () => 'Request timed out after 30s' },
  { label: 'bare status', value: () => ({ status: 503 }) },
]

async function breakIt(value: unknown) {
  failWith.value = value
  // The rejection is real — `.catch` it, or it is an unhandled rejection. The bar
  // does not depend on this: it reads `table.error`.
  await table.reload().catch(() => {})
}

async function fixIt() {
  failWith.value = null
  await table.reload().catch(() => {})
}

// A message of your own. It wins over anything the controller caught, for as long
// as it is set.
const ownMessage = ref('')

// What a failure does to the rows already on screen.
const behaviour = ref<'clear-list' | 'keep-list'>('clear-list')
</script>

<template>
  <div style="display: grid; gap: 0.75rem; width: 100%">
    <div class="example-controls">
      <button
        v-for="f in FAILURES"
        :key="f.label"
        type="button"
        class="example-btn"
        @click="breakIt(f.value())"
      >
        Fail with {{ f.label }}
      </button>
      <button type="button" class="example-btn example-btn-ok" @click="fixIt">
        Recover
      </button>
    </div>

    <label class="example-field">
      <span>Your own message (wins while set)</span>
      <input v-model="ownMessage" placeholder="leave empty to show the caught error" />
    </label>

    <DemoSelect
      v-model="behaviour"
      label="On failure"
      :options="[
        { value: 'clear-list', label: 'clear-list — empty the rows' },
        { value: 'keep-list', label: 'keep-list — leave them' },
      ]"
    />

    <!-- A fixed-height box, and the table stretched to fill it (mono-table-fill +
         one filler row), so the grid keeps its size when a failure clears the rows
         instead of collapsing to the header and the bar.

         The table is WIDER than the box and the header is frozen: scroll it
         sideways and the bar stays exactly the visible width, ✕ and ↻ at the
         visible right edge; scroll it down and the bar stays under the header. -->
    <div mono-table-scroll mono-scroll-y class="example-box">
      <table mono-table mono-fill mono-sticky-head class="example-wide">
        <caption>
          <mono-table-loading :control-table.prop="table"></mono-table-loading>
        </caption>

        <thead>
          <tr>
            <th v-for="col in COLUMNS" :key="col">{{ col }}</th>
            <th mono-sticky-right class="example-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <!-- A row, because <tbody> only takes rows. The element adopts the
               one it finds itself in: the row class, the zebra-skip marker and
               a colspan that follows the columns are all stamped on for you, so
               the two tags are the whole contract. -->
          <tr>
            <td :colspan="COLUMNS.length + 1">
              <mono-table-error
                :control-table.prop="table"
                :message="ownMessage"
                :behaviour="behaviour"
              ></mono-table-error>
            </td>
          </tr>

          <tr v-for="row in rows" :key="row.Id">
            <td v-for="col in COLUMNS" :key="col">{{ row[col] }}</td>
            <td mono-sticky-right class="example-actions">
              <button type="button" class="example-btn">Edit</button>
            </td>
          </tr>
          <tr mono-filler>
            <td v-for="col in COLUMNS" :key="col"></td>
            <td mono-sticky-right></td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="example-note">
      <template v-if="caught">
        <code>table.error</code> = {{ caught }} — still set after you dismiss the bar,
        because dismissing hides that one element and nothing else.
      </template>
      <template v-else><code>table.error</code> is null.</template>
    </p>
  </div>
</template>

<style scoped>
.example-box {
  height: 15rem;
}
.example-wide {
  min-width: 64rem;
}
.example-actions {
  width: 5rem;
  white-space: nowrap;
}
.example-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.example-btn {
  padding: 0.28rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: var(--mono-radius-sm);
  background: var(--card);
  color: var(--destructive);
  font: inherit;
  font-size: 0.78rem;
  cursor: pointer;
}
.example-btn-ok {
  color: var(--primary);
}
.example-field {
  display: grid;
  gap: 0.25rem;
  font-size: 0.78rem;
  opacity: 0.85;
}
.example-field input {
  padding: 0.3rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: var(--mono-radius-sm);
  font: inherit;
  font-size: 0.8rem;
}
.example-note {
  margin: 0;
  font-size: 0.78rem;
  opacity: 0.7;
}
</style>
