// normalize-error.ts — turn whatever a data source rejected with into a line a
// person can read.
//
// A store can reject with almost anything: an `Error`, a bare string, an XHR, an
// axios-shaped `{ response: { status } }`, or a plain object with none of the
// usual fields. The alternative to handling that spread is what the header-filter
// panel does today (`mono-table-th-core.ts`) — `catch {}` the error away and show
// a hardcoded "Failed to load values." Which is never wrong, and never useful.
//
// Two layers, on purpose:
//
// - `normalizeError` — the RAW text: whatever legible string the error carries.
// - `describeError` — the HEADLINE a person should read. An HTTP status is a
//   better source of that than the error's own text: devextreme's ODataStore
//   rejects with `Error(xhr.statusText)` + `{ httpStatus }`, and over HTTP/2 the
//   statusText is EMPTY, so the raw text of a 403 was literally `Error` (the
//   constructor's name — all `normalizeError` could find). Even when it is
//   populated, "Forbidden" tells a user nothing "You do not have permission to
//   view this data" does not say better. So a status with a preset gets the
//   preset, and any text the SERVER wrote (an OData error body, a JSON
//   `message`) rides along as `detail` — that part is information; the reason
//   phrase is not.
//
// Pure functions on purpose: it is the same problem for the grid, the chart and
// the select/tag-input source controllers, and one shared version is how they
// avoid growing three that disagree.

/** Fields worth reading off an object that is not an `Error`. */
const MESSAGE_KEYS = ['message', 'statusText', 'errorMessage', 'error', 'detail'] as const

const text = (value: unknown): string =>
  typeof value === 'string' && value.trim() ? value.trim() : ''

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object'

/**
 * A readable message for `raw`, or `fallback` when nothing legible can be found.
 *
 * Never throws, and never returns an empty string — a caller rendering this into
 * an error bar has to have something to render, and a blank bar is worse than a
 * generic one.
 */
export function normalizeError(raw: unknown, fallback = 'Request failed'): string {
  if (raw == null) return fallback

  // The overwhelmingly common case, and it covers devextreme too: its
  // `errors.Error(...)` payloads are real `Error` instances with a populated
  // `.message`. An EMPTY message (an ODataStore rejection over HTTP/2, where the
  // statusText it copies is blank) falls through to the object probing below —
  // the `httpStatus` devextreme attaches is worth far more than `raw.name`,
  // which is the string "Error".
  if (raw instanceof Error) {
    const own = text(raw.message)
    if (own) return own
  } else {
    if (typeof raw === 'string') return text(raw) || fallback
    if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw)
  }

  if (isObject(raw)) {
    const obj = raw

    for (const key of MESSAGE_KEYS) {
      // `error` and `detail` are often nested objects rather than strings, so
      // only take them when they actually carry text.
      const hit = text(obj[key])
      if (hit) return hit
    }

    // axios / fetch-wrapper shape: the useful part is one level down.
    const response = obj.response as Record<string, unknown> | undefined
    if (isObject(response)) {
      const nested = text(response.statusText) || text(response.message)
      if (nested) return nested
    }

    // An HTTP status with no text is still worth more than "[object Object]" —
    // "HTTP 503" tells someone where to look.
    const status = errorStatus(obj)
    if (status !== undefined && status > 0) return `HTTP ${status}`

    if (raw instanceof Error) return text(raw.name) || fallback

    // Deliberately NOT `String(obj)` here: for a plain object that is the literal
    // string "[object Object]", which reads like a bug in the library rather than
    // a failure in the request.
    return fallback
  }

  return text(String(raw)) || fallback
}

// ── Status → human wording ──────────────────────────────────────────────────

/**
 * Keys of the preset map: an HTTP status, `'network'` for "the request never
 * got an answer" (status 0, `TypeError: Failed to fetch`, devextreme's
 * "Unspecified network error"), and `'default'` for everything else.
 */
export type MonoErrorMessageKey = number | 'network' | 'default'

/** Wording overrides — per grid (`monoDataGrid({ errorMessages })`) or app-wide (`setErrorMessages`). */
export type MonoErrorMessages = Partial<Record<MonoErrorMessageKey, string>>

