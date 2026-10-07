<template>
  <div style="display: flex; flex-direction: column; gap: 0.95rem; width: 100%;">
    <div v-for="s in ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']" :key="s" style="display: flex; align-items: center; gap: 1rem;">
      <span style="min-width: 2.2rem; font-size: 0.7rem; color: var(--foreground); opacity: 0.55; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;">{{ s }}</span>
      <nav mono-breadcrumb :mono-size="s === 'md' ? null : s" aria-label="Breadcrumb">
        <ol mono-list>
          <li mono-item>
            <a mono-action href="#">
              <span mono-content><span mono-title>Dashboard</span></span>
            </a>
          </li>
          <li mono-separator aria-hidden="true">›</li>
          <li mono-item>
            <a mono-action href="#">
              <span mono-content><span mono-title>Settings</span></span>
            </a>
          </li>
          <li mono-separator aria-hidden="true">›</li>
          <li mono-item mono-current aria-current="page">
            <span mono-action>
              <span mono-content><span mono-title>Profile</span></span>
            </span>
          </li>
        </ol>
      </nav>
    </div>
  </div>
</template>
