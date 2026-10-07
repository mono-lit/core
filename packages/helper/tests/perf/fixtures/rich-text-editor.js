// `<mono-rich-text-editor>` — SunEditor v3 as a mono form field, the peer
// loaded on demand.
//
// What is guarded here is the GLUE, not SunEditor: that the editor is built in
// LIGHT DOM inside the frame, that the HTML round-trips both ways without an
// echo, that an empty editor publishes `''` (so `required` works), that the
// toolbar presets and the plugin filter agree, that `disabled` / `readonly`
// reach SunEditor's own state, that the theme remap lands on `.sun-editor`, and
// that a disconnect destroys and a reconnect rebuilds.
//
// `load-css="false"` everywhere: the page inlines SunEditor's sheet itself
// (`run.mjs` reads it from node_modules), because esbuild's IIFE bundle cannot
// carry a dynamic CSS import.

import '@mono-lit/helper/ui/rich-text-editor'
import { controlMonoForm } from '@mono-lit/helper'
import { loadSunEditorLang, TOOLBAR_BASIC, resolveToolbar, pruneToolbar, resolvePlugins } from '@mono-lit/helper/ui/rich-text-editor'

const host = document.getElementById('app')

const ARMS = {}

function mount(id, attrs = {}, props = {}) {
  const wrap = document.createElement('div')
  wrap.style.width = '640px'
  wrap.style.marginBottom = '12px'
  const el = document.createElement('mono-rich-text-editor')
  el.id = id
  el.setAttribute('load-css', 'false')
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  Object.assign(el, props)
  wrap.appendChild(el)
  host.appendChild(wrap)
  ARMS[id] = { el, wrap }
  return el
}

// ── the arms ──────────────────────────────────────────────────────────────────

mount('basic', { label: 'Body', 'model-value': '<p>Hello <b>world</b></p>', name: 'body', placeholder: 'Write…' })
mount('empty', { label: 'Empty' })
mount('toolbar-basic', { toolbar: 'basic' })
mount('toolbar-string', { toolbar: 'bold italic | link' })
mount('toolbar-array', {}, { toolbar: [['bold', 'underline'], '|', ['undo']] })
// A trimmed plugin list with the default (standard) toolbar: the buttons of
// plugins that are not loaded must be dropped, not rejected.
mount('plugins-none', { plugins: 'none' })
mount('plugins-names', { plugins: 'font, link' })
mount('inline', { mode: 'inline' })
mount('states', { 'model-value': '<p>locked</p>' })
mount('sized', { size: 'lg', color: 'danger', variant: 'filled', 'min-height': '12rem' })
mount('second', { 'model-value': '<p>two</p>' })
mount('lang', { language: 'ko' })

// The form arm: the editor is a `required` field the controller validates live.
const form = controlMonoForm({
  validation: { type: 'live' },
  inputs: {
    Body: {
      component: 'mono-rich-text-editor',
      value: '',
      validates: [{ type: 'required', message: 'Body is required' }],
    },
  },
})
{
  const el = mount('form', { label: 'Form body' })
  el.controlForm = form
  el.keyForm = 'Body'
  ARMS.form.form = form
}

// ── helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Resolve once the arm's SunEditor instance reports `onload`. */
async function ready(id, timeout = 15000) {
  const { el } = ARMS[id]
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (el.editor && el.querySelector('.sun-editor .se-wrapper-wysiwyg')) return true
    await sleep(25)
  }
  return false
}

const wysiwyg = (el) => el.querySelector('.sun-editor .se-wrapper-wysiwyg')

/** Type into the editor like a user: set the contenteditable and fire `input`. */
async function typeHtml(id, html) {
  const { el } = ARMS[id]
  const area = wysiwyg(el)
  area.focus()
  area.innerHTML = html
  area.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'x' }))
  // SunEditor pushes history (→ onChange) on a delay; give it room.
  await sleep(450)
}

// ── probes ────────────────────────────────────────────────────────────────────

window.__ready = async (id) => ready(id)

