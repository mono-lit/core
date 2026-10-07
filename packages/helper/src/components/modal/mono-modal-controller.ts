// `monoModal()` / `controlMonoModal()` — the modal controller.
//
// Headless and SSR-safe: nothing in here imports an element module (the root
// `@mono-lit/helper` barrel is loaded on the server), and the one place that touches
// the DOM — `dialog.show()` — guards on `document`. The elements it needs
// (`mono-modal`, `mono-button`) come from the consumer's own
// `import '@mono-lit/helper/ui/modal'` (which registers both) and are looked up
// through `customElements` at show time, so a missing import fails with a
// message that names it instead of an inert unknown tag.
//
// Two independent halves, as the interface says:
//   - the BOUND half drives the `<mono-modal>` element(s) carrying
//     `:control-modal.prop` — props pushed through `applyProps`, open/close through
//     the element's own `show()`/`hide()` so its events fire — mirroring
//     `controlMonoChart` / `controlMonoTable`;
//   - the DIALOG half builds a compact, un-dismissable `<mono-modal>` by code on
//     every `show()`, awaits the user's answer and tears it down again. It never
//     touches the bound elements, and they never touch it.

import { createNotifier } from '../../composables/notifier'
import { applyProps } from '../../composables/element-props'
import type {
  ModalProps,
  ModalSource,
  MonoDialogButton,
  MonoDialogController,
  MonoDialogOptions,
  MonoModalController,
  MonoModalElementLike,
  MonoModalOptions,
} from './modal-types.js'

/** Renamed "control" alias of {@link monoModal} (no breaking change — both work). */
export { monoModal as controlMonoModal }

/**
 * The dialog's `<mono-modal>` defaults. `dialog.props` is merged over these; the
 * dismissal locks are re-applied after that merge in `buildDialogElement` and
 * cannot be turned off — a dialog is a question, and the only way past it is one
 * of its own buttons.
 */
const DIALOG_MODAL_DEFAULTS: Partial<ModalProps> = {
  size: 'xs',
  color: 'primary',
  // "Just right" — the box hugs its text, within reason on either side.
  width: 'fit-content',
  minWidth: '16rem',
  maxWidth: 'min(92vw, 480px)',
  stackable: true,
  // A question can be moved out of the way of what it is asking about.
  draggable: true,
  cssClassName: 'mono-modal-dialog',
}

/** Everything a dialog must refuse. Applied last, so `dialog.props` cannot undo it. */
const DIALOG_LOCKS: Partial<ModalProps> = {
  persistent: true,
  dismissible: false,
  closeOnEscape: false,
  closeOnOverlay: false,
}

/** How long a closed dialog's element lingers for the close transition (`--mono-modal-duration` is 0.22s). */
const DIALOG_REMOVE_DELAY = 320

/** Light tag first; the shadow build registers its own name. */
const resolveTag = (light: string, shadow: string): string | null => {
  if (typeof customElements === 'undefined') return null
  if (customElements.get(light)) return light
  if (customElements.get(shadow)) return shadow
  return null
}

