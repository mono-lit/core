<template>
  <div style="max-width: 32rem; width: 100%;">
    <nav mono-breadcrumb mono-truncate aria-label="Breadcrumb">
      <ol mono-list>
        <li mono-item>
          <a mono-action href="#">
            <span mono-content><span mono-title>Dashboard</span></span>
          </a>
        </li>
        <li mono-separator aria-hidden="true">›</li>
        <li mono-item>
          <a mono-action href="#">
            <span mono-content><span mono-title>Engineering Department</span></span>
          </a>
        </li>
        <li mono-separator aria-hidden="true">›</li>
        <li mono-item>
          <a mono-action href="#">
            <span mono-content><span mono-title>Frontend Platform Group</span></span>
          </a>
        </li>
        <li mono-separator aria-hidden="true">›</li>
        <li mono-item>
          <a mono-action href="#">
            <span mono-content><span mono-title>Component Library Initiative</span></span>
          </a>
        </li>
        <li mono-separator aria-hidden="true">›</li>
        <li mono-item mono-current aria-current="page">
          <span mono-action>
            <span mono-content><span mono-title>Breadcrumb Component Specification</span></span>
          </span>
        </li>
      </ol>
    </nav>
  </div>
</template>
