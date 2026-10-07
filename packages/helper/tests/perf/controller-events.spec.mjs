// Event handlers through a controller's `props` (`onChange`, `onToggle`, `onOpen`, …).
//
// The rule: an `on<Event>` key in ANY controller's `props` becomes a listener on
// every element that controller drives — attached once no matter how often the
// props are re-applied, swapped when the function changes, removed by `null`,
// and dropped when the element leaves the controller. The existing callbacks
// that share the spelling (dialog button `onClick(event, ctx)`, button-dropdown
// item `onClick(event)`) keep their own contract.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=controller-events`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__fixtureReady === true, null, { timeout: 60000 })
  const j = (v) => JSON.stringify(v)

  // ── form ──────────────────────────────────────────────────────────────────
  {
    const r = await page.evaluate(() => window.__form.drive())
    reporter.check(
      'form: `inputs[key].props.onChange` fires once per element (light + shadow) with the model detail',
      r.change.length === 2 && r.change.every((c) => c.type === 'change' && c.detail?.modelValue === 'ab'),
      j(r.change),
    )
    reporter.check(
      'form: `onInput` fires too, as the decorated native input event',
      r.input.length === 2 && r.input.every((c) => c.type === 'input' && c.ctor === 'InputEvent'),
      j(r.input),
    )
    reporter.check('form: the handler is never written as an element property', r.onChangeProp === 'undefined', `typeof el.onChange=${r.onChangeProp}`)

    const c = await page.evaluate(() => window.__form.churn())
    reporter.check(
      'form: five notifies re-applying the same handler leave ONE listener (fires once per change)',
      c.firedPerType === 1 && c.placeholder === 'p4',
      j(c),
    )

    const d = await page.evaluate(() => window.__form.dynamic())
    reporter.check(
      'form: `setProp` adds a handler, a new function replaces it, `null` removes it',
      d.a === 1 && d.b === 1,
      j(d),
    )

    const rb = await page.evaluate(() => window.__form.rebind())
    reporter.check(
      'form: re-binding the element to another form drops the first form’s handler and attaches the second’s',
      rb.form1Fired === 0 && rb.form2Fired === 1,
      j(rb),
    )
  }

  // ── table ─────────────────────────────────────────────────────────────────
  {
    const r = await page.evaluate(() => window.__table.drive())
    reporter.check('table: the shared `props.detail` still writes plain props to every detail', r.icon.every((i) => i === 'i-mdi-plus'), j(r.icon))
    reporter.check(
      'table: `props.detail.onToggle` fires for every `<mono-table-detail>` bound to the grid, with `rowKey` telling them apart',
      r.toggle.length === 4 && r.toggle.map((t) => t.detail?.rowKey).join(',') === '1,2,1,1',
      j(r.toggle.map((t) => [t.type, t.detail?.rowKey, t.detail?.open])),
    )
    reporter.check(
      'table: `onOpen` / `onClose` follow the chevron toggles (the accordion’s own `open` write stays silent, as before)',
      r.open.length === 3 && r.close.length === 1 && r.close[0].detail?.rowKey === '1',
      `open=${j(r.open.map((t) => t.detail?.rowKey))} close=${j(r.close.map((t) => t.detail?.rowKey))}`,
    )

    const e = await page.evaluate(() => window.__table.error())
    reporter.check(
      'table: `props.error.onReload` / `onClose` fire from the error bar’s buttons',
      e.barShown && e.reload.length === 1 && e.close.length === 1 && e.reload[0].type === 'reload',
      j(e),
    )
  }

  // ── modal ─────────────────────────────────────────────────────────────────
  {
    const r = await page.evaluate(() => window.__modal.drive())
    reporter.check('modal: `props.title` still reaches both bound twins', r.titles.every((t) => t === 'CTRL'), j(r.titles))
    reporter.check(
      'modal: `props.onOpen` / `onClose` / `onToggle` fire once per bound element (light + shadow)',
      r.open.length === 2 && r.close.length === 2 && r.toggle.length === 4 && r.open.every((c) => c.type === 'open'),
      `open=${r.open.length} close=${r.close.length} toggle=${r.toggle.length}`,
    )
  }

  // ── dialog buttons ────────────────────────────────────────────────────────
  {
    const r = await page.evaluate(() => window.__dialog.drive())
    reporter.check(
      'dialog: a button’s `onClick(event, ctx)` keeps its contract (event + `{ dialog, button }`) and is not a props listener',
      r.onClick.length === 1 && r.onClick[0].ctxKeys.join(',') === 'button,dialog' && r.onClick[0].sameDialog && r.onClick[0].closeIsFn && r.onClick[0].buttonIsEl && r.onClickProp === 'undefined',
      j(r),
    )
    reporter.check('dialog: the button still resolves `show()` with its `value`', r.value === true, `value=${j(r.value)}`)
  }

  // ── button-dropdown ───────────────────────────────────────────────────────
  {
    const r = await page.evaluate(() => window.__buttonDropdown.drive())
    reporter.check(
      'button-dropdown: an item’s `onClick(event)` is the item callback — called once, never written as a property',
      r.itemCalls === 1 && r.eventType === 'click' && r.onClickProp === 'undefined',
      j(r),
    )
  }
}
