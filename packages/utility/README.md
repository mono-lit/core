# Mono Utils

A comprehensive utility library for Vue.js applications built around DevExtreme UI components, providing powerful data management, validation, and export capabilities.

## Features

- 🔧 **OData Integration** - Sophisticated OData client with batch operations, caching, and error handling
- 🎛️ **DevExtreme Helpers** - Utilities for data grids, lookups, and form components
- ✅ **Schema Validation** - Yup-based validation system with nested object support
- 📊 **Excel Export** - Advanced Excel export capabilities with custom formatting and formulas
- 🔔 **Notification System** - Notivue-based notification management
- 🚨 **Error Handling** - Comprehensive HTTP and OData error handling
- 🔄 **Data Manipulation** - Powerful utilities for data transformation and operations

## Installation

**From npmjs (public):**

```bash
pnpm add @mono-lit/utility
```

**From the Netlify registry:** add this to your project's `.npmrc`, then run the same `pnpm add`:

```ini
@mono-lit:registry=https://mono-libs.netlify.app/npm/
//mono-libs.netlify.app/npm/:_authToken=<REGISTRY_DOWNLOAD_TOKEN>
```

See the [repository README](https://github.com/mono-lit/core#install-in-your-project) for details.

## Dependencies

### Core Dependencies

These are the essential dependencies required for core functionality:

```bash
npm install notivue yup exceljs file-saver-es @odata2ts/http-client-fetch json-server change-case chokidar
```

**Note:** The additional dependencies (`json-server`, `change-case`, `chokidar`) are recommended for development and should be installed as devDependencies:

```bash
npm install --save-dev json-server change-case chokidar
```

### Optional DevExtreme Dependencies

**For DevExtreme UI Components:**
If you're using DevExtreme components, you'll also need:

```bash
npm install devextreme devextreme-vue
```

**Note:** The core data fetching, validation, and Excel export utilities work independently of any UI framework. You can use this library with Vue, React, Angular, or vanilla JavaScript.

## Quick Start

### Basic Setup

```vue
<script setup>
import { useUtils } from '@mono-lit/utility/runtime'

const utils = useUtils()

// Destructure the utilities you need
const {
  notif,
  validateAllSchema,
  validateSchema,
  replacerData,
  exportExcel,
  useFetchOData,
  createFetcher,
  advanceExportExcel
} = utils
</script>
```

### Usage Without DevExtreme

For users working with other UI frameworks (React, Angular, or vanilla JavaScript), you can still use the core data fetching, validation, and export utilities:

```javascript
import { useUtils } from '@mono-lit/utility/runtime'

const { useFetchOData, notif, advanceExportExcel } = useUtils()

// Fetch data
const { data, error } = await useFetchOData({
  url: '/Users',
  baseUrl: 'https://your-api.com/odata',
  type: 'data'
})

if (error) {
  notif({
    message: error.message,
    type: 'error'
  })
}

// Export to Excel
await advanceExportExcel({
  title: 'User Report',
  items: data,
  config: {
    columns: [
      { key: 'Id', title: 'ID', width: 10 },
      { key: 'Name', title: 'Name', width: 30 },
      { key: 'Email', title: 'Email', width: 40 }
    ]
  }
})
```

## Documentation

- **[Data Fetching](./docs/data-fetching.md)** - OData integration, HTTP client, data manipulation
- **[Excel Export](./docs/excel-export.md)** - Advanced Excel export with formatting and formulas
- **[Validation](./docs/validation.md)** - Schema validation with Yup
- **[Notifications](./docs/notifications.md)** - Notivue-based notification system
- **[DevExtreme Integration](./docs/devextreme-integration.md)** - DevExtreme UI helpers and components

## API Reference

### useUtils Return Object

The main `useUtils()` function returns an object with the following utilities:

#### Core Utilities
- `notif` - Notification system
- `validateAllSchema` - Validate entire form with Yup
- `validateSchema` - Validate single field with Yup
- `validateAllSchemaCheck` - Check if any validation errors exist
- `clearSchemaValidation` - Clear all validation errors

#### Data Utilities
- `replacerData` - Add/update/remove items from arrays or DataSources
- `filterOrIn` - Create OData filter expressions

#### UI Components
- `exportExcel` - Basic Excel export
- `advanceExportExcel` - Advanced Excel export with formulas

#### OData & HTTP
- `useFetchOData` - Main OData fetching utility
- `createFetcher` - Create reusable fetchers
- `useNormalFetch` - Simple HTTP fetch utility
- `createUniqueFetcher` - Fetch unique records

## License

This project is licensed under the MIT License.