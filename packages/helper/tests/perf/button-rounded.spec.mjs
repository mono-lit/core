// `rounded` — the single corner prop that replaced `shape`, `round`, `circle`
// and `fab` on button, and `shape` on chip and card.
//
// The interesting risk is the cascade, not the values. Button was the one
// component whose radius never went through a `--mono-*-radius` resolver: it
// hardcoded `border-radius` per size class, which is exactly why `pill` /
// `round` / `circle` had to force theirs with `!important`. So a new class had
// two ways to fail silently — lose to the per-size rule, or win by re-adding
// `!important` and quietly break a consumer's own `--mono-button-radius`. Both
// have assertions.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=button-rounded`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  // ── 1. every step resolves to its theme token ──────────────────────────────

  const expected = await page.evaluate(() => window.__expected())
  const steps = await page.evaluate(() => window.__steps())

  const wrong = Object.keys(expected).filter((s) => steps[s] !== expected[s])
  reporter.check(
    'all eight steps resolve to their theme radius token',
    wrong.length === 0,
    wrong.map((s) => `${s}: got ${steps[s]}, want ${expected[s]}`).join('; '),
  )
  // `xxl` is the one that could be wrong without anyone noticing: the token ladder
  // is spelled `2xl`, while every size scale in this library is spelled `xxl`.
  reporter.check(
    '…including xxl, which maps to the ladder’s 2xl spelling',
    steps.xxl === expected.xxl && parseFloat(steps.xxl) > parseFloat(steps.xl),
    `xxl=${steps.xxl}, xl=${steps.xl}`,
  )

  const unset = await page.evaluate(() => window.__unset())
  reporter.check(
    'unset emits no class and leaves the per-size radius alone',
    unset === '8px',
    `unset radius=${unset}, want the md per-size 8px`,
  )

  // ── 2. `none` beats the per-size radius ────────────────────────────────────

  // The genuinely new capability. The old `shape="square"` emitted a class with
  // no rule, so it could never square anything — and the per-size radius differs
  // at every step, so checking one size would not prove this.
  const bySize = await page.evaluate(() => window.__noneVsSize())
  const notZero = Object.entries(bySize).filter(([, v]) => v.none !== '0px')
  const sameAsBare = Object.entries(bySize).filter(([, v]) => v.none === v.bare)
  reporter.check(
    'rounded="none" is a real 0 at every size',
    notZero.length === 0,
    notZero.map(([s, v]) => `${s}: ${v.none}`).join('; '),
  )
  reporter.check(
    '…and differs from that size’s own radius, so it is actually overriding',
    sameAsBare.length === 0,
    sameAsBare.map(([s, v]) => `${s}: none=${v.none} === bare=${v.bare}`).join('; ') +
      ' (if a size happens to be 0 already, this check proves nothing there)',
  )

  // ── 3. the cascade stays open at the top ───────────────────────────────────

  const consumer = await page.evaluate(() => window.__consumerWins())
  reporter.check(
    'a consumer’s --mono-button-radius still beats a rounded step',
    consumer === '3px',
    `radius=${consumer} with --mono-button-radius: 3px and rounded="full"`,
  )

  const important = await page.evaluate(() => window.__noImportant())
  reporter.check(
    '…because no rounded rule uses !important',
    important.length === 0,
    `${important.length} rule(s) do: ${important.slice(0, 3).join(', ')} ` +
      '(the old pill/round/circle rules did, which is what made them unoverridable)',
  )

  // ── 4. the FAB recipe ──────────────────────────────────────────────────────

  const fab = await page.evaluate(() => window.__fab())
  reporter.check(
    'a fixed square plus rounded="full" renders a circle',
    fab && fab.hostW === 56 && fab.hostH === 56 && fab.square && fab.circle,
    JSON.stringify(fab),
  )
  // The whole point of dropping `fab`: it hardcoded a blue gradient and white
  // text, so it was the one button that could not take a colour or a variant.
  reporter.check(
    '…in any colour and variant, which the old fab prop could not do',
    fab && fab.background === 'rgba(0, 0, 0, 0)' && fab.borderColor !== 'rgba(0, 0, 0, 0)',
    `background=${fab?.background}, border=${fab?.borderColor} for color="danger" variant="outline"`,
  )

  // ── 5. affixes follow the same resolver ────────────────────────────────────

  const affix = await page.evaluate(() => window.__affix())
  reporter.check(
    'prepend/append outer corners follow the rounded step',
    affix && parseFloat(affix.preOuter) > 16 && parseFloat(affix.appOuter) > 16,
    JSON.stringify(affix) + ' (xxl is 20px; these used to be hardcoded per size)',
  )
  reporter.check(
    '…while the two facing edges stay square',
    affix && affix.preInner === '0px' && affix.appInner === '0px',
    `preInner=${affix?.preInner}, appInner=${affix?.appInner}`,
  )

  // ── 6. the same prop on chip and card ──────────────────────────────────────

  const chip = await page.evaluate(() => window.__chip())
  reporter.check(
    'chip: unset is still the pill it always was',
    chip && parseFloat(chip.unset) > 100,
    `unset=${chip?.unset} (the resolver falls through to --theme-radius-full)`,
  )
  // Both are ported now and resolve the Basecoat ladder. The flavors write the
  // chip's radius at the PRESET tier for exactly this reason: a flavor setting
  // the public `--mono-chip-radius` out-ranks the `rounded` prop and freezes
  // every chip at one shape (ONE's pill did, until this check caught it).
  const themeLg = await page.evaluate(() => window.__measure('--mono-radius-lg'))
  reporter.check(
    'chip: none and lg take the shared scale',
    chip && chip.none === '0px' && chip.lg === themeLg,
    `none=${chip?.none}, lg=${chip?.lg} (want ${themeLg})`,
  )

  const card = await page.evaluate(() => window.__card())
  reporter.check(
    'card: unset is still a soft corner (not square, not a pill)',
    card && parseFloat(card.unset) > 4 && parseFloat(card.unset) < 100,
    `unset=${card?.unset}`,
  )
  reporter.check(
    'card: none and full take the shared scale',
    card && card.none === '0px' && parseFloat(card.full) > 100,
    `none=${card?.none}, full=${card?.full}`,
  )

  // ── 7. the dropdown, whose entries are real buttons ────────────────────────

  // Two surfaces, two routes: the `⋮` trigger takes the element's own shorthand
  // (beside `color` / `variant` / `size`), an entry takes it as ordinary
  // `ButtonProps`. Checking one would leave the other free to be broken.
  const dd = await page.evaluate(() => window.__dropdown())
  reporter.check(
    'button-dropdown: the ⋮ trigger takes the element’s rounded shorthand',
    dd && dd.trigger !== null && parseFloat(dd.trigger) > 100,
    `trigger radius=${dd?.trigger}`,
  )
  reporter.check(
    '…and an entry takes its own, as any ButtonProps',
    dd && dd.entry !== null && parseFloat(dd.entry) > 100,
    `entry radius=${dd?.entry}`,
  )

  // ── 8. the two builds agree on identical markup ────────────────────────────

  // The docs' Shadow tab is derived from the Vue source by rewriting the tag, so
  // both builds get exactly the same markup and any difference is a bug. Two were
  // hiding here and a DOM-shape assertion would have seen neither.
  const par = await page.evaluate(() => window.__parity())
  reporter.check(
    'light and shadow render an icon-only link at the same size',
    par && par.light && par.shadow && par.light.w === par.shadow.w && par.light.h === par.shadow.h,
    `light=${par?.light?.w}x${par?.light?.h}, shadow=${par?.shadow?.w}x${par?.shadow?.h} ` +
      '(a page-level box-sizing reset does not cross a shadow boundary, and <a> — ' +
      'unlike <button> — is not border-box in the UA sheet)',
  )
  reporter.check(
    '…with the same box model',
    par && par.light.box === 'border-box' && par.shadow.box === 'border-box',
    `light=${par?.light?.box}, shadow=${par?.shadow?.box}`,
  )
  reporter.check(
    '…and normalise the slotted icon to the same size',
    par && par.light.icon === par.shadow.icon && par.light.icon === '16x16',
    `light icon=${par?.light?.icon}, shadow icon=${par?.shadow?.icon} ` +
      '(`.button-icon > svg` cannot reach slotted content — that needs ::slotted)',
  )
  reporter.check(
    '…and the same radius, from the same rounded step',
    par && par.light.radius === par.shadow.radius,
    `light=${par?.light?.radius}, shadow=${par?.shadow?.radius}`,
  )

  // ── 9. nothing still emits the removed classes ─────────────────────────────

  const removed = await page.evaluate(() => window.__removedClasses())
  reporter.check(
    'no element still emits fab / pill / round / circle / square / soft',
    removed.length === 0,
    `still emitted: ${removed.join(', ')}`,
  )
}
