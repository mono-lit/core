// `md` is the default size — the CSS must agree with the prop.
//
// Every `<mono-*>` emits its size class, so the element always rendered `md`. But the
// unqualified CSS base rules used to carry the `lg` metrics, so hand-written
// `.mono-*` markup (and the css/ demos) that never named a size rendered one step
// larger. The library therefore had two different "defaults" depending on how you
// used it. The base rules now mirror `.md`.
//
// Two assertions per component, and they catch opposite regressions:
//
//   unset == md   the base drifting back off `md` — the original bug.
//   lg   != md    a `.lg` rule going missing. Several components had none, because
//                 the base *was* `lg`; now that the base is `md`, dropping one would
//                 silently collapse `size="lg"` onto `md` with nothing else to notice.

// NB: the component list comes back with the snapshot rather than being imported
// from the fixture — the fixture is browser code (it calls `app.mount`), so importing
// it here would run Vue against a `document` that does not exist in Node.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=size-defaults`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  const snap = await page.evaluate(() => window.__snapshotAll())

  for (const tag of Object.keys(snap)) {
    const arms = snap[tag]

    if (!arms || arms.unset?.error || arms.md?.error) {
      reporter.check(`${tag}: measurable`, false, JSON.stringify(arms?.unset ?? arms))
      continue
    }

    const unset = JSON.stringify(arms.unset)
    const md = JSON.stringify(arms.md)
    const lg = JSON.stringify(arms.lg)

    // Report the first differing key rather than two blobs — a 10-property dump
    // tells you nothing about which metric slipped.
    let detail = ''
    if (unset !== md) {
      for (const k of new Set([...Object.keys(arms.unset), ...Object.keys(arms.md)])) {
        if (arms.unset[k] !== arms.md[k]) {
          detail += `\n           ${k}\n             no size class: ${arms.unset[k]}\n             size="md"    : ${arms.md[k]}`
        }
      }
    }

    reporter.check(`${tag}: class-less markup renders as md`, unset === md, detail.trim())
    reporter.check(
      `${tag}: lg is still distinct from md`,
      lg !== md,
      `lg and md are identical — has the .lg rule been removed? ${lg}`,
    )
  }

  // `size` on modal/drawer scales the CONTENT, never the panel's measure. Width has
  // to be identical at every step; a width preset creeping back into a size rule is
  // exactly the regression this guards.
  for (const [tag, kind] of [
    ['mono-modal', 'mono-modal'],
    ['mono-drawer', 'mono-drawer'],
  ]) {
    const widths = await page.evaluate(([t, k]) => window.__panelWidths(t, k), [tag, kind])
    const first = widths[0]
    reporter.check(
      `${tag}: panel width is unaffected by size`,
      first !== null && widths.every((w) => w === first),
      `unset/md/lg widths = ${JSON.stringify(widths)} — size must not set width`,
    )
  }

  // The other half of that contract: the measure IS reachable, by name, through the
  // `width`/`height` props. They take the same `xs`…`xxl` tokens `size` does but
  // resolve them on a dimension ladder, so `size="sm" width="xl"` is a compact, wide
  // panel. Three things can regress:
  //
  //   token resolves       a typo'd ladder key, or `toCssSize` losing the lookup,
  //                        leaves the token to fall through as a bogus CSS length
  //                        that the browser silently drops.
  //   content untouched    the ladder creeping back onto `size`.
  //   clearing restores    drawer's props and its default share one var chain.
  //
  // `size` is pinned to `sm` throughout, so a measure matching the `sm` CONTENT
  // step would be a coincidence, not a pass.
  // `size` is pinned to `sm` throughout, and each component's own `sm` padding
  // is asserted — as PAINTED pixels, not a private var, so this survives a
  // component renaming its own resolver — which is what caught the modal's
  // `-pad-x` → `-pad` in the Basecoat port.
  const PRESETS = [
    {
      tag: 'mono-modal', kind: 'mono-modal', prop: 'width',
      token: 'xl', literal: 'min(95vw, 880px)', smPadX: 16,
    },
    {
      tag: 'mono-drawer', kind: 'mono-drawer', prop: 'width',
      token: 'xl', literal: '720px', smPadX: 12,
    },
  ]

  for (const { tag, kind, prop, token, literal, smPadX } of PRESETS) {
    const res = await page.evaluate(
      ([t, k, pr, tk, lit]) => window.__dimensionPreset(t, k, pr, tk, lit),
      [tag, kind, prop, token, literal],
    )

    if (res.error) {
      reporter.check(`${tag}: ${prop}="${token}" measurable`, false, res.error)
      continue
    }

    reporter.check(
      `${tag}: ${prop}="${token}" resolves to ${literal}`,
      res.withToken === res.withLiteral && res.withToken > 0,
      `token gave ${res.withToken}px, the literal gave ${res.withLiteral}px — did the token fall through toCssSize as a bad length?`,
    )
    reporter.check(
      `${tag}: a dimension token is not just the default measure`,
      res.withToken !== res.cleared,
      `${prop}="${token}" and no ${prop} both measure ${res.cleared}px`,
    )
    reporter.check(
      `${tag}: a dimension token leaves the content scale alone`,
      res.padX === smPadX,
      `the padded box reads ${res.padX}px, expected the size="sm" value ${smPadX}px`,
    )
    reporter.check(
      `${tag}: clearing ${prop} restores the default measure`,
      res.cleared > 0 && res.cleared !== res.withToken,
      `still ${res.cleared}px after clearing ${prop}`,
    )
  }
}
