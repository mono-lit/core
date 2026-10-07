<template>
  <!-- Accent + radius set on the wrapper cascade into every checkbox inside. -->
  <div style="display: grid; gap: 0.75rem; --mono-checkbox-accent: #7c3aed; --mono-checkbox-radius: 0.6rem;">
    <label mono-checkbox mono-checked>
      <input mono-input type="checkbox" checked />
      <span mono-box aria-hidden="true"></span>
      <span mono-label>
        <span mono-label-text>Accent + radius from the wrapper</span>
        <span mono-description>Set --mono-checkbox-* once; every checkbox inside inherits it.</span>
      </span>
    </label>

    <!-- Inline vars on one element override the wrapper. -->
    <label mono-checkbox mono-checked style="--mono-checkbox-accent: #0d9488;">
      <input mono-input type="checkbox" checked />
      <span mono-box aria-hidden="true"></span>
      <span mono-label>
        <span mono-label-text>Inline override (teal)</span>
      </span>
    </label>
  </div>
</template>
