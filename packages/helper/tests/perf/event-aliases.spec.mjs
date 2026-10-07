// Plain event names beside the `mno-*` aliases, light AND shadow builds.
//
// The one rule: a consumer listening to the plain name hears each thing exactly
// once, with the same `detail` the `mno-*` event carries — decorated onto the
// native event where the browser already delivers one to the host (`input`,
// light-DOM `change`, `click`), synthesized where it does not (shadow `change`,
// everything with no native namesake) — and nothing is ever added on top: no
// second `click` per press, no synthesized device event reaching the document,
// no `error` escaping the element.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=event-aliases`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__fixtureReady === true, null, { timeout: 60000 })
  const j = (v) => JSON.stringify(v)

  /**
   * Per case: how many REAL clicks the drive performs (what the document may see),
   * which plain events are the decorated native ones (ctor must not be CustomEvent),
   * and any extra checks.
   */
  const EXPECT = {
    input: { realClicks: 1, decorated: { light: ['input', 'change'], shadow: ['input'] } },
    textarea: { realClicks: 0, decorated: { light: ['input', 'change'], shadow: ['input'] } },
    checkbox: { realClicks: 1, decorated: { light: ['change'], shadow: [] } },
    switch: { realClicks: 1, decorated: { light: ['change'], shadow: [] } },
    radio: { realClicks: 1, decorated: { light: ['change'], shadow: [] } },
    select: { realClicks: 2, decorated: { light: [], shadow: [] } },
    button: { realClicks: 1, decorated: { light: ['click'], shadow: ['click'] } },
    'button-affix': { realClicks: 1, decorated: { light: [], shadow: [] }, affix: true },
    chip: { realClicks: 2, decorated: { light: ['click'], shadow: ['click'] } },
    card: { realClicks: 2, decorated: { light: ['click'], shadow: ['click'] } },
    tabs: { realClicks: 1, decorated: { light: [], shadow: [] }, nativeClicks: 1 },
    accordion: { realClicks: 2, decorated: { light: [], shadow: [] }, nativeClicks: 2 },
    modal: { realClicks: 0, decorated: { light: [], shadow: [] }, nativeClicks: 0 },
    drawer: { realClicks: 0, decorated: { light: [], shadow: [] }, nativeClicks: 0 },
    dropdown: { realClicks: 0, decorated: { light: [], shadow: [] }, nativeClicks: 0 },
    menu: { realClicks: 1, decorated: { light: ['click'], shadow: ['click'] } },
    breadcrumb: { realClicks: 1, decorated: { light: ['click'], shadow: ['click'] } },
    // The REJECTED pick (too big) emits no mono event, but the file input's own
    // native `change` still bubbles in the light build, undecorated — as it always
    // did. So light sees one plain `change` more than `mno-change`.
    'file-upload': { realClicks: 0, decorated: { light: ['change'], shadow: [] }, extraNative: { light: { change: 1 } } },
    // flatpickr fires a native `change` on the field right after its hooks; mono
    // decorates THAT one in the light build (else `@change` would fire twice).
    date: { realClicks: 0, decorated: { light: ['change'], shadow: [] } },
  }

  for (const [id, exp] of Object.entries(EXPECT)) {
    const r = await page.evaluate((id) => window.__drive(id), id)

    for (const build of ['light', 'shadow']) {
      const b = r[build]
      const plainNames = Object.keys(b.sameDetail)

      if (exp.affix) {
        // The affix control's click stops at the affix boundary: no click, no
        // mno-click, on the outer button — but the document (capture) still saw it.
        reporter.check(
          `${id} [${build}]: a click on an affix control never surfaces as the button's own click`,
          b.counts.click === 0 && b.counts['mno-click'] === 0 && b.documentClicks === 1,
          `click=${b.counts.click} mno-click=${b.counts['mno-click']} documentClicks=${b.documentClicks}`,
        )
        continue
      }

      // 1. every reported thing arrives once under the plain name — same count as mno-*, same detail object
      const mismatches = []
      for (const plain of plainNames) {
        const mno = Object.keys(b.counts).find((k) => k.startsWith('mno-') && k.slice(4) === (plain === 'toggle' || plain === 'change' && id === 'tabs' ? 'click' : plain))
        const mnoCount = mno ? b.counts[mno] : undefined
        if (mnoCount === undefined || mnoCount < 1) mismatches.push(`${plain}: mno never fired (${mno}=${mnoCount})`)
        else if (b.counts[plain] !== mnoCount + (exp.extraNative?.[build]?.[plain] ?? 0)) mismatches.push(`${plain}=${b.counts[plain]} vs ${mno}=${mnoCount}`)
        else if (!b.sameDetail[plain]) mismatches.push(`${plain}: detail differs from ${mno}`)
      }
      reporter.check(
        `${id} [${build}]: every plain event fires once per mno event, with the same detail`,
        mismatches.length === 0,
        mismatches.length ? mismatches.join('; ') + ` counts=${j(b.counts)}` : `counts=${j(b.counts)}`,
      )

      // 2. decorated vs synthesized, per build
      const wrong = []
      for (const plain of plainNames) {
        const seen = b.seen[plain]
        if (!seen) continue
        const shouldDecorate = exp.decorated[build].includes(plain)
        const isNative = seen.ctor !== 'CustomEvent'
        if (shouldDecorate && !isNative) wrong.push(`${plain} should be the native event, got ${seen.ctor}`)
        if (!shouldDecorate && isNative) wrong.push(`${plain} should be synthesized, got native ${seen.ctor}`)
        if (shouldDecorate && build === 'light' && seen.target === 'host') wrong.push(`${plain}: light decorated target should be the inner control`)
        if (shouldDecorate && build === 'shadow' && seen.target !== 'host') wrong.push(`${plain}: shadow decorated target should retarget to host, got ${seen.target}`)
        if (!seen.hasDetail) wrong.push(`${plain}: no detail object (${seen.detailKeys})`)
      }
      reporter.check(
        `${id} [${build}]: native events are decorated where they reach the host, synthesized where they cannot`,
        wrong.length === 0,
        wrong.length ? wrong.join('; ') : j(Object.fromEntries(plainNames.map((p) => [p, `${b.seen[p]?.ctor}@${b.seen[p]?.target}`]))),
      )

      // 3. no synthesized device event: the document saw exactly the real clicks
      reporter.check(
        `${id} [${build}]: the document saw only the ${exp.realClicks} real click(s)`,
        b.documentClicks === exp.realClicks,
        `documentClicks=${b.documentClicks}`,
      )

      // 4. state-change components: a bare `click` is only ever the undecorated native one
      if (exp.nativeClicks !== undefined) {
        const click = b.seen.click
        reporter.check(
          `${id} [${build}]: no bare \`click\` for a state change (native clicks: ${exp.nativeClicks}, undecorated)`,
          b.counts.click === exp.nativeClicks && (!click || click.detailKeys === 'number' || click.detailKeys === 'undefined'),
          `click=${b.counts.click} detail=${j(click?.detailKeys)}`,
        )
      }

      // 5. `error` stays on the element
      if (id === 'file-upload') {
        reporter.check(
          `${id} [${build}]: \`error\` fires on the element and does NOT bubble`,
          b.counts.error === 1 && b.seen.error?.bubbles === false && b.wrap.error === 0 && b.wrapperErrors === 0,
          `error=${b.counts.error} bubbles=${b.seen.error?.bubbles} wrap=${b.wrap.error} page=${b.wrapperErrors}`,
        )
      }

      // 6. bubbling plain events reach an ancestor (delegation keeps working)
      const bubbling = plainNames.filter((p) => p !== 'error' && p !== 'focus' && p !== 'blur')
      const notBubbled = bubbling.filter((p) => b.counts[p] > 0 && b.wrap[p] !== b.counts[p])
      reporter.check(
        `${id} [${build}]: plain events bubble to an ancestor listener (${bubbling.join(', ')})`,
        notBubbled.length === 0,
        notBubbled.length ? notBubbled.map((p) => `${p}: host=${b.counts[p]} wrap=${b.wrap[p]}`).join('; ') : 'ok',
      )
    }
  }
}
