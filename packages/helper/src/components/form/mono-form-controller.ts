import { runRules } from './form-rules.js'
import type {
  MonoFormSetProp,
  MonoFormSetValidation,
  MonoFormComponent,
  MonoFormController,
  MonoFormItem,
  MonoFormListEntry,
  MonoFormOptions,
  MonoFormRefLike,
  MonoFormTiming,
  MonoFormWatcherCtx,
} from './form-types.js'
import { createNotifier } from '../../composables/notifier'

/** Unwrap a ref-like (`{ value }`) or pass a plain value straight through. */
function unref(v: unknown): unknown {
  return v && typeof v === 'object' && 'value' in (v as Record<string, unknown>)
    ? (v as MonoFormRefLike).value
    : v
}

/**
 * Depth cap for the watcher fan-out. A watcher may legitimately `setValue`
 * another field (which fans out again); this stops a pair of watchers that write
 * to each other from spinning forever, and surfaces it instead of hanging.
 */
const MAX_DEPTH = 10

/**
 * `monoForm()` — a headless form controller.
 *
 * The consumer authors the markup by hand and opts each control in with
 * `:data-form="form"` + `key-form="Name"`. The controller owns the value,
 * validation, cross-field reactions and the props pushed onto each element;
 * nothing here touches the DOM, so it is SSR-safe and testable on its own.
 *
 * Mirrors `monoDataGrid`'s controller shape: a plain object with coalesced
 * `subscribe`/`notify`, state mutated in place, and elements re-rendering off
 * the subscription.
 */
/** Renamed "control" alias of {@link monoForm} (no breaking change — both work). */
export { monoForm as controlMonoForm }

