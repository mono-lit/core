// A no-overlay modal / drawer closes on an outside click — see the fixture's
// header for the mechanism. What is pinned here:
//   1. page click → closes with `source: 'overlay'` AND the page element got its
//      click (click-through), light + shadow, modal + drawer;
//   2. inside stays inside: the panel, a select's option list opened from within;
//   3. topmost only: with that select open, the first page click closes the select
//      and not the dialog; a stacked modal's backdrop click leaves the one below;
//   4. `close-on-overlay="false"`, `persistent`, `dismissible="false"` keep it open;
//   5. with an overlay nothing changes and no document listener is installed;
//   6. the click that OPENED the dialog never closes it.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=dialog-outside-click`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  const isOpen = (n) => page.evaluate((x) => window.__isOpen(x), n)
  const closedWith = (n) => page.evaluate((x) => window.__closedWith(x), n)
  const setOpen = (n, v) => page.evaluate(([a, b]) => window.__setOpen(a, b), [n, v])
  const pointer = (sel) => page.evaluate((s) => window.__pointer(s), sel)
  const pageClicks = () => page.evaluate(() => window.__pageClicks())

  // ── 1. page click closes, and goes through ─────────────────────────────────
  for (const [name, kind] of [
    ['modal', 'light modal'],
    ['drawer', 'light drawer'],
    ['shadowModal', 'shadow modal'],
    ['shadowDrawer', 'shadow drawer'],
  ]) {
    await page.evaluate((n) => window.__reset(n), name)
    await setOpen(name, true)
    const before = await pageClicks()
    const wasOpen = await isOpen(name)
    await pointer('#page-btn')
    const after = await pageClicks()
    reporter.check(
      `${kind} without overlay: a click on a page button closes it with source "overlay" and the button still got the click`,
      wasOpen && !(await isOpen(name)) && (await closedWith(name)) === 'overlay' && after === before + 1,
      `open before=${wasOpen}, after=${await isOpen(name)}, source=${await closedWith(name)}, page clicks ${before}→${after}`,
    )
  }

  // ── 2. inside stays inside ─────────────────────────────────────────────────
  await setOpen('modal', true)
  await page.evaluate(() => window.__clickInside('modal'))
  const insideStays = await isOpen('modal')
  const selOpened = await page.evaluate(() => window.__openSelect())
  await page.evaluate(() => window.__pickOption('Beta'))
  const afterPick = { open: await isOpen('modal'), value: await page.evaluate(() => window.__selectValue()), selectOpen: await page.evaluate(() => window.__selectOpen()) }
  reporter.check(
    'a click inside the panel, and a pick in a select list opened from inside it (a body portal), both leave the modal open',
    insideStays && selOpened && afterPick.open && (afterPick.value?.value ?? afterPick.value) === 'b',
    `inside→open=${insideStays}; select opened=${selOpened}; after pick ${JSON.stringify(afterPick)}`,
  )

  // ── 3. topmost only ────────────────────────────────────────────────────────
  const reopened = await page.evaluate(() => window.__openSelect())
  await pointer('#elsewhere')
  const firstClick = { modal: await isOpen('modal'), select: await page.evaluate(() => window.__selectOpen()) }
  await pointer('#elsewhere')
  const secondClick = { modal: await isOpen('modal') }
  reporter.check(
    'with the select open, the first page click closes only the select (topmost layer); the next one closes the modal',
    reopened && firstClick.modal && !firstClick.select && !secondClick.modal,
    `select reopened=${reopened}; first ${JSON.stringify(firstClick)}; second ${JSON.stringify(secondClick)}`,
  )

  await setOpen('modal', true)
  await setOpen('stackedTop', true)
  await page.evaluate(() => window.__clickBackdrop('stackedTop'))
  const stacked = { below: await isOpen('modal'), top: await isOpen('stackedTop') }
  await pointer('#elsewhere')
  const thenPage = await isOpen('modal')
  reporter.check(
    'stacked: a click on the backdrop of the modal ABOVE closes only that one; the no-overlay modal below closes on the next page click',
    stacked.below && !stacked.top && !thenPage,
    `after backdrop ${JSON.stringify(stacked)}; after page click below=${thenPage}`,
  )

  // ── 4. the gates ───────────────────────────────────────────────────────────
  for (const [name, what] of [
    ['noClose', 'close-on-overlay="false"'],
    ['persistent', 'persistent'],
    ['noDismiss', 'dismissible="false" (drawer)'],
  ]) {
    await setOpen(name, true)
    await pointer('#page-btn')
    const still = await isOpen(name)
    await setOpen(name, false)
    reporter.check(`${what}: a page click leaves it open`, still, `open after page click: ${still}`)
  }

  // ── 5. with an overlay: unchanged, and no document listener ────────────────
  const listenersBefore = await page.evaluate(() => window.__docClickListeners())
  await setOpen('overlaid', true)
  const listenersOpen = await page.evaluate(() => window.__docClickListeners())
  await page.evaluate(() => window.__clickBackdrop('overlaid'))
  const overlaidClosed = !(await isOpen('overlaid'))
  reporter.check(
    'with an overlay the backdrop still closes it and NO document click listener is installed',
    overlaidClosed && (await closedWith('overlaid')) === 'overlay' && listenersOpen === listenersBefore,
    `closed=${overlaidClosed}, source=${await closedWith('overlaid')}, document click listeners ${listenersBefore}→${listenersOpen}`,
  )

  // ── 6. the opening click ───────────────────────────────────────────────────
  await page.evaluate(() => window.__reset('modal'))
  await page.evaluate(() => window.__openByClick('modal'))
  const survivedOpener = await isOpen('modal')
  await pointer('#elsewhere')
  reporter.check(
    'the page click that OPENS a no-overlay modal does not close it; the next page click does',
    survivedOpener && !(await isOpen('modal')),
    `after opener click: ${survivedOpener}; after next click: ${await isOpen('modal')}`,
  )
}
