// Regression: a grid whose rows do not carry the `keyExpr` field broke row selection
// in two ways, both from `keyExpr` silently defaulting to 'Id'.
//
//   (a) select-all drained with `$select=<keyValue>,Id` — a column the entity does
//       not have — and OData answered 400, killing the whole drain.
//   (b) ticking ONE row ticked EVERY row: `rowKey()` fell back to
//       `ctrl.items.indexOf(row)`, which is -1 for the reactive PROXY a framework
//       hands the component, so every row keyed to the string "-1".
//
// DOM/state counts, not timings — the house rule from `select-loop.spec.mjs`.
//
// WHICH FIX EACH ARM GUARDS (measured by reverting them one at a time, not assumed):
//   - "ticking one row checks exactly one"  → guards the `unwrapReactive` + WeakMap
//     change in `rowKey`. Reverting only `checkSelect` leaves it green.
//   - "the drain never selects a missing field" → guards the `rowsHaveKeyExpr()`
//     gate in `checkSelect`. Reverting only `rowKey` leaves it green.
//   - the `keyExpr: 'OrderID'` arm is the control: it must stay green throughout, so
//     a "fix" that simply broke the normal path cannot pass this spec.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=row-selection-key`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  // ── symptom (b): the misconfigured grid ─────────────────────────────────────
  const broken = await page.evaluate(() => window.__checkedAfterTickingOne('broken'))
  reporter.check(
    'keyExpr absent from the rows: ticking one row checks exactly one',
    broken && broken.reportedChecked === 1,
    `checked=${broken?.reportedChecked} of ${broken?.total} (was ${broken?.total} — every row shared the key "-1")`,
  )
  reporter.check(
    'keyExpr absent from the rows: no OTHER row reports itself checked',
    broken && broken.othersChecked === 0,
    `others reporting checked=${broken?.othersChecked} (must be 0)`,
  )

  // ── symptom (a): the drain's column list ────────────────────────────────────
  const drain = await page.evaluate(() => window.__drainSelect('broken'))
  reporter.check(
    'keyExpr absent from the rows: the drain never $selects a field the rows lack',
    drain && drain.asksForMissingField === false && !drain.selects.includes('Id'),
    `select=${JSON.stringify(drain?.selects)} — 'Id' here is what made Northwind answer 400`,
  )
  reporter.check(
    'keyExpr absent from the rows: select-all still selects every row',
    drain && drain.checked === broken.total,
    `checked=${drain?.checked} expected=${broken?.total}`,
  )

  // ── control: the same grid, configured correctly ────────────────────────────
  const okTick = await page.evaluate(() => window.__checkedAfterTickingOne('fixed'))
  reporter.check(
    'keyExpr set: ticking one row still checks exactly one',
    okTick && okTick.reportedChecked === 1 && okTick.othersChecked === 0,
    JSON.stringify(okTick),
  )

  const okDrain = await page.evaluate(() => window.__drainSelect('fixed'))
  reporter.check(
    'keyExpr set: the drain narrows to the key column',
    okDrain && okDrain.asksForMissingField === false && okDrain.selects.includes('OrderID'),
    `select=${JSON.stringify(okDrain?.selects)}`,
  )
  reporter.check(
    'keyExpr set: select-all selects every row',
    okDrain && okDrain.checked === okTick.total,
    `checked=${okDrain?.checked} expected=${okTick?.total}`,
  )
}
