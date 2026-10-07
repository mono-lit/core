// `hasChanged: arrayHasChanged` guards — reactivity must survive them.
//
// The guard reports "unchanged" only when the array holds literally the same objects
// in the same order, so a genuine change can never be suppressed. This suite is the
// proof of that, and it is what a future contributor will break if they swap the
// element-wise compare for a deep/content one without thinking it through.

const CASES = [
  {
    name: 'mono-menu items',
    ref: 'menuItems',
    el: 'menu',
    next: [{ id: 'a', title: 'Alpha' }, { id: 'c', title: 'Charlie' }],
    expect: 'Charlie',
    gone: 'Bravo',
  },
  {
    name: 'mono-menu-list items',
    ref: 'listItems',
    el: 'menuList',
    next: [{ id: 'y', title: 'Yankee' }],
    expect: 'Yankee',
    gone: 'Xray',
  },
  {
    name: 'mono-tabs items',
    ref: 'tabItems',
    el: 'tabs',
    next: [{ value: 't1', label: 'One' }, { value: 't3', label: 'Three' }],
    expect: 'Three',
    gone: 'Two',
  },
  {
    name: 'mono-breadcrumb items',
    ref: 'crumbItems',
    el: 'crumb',
    next: [{ id: 'h', title: 'Home' }, { id: 'g', title: 'Guides' }],
    expect: 'Guides',
    gone: 'Docs',
  },
  {
    name: 'mono-breadcrumb-list items',
    ref: 'crumbListItems',
    el: 'crumbList',
    next: [{ id: 'n', title: 'Nested' }],
    expect: 'Nested',
    gone: 'Root',
  },
  {
    name: 'mono-file-upload modelValue',
    ref: 'files',
    el: 'files',
    next: [{ id: 'f2', name: 'bravo.txt', size: 20, type: 'text/plain' }],
    expect: 'bravo.txt',
    gone: 'alpha.txt',
  },
  {
    name: 'mono-tag-input modelValue',
    ref: 'tags',
    el: 'tags',
    next: ['red', 'blue'],
    expect: 'blue',
    gone: 'green',
  },
]

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=guarded`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })
  await page.waitForTimeout(400)

  for (const c of CASES) {
    const before = await page.evaluate((el) => window.__read(el), c.el)
    const after = await page.evaluate(
      ([ref, next, el]) => window.__setAndRead(ref, next, el),
      [c.ref, c.next, c.el],
    )
    reporter.check(
      `${c.name}: a real change still renders`,
      after.includes(c.expect) && !after.includes(c.gone),
      `before="${before}" after="${after}" (wanted "${c.expect}", not "${c.gone}")`,
    )
  }

  // And the guard's actual job: re-assigning the SAME array must be a no-op, not a
  // crash or a wipe. Read-back proves the render survived.
  const stable = await page.evaluate(async () => {
    const el = document.querySelector('[data-t="menu"]')
    const same = el.items
    el.items = same
    await new Promise((r) => setTimeout(r, 60))
    return (el.textContent || '').replace(/\s+/g, ' ').trim()
  })
  reporter.check(
    'mono-menu: re-assigning the identical array leaves the render intact',
    stable.includes('Alpha'),
    `textContent="${stable}"`,
  )
}
