<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/button'
import { controlMonoTable } from '@mono-lit/helper'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

type PersonRow = {
  UserName: string
  FirstName: string
  LastName: string
}

// A real remote source, so the empty state is reached the way it is in an app:
// search for something that does not exist.
//
// Nothing in this component watches `items.length`. That is the point —
// <mono-table-empty> reads the controller itself, and it reads it correctly:
// `items: []` with `loading: false` is ALSO a controller that has never been
// asked for anything, so the obvious `!rows.length && !loading` prints "no data"
// on every table for the moment between mount and first response. The element
// waits for `table.hasLoaded`.
const table = controlMonoTable<PersonRow>(null, {
  keyExpr: 'UserName',
  searchValue: ['UserName', 'FirstName', 'LastName'],
})

const rows = ref<PersonRow[]>([])
const off = table.subscribe(() => {
  rows.value = [...table.items]
})

onMounted(async () => {
  const { dataSource } = await monoCreateFetcher({
    baseUrl: 'https://services.odata.org/TripPinRESTierService/(S(monohelperdocs000000001))',
    url: '/People',
  }).response({
    options: {
      key: 'UserName',
      select: ['UserName', 'FirstName', 'LastName'],
      paginate: true,
      pageSize: 8,
    },
  })
  table.bind(dataSource)
  await table.load()
})

onBeforeUnmount(() => off())

// ── the variants below the table ──────────────────────────────────────────────

type Variant = 'default' | 'props' | 'emoji' | 'body' | 'bare' | 'sized'

const variant = ref<Variant>('default')

const VARIANTS: Array<{ id: Variant; label: string; note: string }> = [
  { id: 'default', label: 'Defaults', note: 'No props at all — icon, title, subtitle and the reload button all come from the element.' },
  { id: 'props', label: 'Own copy', note: 'icon / title / subtitle / reload-label override the defaults.' },
  { id: 'emoji', label: 'Emoji icon', note: 'icon takes an iconify class OR any other string — an emoji renders as text, not as a class.' },
  { id: 'bare', label: 'Title only', note: 'Once a part has a default, an explicit empty string is how you drop it.' },
  { id: 'sized', label: 'Sized', note: 'min-height / max-height / height control the room it reserves. max-height wins over the floor.' },
  { id: 'body', label: 'Body slot', note: 'slot="body" replaces the icon, title and subtitle entirely — put any markup, or a mono component, in the same box.' },
]

const note = () => VARIANTS.find((v) => v.id === variant.value)?.note ?? ''

const created = ref(0)
</script>

<template>
  <div style="display: grid; gap: 0.75rem; width: 100%">
    <mono-table-search
      :control-table.prop="table"
      placeholder="Search people — try “zzzz” to empty the grid…"
      clearable
    ></mono-table-search>

    <div class="example-variants">
      <button
        v-for="v in VARIANTS"
        :key="v.id"
        type="button"
        class="example-variant"
        :class="{ 'example-variant-on': variant === v.id }"
        @click="variant = v.id"
      >
        {{ v.label }}
      </button>
    </div>

    <div mono-table-scroll>
      <table mono-table>
        <caption>
          <!-- Its pair. Both live in the caption; each reserves its own room, so
               the spinner's hide cannot take the message's away. -->
          <mono-table-loading :control-table.prop="table"></mono-table-loading>

          <!-- 1. Defaults: nothing but the controller. -->
          <mono-table-empty
            v-if="variant === 'default'"
            :control-table.prop="table"
          ></mono-table-empty>

          <!-- 2. Your own copy. -->
          <mono-table-empty
            v-else-if="variant === 'props'"
            :control-table.prop="table"
            icon="i-mdi-account-search-outline"
            title="No people found"
            subtitle="Nothing matches that search. Try a different term."
            reload-label="Search again"
          ></mono-table-empty>

          <!-- 3. An emoji. `i-` + two dashed segments is a class; anything else
                  is text, so this needs no escaping or opt-out. -->
          <mono-table-empty
            v-else-if="variant === 'emoji'"
            :control-table.prop="table"
            icon="📭"
            title="Nothing in the box"
            subtitle="Empty as can be."
          ></mono-table-empty>

          <!-- 4. Dropping parts. `''` is the only way once they have defaults. -->
          <mono-table-empty
            v-else-if="variant === 'bare'"
            :control-table.prop="table"
            icon=""
            title="No people found"
            subtitle=""
          ></mono-table-empty>

          <!-- 5. Sizing. The reservation grows with the message on its own — the
                  box is sticky, and one taller than its container gets clamped
                  back onto the column names — so these only override that. -->
          <mono-table-empty
            v-else-if="variant === 'sized'"
            :control-table.prop="table"
            title="Compact"
            subtitle="Custom height 20rem"
            min-height="20rem"
            max-height="20rem"
          ></mono-table-empty>

          <!-- 6. The body slot. It replaces icon/title/subtitle, and keeps the
                  placement, centring and reserved room. -->
          <mono-table-empty v-else :control-table.prop="table" min-height="15rem">
            <div slot="body" class="example-body">
              <strong>Nothing here yet</strong>
              <span>Anything can go in this slot — including mono components.</span>
              <mono-button size="sm" color="primary" @click="created++">
                Create the first one
              </mono-button>
              <em v-if="created">clicked {{ created }}×</em>
            </div>
          </mono-table-empty>
        </caption>

        <thead>
          <tr>
            <th>User name</th>
            <th>First name</th>
            <th>Last name</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.UserName">
            <td>{{ row.UserName }}</td>
            <td>{{ row.FirstName }}</td>
            <td>{{ row.LastName }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <mono-table-paging :control-table.prop="table"></mono-table-paging>

    <p class="example-note">{{ note() }}</p>
  </div>
</template>

<style scoped>
.example-variants {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.example-variant {
  padding: 0.28rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: var(--mono-radius-sm);
  background: var(--card);
  color: var(--foreground);
  font: inherit;
  font-size: 0.78rem;
  cursor: pointer;
}
.example-variant-on {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 10%, transparent);
  color: var(--primary);
}
.example-note {
  margin: 0;
  font-size: 0.78rem;
  opacity: 0.7;
}
.example-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}
.example-body span {
  font-size: 0.78rem;
  opacity: 0.7;
}
.example-body em {
  font-size: 0.72rem;
  opacity: 0.55;
}
</style>
