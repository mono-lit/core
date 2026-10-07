<template>
  <nav style="width: fit-content;" mono-breadcrumb mono-variant="contained" class="example-breadcrumb-root" aria-label="Breadcrumb">
    <ol mono-list>
      <li mono-item>
        <a mono-action class="example-breadcrumb-action" href="#">
          <span mono-content><span mono-title>Dashboard</span></span>
        </a>
      </li>
      <li mono-separator class="example-breadcrumb-sep" aria-hidden="true">›</li>
      <li mono-item>
        <a mono-action class="example-breadcrumb-action" href="#">
          <span mono-content><span mono-title>Premium</span></span>
        </a>
      </li>
      <li mono-separator class="example-breadcrumb-sep" aria-hidden="true">›</li>
      <li mono-item mono-current class="example-breadcrumb-current" aria-current="page">
        <span mono-action class="example-breadcrumb-action">
          <span mono-content><span mono-title>Gold tier</span></span>
        </span>
      </li>
    </ol>
  </nav>
</template>

<style>
.example-breadcrumb-root {
  font-family: 'DM Serif Display', 'Georgia', serif;
  font-size: 0.88rem;
}
.example-breadcrumb-sep {
  color: var(--warning) !important;
  font-weight: 700;
}
.example-breadcrumb-action {
  border-radius: var(--mono-radius-full, 999px) !important;
  letter-spacing: 0.01em;
}
/* The part ATTRIBUTE, not the legacy class — and a flat role fill, since the
   port has no gradients left to match. */
.example-breadcrumb-current > [mono-action] {
  background: var(--warning) !important;
  color: var(--warning-foreground) !important;
  border-color: transparent !important;
}
</style>