/**
 * What the bar says for a status. English; an app puts its own language in
 * ONCE with `setErrorMessages()` rather than on every table.
 */
export const DEFAULT_ERROR_MESSAGES: Readonly<Record<MonoErrorMessageKey, string>> = Object.freeze({
  network: 'Could not reach the server. Check your connection and try again.',
  400: 'The server rejected the request.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to view this data.',
  404: 'The requested data could not be found.',
  408: 'The server took too long to respond. Please try again.',
  409: 'The request conflicts with the current state of the data.',
  422: 'The server could not process the request.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong on the server. Please try again later.',
  502: 'The server is temporarily unavailable. Please try again later.',
  503: 'The server is temporarily unavailable. Please try again later.',
  504: 'The server took too long to respond. Please try again later.',
  default: 'Request failed',
})

let globalMessages: MonoErrorMessages | null = null

/**
 * App-wide wording, merged over the defaults; `null` restores them. A grid's own
 * `errorMessages` merges over this in turn, so a single table can still differ.
 */
export function setErrorMessages(messages: MonoErrorMessages | null): void {
  globalMessages = messages ? { ...messages } : null
}

/** Defaults ← app-wide ← `local`, same shape as the filter builder's `resolveTexts`. */
export function resolveErrorMessages(local?: MonoErrorMessages): Record<MonoErrorMessageKey, string> {
  const merged: MonoErrorMessages = { ...DEFAULT_ERROR_MESSAGES }
  // Merge key by key rather than by spread: an override set to `undefined` (a
  // Vue ref that has not resolved, an optional config key) would otherwise ERASE
  // the default and leave a status with no wording at all.
  for (const layer of [globalMessages, local]) {
    if (!layer) continue
    for (const key of Object.keys(layer) as Array<keyof MonoErrorMessages>) {
      const value = layer[key]
      if (typeof value === 'string' && value.trim()) merged[key] = value
    }
  }
  return merged as Record<MonoErrorMessageKey, string>
}

/**
 * The standard reason phrases. Not shown to anyone — they are what `describeError`
 * uses to recognise that an error's text is ONLY the phrase for its status
 * (`Error('Forbidden')` + `httpStatus: 403`), which adds nothing to the preset and
 * so is not a detail worth appending.
 */
const REASON_PHRASES: Readonly<Record<number, string>> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  412: 'Precondition Failed',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
}

/** Texts a transport mints for "no answer at all" — a status of 0 in words. */
const NETWORK_TEXTS = [
  'failed to fetch', // fetch (Chromium)
  'networkerror when attempting to fetch resource', // fetch (Firefox)
  'load failed', // fetch (WebKit)
  'network error', // axios
  'unspecified network error', // devextreme
  'network connection timeout', // devextreme
  'network request failed',
]

const toStatus = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined
  const n = Number(value)
  return Number.isInteger(n) && n >= 0 && n < 1000 ? n : undefined
}

/**
 * The HTTP status an error carries, `0` for a network failure, `undefined` when
 * it has none.
 *
 * Reads the fields the common transports use — devextreme's `httpStatus`, a
 * fetch `Response` / axios error's `status` and `response.status`, ofetch's
 * `statusCode`, an OData error body's numeric `code` — on an `Error` instance as
 * readily as on a plain object, since devextreme `extend()`s them onto an
 * `Error`.
 */
export function errorStatus(raw: unknown): number | undefined {
  if (!isObject(raw)) return undefined

  const response = isObject(raw.response) ? raw.response : undefined
  const direct =
    toStatus(raw.httpStatus) ??
    toStatus(raw.status) ??
    toStatus(raw.statusCode) ??
    toStatus(response?.status) ??
    toStatus(response?.statusCode)
  if (direct !== undefined) return direct

  // devextreme lifts a >= 400 `error.code` from an OData body onto `httpStatus`
  // already; a body handed over raw still has it under `errorDetails`.
  const details = isObject(raw.errorDetails) ? raw.errorDetails : undefined
  const code = toStatus(details?.code)
  if (code !== undefined && code >= 400) return code

  // No status field at all: a transport-level failure is still recognisable by
  // the text the transport minted for it.
  const own = (raw instanceof Error ? text(raw.message) : text(raw.message)).toLowerCase()
  if (own && NETWORK_TEXTS.some((t) => own.includes(t))) return 0

  return undefined
}

