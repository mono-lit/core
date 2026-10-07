<template>
  <!-- Re-tint on the wrapper: --mono-chip-primary cascades into every chip inside,
       and the soft/solid/outline tints all derive from it (custom properties
       inherit — and pierce the shadow boundary). -->
  <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; --mono-chip-primary: #7c3aed;">
    <div mono-chip>
        <span mono-main>
            <span mono-content>
                <span mono-label>Soft</span>
            </span>
        </span>
    </div>
    <div mono-chip mono-variant="solid">
        <span mono-main>
            <span mono-content>
                <span mono-label>Solid</span>
            </span>
        </span>
    </div>
    <div mono-chip mono-variant="outline">
        <span mono-main>
            <span mono-content>
                <span mono-label>Outline</span>
            </span>
        </span>
    </div>
  </div>
</template>
