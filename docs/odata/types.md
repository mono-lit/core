# OData Types

Every OData service publishes a `$metadata` document describing all of its entities and
their fields. Instead of hand-writing TypeScript interfaces for those entities (tedious,
and they drift out of sync with the backend), you **generate** them from `$metadata` with
[`odata2ts`](https://odata2ts.github.io/).

There's one catch: odata2ts emits **query-object classes** (the `Q*` objects used to build
type-safe OData queries), not plain field shapes. So the workflow has a small mapping step —
turn the raw `Q*` class into a normal type with `MonoOdataMapTypes` from `@mono-lit/utility/runtime`. After
that the type is safe to use anywhere in the app.

The four steps:

1. [Configure the service](#step-1-configure-odata2ts-config-ts) in `odata2ts.config.ts`.
2. [Generate](#step-2-generate-the-classes) the classes into `src/odata/`.
3. [Map](#step-3-map-the-raw-q-classes-to-normal-types) the raw `Q*` classes to plain types.
4. [Use](#step-4-use-the-mapped-types-across-the-app) the mapped types across the app.

## Step 1 — Configure `odata2ts.config.ts`

`odata2ts.config.ts` (at the app root) lists every OData source under `services`. **Each
key is unique and becomes the folder name** generated under `src/odata/<Key>`.

```ts
// odata2ts.config.ts
import type { ConfigFileOptions } from '@odata2ts/odata2ts'
import dotenv from 'dotenv'

dotenv.config()

const sourceUrl = `${String(process.env.MONO_VUE_ODATA_BASE_URL)}`

const config: ConfigFileOptions = {
  services: {
    DTO: {
      sourceUrl,                          // the OData root (from an env var)
      source: 'src/odata/DTO/metadata.xml', // local metadata snapshot
      output: 'src/odata/DTO',            // where generated files go
    },
  },
}

export default config
```

- **`DTO`** — the unique service key → output folder `src/odata/DTO`.
- **`sourceUrl`** — the OData base URL. Keep it in an env var (`MONO_…`, see
  [Environment](../repo/env) / Rule 6) — never hardcode it.
- **`source`** — the local `metadata.xml` snapshot odata2ts reads/writes.
- **`output`** — the target folder for the generated code.

#### Many OData sources in one config

Add another key for a second service — it gets its **own folder**:

```ts
services: {
  DTO: {
    sourceUrl: `${String(process.env.MONO_VUE_ODATA_BASE_URL)}`,
    source: 'src/odata/DTO/metadata.xml',
    output: 'src/odata/DTO',
  },
  Reporting: {                            // → src/odata/Reporting
    sourceUrl: `${String(process.env.MONO_VUE_REPORTING_ODATA_URL)}`,
    source: 'src/odata/Reporting/metadata.xml',
    output: 'src/odata/Reporting',
  },
},
```

## Step 2 — Generate the classes

Run the generation script from `package.json`:

```bash
pnpm odata:gen      # dotenv -e .env.dev odata2ts
```

It loads `.env.dev` (so `MONO_VUE_ODATA_BASE_URL` resolves), reads the metadata, and writes
the typed output into each service's `output` folder. A `src/odata/DTO/` folder ends up with:

| Generated file | What it is |
| --- | --- |
| `QDefault` | The **query-object classes** — e.g. `QDTO_Brand`, `QDTO_MasterUser`. These are what you map in Step 3. |
| `DefaultModel` | The DTO model interfaces + enums. |
| `DefaultService` | OData service/entity-set classes. |
| `metadata.xml` | The metadata snapshot odata2ts read from. |

> There's also `pnpm odata:github` for pulling metadata from a GitHub source instead of a
> live URL.

::: danger Generated — never hand-edit
Everything under `src/odata/<Key>/` is regenerated on every run. Don't edit it by hand —
your changes vanish and you hide the real source (the metadata). This is **Rule 4** in
[Template Rules](../ai/template). To change the types, fix the backend / regenerate.
:::

## Step 3 — Map the raw `Q*` classes to normal types

The generated `Q*` objects describe fields as query paths (`QStringPath<string>`,
`QNumberPath<number>`, …), not as a plain shape you can put in a `ref`. **`MonoOdataMapTypes`**
(from `@mono-lit/utility/runtime`) unwraps them into a normal type. Do this once per entity in
`src/types/odata.d.ts`:

```ts
// src/types/odata.d.ts
import type {
  QDTO_Brand,
  QDTO_MasterUser,
} from '@mono-vue/odata/DTO/QDefault'
import type { MonoOdataMapTypes } from '@mono-lit/utility/runtime'

export type DTO_BrandTypes = MonoOdataMapTypes<typeof QDTO_Brand>
export type DTO_MasterUserTypes = MonoOdataMapTypes<typeof QDTO_MasterUser>

// hand-written shapes (e.g. a POST body) still live alongside as plain types
export type BrandPostTypes = {
  Nama: string
  NamaBudget: string
}
```

`MonoOdataMapTypes<typeof QDTO_Brand>` reads the `Q*` class and unwraps each path to its
real value type:

| Generated path | Becomes |
| --- | --- |
| `QStringPath<string>` | `string` |
| `QNumberPath<number>` | `number` |
| `QBooleanPath<boolean>` | `boolean` |
| `QDateTimeOffsetPath<string>` | `string` |
| `QEntityPath<QOther>` | the nested mapped object |
| `QEntityCollectionPath<QOther>` | the nested mapped object **as an array** |

So `DTO_BrandTypes` resolves to `{ Id: number; Nama: string; NamaBudget: string; Aktif:
boolean; DibuatTanggal: string }`. It also accepts an optional second generic to **override**
specific fields with another mapped type when you need to.

::: tip Import through your app's own alias
The `Q*` objects are imported via the **role-based resolve alias** — `@mono-vue/...` in a
Remote, `@mono-host/...` in the Host. Each alias points at that app's own `./src` (see Rule 1 / Rule 2
in [Template Rules](../ai/template)), so the generated types resolve correctly and stay safe to
use across the ecosystem.
:::

## Step 4 — Use the mapped types across the app

The mapped types are now ordinary TypeScript — use them in store state, as fetch generics,
and to constrain table columns.

```ts
// src/stores/use-master-user.ts
import type { DTO_MasterUserTypes } from '@mono-vue/types'
import { monoFetchOdata } from '@mono-lit/utility/fetching'

export const useMasterUser = defineStore('master-user', () => {
  const detail = ref<DTO_MasterUserTypes | null>(null)

  async function fetchDetail(id: number) {
    const { data, error } = await monoFetchOdata<DTO_MasterUserTypes>({
      configBaseUrl: 'myOdata',
      url: `/DTO_MasterUser(${id})`,
      type: 'data',
      options: { select: ['Id', 'Username', 'NamaLengkap'], expand: ['Role'] },
    })
    if (!error) detail.value = data
  }

  return { detail, fetchDetail }
})
```

Because the type is a plain shape, `keyof` works too — handy for typing table column
definitions so a typo'd field name fails at compile time:

```ts
// src/datas/tables/user.ts
import type { DTO_MasterUserTypes } from '@mono-vue/types'

export interface UserCol {
  field: keyof DTO_MasterUserTypes | string
  caption: string
  sortable?: boolean
}

const colUser: UserCol[] = [
  { field: 'Username', caption: 'Username', sortable: true },
  { field: 'NamaLengkap', caption: 'Nama Lengkap', sortable: true },
  { field: 'Nik', caption: 'NIK' },
]
```

Fetching itself still goes through `@mono-lit/utility/fetching` — see [Data Fetching](../repo/data-fetching)
and [DataSource](./datasource).

::: tip Recap
Generate (`odata2ts`) → map (`MonoOdataMapTypes`) → use. The generated `src/odata/<Key>/`
folder is read-only (Rule 4); your only hand-written file in this flow is
`src/types/odata.d.ts`. See [Template Rules → Rule 11](../ai/template) for the short version.
:::