/**
 * The text a SERVER wrote about the failure, if the error carries one — an OData
 * error body's message, a JSON body's `message` / `error`, an axios
 * `response.data`. `''` when there is nothing beyond the transport's own words.
 */
function serverDetail(raw: unknown): string {
  if (!isObject(raw)) return ''

  // devextreme: the parsed `error` / `odata.error` / `@odata.error` body.
  const details = raw.errorDetails
  if (isObject(details)) {
    const m = details.message
    const hit = text(m) || (isObject(m) ? text(m.value) : '')
    if (hit) return hit
  }

  // axios / ofetch: the response body one level down.
  const response = isObject(raw.response) ? raw.response : undefined
  const data = response?.data ?? response?._data ?? raw.data
  if (isObject(data)) {
    const err = data.error
    const hit =
      text(data.message) ||
      text(data.detail) ||
      text(data.title) ||
      text(err) ||
      (isObject(err) ? text(err.message) : '')
    if (hit) return hit
  } else if (text(data)) {
    return text(data)
  }

  if (!(raw instanceof Error)) {
    const err = raw.error
    const hit = text(raw.errorMessage) || text(raw.detail) || (isObject(err) ? text(err.message) : '')
    if (hit) return hit
  }

  return ''
}

/** Is `value` nothing more than the reason phrase / a generic label for `status`? */
function isBoilerplate(value: string, status: number | undefined): boolean {
  const v = value.toLowerCase()
  if (!v || v === 'error' || v === 'unknown error' || v === 'request failed') return true
  if (/^http\s*\d{3}$/.test(v)) return true
  // The transport's own words for "no answer" say nothing the network preset does not.
  if (NETWORK_TEXTS.some((t) => v.includes(t))) return true
  if (status !== undefined) {
    const phrase = REASON_PHRASES[status]?.toLowerCase()
    if (phrase && (v === phrase || v === `${status} ${phrase}` || v === `${status}`)) return true
    if (v === String(status)) return true
  }
  // Any status's phrase — a 502 preset should not be followed by "Bad Gateway".
  return Object.values(REASON_PHRASES).some((p) => p.toLowerCase() === v)
}

export interface DescribedError {
  /** The headline: the preset for the status when there is one, else the error's own text. */
  message: string
  /** The HTTP status, `0` for a network failure, absent when the error carries none. */
  status?: number
  /**
   * Text the server (or the error itself) added beyond the status — the part a
   * user CAN act on ("Budget period is closed"). Never a bare reason phrase.
   */
  detail?: string
}

/**
 * The line a person should read for `raw`.
 *
 * Order: a preset for the status (`'network'` for 0) → the error's own text →
 * `messages.default`. When a preset is the headline, whatever the server said
 * on top of the status becomes `detail`; without a preset, the raw text IS the
 * headline and only a distinct server body is a detail. Never throws, never
 * returns an empty `message`.
 */
export function describeError(raw: unknown, messages?: MonoErrorMessages): DescribedError {
  const texts = resolveErrorMessages(messages)
  const status = errorStatus(raw)
  const fallback = texts.default || DEFAULT_ERROR_MESSAGES.default
  const rawText = normalizeError(raw, fallback)

  const preset =
    status === undefined ? undefined : status === 0 ? texts.network : texts[status]

  if (preset) {
    // The server's own words first; failing that the error's text, if it says
    // more than the status already does.
    const fromServer = serverDetail(raw)
    const candidate = fromServer || (rawText === fallback ? '' : rawText)
    const detail = candidate && !isBoilerplate(candidate, status) && candidate !== preset ? candidate : ''
    return detail ? { message: preset, status, detail } : { message: preset, status }
  }

  const message = rawText || fallback
  const fromServer = serverDetail(raw)
  const detail = fromServer && fromServer !== message && !isBoilerplate(fromServer, status) ? fromServer : ''
  const out: DescribedError = { message }
  if (status !== undefined) out.status = status
  if (detail) out.detail = detail
  return out
}
