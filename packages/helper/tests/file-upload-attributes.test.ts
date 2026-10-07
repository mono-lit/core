// @vitest-environment jsdom
//
// `<mono-file-upload>` renders its Basecoat styling ATTRIBUTES: the root carries
// `mono-file-upload` plus one `mono-<prop>` per prop that is off its default and
// the states `mono-disabled` / `mono-required` / `mono-multiple` /
// `mono-no-dragdrop` / `mono-dragover`; the parts are `mono-label`
// (+ `mono-required-mark`), `mono-dropzone` > `mono-icon` > `mono-glyph` /
// `mono-title` / `mono-subtitle` (+ the old `mono-subtext`) / `mono-native`, `mono-list` > `mono-item` >
// `mono-thumb` / `mono-file` > `mono-name` + `mono-meta` / `mono-remove`, and
// `mono-message="helper|valid|invalid|warning"`. file-upload.css keys on these
// alone.
//
// Drives the BUILT artifact so it exercises what a consumer installs.
import { describe, it, expect, beforeAll } from 'vitest'

describe('<mono-file-upload> styling attributes', () => {
  beforeAll(async () => {
    await import('../dist/ui/file-upload.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

  async function mount(props: Record<string, unknown> = {}): Promise<any> {
    const el = document.createElement('mono-file-upload') as any
    document.body.appendChild(el)
    for (const [k, v] of Object.entries(props)) el[k] = v
    await tick()
    return el
  }

  const root = (el: any) => el.querySelector('[mono-file-upload]') as HTMLElement

  it('a default uploader emits the root attribute and nothing for default-valued props', async () => {
    const el = await mount({
      label: 'Supporting Document',
      placeholder: 'Click or drag file here',
      subtext: 'PDF, DOCX, XLSX',
      helperText: 'Single file upload',
    })
    const r = root(el)
    for (const a of [
      'mono-variant',
      'mono-validation-state',
      'mono-disabled',
      'mono-required',
      'mono-multiple',
      'mono-no-dragdrop',
      'mono-dragover',
    ]) {
      expect(r.hasAttribute(a), a).toBe(false)
    }

    expect(r.querySelector(':scope > [mono-label]')?.textContent?.trim()).toBe('Supporting Document')
    expect(r.querySelector('[mono-required-mark]')).toBeNull()

    const zone = r.querySelector(':scope > [mono-dropzone]') as HTMLElement
    expect(zone).not.toBeNull()
    expect(zone.querySelector(':scope > [mono-icon] [mono-glyph]')).not.toBeNull()
    expect(zone.querySelector(':scope > [mono-title]')?.textContent?.trim()).toBe(
      'Click or drag file here',
    )
    expect(zone.querySelector(':scope > [mono-subtext]')?.textContent?.trim()).toBe('PDF, DOCX, XLSX')
    expect(zone.querySelector(':scope > [mono-native][type="file"]')).not.toBeNull()

    const msg = r.querySelector('[mono-message]') as HTMLElement
    expect(msg.getAttribute('mono-message')).toBe('helper')
    expect(msg.textContent?.trim()).toBe('Single file upload')

    // the pre-Basecoat classes stay as inert hooks until 2.0
    expect(r.classList.contains('mono-file-upload')).toBe(true)
    el.remove()
  })

  it('props and states mirror onto the root', async () => {
    const el = await mount({ label: 'L', variant: 'compact', required: true, multiple: true })
    const r = root(el)
    expect(r.getAttribute('mono-variant')).toBe('compact')
    expect(r.hasAttribute('mono-required')).toBe(true)
    expect(r.hasAttribute('mono-multiple')).toBe(true)
    expect(r.querySelector('[mono-label] > [mono-required-mark]')?.textContent?.trim()).toBe('*')

    el.disabled = true
    el.dragdrop = false
    el.validationState = 'invalid'
    el.validationMessage = 'This field is required'
    await tick()
    expect(r.hasAttribute('mono-disabled')).toBe(true)
    expect(r.hasAttribute('mono-no-dragdrop')).toBe(true)
    expect(r.getAttribute('mono-validation-state')).toBe('invalid')

    const msg = r.querySelector('[mono-message]') as HTMLElement
    expect(msg.getAttribute('mono-message')).toBe('invalid')
    expect(msg.getAttribute('role')).toBe('alert')
    el.remove()
  })

  it('title / subtitle render into [mono-title] / [mono-subtitle] (+ the old [mono-subtext] hook)', async () => {
    const el = await mount({ title: 'Drop here', subtitle: 'PDF only' })
    const zone = root(el).querySelector('[mono-dropzone]') as HTMLElement
    expect(zone.querySelector(':scope > [mono-title]')?.textContent?.trim()).toBe('Drop here')
    const sub = zone.querySelector(':scope > [mono-subtitle]') as HTMLElement
    expect(sub.textContent?.trim()).toBe('PDF only')
    expect(sub.hasAttribute('mono-subtext')).toBe(true)
    expect(sub.classList.contains('mono-file-upload-subtitle')).toBe(true)
    expect(sub.classList.contains('mono-file-upload-subtext')).toBe(true)

    el.title = ''
    await tick()
    expect(zone.querySelector(':scope > [mono-title]')?.hasAttribute('mono-empty')).toBe(true)
    el.remove()
  })

  it('defaults to the Indonesian prompt texts', async () => {
    const el = await mount()
    expect(el.title).toBe('Klik atau seret file ke sini')
    expect(el.subtitle).toBe('Pilih file untuk diunggah')
    el.remove()
  })

  it('placeholder / subtext properties are aliases of title / subtitle', async () => {
    const el = await mount({ placeholder: 'Old title', subtext: 'Old sub' })
    expect(el.title).toBe('Old title')
    expect(el.subtitle).toBe('Old sub')
    expect(root(el).querySelector('[mono-title]')?.textContent?.trim()).toBe('Old title')
    expect(root(el).querySelector('[mono-subtitle]')?.textContent?.trim()).toBe('Old sub')

    el.title = 'New title'
    expect(el.placeholder).toBe('New title')
    el.remove()
  })

  it('placeholder / subtext ATTRIBUTES map to title / subtitle', async () => {
    const el = document.createElement('mono-file-upload') as any
    el.setAttribute('placeholder', 'Attr title')
    el.setAttribute('subtext', 'Attr sub')
    document.body.appendChild(el)
    await tick()
    expect(el.title).toBe('Attr title')
    expect(el.subtitle).toBe('Attr sub')
    expect(root(el).querySelector('[mono-title]')?.textContent?.trim()).toBe('Attr title')

    el.setAttribute('placeholder', 'Changed')
    await tick()
    expect(root(el).querySelector('[mono-title]')?.textContent?.trim()).toBe('Changed')
    el.remove()
  })

  it('slot="title" / slot="subtitle" beat the props', async () => {
    const el = document.createElement('mono-file-upload') as any
    el.setAttribute('title', 'prop title')
    el.setAttribute('subtitle', 'prop sub')
    el.innerHTML =
      '<span slot="title">Slot <strong>title</strong></span><span slot="subtitle">Slot sub</span>'
    document.body.appendChild(el)
    await tick()

    const t = root(el).querySelector('[mono-title]') as HTMLElement
    const s = root(el).querySelector('[mono-subtitle]') as HTMLElement
    expect(t.textContent?.trim()).toBe('Slot title')
    expect(t.querySelector('strong')).not.toBeNull()
    expect(t.hasAttribute('mono-empty')).toBe(false)
    expect(s.textContent?.trim()).toBe('Slot sub')

    // a later prop write does not displace the slotted content
    el.title = 'still ignored'
    await tick()
    expect(root(el).querySelector('[mono-title]')?.textContent?.trim()).toBe('Slot title')
    el.remove()
  })

  it('the rendered root carries title="" (no native tooltip from the host title)', async () => {
    const el = document.createElement('mono-file-upload') as any
    el.setAttribute('title', 'Drop here')
    document.body.appendChild(el)
    await tick()
    expect(root(el).getAttribute('title')).toBe('')
    expect(root(el).querySelector('[mono-title]')?.textContent?.trim()).toBe('Drop here')
    el.remove()
  })

  it('a file row carries every row part', async () => {
    const el = await mount({
      modelValue: [{ id: 'a', name: 'design-spec.pdf', size: 142336, type: 'application/pdf' }],
    })
    const r = root(el)
    const item = r.querySelector('[mono-list] > [mono-item]') as HTMLElement
    expect(item).not.toBeNull()
    expect(item.querySelector(':scope > [mono-thumb] [mono-glyph]')).not.toBeNull()
    expect(item.querySelector('[mono-file] > [mono-name]')?.textContent?.trim()).toBe(
      'design-spec.pdf',
    )
    expect(item.querySelector('[mono-file] > [mono-meta]')?.textContent?.trim()).toBe('139 KB')
    const remove = item.querySelector(':scope > [mono-remove]') as HTMLButtonElement
    expect(remove.tagName).toBe('BUTTON')
    expect(remove.querySelector('[mono-glyph]')).not.toBeNull()
    el.remove()
  })
})
