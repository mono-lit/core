// Regression: `<mono-checkbox>` (and radio / switch) rendered 0x0 inside a `<td>`.
//
// The seamless-inline-editor rule sets `--theme-control-height-*: auto` on an editor
// cell. That is correct for a FIELD, where the token feeds `min-height` — but these
// three derive their real geometry from it (`calc(token * 0.5)`), and
// `calc(auto * 0.5)` is invalid at computed-value time, so width/height fall back to
// `auto` and the box has no intrinsic size. The control was present and invisible.
//
// Measured geometry, not computed strings — per the house rule in
// `select-loop.spec.mjs`, count/measure the thing rather than trusting a proxy for it.
//
// WHAT THE HOSTILE RUN ACTUALLY SHOWED (measured by deleting the restore rule and
// rebuilding, not assumed):
//   - checkbox and radio in a `<td>` collapse to **2x2** — their 1px borders — not
//     to 0x0. Invisible in practice, but a naive `width > 0` assertion PASSES on the
//     broken build. That is why every arm compares against the same control rendered
//     outside a table instead.
//   - the switch track does go to a true 0x0.
//   - the `<th>` arm and the outside-a-table arms stay correct either way: there is
//     no `th:has(…)` counterpart to the editor rule, which is exactly why the user
//     saw the select-all checkbox render while every row checkbox vanished.
//
// The `#td-input` arm is the control: it asserts the editor rule STILL flattens a
// field cell to `auto`, so "fixing" this by dropping the override would fail here.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=table-cell-controls`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  const s = await page.evaluate(() => window.__sizes())
  const token = await page.evaluate(() => window.__inputCellToken())

  // An unchecked checkbox is ONLY its border. The editor-cell rule zeroes `--mono-border-width`
  // to flatten fields, and the ported checkbox reads that token for its box outline, so every
  // unchecked row checkbox went invisible (found live: the select-all COA picker in esw-ui).
  const borders = await page.evaluate(() => window.__borders())
  reporter.check(
    'an unchecked checkbox in a <td> keeps the same border as outside a table',
    borders.outside > 0 && borders.tdCheckbox === borders.outside && borders.tdMixed === borders.outside,
    `border width: td ${borders.tdCheckbox}px, mixed-cell ${borders.tdMixed}px, outside ${borders.outside}px`,
  )

  const nonZero = (b) => !!b && b.w > 0 && b.h > 0

  /** Same painted size as the identical control outside any table. */
  const matches = (a, b) =>
    nonZero(a) && nonZero(b) && Math.abs(a.w - b.w) < 0.5 && Math.abs(a.h - b.h) < 0.5

  // Each control is compared against its own out-of-table twin, NOT merely asserted
  // non-zero: the broken build collapses the checkbox and radio to their 2px border
  // (2x2), which is invisible but passes a naive "> 0" check. Only the switch went
  // to a true 0x0. See the header note.
  reporter.check(
    'a checkbox in a <td> is the size it is outside a table',
    matches(s.tdCheckbox, s.outside),
    `td=${JSON.stringify(s.tdCheckbox)} outside=${JSON.stringify(s.outside)} (broken build: 2x2)`,
  )
  reporter.check(
    'a radio in a <td> is the size it is outside a table',
    matches(s.tdRadio, s.outsideRadio),
    `td=${JSON.stringify(s.tdRadio)} outside=${JSON.stringify(s.outsideRadio)} (broken build: 2x2)`,
  )
  reporter.check(
    'a switch in a <td> is the size it is outside a table',
    matches(s.tdSwitch, s.outsideSwitch),
    `td=${JSON.stringify(s.tdSwitch)} outside=${JSON.stringify(s.outsideSwitch)} (broken build: 0x0)`,
  )

  // A cell holding a field AND a checkbox still matches the editor rule's :has()
  // list — the case a selector split would have left broken.
  reporter.check(
    'a cell holding both an input and a checkbox still sizes the checkbox',
    nonZero(s.tdMixed)
      && Math.abs(s.tdMixed.w - s.outside.w) < 0.5,
    `mixed cell checkbox = ${JSON.stringify(s.tdMixed)} outside=${JSON.stringify(s.outside)}`,
  )

  reporter.check(
    'the <th> checkbox was never affected',
    nonZero(s.thCheckbox),
    `th checkbox box = ${JSON.stringify(s.thCheckbox)} — passes with or without the fix`,
  )

  // Control: the seamless-editor feature must be intact.
  reporter.check(
    'a field cell still flattens its height token to auto',
    token === 'auto',
    `--theme-control-height-md on the input cell = "${token}" (expected "auto")`,
  )
}
