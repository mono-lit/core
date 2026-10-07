<template>
  <!-- Accent + radius set on the wrapper cascade into the breadcrumb inside. -->
  <div style="--mono-breadcrumb-accent: var(--purple); --mono-breadcrumb-radius: 999px;">
    <nav mono-breadcrumb mono-variant="contained" aria-label="Breadcrumb">
      <ol mono-list>
        <li mono-item>
          <a mono-action href="#">
            <span mono-content><span mono-title>Dashboard</span></span>
          </a>
        </li>
        <li mono-separator aria-hidden="true">›</li>
        <li mono-item>
          <a mono-action href="#">
            <span mono-content><span mono-title>Reports</span></span>
          </a>
        </li>
        <li mono-separator aria-hidden="true">›</li>
        <li mono-item mono-current aria-current="page">
          <span mono-action>
            <span mono-content><span mono-title>Q4</span></span>
          </span>
        </li>
      </ol>
    </nav>
  </div>
</template>