export function monoModal(options: MonoModalOptions = {}): MonoModalController {
  const notifier = createNotifier()
  const notify = notifier.notify

  /* ───────────────────────── bound modal ───────────────────────── */

  // One object, stable identity, mutated in place — exactly like `controlMonoTable`'s
  // `table.props()`: every bound element pulls it on each notify.
  const elementProps: Partial<ModalProps> = { ...(options.props ?? {}) }
  const elements = new Set<MonoModalElementLike>()
  // The state the controller WANTS, so an element bound after `open()` opens too.
  let wantOpen = false
  let isOpen = false

  const setOpen = (next: boolean): void => {
    wantOpen = next
    for (const el of elements) {
      if (next) el.show('manual')
      else el.hide('manual')
    }
    if (!elements.size && isOpen !== next) {
      isOpen = next
      notify()
    }
  }

  /* ───────────────────────── dialog ───────────────────────── */

  let dialogDefaults: MonoDialogOptions = { ...(options.dialog ?? {}) }
  let dialogEl: (HTMLElement & MonoModalElementLike) | null = null
  let dialogResolve: ((value: unknown) => void) | null = null
  let dialogOpen = false

  /** Resolve the pending `show()` and start the teardown. */
  const closeDialog = (value: unknown): void => {
    const el = dialogEl
    const resolve = dialogResolve
    dialogEl = null
    dialogResolve = null
    dialogOpen = false
    if (el) {
      el.hide('manual')
      // Let the close transition play before the element (and its body portal) goes.
      setTimeout(() => el.remove(), DIALOG_REMOVE_DELAY)
    }
    resolve?.(value ?? false)
    notify()
  }

  const buildButton = (
    tag: string,
    item: MonoDialogButton,
    owner: () => HTMLElement | null,
  ): HTMLElement => {
    const el = document.createElement(tag)
    el.setAttribute('data-mono-dialog-button', '')
    if (item.className) el.className = item.className
    // Children go on BEFORE the element is connected, so the button's own capture
    // routes them to the right slot (same as button-dropdown's entries).
    if (item.icon) {
      const icon = document.createElement('span')
      icon.setAttribute('slot', 'icon')
      icon.className = `mono-icon ${item.icon}`
      el.appendChild(icon)
    }
    if (item.label) el.appendChild(document.createTextNode(item.label))

    const { label: _l, icon: _i, className: _n, onClick, value, ...rest } = item

    // Compact by default — a dialog is small, its actions match; `size` in the item wins.
    applyProps(el, { size: 'xs', ...rest } as Record<string, unknown>)
    // The consumer's hook is `onClick(event, { dialog, button })`; it is wired
    // through the button's OWN `handler` prop rather than a `click` listener
    // because that is the path that owns the spinner, re-throws a rejection (a
    // `waitUntil` promise is `allSettled` and would swallow it), and is what
    // `throttle` / `debounce` rate-limit. So: run `onClick`, then — if the
    // button carries a `value` and THIS dialog is still the open one (not one
    // `onClick` showed, and not already answered by `dialog.close()` inside
    // it) — answer with that value. A throw or rejection leaves the dialog open
    // and surfaces through the button as usual.
    ;(el as any).handler = async (event: MouseEvent) => {
      if (onClick) await onClick(event, { dialog, button: el })
      if (value !== undefined && dialogEl && dialogEl === owner()) closeDialog(value)
    }
    // The embedded button emits its OWN bubbling `mno-click`; stop it at the
    // boundary so the modal's listeners never mistake it for their own.
    el.addEventListener('mno-click', (e) => e.stopPropagation())
    el.addEventListener('mnoClick', (e) => e.stopPropagation())
    return el
  }

  const buildDialogElement = (
    opts: MonoDialogOptions,
    modalTag: string,
    buttonTag: string,
  ): HTMLElement & MonoModalElementLike => {
    const el = document.createElement(modalTag) as HTMLElement & MonoModalElementLike
    el.setAttribute('data-mono-dialog', '')

    // Body — ONE stable wrapper the modal captures on connect; an HTML string is
    // rendered as-is, a node appended untouched.
    const body = document.createElement('div')
    body.className = 'mono-modal-dialog-body'
    if (opts.body instanceof Node) body.appendChild(opts.body)
    else if (opts.body != null) body.innerHTML = String(opts.body)
    el.appendChild(body)

    // Footer — the actions, centred by `.mono-modal-dialog` CSS.
    const buttons = opts.buttons ?? []
    if (buttons.length) {
      const foot = document.createElement('span')
      foot.setAttribute('slot', 'footer')
      foot.className = 'mono-modal-dialog-actions'
      for (const item of buttons) foot.appendChild(buildButton(buttonTag, item, () => el))
      el.appendChild(foot)
    }

    applyProps(el, {
      ...DIALOG_MODAL_DEFAULTS,
      ...(opts.props ?? {}),
      ...(opts.title != null ? { title: opts.title } : {}),
      ...(opts.subtitle != null ? { subtitle: opts.subtitle } : {}),
      ...DIALOG_LOCKS,
    } as Record<string, unknown>)
    return el
  }

  const focusButton = async (el: HTMLElement, index: number | 'none' | undefined): Promise<void> => {
    if (index === 'none') return
    const i = typeof index === 'number' ? index : 0
    await (el as any).updateComplete
    // Light build: the captured children now live in the modal's body portal, which is
    // its render root. Shadow build: they are still light children of the host.
    const root = (el as any).renderRoot as ParentNode | undefined
    const target = el.querySelectorAll<HTMLElement>('[data-mono-dialog-button]')[i]
      ?? root?.querySelectorAll<HTMLElement>('[data-mono-dialog-button]')[i]
    if (!target) return
    await (target as any).updateComplete
    // One frame: the portal is placed in `updated()`, focus needs it on screen.
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    if (dialogEl === el) target.focus?.()
  }

  const dialog: MonoDialogController = {
    show<T = boolean>(override?: Partial<MonoDialogOptions>): Promise<T> {
      if (typeof document === 'undefined') {
        return Promise.reject(new Error('[mono-modal] dialog.show() needs a document — call it on the client'))
      }
      const modalTag = resolveTag('mono-modal', 'mono-shadow-modal')
      const buttonTag = resolveTag('mono-button', 'mono-shadow-button')
      if (!modalTag || !buttonTag) {
        return Promise.reject(new Error(
          '[mono-modal] dialog.show(): <mono-modal> and <mono-button> are not registered — '
          + "import '@mono-lit/helper/ui/modal' (it registers both) before showing a dialog.",
        ))
      }

      // Only one at a time: a second show answers the first with `false`.
      if (dialogOpen) closeDialog(false)

      const opts: MonoDialogOptions = {
        ...dialogDefaults,
        ...(override ?? {}),
        props: { ...(dialogDefaults.props ?? {}), ...(override?.props ?? {}) },
      }
      const el = buildDialogElement(opts, modalTag, buttonTag)
      dialogEl = el
      dialogOpen = true

      const promise = new Promise<T>((resolve) => {
        dialogResolve = resolve as (value: unknown) => void
      })

      document.body.appendChild(el)
      el.show('manual')
      void focusButton(el, opts.focus)
      notify()
      return promise
    },
    close(value?: unknown): void {
      if (!dialogOpen) return
      closeDialog(value)
    },
    get isOpen(): boolean {
      return dialogOpen
    },
    get element(): HTMLElement | null {
      return dialogEl
    },
    setProps(patch: Partial<MonoDialogOptions>): void {
      dialogDefaults = {
        ...dialogDefaults,
        ...patch,
        props: { ...(dialogDefaults.props ?? {}), ...(patch.props ?? {}) },
      }
    },
  }

  /* ───────────────────────── controller ───────────────────────── */

  return {
    props: () => elementProps,
    setProps(patch: Partial<ModalProps>): void {
      Object.assign(elementProps, patch)
      notify()
    },
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!isOpen),
    get isOpen(): boolean {
      return isOpen
    },
    get element(): HTMLElement | null {
      const first = elements.values().next().value as unknown
      return (first as HTMLElement) ?? null
    },
    dialog,
    subscribe: notifier.subscribe,
    dispose(): void {
      if (dialogOpen) closeDialog(false)
      notifier.clear()
      elements.clear()
    },
    _register(el: MonoModalElementLike): void {
      elements.add(el)
      // Bound after `open()`: catch up.
      if (wantOpen && !el.modelValue) el.show('manual')
      else if (isOpen !== el.modelValue) {
        isOpen = el.modelValue
        notify()
      }
    },
    _unregister(el: MonoModalElementLike): void {
      elements.delete(el)
    },
    _report(open: boolean, _source: ModalSource): void {
      wantOpen = open
      if (isOpen === open) return
      isOpen = open
      notify()
    },
  }
}
