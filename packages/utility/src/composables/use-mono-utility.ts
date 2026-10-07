import { useUtils } from '../core'

/**
 * The shared helper surface — validation (Yup), notifications, list/DataSource
 * add-update-remove, OData filters, JSON parsing — combined into `@mono-lit/utility` so
 * apps import from one place:
 *
 * ```ts
 * import { useMonoUtility } from '@mono-lit/utility/runtime'
 * const { validateAllSchema, notif, replacerData } = useMonoUtility()
 * ```
 *
 * Same surface as the core `useUtils()` (src/core); `useMonoUtility` is the public name.
 */
export const useMonoUtility = () => useUtils()
