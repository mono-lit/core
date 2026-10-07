<script setup lang="ts">
import '@mono-lit/helper/ui/tag-input'
import { ref, onMounted } from 'vue'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

const ds = ref<any>(null)
const tags = ref<unknown[]>([])

// One accessor per group level — string reads a field, function computes it.
const displayGroup = ['Gender', (row: any) => row.AddressInfo?.[0]?.City?.Region ?? '—']
const displayValue = (row: any) => `${row.FirstName} ${row.LastName} · @${row.UserName}`

onMounted(async () => {
  // PLAIN, paginated source — NO `group` in the request, so paging stays on.
  // `group` makes mono-tag-input fetch flat rows page by page (scroll loads
  // more) and bucket the accumulated rows by `display-group` in the browser.
  const { dataSource } = await monoCreateFetcher({
    baseUrl: 'https://services.odata.org/TripPinRESTierService/(S(monohelperdocs000000001))',
    url: '/People',
  }).response({
    options: {
      key: 'UserName',
      // NO `select`: TripPin 500s when a $select names a collection-valued
      // property, and the 2nd group level needs AddressInfo. A bare /People
      // returns every field, address included.
      paginate: true,
      pageSize: 20,
    },
  })

  ds.value = dataSource
})
</script>

<template>
  <ClientOnly>
    <div style="width: 100%;  display: grid; gap: 0.6rem;">
      <mono-tag-input
        :data-source.prop="ds"
        group
        group-sticky
        checkable
        allow-custom="false"
        load-more="scroll"
        :display-group.prop="displayGroup"
        :display-value.prop="displayValue"
        key-value="UserName"
        label="People (grouped + paged)"
        placeholder="Add people…"
        @change="tags = $event.detail.modelValue"
      ></mono-tag-input>

      <div style="font-family: 'DM Mono', ui-monospace, monospace; font-size: 0.8rem; opacity: 0.7;">
        selected usernames → {{ tags.length ? tags.join(', ') : '—' }}
      </div>
    </div>
  </ClientOnly>
</template>
