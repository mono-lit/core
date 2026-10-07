// `z-index` prop on mono-modal / mono-drawer.
//
// The value has to survive three different Vue binding spellings, reach a <body>
// portal (light) or a shadow root (shadow), and — crucially — stay OUT of the way
// when unset, so the shared popup stack keeps assigning levels as before.
//
// It also has to bring the layers ABOVE it along. A pinned dialog that leaves the
// select opened inside it at the stack's base paints its own dropdowns underneath
// itself, which is the bug this half of the suite exists for.

/** Mirrors `POPUP_Z_BASE` in src/composables/popup-stack.ts (can't import TS here). */
const POPUP_Z_BASE = 1000
/** Mirrors `POPUP_Z_STEP`. */
const POPUP_Z_STEP = 10

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=dialog-z`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })
  await page.waitForTimeout(400)

  const zOf = (name) => page.evaluate((n) => window.__zOf(n), name)
  const setOpen = (name, value) => page.evaluate(([n, v]) => window.__setOpen(n, v), [name, value])
  const openPopup = (name, value) => page.evaluate(([n, v]) => window.__openPopup(n, v), [name, value])
  const setDropdowns = (value) => page.evaluate((v) => window.__setDropdowns(v), value)
  const scrollListeners = () => page.evaluate(() => window.__scrollListenerCount())

  // ── the three spellings, light build ────────────────────────────────────────
  await setOpen('openA', true)
  let r = await zOf('modalKebab')
  reporter.check(':z-index="1600" (kebab attribute)', r.z === '1600', JSON.stringify(r))

  r = await zOf('drawerKebab')
  reporter.check('drawer :z-index="1650"', r.z === '1650', JSON.stringify(r))

  // ── popups nested inside a PINNED dialog ────────────────────────────────────
  // The modal paints at 1600. Its own dropdown used to take the stack's next free
  // slot (1010) and disappear behind the very modal it belongs to.
  let p = await openPopup('ddInPinnedModal', true)
  reporter.check(
    'button-dropdown inside a modal pinned at 1600 stacks above it',
    Number(p.z) > 1600,
    `${JSON.stringify(p)} — expected > 1600`,
  )
  await openPopup('ddInPinnedModal', false)

  p = await openPopup('selInPinnedModal', true)
  reporter.check(
    'select inside a modal pinned at 1600 stacks above it',
    Number(p.z) > 1600,
    `${JSON.stringify(p)} — expected > 1600`,
  )
  await openPopup('selInPinnedModal', false)
  await setOpen('openA', false)

  await setOpen('openG', true)
  p = await openPopup('ddInPinnedDrawer', true)
  reporter.check(
    'button-dropdown inside a drawer pinned at 1650 stacks above it',
    Number(p.z) > 1650,
    `${JSON.stringify(p)} — expected > 1650`,
  )
  await openPopup('ddInPinnedDrawer', false)
  await setOpen('openG', false)

  await setOpen('openB', true)
  r = await zOf('modalCamel')
  reporter.check(':zIndex="1700" (camelCase property)', r.z === '1700', JSON.stringify(r))
  await setOpen('openB', false)

  await setOpen('openC', true)
  r = await zOf('modalStatic')
  reporter.check('z-index="1800" (static attribute)', r.z === '1800', JSON.stringify(r))
  await setOpen('openC', false)

  // ── unset must still defer to the popup stack ───────────────────────────────
  await setOpen('openD', true)
  const unsetModal = await zOf('modalUnset')
  const unsetDrawer = await zOf('drawerUnset')
  reporter.check(
    'unset modal still takes a stack slot',
    Number(unsetModal.z) >= POPUP_Z_BASE,
    `${JSON.stringify(unsetModal)} — expected >= ${POPUP_Z_BASE}`,
  )
  reporter.check(
    'unset drawer still takes a stack slot, above the modal opened before it',
    Number(unsetDrawer.z) > Number(unsetModal.z),
    `modal=${unsetModal.z} drawer=${unsetDrawer.z} — the stack orders by open time`,
  )

  // The no-regression check: with nothing pinned, the chain is exactly what it was.
  // The popup lands on the DRAWER, the last layer in — not on the modal below it.
  const unsetPopup = await openPopup('ddInUnsetModal', true)
  reporter.check(
    'with nothing pinned the chain is unchanged (popup == top layer + one step)',
    Number(unsetPopup.z) === Number(unsetDrawer.z) + POPUP_Z_STEP,
    `drawer=${unsetDrawer.z} popup=${unsetPopup.z} — expected drawer + ${POPUP_Z_STEP}`,
  )
  await openPopup('ddInUnsetModal', false)
  await setOpen('openD', false)

  // `null` / `''` are both Number()-finite ZEROS, so without an explicit guard they
  // pin the dialog to `z-index: 0` — behind the page. Vue writes both through the
  // PROPERTY, which never sees the attribute converter. One at a time, on their own
  // refs: modals are exclusive unless `stackable`, and a shared ref would let the
  // one that gets closed write `false` back and take the others down with it.
  await setOpen('openJ', true)
  const nullZ = await zOf('modalNullZ')
  reporter.check(
    ':z-index="null" means unset, not 0',
    Number(nullZ.z) >= POPUP_Z_BASE,
    `${JSON.stringify(nullZ)} — expected >= ${POPUP_Z_BASE}`,
  )
  await setOpen('openJ', false)

  await setOpen('openK', true)
  const emptyZ = await zOf('modalEmptyZ')
  reporter.check(
    ':z-index="\'\'" means unset, not 0',
    Number(emptyZ.z) >= POPUP_Z_BASE,
    `${JSON.stringify(emptyZ)} — expected >= ${POPUP_Z_BASE}`,
  )
  await setOpen('openK', false)

  // ── an UNPINNED dialog opened over a pinned one ─────────────────────────────
  await setOpen('openH', true)
  await setOpen('openI', true)
  const pinnedBase = await zOf('modalPinnedBase')
  const stackedOver = await zOf('modalStackedOver')
  reporter.check(
    'an unpinned modal opened over one pinned at 1600 lands above it',
    Number(stackedOver.z) > Number(pinnedBase.z),
    `base=${pinnedBase.z} over=${stackedOver.z}`,
  )
  await setOpen('openI', false)
  await setOpen('openH', false)

  // ── reactive updates ────────────────────────────────────────────────────────
  await setOpen('openE', true)
  r = await zOf('modalDynamic')
  reporter.check('bound value applies (1400)', r.z === '1400', JSON.stringify(r))

  await page.evaluate(() => window.__setZ(1750))
  r = await zOf('modalDynamic')
  reporter.check('changing the bound value re-applies (1750)', r.z === '1750', JSON.stringify(r))
  await setOpen('openE', false)

  // ── shadow builds ───────────────────────────────────────────────────────────
  await setOpen('openF', true)
  r = await zOf('shadowModal')
  reporter.check('shadow modal :z-index="1900"', r.z === '1900', JSON.stringify(r))

  r = await zOf('shadowDrawer')
  reporter.check('shadow drawer :z-index="1950"', r.z === '1950', JSON.stringify(r))
  await setOpen('openF', false)

  // ── viewport listeners are an OPEN cost, not a mounted one ──────────────────
  // These used to be bound in `connectedCallback`, so a grid with a menu per row
  // held one capture-phase window scroll listener per row whether or not anything
  // was open — enough on its own to keep scrolling off the compositor thread.
  const baseline = await scrollListeners()
  await setDropdowns(true)
  const mounted = await scrollListeners()
  reporter.check(
    'mounting 12 button-dropdowns adds no window scroll listener',
    mounted === baseline,
    `baseline=${baseline} after mount=${mounted}`,
  )

  await openPopup('ddIdle1', true)
  const opened = await scrollListeners()
  reporter.check(
    'opening one binds its listener',
    opened > mounted,
    `mounted=${mounted} opened=${opened}`,
  )

  await openPopup('ddIdle1', false)
  const closed = await scrollListeners()
  reporter.check(
    'closing releases it again',
    closed === mounted,
    `mounted=${mounted} closed=${closed}`,
  )
  await setDropdowns(false)
}