window.__read = (id) => {
  const { el } = ARMS[id]
  const root = el.querySelector('.mono-rich-text-editor')
  const field = el.querySelector('.mono-rich-text-editor-field')
  const mountEl = el.querySelector('.mono-rich-text-editor-mount')
  const sun = el.querySelector('.sun-editor')
  const area = wysiwyg(el)
  return {
    hasEditor: !!el.editor,
    rootClass: root?.className ?? '',
    // The editor DOM is a light-DOM descendant of the FRAME (not a sibling, not shadow).
    mountInField: !!mountEl && mountEl.parentElement === field,
    sunInMount: !!sun && !!mountEl && mountEl.contains(sun),
    editorHtml: el.editor ? el.editor.$.html.get() : null,
    modelValue: el.modelValue,
    getHtml: el.getHtml(),
    isEmpty: el.isEmpty(),
    toolbarButtons: Array.from(el.querySelectorAll('.se-toolbar button[data-command], .se-toolbar button[data-type]'))
      .map((b) => b.getAttribute('data-command') || b.getAttribute('data-type'))
      .filter(Boolean),
    toolbarNames: Array.from(el.querySelectorAll('.se-toolbar .se-btn')).map(
      (b) => b.getAttribute('data-command') ?? b.className,
    ),
    hasToolbarInFlow: !!el.querySelector('.sun-editor .se-toolbar') && !el.querySelector('.sun-editor .se-toolbar.se-toolbar-inline'),
    contentEditable: area?.getAttribute('contenteditable') ?? null,
    label: el.querySelector('.mono-rich-text-editor-label')?.textContent.trim() ?? '',
    message: el.querySelector('.mono-rich-text-editor-message')?.textContent.trim() ?? '',
    unavailable: el.querySelector('.mono-rich-text-editor-unavailable')?.textContent.trim() ?? '',
    validationState: el.validationState,
  }
}

/** Every SunEditor toolbar button name the arm rendered. */
window.__buttons = (id) => {
  const { el } = ARMS[id]
  return Array.from(el.querySelectorAll('.se-toolbar button[data-command]')).map((b) => b.getAttribute('data-command'))
}

window.__type = async (id, html) => {
  const { el } = ARMS[id]
  const events = { input: 0, change: 0, lastChange: null, lastInput: null }
  const onInput = (e) => {
    events.input++
    events.lastInput = e.detail.modelValue
  }
  const onChange = (e) => {
    events.change++
    events.lastChange = e.detail.modelValue
  }
  el.addEventListener('mno-input', onInput)
  el.addEventListener('mno-change', onChange)
  await typeHtml(id, html)
  el.removeEventListener('mno-input', onInput)
  el.removeEventListener('mno-change', onChange)
  return { ...events, ...window.__read(id) }
}

/** An OUTSIDE write: the parent's v-model changed. Must reach the editor without an echo. */
window.__setModel = async (id, html) => {
  const { el } = ARMS[id]
  let changes = 0
  const onChange = () => changes++
  el.addEventListener('mno-change', onChange)
  el.modelValue = html
  await el.updateComplete
  await sleep(450)
  el.removeEventListener('mno-change', onChange)
  return { changes, ...window.__read(id) }
}

window.__setState = async (id, { disabled, readonly }) => {
  const { el } = ARMS[id]
  if (disabled !== undefined) el.disabled = disabled
  if (readonly !== undefined) el.readonly = readonly
  await el.updateComplete
  await sleep(50)
  const first = el.querySelector('.se-toolbar button[data-command="bold"]')
  return {
    ...window.__read(id),
    boldDisabled: first ? first.disabled || first.getAttribute('disabled') !== null : null,
    wysiwygEditable: wysiwyg(el)?.getAttribute('contenteditable'),
    readOnlyClass: !!wysiwyg(el)?.classList.contains('se-read-only'),
  }
}

