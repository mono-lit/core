// `controlMonoModal()` — the bound-modal half and the programmatic dialog.
//
// Everything the spec asserts is exposed as `window.__*` helpers so the assertions
// read the DOM the user sees (the portal), not controller internals.

import '@mono-lit/helper/ui/modal'
import { controlMonoModal } from '@mono-lit/helper'

const host = document.getElementById('app')

// ── bound modal ─────────────────────────────────────────────────────────────
const bound = controlMonoModal({ props: { title: 'BOUND-TITLE', size: 'sm' } })
host.innerHTML = '<mono-modal id="bound" title="ATTR-TITLE"><p>bound body</p></mono-modal>'
const boundEl = document.getElementById('bound')
boundEl.controlModal = bound

// Another plain modal, opened by hand, to prove a dialog stacks OVER it.
const other = document.createElement('mono-modal')
other.id = 'other'
other.title = 'OTHER'
other.appendChild(document.createTextNode('other body'))
host.appendChild(other)

// ── dialog ──────────────────────────────────────────────────────────────────
const log = []
const dlg = controlMonoModal({
  dialog: {
    title: 'Lock Budget Reminder',
    body: 'Sudah selesai meng-input budget?<br/><b>Pastikan</b> sudah lock.',
    buttons: [
      { label: 'Ya, lanjut', color: 'success', value: true },
      { label: 'Belum', variant: 'outline', color: 'secondary', value: false },
      { label: 'Detail', variant: 'text', onClick: () => { log.push('detail') } },
    ],
  },
})

const settle = (ms = 80) => new Promise((r) => setTimeout(r, ms))

const portalOf = (el) => el?._portal ?? el?.shadowRoot ?? null

window.__bound = {
  open: async () => { bound.open(); await settle(); return window.__bound.state() },
  close: async () => { bound.close(); await settle(); return window.__bound.state() },
  setProps: async (patch) => { bound.setProps(patch); await settle(); return window.__bound.state() },
  overlayClick: async () => {
    portalOf(boundEl)?.querySelector('.mono-modal-overlay')?.click()
    await settle()
    return window.__bound.state()
  },
  state: () => ({
    isOpen: bound.isOpen,
    elementOpen: boundEl.modelValue,
    title: portalOf(boundEl)?.querySelector('.mono-modal-title')?.textContent?.trim() ?? null,
    size: boundEl.size,
    element: bound.element === boundEl,
  }),
}

let pending = null
// The spec compares `ctx.dialog` against this.
window.__dlg = dlg
window.__dialog = {
  show: async (override) => {
    pending = dlg.dialog.show(override).then((v) => ({ resolved: true, value: v }))
    await settle(120)
    return window.__dialog.state()
  },
  /** Whether `show()` has resolved yet (races the promise against a tick). */
  settled: () => Promise.race([pending, settle(30).then(() => ({ resolved: false }))]),
  clickButton: async (i) => {
    const btn = portalOf(dlg.dialog.element)?.querySelectorAll('[data-mono-dialog-button]')[i]
    btn?.querySelector('button')?.click() ?? btn?.click()
    await settle(120)
    return window.__dialog.state()
  },
  overlayClick: async () => {
    portalOf(dlg.dialog.element)?.querySelector('.mono-modal-overlay')?.click()
    await settle()
    return window.__dialog.state()
  },
  escape: async () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await settle()
    return window.__dialog.state()
  },
  close: async (v) => { dlg.dialog.close(v); await settle(400); return window.__dialog.state() },
  openOther: async () => { other.show('manual'); await settle(); return other.modelValue },
  otherOpen: () => other.modelValue,
  log: () => [...log],
  state: () => {
    const el = dlg.dialog.element
    const portal = portalOf(el)
    return {
      isOpen: dlg.dialog.isOpen,
      inBody: !!el && document.body.contains(el),
      dialogsInBody: document.querySelectorAll('mono-modal[data-mono-dialog]').length,
      portalOpen: !!portal?.querySelector('.mono-modal.open, .mono-modal[data-open], .mono-modal'),
      title: portal?.querySelector('.mono-modal-title')?.textContent?.trim() ?? null,
      bodyHtml: portal?.querySelector('.mono-modal-dialog-body')?.innerHTML ?? null,
      buttons: [...(portal?.querySelectorAll('[data-mono-dialog-button]') ?? [])].map((b) => b.textContent.trim()),
      hasClose: !!portal?.querySelector('.mono-modal-close'),
      // Light build: the portal div IS the `.mono-modal` root; shadow: it is inside.
      rootClass: (portal?.classList?.contains?.('mono-modal') ? portal.className : portal?.querySelector('.mono-modal')?.className) ?? null,
      footJustify: portal ? getComputedStyle(portal.querySelector('.mono-modal-foot')).justifyContent : null,
      panelWidth: portal ? Math.round(portal.querySelector('.mono-modal-panel').getBoundingClientRect().width) : null,
      focusedIsButton: !!document.activeElement?.closest?.('[data-mono-dialog-button]')
        || !!(document.activeElement?.tagName === 'BUTTON' && portal?.contains(document.activeElement)),
      focusedLabel: (document.activeElement?.closest?.('[data-mono-dialog-button]') ?? document.activeElement)?.textContent?.trim() ?? null,
    }
  },
}

// A dialog whose closing button has an async `onClick` that rejects: it must stay open.
window.__dialogReject = {
  show: async () => {
    const ctl = controlMonoModal({ dialog: {
      body: 'reject me',
      buttons: [{ label: 'Save', value: 'ok', onClick: async () => { throw new Error('nope') } }],
    } })
    window.__rejectCtl = ctl
    ctl.dialog.show().catch(() => {})
    await settle(120)
    const portal = portalOf(ctl.dialog.element)
    portal?.querySelector('[data-mono-dialog-button] button')?.click()
    await settle(150)
    const still = ctl.dialog.isOpen
    ctl.dialog.close(false)
    await settle(400)
    return { stillOpenAfterReject: still, gone: !document.body.contains(ctl.dialog.element) }
  },
}

window.__ready = true
