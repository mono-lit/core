<script setup>
const seps = ['›', '/', '•']
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%;">
    <nav v-for="sep in seps" :key="sep" mono-breadcrumb aria-label="Breadcrumb">
      <ol mono-list>
        <li mono-item>
          <a mono-action href="#">
            <span mono-content><span mono-title>Dashboard</span></span>
          </a>
        </li>
        <li mono-separator aria-hidden="true">{{ sep }}</li>
        <li mono-item>
          <a mono-action href="#">
            <span mono-content><span mono-title>Catalog</span></span>
          </a>
        </li>
        <li mono-separator aria-hidden="true">{{ sep }}</li>
        <li mono-item mono-current aria-current="page">
          <span mono-action>
            <span mono-content><span mono-title>Item</span></span>
          </span>
        </li>
      </ol>
    </nav>

    <nav mono-breadcrumb aria-label="Breadcrumb">
      <ol mono-list>
        <li mono-item>
          <a mono-action href="#">
            <span mono-content><span mono-title>Dashboard</span></span>
          </a>
        </li>
        <li mono-separator aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 6 15 12 9 18"></polyline>
          </svg>
        </li>
        <li mono-item>
          <a mono-action href="#">
            <span mono-content><span mono-title>Catalog</span></span>
          </a>
        </li>
        <li mono-separator aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 6 15 12 9 18"></polyline>
          </svg>
        </li>
        <li mono-item mono-current aria-current="page">
          <span mono-action>
            <span mono-content><span mono-title>Item</span></span>
          </span>
        </li>
      </ol>
    </nav>
  </div>
</template>