/** The resolved theme remap, read off SunEditor's own root. */
window.__theme = (id) => {
  const { el } = ARMS[id]
  const sun = el.querySelector('.sun-editor')
  const root = el.querySelector('.mono-rich-text-editor')
  const cs = getComputedStyle(sun)
  const probe = document.createElement('div')
  // the accent is the field's focus colour: Basecoat's --ring for primary
  probe.style.color = 'var(--ring)'
  document.body.appendChild(probe)
  const themePrimary = getComputedStyle(probe).color
  probe.style.color = 'var(--destructive)'
  const themeDanger = getComputedStyle(probe).color
  probe.remove()
  // `--se-active-color` is a raw token; resolve it through a probe of our own.
  const sunProbe = document.createElement('div')
  sun.appendChild(sunProbe)
  sunProbe.style.color = 'var(--se-active-color)'
  const active = getComputedStyle(sunProbe).color
  sunProbe.style.color = 'var(--se-main-font-size)'
  sunProbe.style.fontSize = 'var(--se-main-font-size)'
  const fontSize = getComputedStyle(sunProbe).fontSize
  sunProbe.style.width = 'var(--se-icon-size)'
  const iconSize = getComputedStyle(sunProbe).width
  sunProbe.remove()
  return {
    active,
    themePrimary,
    themeDanger,
    fontSize,
    iconSize,
    sunBorder: cs.borderTopWidth,
    rootFontVar: getComputedStyle(root).getPropertyValue('--_mono-rte-font-size').trim(),
  }
}

window.__form = async (html) => {
  const { el } = ARMS.form
  await typeHtml('form', html)
  await sleep(50)
  const item = form.items().Body
  return {
    ...window.__read('form'),
    formValue: item.currentValue,
    valid: item.validate.success,
    formMessage: item.validate.message,
  }
}

window.__formValidate = async () => {
  const ok = await form.validate()
  await ARMS.form.el.updateComplete
  await sleep(30)
  return { ok, ...window.__read('form') }
}

/** Detach the arm, report, reattach, wait for the rebuild, report again. */
window.__cycle = async (id) => {
  const { el, wrap } = ARMS[id]
  const before = window.__read(id)
  wrap.removeChild(el)
  await sleep(30)
  const detached = { hasEditor: !!el.editor, sunLeft: !!el.querySelector('.sun-editor') }
  wrap.appendChild(el)
  const rebuilt = await ready(id)
  return { before, detached, rebuilt, after: window.__read(id) }
}

window.__carriers = () => ({
  carriers: document.querySelectorAll('.sun-editor-carrier-wrapper').length,
  editors: Object.values(ARMS).filter((a) => !!a.el.editor).length,
})

/** The resolvers, straight: presets, string grammar, pruning, plugin lookup. */
window.__resolvers = () => {
  const all = { font: class { static key = 'font' }, link: class { static key = 'link' }, image: class { static key = 'image' } }
  const basic = resolveToolbar('basic')
  const str = resolveToolbar('bold italic | link / image')
  const json = resolveToolbar('[["bold"],"|",["link"]]')
  const none = resolvePlugins('none', all)
  const names = resolvePlugins('font, link', all)
  const auto = resolvePlugins('auto', all)
  const classes = resolvePlugins([all.image], null)
  const pruned = pruneToolbar([['bold', 'font', 'image'], '|', ['link'], '|', ['undo']], names.keys)
  return {
    basicIsPreset: basic === TOOLBAR_BASIC,
    str,
    json,
    noneCount: none.plugins.length,
    namesKeys: [...names.keys],
    autoKeys: [...auto.keys],
    classesKeys: [...classes.keys],
    pruned,
  }
}

window.__lang = async () => {
  const ko = await loadSunEditorLang('ko')
  const ptbr = await loadSunEditorLang('pt-BR')
  const unknown = await loadSunEditorLang('xx')
  const en = await loadSunEditorLang('en')
  return {
    ko: !!ko && typeof ko === 'object' && typeof ko.code === 'string' ? ko.code : ko ? 'object' : null,
    ptbr: !!ptbr,
    unknown: unknown === undefined,
    en: en === undefined,
    editorLang: ARMS.lang.el.editor ? ARMS.lang.el.querySelector('.se-toolbar button[data-command="bold"]')?.getAttribute('aria-label') : null,
  }
}

window.__ready_all = async () => {
  const out = {}
  for (const id of Object.keys(ARMS)) out[id] = await ready(id)
  return out
}

window.__fixtureReady = true