export function monoForm(options: MonoFormOptions): MonoFormController {
  const defaultTiming: MonoFormTiming = options.validation?.type ?? 'change'
  const inputs = options.inputs ?? {}
  const keys = Object.keys(inputs)

  // --- notify ---------------------------------------------------------------
  const refs = new Set<MonoFormRefLike<Record<string, MonoFormItem> | undefined>>()

  function flush(): void {
    // Recompute merged props BEFORE snapshotting. They used to be refreshed only
    // when an element synced, which runs after this — so a `state` reader saw
    // the previous notify's props and lagged a step behind the live element.
    for (const k of keys) propsFor(k)

    // A fresh shallow snapshot per bound ref: Vue tracks the ref assignment, and
    // copying the item objects means a template re-renders on nested changes too.
    //
    // ...but only when something in it MOVED. A flush with nothing new (a list re-published with
    // the same rows, a `setProp` of the values already there) used to hand Vue a brand-new object
    // anyway, so a `watch(state, …, { deep: true })` fired on every notify — and a watcher that
    // wrote anything back (a `setProp`, a mirror with `?? []` defaults another watcher reacts to)
    // closed an endless microtask loop that froze the tab. Re-assigning the SAME object is a no-op
    // to a Vue ref, and still seeds a ref bound since the last change.
    if (refs.size) {
      if (!lastSnap || snapshotMoved(lastSnap)) {
        const snap: Record<string, MonoFormItem> = {}
        for (const k of keys) {
          snap[k] = { ...state[k], validate: { ...state[k].validate }, props: { ...state[k].props } }
        }
        lastSnap = snap
      }
      const snap = lastSnap
      refs.forEach((r) => {
        r.value = snap
      })
    }
  }

  /** The snapshot last handed to the bound refs — see `flush`. */
  let lastSnap: Record<string, MonoFormItem> | undefined

  /** Does the live state differ from `prev` in anything a snapshot reader can see? */
  function snapshotMoved(prev: Record<string, MonoFormItem>): boolean {
    for (const k of keys) {
      const a = prev[k]
      const b = state[k]
      if (!a || !b) return true
      if (
        !Object.is(a.currentValue, b.currentValue)
        || !Object.is(a.oldValue, b.oldValue)
        || a.touched !== b.touched
        || a.list !== b.list
        || a.validate.success !== b.validate.success
        || a.validate.message !== b.validate.message
      ) return true
      const ap = a.props
      const bp = b.props
      const aKeys = Object.keys(ap)
      if (aKeys.length !== Object.keys(bp).length) return true
      for (const p of aKeys) {
        if (!(p in bp) || !Object.is(ap[p], bp[p])) return true
      }
    }
    return false
  }

  // Scheduling lives in `createNotifier`; `flush` above is its onFlush.
  const notifier = createNotifier({
    onFlush: flush,
    name: 'controlMonoForm',
    // On a runaway, name the fields: which ones are bound, and what they hold.
    detail: () => `Fields: ${keys.join(', ')}.`,
  })
  const notify = notifier.notify

  // --- state ----------------------------------------------------------------
  const state: Record<string, MonoFormItem> = {}
  /** Props pushed at runtime by the `setProp()` METHOD (watchers / outside code). */
  const dynamicProps: Record<string, Record<string, unknown>> = {}
  const elements: Record<string, Set<unknown>> = {}

  for (const key of keys) {
    const initial = inputs[key].value
    state[key] = {
      key,
      currentValue: initial,
      oldValue: initial,
      validate: { success: true, message: '' },
      touched: false,
      props: {},
      // Filled by `_reportList` for controls that HAVE a list; a plain input never touches it.
      list: [],
    }
    dynamicProps[key] = {}
    elements[key] = new Set()
  }

  function values(): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    for (const k of keys) out[k] = state[k].currentValue
    return out
  }

  function externals(): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(options.external ?? {})) out[k] = unref(v)
    return out
  }

  /**
   * The STATIC `inputs[key].props` is the declared override and always wins, so
   * it is merged LAST over whatever the `setProp()` method has accumulated.
   */
  function propsFor(key: string): Record<string, unknown> {
    const merged = { ...(dynamicProps[key] ?? {}), ...((inputs[key]?.props as object) ?? {}) }
    state[key] && (state[key].props = merged)
    return merged
  }

  // --- validation -----------------------------------------------------------
  /**
   * Bumped by `setValidation`. A rule run captures it first and refuses to
   * write if it changed meanwhile — otherwise the async rule pass lands AFTER
   * the synchronous watcher fan-out and silently overwrites a watcher's verdict.
   */
  const manualSeq: Record<string, number> = {}

  async function validateKey(key: string, timing?: MonoFormTiming): Promise<boolean> {
    const input = inputs[key]
    if (!input) return true
    // A field with no rules has no opinion on its own validity — leave whatever
    // `setValidation` put there instead of asserting `success: true` over it.
    if (!input.validates?.length) return state[key].validate.success

    const seq = manualSeq[key] ?? 0
    const result = await runRules(
      input.validates,
      { value: state[key].currentValue, values: values(), key },
      { timing, defaultTiming },
    )
    if ((manualSeq[key] ?? 0) !== seq) return result.success // a manual write won

    const prev = state[key].validate
    if (prev.success !== result.success || prev.message !== result.message) {
      state[key].validate = result
      notify()
    }
    return result.success
  }

  // --- watcher fan-out ------------------------------------------------------
  let depth = 0

  /**
   * The `mno-input` / `mno-change` CustomEvent that last touched each field, so
   * a watcher can reach the real DOM event (`event.target`, `detail`, keys…).
   * Cleared on a programmatic write — `setValue` has no originating event, and
   * handing back a stale one would be worse than `undefined`.
   */
  const lastEvent: Record<string, Event | undefined> = {}

  function watcherCtx(selfKey: string, peerKey: string): MonoFormWatcherCtx {
    return {
      selfKey,
      peerKey,
      currentValue: state[selfKey].currentValue,
      oldValue: state[selfKey].oldValue,
      peerCurrentValue: state[peerKey]?.currentValue,
      peerOldValue: state[peerKey]?.oldValue,
      event: lastEvent[selfKey],
      peerEvent: lastEvent[peerKey],
      values: values(),
      external: externals(),
      setProp,
      setValidation,
      setValue,
    }
  }

  /**
   * Run EVERY field's watcher for one change: the changed field's own watcher
   * (`peerKey === selfKey`) plus every other field's watcher with `peerKey` set
   * to the changed key. That fan-out is what lets `Name`'s watcher say
   * `if (peerKey === 'Age')` without any separate peer registry.
   */
  function fanOut(changedKey: string): void {
    if (depth >= MAX_DEPTH) {
      console.warn(
        `[monoForm] watcher depth limit (${MAX_DEPTH}) reached while processing "${changedKey}" — ` +
          'a watcher is probably writing to a field whose watcher writes back.',
      )
      return
    }
    depth++
    try {
      for (const selfKey of keys) {
        inputs[selfKey]?.watcher?.(watcherCtx(selfKey, changedKey))
      }
    } finally {
      depth--
    }
  }

  // --- public mutation ------------------------------------------------------
  function setValue(key: string, value: unknown): void {
    const item = state[key]
    if (!item) return
    if (Object.is(item.currentValue, value)) return
    item.oldValue = item.currentValue
    item.currentValue = value
    lastEvent[key] = undefined // programmatic — no originating DOM event
    notify()
    fanOut(key)
    void validateKey(key)
  }

  function setValues(next: Record<string, unknown>): void {
    for (const [k, v] of Object.entries(next)) {
      const item = state[k]
      if (!item || Object.is(item.currentValue, v)) continue
      item.oldValue = item.currentValue
      item.currentValue = v
      lastEvent[k] = undefined // programmatic — no originating DOM event
    }
    notify()
    for (const k of Object.keys(next)) if (state[k]) fanOut(k)
  }

  function setProp<C extends MonoFormComponent = MonoFormComponent>(
    arg: MonoFormSetProp<C>,
  ): void {
    if (!arg?.key || !dynamicProps[arg.key]) return
    // Only what actually changes, and no notify when nothing did. Callers push their whole prop set
    // on every reaction (`visible`, `label`, `disabled` … re-sent unchanged), so an unconditional
    // notify turned each of those into a flush — and a flush that reached a watcher which pushes
    // props again into a loop.
    const bag = dynamicProps[arg.key]
    let changed = false
    for (const [p, v] of Object.entries((arg.props ?? {}) as Record<string, unknown>)) {
      if (p in bag && Object.is(bag[p], v)) continue
      bag[p] = v
      changed = true
    }
    if (changed) notify()
  }

  function setValidation(arg: MonoFormSetValidation): void {
    const item = state[arg?.key]
    if (!item) return
    manualSeq[arg.key] = (manualSeq[arg.key] ?? 0) + 1
    item.validate = {
      success: arg.validation?.success ?? item.validate.success,
      message: arg.validation?.message ?? '',
    }
    notify()
  }

  async function validateAll(): Promise<boolean> {
    // No `timing` → every rule runs, which is the submit-time sweep.
    const outcomes = await Promise.all(keys.map((k) => validateKey(k)))
    for (const k of keys) state[k].touched = true
    notify()
    return outcomes.every(Boolean)
  }

  function isValid(): boolean {
    return keys.every((k) => state[k].validate.success)
  }

  function reset(): void {
    for (const key of keys) {
      const initial = inputs[key].value
      state[key].currentValue = initial
      state[key].oldValue = initial
      state[key].validate = { success: true, message: '' }
      state[key].touched = false
      dynamicProps[key] = {}
    }
    notify()
  }

  function refresh(): void {
    for (const key of keys) fanOut(key)
    notify()
  }

  function bindRef(ref: MonoFormRefLike<Record<string, MonoFormItem> | undefined>): () => void {
    refs.add(ref)
    notify()
    return () => refs.delete(ref)
  }

  if (options.state) bindRef(options.state)

  // --- element plumbing -----------------------------------------------------
  function _register(key: string, el: unknown): () => void {
    if (!elements[key]) elements[key] = new Set()
    elements[key].add(el)
    return () => elements[key]?.delete(el)
  }

  /**
   * A list control publishing its resolved options.
   *
   * Called from the control's own render path, so it lands on EVERY render — hence the identity
   * guard. Without it a notify here would re-render the control, which would report again: a loop
   * that never settles. The control hands over a fresh array only when the rows actually moved.
   */
  function _reportList(key: string, entries: MonoFormListEntry[]): void {
    const item = state[key]
    if (!item || item.list === entries) return

    item.list = entries
    notify()
  }

  function _report(key: string, value: unknown, timing: MonoFormTiming, event?: Event): void {
    const item = state[key]
    if (!item) return
    // Recorded even when the value didn't change, so `event` reflects the most
    // recent real interaction with this field.
    lastEvent[key] = event
    if (timing === 'change') item.touched = true
    if (Object.is(item.currentValue, value)) {
      // Same value, but a commit still needs its `change`-timed rules to run.
      if (timing === 'change') void validateKey(key, timing)
      return
    }
    item.oldValue = item.currentValue
    item.currentValue = value
    notify()
    fanOut(key)
    void validateKey(key, timing)
  }

  const controller: MonoFormController = {
    items: () => state,
    values,
    setValue,
    setValues,
    validate: validateAll,
    isValid,
    reset,
    setProp,
    setValidation,
    refresh,
    bindRef,
    subscribe: notifier.subscribe,
    dispose(): void {
      notifier.clear()
      refs.clear()
      for (const k of keys) elements[k]?.clear()
    },
    _register,
    _report,
    _reportList,
    _propsFor: propsFor,
  }

  return controller
}
