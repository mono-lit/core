<template>
  <div style="display: flex; flex-direction: column; gap: 0.85rem; width: 100%;">
    <div>
      <div style="font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--foreground); opacity: 0.55; margin-bottom: 0.4rem;">items array</div>
      <nav mono-breadcrumb mono-variant="underlined" mono-color="success" aria-label="Breadcrumb">
        <ol mono-list>
          <li mono-item>
            <a mono-action href="#">
              <span mono-content><span mono-title>Dashboard</span></span>
            </a>
          </li>
          <li mono-separator aria-hidden="true">›</li>
          <li mono-item>
            <a mono-action href="#">
              <span mono-content><span mono-title>Docs</span></span>
            </a>
          </li>
          <li mono-separator aria-hidden="true">›</li>
          <li mono-item mono-current aria-current="page">
            <span mono-action>
              <span mono-content><span mono-title>Quickstart</span></span>
            </span>
          </li>
        </ol>
      </nav>
    </div>

    <div>
      <div style="font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--foreground); opacity: 0.55; margin-bottom: 0.4rem;">single-row direct props</div>
      <nav mono-breadcrumb mono-variant="contained" mono-color="info" aria-label="Breadcrumb">
        <ol mono-list>
          <!-- the only entry IS the last one, so the element renders it current -->
          <li mono-item mono-current aria-current="page">
            <span mono-action>
              <span mono-content><span mono-title>Dashboard</span></span>
            </span>
          </li>
        </ol>
      </nav>
    </div>
  </div>
</template>
