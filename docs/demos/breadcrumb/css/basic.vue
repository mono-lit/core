<template>
  <nav style="width: fit-content;" mono-breadcrumb aria-label="Breadcrumb">
    <ol mono-list>
      <li mono-item>
        <a mono-action href="#">
          <span mono-content>
            <span mono-title>Dashboard</span>
          </span>
        </a>
      </li>
      <li mono-separator aria-hidden="true">›</li>
      <li mono-item>
        <a mono-action href="#">
          <span mono-content>
            <span mono-title>Klaim</span>
          </span>
        </a>
      </li>
      <li mono-separator aria-hidden="true">›</li>
      <li mono-item mono-current aria-current="page">
        <span mono-action>
          <span mono-content>
            <span mono-title>Detail Klaim</span>
          </span>
        </span>
      </li>
    </ol>
  </nav>
</template>
