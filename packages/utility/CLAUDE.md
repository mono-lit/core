# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build
```bash
npm run build
```
The project uses `tsdown` as the build tool, configured in `tsdown.config.ts`. It builds from the entry point `./pkg/index.ts` and outputs to the `dist/` directory with TypeScript declarations.

## Project Architecture

This is the `@mono-lit/utility` package. Its core fetch/helper layer (`src/core/`) provides:

### Core Composables

**`use-helper.ts`** - Main utility composable providing:
- Notification system using Notivue
- Schema validation with Yup integration
- Data manipulation utilities (replacerData, filterOrIn)
- Excel export functionality

**`use-fetch-helper.ts`** - OData and HTTP client utilities:
- OData integration with DevExtreme DataSources
- Batch operations support
- Error handling and authentication
- Zero-value filtering and caching mechanisms
- Support for both OData services and fake/JSON-server backends

**`use-static-datasource.ts`** - Static DataSource management
**`use-export-excel.ts`** - Advanced Excel export capabilities

### Type Definitions
Located in `src/core/types/`:
- `fetch.d.ts` - OData and HTTP request/response types
- `column.d.ts` - DevExtreme column configuration types
- `schema.d.ts` - Validation schema types
- `excel.d.ts` - Excel export types

### Key Dependencies
- **DevExtreme**: Core UI framework integration
- **@odata2ts/http-client-fetch**: OData client library
- **notivue**: Notification system
- **yup**: Schema validation
- **exceljs**: Excel file generation
- **file-saver-es**: File download utilities

### Export Structure
The package exports a single main utility:
- `useUtils` (alias for `useHelper`), via `@mono-lit/utility/runtime`

### Development Notes
- TypeScript-first project with strict typing
- Built for ESM modules ( `"type": "module"` )
- Uses workspace dependencies for internal packages
- Supports both OData and REST API backends
- Heavy integration with DevExtreme Vue components