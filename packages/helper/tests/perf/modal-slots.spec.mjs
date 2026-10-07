// `slot="header"` / `slot="footer"` alias `head` / `foot` on mono-modal.
//
// The contract, in both builds:
//   - the original names keep working (nothing about them changed)
//   - the aliases work on their own
//   - when BOTH are supplied for a region, the alias wins and the original is not
//     rendered at all
//   - with neither supplied, the head still falls back to title + ✕
//
// That last case is the one that breaks first. The shadow build expresses the
// priority by NESTING (`<slot name="header"><slot name="head">fallback</slot></slot>`),
// so the default header lives on the inner slot — hoist the fallback to the outer
// slot and it renders even when `head` is filled.

const CASES = [
  ['original names', 'original', 'HEAD-ORIGINAL', 'FOOT-ORIGINAL'],
  ['alias names', 'alias', 'HEAD-ALIAS', 'FOOT-ALIAS'],
  ['both — alias wins', 'both', 'HEAD-ALIAS', 'FOOT-ALIAS'],
]

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=modal-slots`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  const read = (key, region) =>
    page.evaluate(([k, r]) => window.__regionText(k, r), [key, region])

  for (const build of ['light', 'shadow']) {
    for (const [label, kase, wantHead, wantFoot] of CASES) {
      const head = await read(`${build}|${kase}`, 'head')
      const foot = await read(`${build}|${kase}`, 'foot')

      reporter.check(
        `${build}: ${label} — head`,
        head.includes(wantHead) && (kase !== 'both' || !head.includes('HEAD-ORIGINAL')),
        `got "${head}", wanted "${wantHead}"${kase === 'both' ? ' and NOT HEAD-ORIGINAL' : ''}`,
      )
      reporter.check(
        `${build}: ${label} — foot`,
        foot.includes(wantFoot) && (kase !== 'both' || !foot.includes('FOOT-ORIGINAL')),
        `got "${foot}", wanted "${wantFoot}"${kase === 'both' ? ' and NOT FOOT-ORIGINAL' : ''}`,
      )
    }

    // Neither name supplied → the default header (title + close) must still render.
    const fallbackHead = await read(`${build}|fallback`, 'head')
    reporter.check(
      `${build}: no head/header — default title fallback still renders`,
      fallbackHead.includes('T'),
      `got "${fallbackHead}" — expected the \`title\` prop to show through`,
    )
  }
}
