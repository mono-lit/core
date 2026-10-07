// `<mono-rich-text-editor>` after the Basecoat port. See the fixture for what
// is being claimed; these are the assertions that would catch it regressing.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=rich-text-editor-attributes`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  const tok = async (n) => page.evaluate((n) => window.__token(n), n)

  const light = await page.evaluate(() => window.__m('light'))
  const shadow = await page.evaluate(() => window.__m('shadow'))
  const sized = await page.evaluate(() => window.__m('sized'))
  const under = await page.evaluate(() => window.__m('under'))
  const ref = await page.evaluate(() => window.__ref())

  reporter.check(
    'default: the root attribute and the value state alone — nothing for default-valued props',
    same(light.attrs, ['mono-has-value', 'mono-rich-text-editor']),
    JSON.stringify(light.attrs),
  )
  reporter.check(
    'every prop mirrors onto the root by name; the validation state resolves from the message',
    same(sized.attrs, ['mono-color', 'mono-required', 'mono-rich-text-editor', 'mono-size', 'mono-validation-state', 'mono-variant']),
    JSON.stringify(sized.attrs),
  )
  reporter.check('the mount carries mono-rte-mount in both builds', light.mount && shadow.mount, JSON.stringify({ light: light.mount, shadow: shadow.mount }))

  // ── the frame is the textarea's box ──────────────────────────────────────
  reporter.check(
    'the frame has the same corner, edge, surface and shadow as a real <mono-textarea> beside it',
    Math.abs(light.field.radius - ref.radius) <= 0.5 && same(light.field.border, ref.border) && same(light.field.bg, ref.bg) && same(light.field.shadow, ref.shadow),
    JSON.stringify({ field: light.field, ref }),
  )
  reporter.check('the frame edge is `border-input`, not a --theme-* bridge', same(light.field.border, await tok('--input')), JSON.stringify({ border: light.field.border, input: await tok('--input') }))
  reporter.check('the label is the field label: text-sm font-medium, foreground', light.label.font === ref.labelFont && light.label.weight === '500' && same(light.label.ink, await tok('--foreground')), JSON.stringify({ label: light.label, refFont: ref.labelFont }))
  reporter.check(
    'an error message is the destructive alert; the invalid frame takes the mode border',
    sized.msg?.state === 'invalid' && sized.msg?.role === 'alert' && same(sized.msg?.ink, await tok('--destructive')) && sized.field.border !== light.field.border,
    JSON.stringify({ msg: sized.msg, border: sized.field.border }),
  )
  reporter.check('underlined: square, the bottom edge only, no shadow', under.field.radius === 0 && /rgba\(0, 0, 0, 0\)|transparent/.test(under.field.side) && under.field.border !== under.field.side, JSON.stringify(under.field))

  // ── SunEditor takes the tokens ───────────────────────────────────────────
  reporter.check('the editor active colour is the field focus colour (--ring); color="danger" retargets it', same(light.sun?.active, await tok('--ring')) && same(sized.sun?.active, await tok('--destructive')), JSON.stringify({ light: light.sun?.active, sized: sized.sun?.active }))
  reporter.check('the editing surface is the frame surface; SunEditor’s own frame border is flattened', same(light.sun?.bg, light.field.bg) && light.sun?.border === '0px', JSON.stringify({ sun: light.sun, field: light.field.bg }))
  reporter.check('a SunEditor dropdown / dialog takes the select panel’s popover corner', light.sun?.popoverRadius === ref.popoverRadius, JSON.stringify({ sun: light.sun?.popoverRadius, popover: ref.popoverRadius }))
  reporter.check('the toolbar is a muted band', !!light.toolbar && light.toolbar.bg !== light.field.bg && light.toolbar.bg !== 'rgba(0, 0, 0, 0)', JSON.stringify({ toolbar: light.toolbar, field: light.field.bg }))
  reporter.check('every placeholder is the field placeholder: opaque --muted-foreground (the Size input, the empty area)', same(light.placeholder.input, await tok('--muted-foreground')) && light.placeholder.inputOpacity === '1' && (light.placeholder.area === null || same(light.placeholder.area, await tok('--muted-foreground'))), JSON.stringify(light.placeholder))
  reporter.check('size="lg" steps the editor font up', sized.sun && light.sun && sized.sun.font >= light.sun.font, JSON.stringify({ md: light.sun?.font, lg: sized.sun?.font }))

  // ── the toolbar tooltip is Basecoat's tooltip ────────────────────────────
  for (const build of ['light', 'shadow']) {
    const pt = await page.evaluate((b) => window.__buttonPoint(b), build)
    await page.mouse.move(pt.x, pt.y)
    await page.waitForTimeout(300)
    const tip = await page.evaluate((b) => window.__tooltip(b), build)
    reporter.check(
      `${build}: hovering a toolbar button shows its tooltip as bg-foreground text-background at the style's corner, text-xs`,
      tip.shown && same(tip.bg, await tok('--foreground')) && same(tip.ink, await tok('--background')) && tip.radius === tip.expectRadius && tip.font === 12,
      JSON.stringify(tip),
    )
    await page.mouse.move(0, 0)
  }

  // ── the dropdown items' native titles are Basecoat tooltips now ──────────
  for (const build of ['light', 'shadow']) {
    // a real click on a focused editor: the layer opens in the carrier on <body>
    const ed = await page.evaluate((b) => window.__editablePoint(b), build)
    await page.mouse.click(ed.x, ed.y)
    await page.waitForTimeout(200)
    const btn = await page.evaluate((b) => window.__buttonPoint(b, 'fontColor'), build)
    await page.mouse.click(btn.x, btn.y)
    await page.waitForTimeout(500)
    const pt = await page.evaluate(() => window.__swatchPoint())
    if (pt) { await page.mouse.move(pt.x, pt.y); await page.waitForTimeout(300) }
    const t = await page.evaluate((b) => window.__titles(b), build)
    reporter.check(
      `${build}: no native title survives under the editor or its carrier; the open palette carries aria-labels and data-tooltips`,
      t.titles === 0 && t.tooltips > 0 && t.labels > 0,
      JSON.stringify({ titles: t.titles, tooltips: t.tooltips, labels: t.labels }),
    )
    reporter.check(
      `${build}: a hovered palette swatch shows its tooltip as Basecoat's — bg-foreground text-background, text-xs in the page font`,
      !!t.swatch && t.swatch.opacity === '1' && t.swatch.content !== 'none' && same(t.swatch.bg, await tok('--foreground')) && same(t.swatch.ink, await tok('--background')) && t.swatch.font === 12 && t.swatch.family === t.pageFont,
      JSON.stringify(t.swatch),
    )
    // close the layer, then PARK THE POINTER at (0,0) like every other spec: the
    // next fixture loads into this same page, and a pointer left over a control
    // hovers it (the button spec measured bg-primary/90 once because of this)
    await page.keyboard.press('Escape')
    await page.mouse.move(0, 0)
    await page.waitForTimeout(200)
  }

  // ── the dropdown lists (in the carrier on <body>) are the theme's popover ─
  const li = await page.evaluate(() => window.__openList())
  if (li) { await page.mouse.move(li.x, li.y); await page.waitForTimeout(300) }
  const list = await page.evaluate(() => window.__list())
  reporter.check(
    'a dropdown list is the popover surface at the select panel corner, a hovered item is inked --foreground',
    same(list.layer.bg, await tok('--popover')) && list.layer.radius === ref.popoverRadius && !!list.hovered && same(list.hovered.ink, await tok('--foreground')),
    JSON.stringify({ layer: list.layer, hovered: list.hovered, popoverRadius: ref.popoverRadius }),
  )
  reporter.check(
    'a checked item is the toggle-on state: bg-accent text-accent-foreground, not a primary tint',
    !!list.checked && same(list.checked.bg, await tok('--accent')) && same(list.checked.ink, await tok('--accent-foreground')),
    JSON.stringify(list.checked),
  )
  await page.mouse.move(0, 0)

  // ── SunEditor's dialogs are the page's dialog; their fields the ported input ─
  {
    const ed = await page.evaluate(() => window.__editablePoint('light'))
    await page.mouse.click(ed.x, ed.y)
    await page.waitForTimeout(200)
    const btn = await page.evaluate(() => window.__buttonPoint('light', 'link'))
    await page.mouse.click(btn.x, btn.y)
    await page.waitForTimeout(600)
    await page.evaluate(() => window.__modalBlur())
    await page.waitForTimeout(300)
    const modal = await page.evaluate(() => window.__modal())
    reporter.check(
      "the link dialog is a popover: bg-popover, a --border edge, the select panel's corner and shadow",
      !!modal && same(modal.content.bg, await tok('--popover')) && same(modal.content.border, await tok('--border')) && modal.content.radius === ref.popoverRadius && modal.content.shadow !== 'none',
      JSON.stringify(modal?.content),
    )
    reporter.check(
      "a dialog field paints like a real <mono-input>: same surface, edge and corner",
      !!modal?.input && same(modal.input.bg, modal.refInput.bg) && same(modal.input.border, modal.refInput.border) && modal.input.radius === modal.refInput.radius,
      JSON.stringify({ input: modal?.input, ref: modal?.refInput }),
    )
    reporter.check('Submit is the primary button: bg-primary text-primary-foreground', !!modal?.submit && same(modal.submit.bg, await tok('--primary')) && same(modal.submit.ink, await tok('--primary-foreground')), JSON.stringify(modal?.submit))
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
  }
  const code = await page.evaluate(() => window.__codeView())
  reporter.check(
    'code view stays on the editing surface in the page ink, mono face, a muted line column',
    !!code && same(code.bg, code.fieldBg) && same(code.ink, await tok('--foreground')) && same(code.lineBg, await tok('--muted')) && /mono|Menlo|Consolas/i.test(code.font),
    JSON.stringify(code),
  )
  for (const build of ['light', 'shadow']) {
    const fs = await page.evaluate((b) => window.__fullScreen(b), build)
    reporter.check(
      `${build}: full screen takes the opaque page surface (bg-background) and marks the mount; leaving it restores the frame`,
      fs.marked && fs.position === 'fixed' && same(fs.bg, await tok('--background')) && same(fs.wysBg, await tok('--background')) && fs.toolbarBg !== 'rgba(0, 0, 0, 0)' && !fs.after.marked && fs.after.position !== 'fixed' && (fs.after.bg === 'rgba(0, 0, 0, 0)' || fs.after.bg === 'transparent'),
      JSON.stringify(fs),
    )
  }
  await page.mouse.move(0, 0)

  // ── no --theme-* bridge anywhere in the sheet ────────────────────────────
  const reads = await page.evaluate(() => window.__reads())
  reporter.check('no rich-text-editor rule reads a --theme-* bridge', reads.length === 0, JSON.stringify(reads.slice(0, 4)))

  // ── shadow === light ─────────────────────────────────────────────────────
  const strip = (m) => ({ ...m, attrs: undefined })
  reporter.check('the shadow build paints the same numbers as the light build', same(strip(light), strip(shadow)), JSON.stringify({ light: strip(light), shadow: strip(shadow) }))
}
