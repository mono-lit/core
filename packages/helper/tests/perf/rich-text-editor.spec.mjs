// `<mono-rich-text-editor>` — SunEditor v3 as a mono form field.
//
// SunEditor is an OPTIONAL peer, externalized from `dist/`; the fixture bundle
// resolves it from the dev dependency. What is asserted is mono's glue: light-DOM
// placement, the two-way HTML model without echo, the empty → `''` rule that
// makes `required` honest, presets / plugin pruning, `disabled` / `readonly`
// reaching SunEditor, the theme remap, destroy-on-disconnect and the build's
// externalization itself.

import fs from 'node:fs'
import path from 'node:path'
import { PKG } from './harness.mjs'

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=rich-text-editor`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__fixtureReady === true, null, { timeout: 60000 })
  const j = (v) => JSON.stringify(v)

  // ── 0. the build ───────────────────────────────────────────────────────────

  const light = fs.readFileSync(path.join(PKG, 'dist/ui/rich-text-editor.js'), 'utf8')
  const shadow = fs.readFileSync(path.join(PKG, 'dist/ui/shadow/rich-text-editor.js'), 'utf8')
  reporter.check(
    'dist keeps `import("suneditor")` external — the peer is never inlined',
    light.includes('import("suneditor")') &&
      light.includes('import("suneditor/plugins")') &&
      light.includes('import("suneditor/css/editor")') &&
      shadow.includes('import("suneditor")') &&
      !light.includes('sun-editor-carrier-wrapper') === false, // our own CSS may mention it
    `light=${light.length}B shadow=${shadow.length}B`,
  )
  reporter.check(
    '…and stays small (no SunEditor source in the chunk)',
    light.length < 120_000 && !light.includes('[SUNEDITOR.create.fail]'),
    `${light.length} bytes`,
  )

  // ── 1. it builds, in light DOM, inside the frame ──────────────────────────

  const all = await page.evaluate(() => window.__ready_all())
  reporter.check(
    'every arm builds a SunEditor instance',
    all && Object.values(all).every(Boolean),
    j(all),
  )

  const basic = await page.evaluate(() => window.__read('basic'))
  reporter.check(
    'the editor DOM is a light-DOM child of the field frame (mount → .sun-editor)',
    basic && basic.mountInField && basic.sunInMount,
    `mountInField=${basic?.mountInField} sunInMount=${basic?.sunInMount}`,
  )
  reporter.check(
    'the initial model-value is the editor content',
    // SunEditor normalises `<b>` to `<strong>` — the content, not the tag, is what matters.
    basic && basic.editorHtml && /Hello <(b|strong)>world<\/(b|strong)>/.test(basic.editorHtml),
    `editorHtml=${j(basic?.editorHtml)}`,
  )
  reporter.check(
    'the chrome is mono’s: label, root classes size/color/variant, has-value',
    basic &&
      basic.label === 'Body' &&
      /\bmono-rich-text-editor\b/.test(basic.rootClass) &&
      /\bmd\b/.test(basic.rootClass) &&
      /\bprimary\b/.test(basic.rootClass) &&
      /\boutlined\b/.test(basic.rootClass) &&
      /\bhas-value\b/.test(basic.rootClass) &&
      !/\bis-loading\b/.test(basic.rootClass),
    `label=${j(basic?.label)} class=${j(basic?.rootClass)}`,
  )

  // ── 2. the model, both ways ────────────────────────────────────────────────

  const typed = await page.evaluate(() => window.__type('basic', '<p>Typed <i>text</i></p>'))
  reporter.check(
    'typing emits mno-input and mno-change carrying the HTML, and mirrors modelValue',
    typed &&
      typed.input >= 1 &&
      typed.change >= 1 &&
      typeof typed.lastChange === 'string' &&
      typed.lastChange.includes('Typed <i>text</i>') &&
      typed.modelValue === typed.lastChange,
    `input=${typed?.input} change=${typed?.change} lastChange=${j(typed?.lastChange)} model=${j(typed?.modelValue)}`,
  )

  const outside = await page.evaluate(() => window.__setModel('basic', '<p>From the parent</p>'))
  reporter.check(
    'an OUTSIDE modelValue write reaches the editor…',
    outside && outside.editorHtml && outside.editorHtml.includes('From the parent'),
    `editorHtml=${j(outside?.editorHtml)}`,
  )
  reporter.check(
    '…without echoing an mno-change back (no v-model loop)',
    outside && outside.changes === 0,
    `changes=${outside?.changes}`,
  )

  const emptied = await page.evaluate(() => window.__type('basic', '<p><br></p>'))
  reporter.check(
    'an emptied editor publishes "" — not "<p><br></p>"',
    emptied && emptied.modelValue === '' && emptied.isEmpty && emptied.getHtml === '',
    `model=${j(emptied?.modelValue)} isEmpty=${emptied?.isEmpty} getHtml=${j(emptied?.getHtml)}`,
  )

  const empty = await page.evaluate(() => window.__read('empty'))
  reporter.check(
    'a fresh editor with no value reads as empty ("" / isEmpty)',
    empty && empty.modelValue === '' && empty.isEmpty && !/\bhas-value\b/.test(empty.rootClass),
    `model=${j(empty?.modelValue)} isEmpty=${empty?.isEmpty}`,
  )

  // ── 3. toolbar presets + plugins ──────────────────────────────────────────

  const resolvers = await page.evaluate(() => window.__resolvers())
  reporter.check(
    'resolveToolbar: preset name → the preset object; string grammar and JSON parse',
    resolvers &&
      resolvers.basicIsPreset &&
      j(resolvers.str) === j([['bold', 'italic'], '|', ['link'], '/', ['image']]) &&
      j(resolvers.json) === j([['bold'], '|', ['link']]),
    `str=${j(resolvers?.str)} json=${j(resolvers?.json)}`,
  )
  reporter.check(
    'resolvePlugins: none → 0, names → looked up, auto → all, classes → keyed by static key',
    resolvers &&
      resolvers.noneCount === 0 &&
      j(resolvers.namesKeys) === j(['font', 'link']) &&
      j(resolvers.autoKeys) === j(['font', 'link', 'image']) &&
      j(resolvers.classesKeys) === j(['image']),
    `none=${resolvers?.noneCount} names=${j(resolvers?.namesKeys)} auto=${j(resolvers?.autoKeys)} classes=${j(resolvers?.classesKeys)}`,
  )
  reporter.check(
    'pruneToolbar drops buttons of plugins not loaded, keeps core buttons, tidies separators',
    resolvers && j(resolvers.pruned) === j([['bold', 'font'], '|', ['link'], '|', ['undo']]),
    `pruned=${j(resolvers?.pruned)}`,
  )

  const tbBasic = await page.evaluate(() => window.__buttons('toolbar-basic'))
  reporter.check(
    'toolbar="basic" renders exactly the preset’s buttons',
    tbBasic &&
      ['undo', 'redo', 'bold', 'underline', 'italic', 'strike', 'list_bulleted', 'list_numbered', 'link', 'removeFormat'].every(
        (b) => tbBasic.includes(b),
      ) &&
      !tbBasic.includes('image') &&
      !tbBasic.includes('table'),
    `buttons=${j(tbBasic)}`,
  )
  const tbArray = await page.evaluate(() => window.__buttons('toolbar-array'))
  reporter.check(
    'a `.prop` buttonList array is honoured verbatim',
    tbArray && j(tbArray) === j(['bold', 'underline', 'undo']),
    `buttons=${j(tbArray)}`,
  )
  const tbString = await page.evaluate(() => window.__buttons('toolbar-string'))
  reporter.check(
    'toolbar="bold italic | link" (string grammar) renders those three',
    tbString && j(tbString) === j(['bold', 'italic', 'link']),
    `buttons=${j(tbString)}`,
  )
  const noPlugins = await page.evaluate(() => window.__buttons('plugins-none'))
  reporter.check(
    'plugins="none" + the standard toolbar degrades to the core buttons (no font/table/image)',
    noPlugins &&
      noPlugins.includes('bold') &&
      noPlugins.includes('undo') &&
      noPlugins.includes('codeView') &&
      !noPlugins.includes('font') &&
      !noPlugins.includes('table') &&
      !noPlugins.includes('image') &&
      !noPlugins.includes('link'),
    `buttons=${j(noPlugins)}`,
  )
  const namedPlugins = await page.evaluate(() => window.__buttons('plugins-names'))
  reporter.check(
    'plugins="font, link" keeps exactly those plugin buttons',
    namedPlugins &&
      namedPlugins.includes('font') &&
      namedPlugins.includes('link') &&
      !namedPlugins.includes('table') &&
      !namedPlugins.includes('image'),
    `buttons=${j(namedPlugins)}`,
  )

  const inline = await page.evaluate(() => window.__read('inline'))
  const classic = await page.evaluate(() => window.__read('toolbar-basic'))
  reporter.check(
    'mode="inline" builds with no classic toolbar in flow (classic has one)',
    inline && classic && inline.hasEditor && !inline.hasToolbarInFlow && classic.hasToolbarInFlow,
    `inline=${inline?.hasToolbarInFlow} classic=${classic?.hasToolbarInFlow}`,
  )

  // ── 4. disabled / readonly reach SunEditor ─────────────────────────────────

  const ro = await page.evaluate(() => window.__setState('states', { readonly: true }))
  reporter.check(
    'readonly: SunEditor marks the editing area .se-read-only and the root reads .readonly',
    ro && ro.readOnlyClass && /\breadonly\b/.test(ro.rootClass),
    `se-read-only=${ro?.readOnlyClass} class=${j(ro?.rootClass)}`,
  )
  const dis = await page.evaluate(() => window.__setState('states', { readonly: false, disabled: true }))
  reporter.check(
    'disabled: SunEditor disables its toolbar and the editing area',
    dis && dis.boldDisabled === true && dis.wysiwygEditable === 'false',
    `boldDisabled=${dis?.boldDisabled} contenteditable=${j(dis?.wysiwygEditable)}`,
  )
  const back = await page.evaluate(() => window.__setState('states', { disabled: false }))
  reporter.check(
    '…and enabling again restores editing (and does not leave read-only behind)',
    back && back.wysiwygEditable === 'true' && back.boldDisabled === false && !back.readOnlyClass,
    `contenteditable=${j(back?.wysiwygEditable)} boldDisabled=${back?.boldDisabled} se-read-only=${back?.readOnlyClass}`,
  )

  // ── 5. monoForm ────────────────────────────────────────────────────────────

  const formEmpty = await page.evaluate(() => window.__formValidate())
  reporter.check(
    'monoForm: an empty required editor fails validate() and paints .is-invalid + the message',
    formEmpty &&
      formEmpty.ok === false &&
      formEmpty.validationState === 'invalid' &&
      /\bis-invalid\b/.test(formEmpty.rootClass) &&
      formEmpty.message === 'Body is required',
    `ok=${formEmpty?.ok} state=${formEmpty?.validationState} message=${j(formEmpty?.message)}`,
  )
  const formTyped = await page.evaluate(() => window.__form('<p>Now filled</p>'))
  reporter.check(
    '…typing reports live to the form: value stored, rule passes, state back to default',
    formTyped &&
      typeof formTyped.formValue === 'string' &&
      formTyped.formValue.includes('Now filled') &&
      formTyped.valid === true &&
      formTyped.validationState === 'default',
    `formValue=${j(formTyped?.formValue)} valid=${formTyped?.valid} state=${formTyped?.validationState}`,
  )
  const formCleared = await page.evaluate(() => window.__form('<p><br></p>'))
  reporter.check(
    '…and clearing it fails `required` again ("" reaches the form, not "<p><br></p>")',
    formCleared && formCleared.formValue === '' && formCleared.valid === false,
    `formValue=${j(formCleared?.formValue)} valid=${formCleared?.valid}`,
  )

  // ── 6. theme remap ─────────────────────────────────────────────────────────

  const theme = await page.evaluate(() => window.__theme('basic'))
  reporter.check(
    '--se-active-color on .sun-editor resolves to --ring (the field focus colour)',
    theme && theme.active && theme.active === theme.themePrimary,
    `active=${theme?.active} themePrimary=${theme?.themePrimary}`,
  )
  const themed = await page.evaluate(() => window.__theme('sized'))
  reporter.check(
    'color="danger" retargets the editor accent; SunEditor’s own frame border is flattened',
    themed && themed.active === themed.themeDanger && themed.sunBorder === '0px',
    `active=${themed?.active} themeDanger=${themed?.themeDanger} sunBorder=${themed?.sunBorder}`,
  )
  // the textarea ladder keeps lg at md's font (only xl / xxl step to text-base);
  // what steps at lg is the toolbar icon size
  reporter.check(
    'size="lg" steps the toolbar icons through --se-icon-size and never shrinks the font',
    theme && themed && parseFloat(themed.iconSize) > parseFloat(theme.iconSize) && parseFloat(themed.fontSize) >= parseFloat(theme.fontSize),
    `md=${theme?.fontSize}/${theme?.iconSize} lg=${themed?.fontSize}/${themed?.iconSize}`,
  )

  // ── 7. lifecycle ───────────────────────────────────────────────────────────

  const cycle = await page.evaluate(() => window.__cycle('second'))
  reporter.check(
    'disconnect destroys the instance and its DOM; reconnect rebuilds with the value kept',
    cycle &&
      cycle.before.hasEditor &&
      !cycle.detached.hasEditor &&
      !cycle.detached.sunLeft &&
      cycle.rebuilt &&
      cycle.after.hasEditor &&
      cycle.after.editorHtml.includes('two'),
    `before=${cycle?.before?.hasEditor} detached=${j(cycle?.detached)} rebuilt=${cycle?.rebuilt} after=${j(cycle?.after?.editorHtml)}`,
  )
  // SunEditor parks one carrier (modals / alerts) on <body> PER instance and
  // removes it on destroy — so after the destroy + rebuild above the count must
  // still equal the number of live editors, or the cycle leaked one.
  const carriers = await page.evaluate(() => window.__carriers())
  reporter.check(
    'one body-level carrier per live editor — a destroy + rebuild leaks none',
    carriers && carriers.carriers === carriers.editors,
    `carriers=${carriers?.carriers} editors=${carriers?.editors}`,
  )

  // ── 8. languages ───────────────────────────────────────────────────────────

  const lang = await page.evaluate(() => window.__lang())
  reporter.check(
    'loadSunEditorLang: ko → pack, pt-BR → pt_br, unknown → undefined (warned), en → undefined',
    lang && lang.ko && lang.ptbr && lang.unknown && lang.en,
    j(lang),
  )
  reporter.check(
    'language="ko" builds the toolbar with the Korean pack',
    lang && typeof lang.editorLang === 'string' && /[가-힯]/.test(lang.editorLang),
    `bold aria-label=${j(lang?.editorLang)}`,
  )
}
