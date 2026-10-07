<template>
  <div style="display: flex; flex-direction: column; gap: 1.05rem; width: 100%;">
    <div>
      <div style="font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--foreground); opacity: 0.55; margin-bottom: 0.4rem;">Iconify (item.icon)</div>
      <nav mono-breadcrumb aria-label="Breadcrumb">
        <ol mono-list>
          <li mono-item>
            <a mono-action href="#">
              <span mono-icon aria-hidden="true">
                <span mono-glyph class="i-mdi-view-dashboard"></span>
              </span>
              <span mono-content><span mono-title>Dashboard</span></span>
            </a>
          </li>
          <li mono-separator aria-hidden="true">›</li>
          <li mono-item>
            <a mono-action href="#">
              <span mono-icon aria-hidden="true">
                <span mono-glyph class="i-mdi-account-group"></span>
              </span>
              <span mono-content><span mono-title>Team</span></span>
            </a>
          </li>
          <li mono-separator aria-hidden="true">›</li>
          <li mono-item mono-current aria-current="page">
            <span mono-action>
              <span mono-icon aria-hidden="true">
                <span mono-glyph class="i-mdi-account-circle"></span>
              </span>
              <span mono-content><span mono-title>Ahmad Fauzi</span></span>
            </span>
          </li>
        </ol>
      </nav>
    </div>

    <div>
      <div style="font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--foreground); opacity: 0.55; margin-bottom: 0.4rem;">Slotted SVGs (slot=&quot;icon-{id}&quot;)</div>
      <nav mono-breadcrumb aria-label="Breadcrumb">
        <ol mono-list>
          <li mono-item>
            <a mono-action href="#">
              <span mono-icon aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 12l9-9 9 9" />
                  <path d="M5 10v10h14V10" />
                </svg>
              </span>
              <span mono-content><span mono-title>Home</span></span>
            </a>
          </li>
          <li mono-separator aria-hidden="true">›</li>
          <li mono-item>
            <a mono-action href="#">
              <span mono-icon aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </span>
              <span mono-content><span mono-title>Klaim</span></span>
            </a>
          </li>
          <li mono-separator aria-hidden="true">›</li>
          <li mono-item mono-current aria-current="page">
            <span mono-action>
              <span mono-content><span mono-title>#KLM-0053</span></span>
            </span>
          </li>
        </ol>
      </nav>
    </div>
  </div>
</template>
