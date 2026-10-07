<template>
  <!-- A brand accent set on the wrapper cascades into every switch inside. -->
  <div style="display: grid; gap: 0.85rem; --mono-switch-accent: #7c3aed; --mono-switch-gap: 0.9rem;">
    <label mono-switch mono-checked>
      <input mono-input type="checkbox" role="switch" checked />
      <span mono-track aria-hidden="true">
        <span mono-thumb></span>
      </span>
      <span mono-label>
        <span mono-label-text>Accent from the wrapper</span>
        <span mono-description>Set --mono-switch-accent once; every switch inside inherits it.</span>
      </span>
    </label>

    <!-- Inline vars on one element override the wrapper. -->
    <label mono-switch mono-checked style="--mono-switch-accent: #0d9488;">
      <input mono-input type="checkbox" role="switch" checked />
      <span mono-track aria-hidden="true">
        <span mono-thumb></span>
      </span>
      <span mono-label>
        <span mono-label-text>Inline override (teal)</span>
      </span>
    </label>
  </div>
</template>
