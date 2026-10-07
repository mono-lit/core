// `controlMonoModal()`: the bound half drives a `<mono-modal>` through its own
// show()/hide() (events fire, `isOpen` follows the screen), and the `dialog` half
// builds a compact, un-dismissable question by code and awaits the answer.
//
// The dialog contract worth guarding, in order of how badly a regression would
// hurt: it cannot be dismissed (overlay, Escape, no ✕ — the question MUST be
// answered), only a button with a `value` — or an `onClick` that calls
// `ctx.dialog.close(x)` — closes it, the promise resolves with that answer, a
// rejected `onClick` keeps it open, and the element is gone from <body> afterwards.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=modal-controller`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  // ── bound modal ──────────────────────────────────────────────────────────
  let s = await page.evaluate(() => window.__bound.state())
  reporter.check(
    'bound: controller props win over the attribute (title, size) before any open',
    s.title === 'BOUND-TITLE' && s.size === 'sm' && s.element,
    `title=${s.title} size=${s.size} element=${s.element}`,
  )
  s = await page.evaluate(() => window.__bound.open())
  reporter.check('bound: open() opens the element and isOpen follows', s.isOpen && s.elementOpen, JSON.stringify(s))
  s = await page.evaluate(() => window.__bound.setProps({ title: 'CHANGED' }))
  reporter.check('bound: setProps() reaches the open element', s.title === 'CHANGED', `title=${s.title}`)
  s = await page.evaluate(() => window.__bound.overlayClick())
  reporter.check('bound: a user overlay close is reported back — isOpen false', !s.isOpen && !s.elementOpen, JSON.stringify(s))
  s = await page.evaluate(() => window.__bound.open())
  s = await page.evaluate(() => window.__bound.close())
  reporter.check('bound: close() closes it again', !s.isOpen && !s.elementOpen, JSON.stringify(s))

  // ── dialog ───────────────────────────────────────────────────────────────
  const otherOpen = await page.evaluate(() => window.__dialog.openOther())
  reporter.check('setup: a plain modal is open underneath', otherOpen === true, `other=${otherOpen}`)

  s = await page.evaluate(() => window.__dialog.show())
  reporter.check(
    'dialog: show() builds a compact modal in <body> with title, HTML body and the three buttons',
    s.isOpen && s.inBody && s.dialogsInBody === 1 && s.title === 'Lock Budget Reminder'
      && /<b>Pastikan<\/b>/.test(s.bodyHtml ?? '') && s.buttons.join('|') === 'Ya, lanjut|Belum|Detail',
    JSON.stringify(s),
  )
  reporter.check('dialog: no ✕ button', s.hasClose === false, `hasClose=${s.hasClose}`)
  reporter.check('dialog: root carries .mono-modal-dialog and the footer is centred', /mono-modal-dialog/.test(s.rootClass ?? '') && s.footJustify === 'center', `class=${s.rootClass} justify=${s.footJustify}`)
  reporter.check('dialog: the panel hugs its content (under 480px, over 200px)', s.panelWidth > 200 && s.panelWidth <= 480, `panelWidth=${s.panelWidth}`)
  reporter.check('dialog: the first button has focus', s.focusedIsButton && s.focusedLabel === 'Ya, lanjut', `focused=${s.focusedLabel}`)
  reporter.check('dialog: it stacks — the modal underneath stays open', await page.evaluate(() => window.__dialog.otherOpen()) === true, '')

  let settled = await page.evaluate(() => window.__dialog.settled())
  reporter.check('dialog: the promise is pending while open', settled.resolved === false, JSON.stringify(settled))

  s = await page.evaluate(() => window.__dialog.overlayClick())
  reporter.check('dialog: an overlay click does nothing', s.isOpen === true, `isOpen=${s.isOpen}`)
  s = await page.evaluate(() => window.__dialog.escape())
  reporter.check('dialog: Escape does nothing', s.isOpen === true, `isOpen=${s.isOpen}`)

  s = await page.evaluate(() => window.__dialog.clickButton(2))
  const log = await page.evaluate(() => window.__dialog.log())
  reporter.check('dialog: a button without `value` runs onClick and leaves it open', s.isOpen === true && log.includes('detail'), `isOpen=${s.isOpen} log=${log}`)

  s = await page.evaluate(() => window.__dialog.clickButton(1))
  settled = await page.evaluate(() => window.__dialog.settled())
  reporter.check('dialog: the `value: false` button resolves false', !s.isOpen && settled.resolved && settled.value === false, JSON.stringify({ s, settled }))
  await page.waitForTimeout(400)
  s = await page.evaluate(() => window.__dialog.state())
  reporter.check('dialog: the element is removed from <body> after the close', s.dialogsInBody === 0, `dialogsInBody=${s.dialogsInBody}`)

  s = await page.evaluate(() => window.__dialog.show())
  s = await page.evaluate(() => window.__dialog.clickButton(0))
  settled = await page.evaluate(() => window.__dialog.settled())
  reporter.check('dialog: the `value: true` button resolves true', !s.isOpen && settled.resolved && settled.value === true, JSON.stringify(settled))

  s = await page.evaluate(() => window.__dialog.show({ buttons: [{ label: 'Pick', value: { picked: 42 } }] }))
  s = await page.evaluate(() => window.__dialog.clickButton(0))
  settled = await page.evaluate(() => window.__dialog.settled())
  reporter.check('dialog: an object `value` resolves itself', settled.resolved && settled.value?.picked === 42, JSON.stringify(settled))

  // `ctx.dialog` is the controller: closing from inside `onClick` answers with
  // that value, and the button's own `value` must not re-close / re-resolve.
  s = await page.evaluate(() => window.__dialog.show({ buttons: [{ label: 'Ctx', value: 'ignored', onClick: (_e, ctx) => { window.__ctxSeen = { same: ctx.dialog === window.__dlg.dialog, isOpen: ctx.dialog.isOpen, button: ctx.button?.tagName?.toLowerCase() ?? null }; ctx.dialog.close('from-ctx') } }] }))
  s = await page.evaluate(() => window.__dialog.clickButton(0))
  settled = await page.evaluate(() => window.__dialog.settled())
  const ctxSeen = await page.evaluate(() => window.__ctxSeen)
  reporter.check('dialog: ctx.dialog is the dialog controller (same object, isOpen, and the pressed button)', ctxSeen?.same === true && ctxSeen?.isOpen === true && ctxSeen?.button === 'mono-button', JSON.stringify(ctxSeen))
  reporter.check('dialog: ctx.dialog.close(x) resolves x; the button `value` does not override it', !s.isOpen && settled.resolved && settled.value === 'from-ctx', JSON.stringify({ s, settled }))

  s = await page.evaluate(() => window.__dialog.show())
  s = await page.evaluate(() => window.__dialog.close('by-code'))
  settled = await page.evaluate(() => window.__dialog.settled())
  reporter.check('dialog: close(x) resolves x and tears down', settled.resolved && settled.value === 'by-code' && s.dialogsInBody === 0, JSON.stringify({ settled, inBody: s.dialogsInBody }))

  const rej = await page.evaluate(() => window.__dialogReject.show())
  reporter.check('dialog: a rejected onClick keeps it open; close() still tears it down', rej.stillOpenAfterReject && rej.gone, JSON.stringify(rej))

  reporter.check('teardown: the modal underneath is still open after all of that', await page.evaluate(() => window.__dialog.otherOpen()) === true, '')
}
