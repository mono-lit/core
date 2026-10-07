<template>
  <div
    style="padding: 0.85rem 1rem; border: 1px dashed var(--border); border-radius: 8px; background: var(--muted); font-size: 0.78rem; color: var(--foreground); opacity: 0.78; line-height: 1.5;"
  >
    <strong>slot="list"</strong> needs a <strong>controlMonoForm</strong>: the rows it loops are the
    control's resolved list, reported back onto <code>form.items()[key].list</code>. There is no
    plain-HTML counterpart — see the Vue tab.
  </div>
</template>
