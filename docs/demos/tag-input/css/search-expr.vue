<template>
  <div
    style="box-sizing: border-box; width: 100%; padding: 0.85rem 1rem; border: 1px dashed var(--border); border-radius: 8px; background: var(--muted); font-size: 0.78rem; color: var(--foreground); opacity: 0.78; line-height: 1.5;"
  >
    Search expressions live on the <code>&lt;mono-tag-input&gt;</code> custom
    element. The comma-string form works from plain HTML
    (<code>search-value="Company.Name,Transaction.[*].Price"</code>), but the array
    form and <code>{ field, custom }</code> builders need a property binding — see
    the Vue tab.
  </div>
</template>
