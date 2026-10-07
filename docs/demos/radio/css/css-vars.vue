<template>
  <!-- A brand accent set on the wrapper cascades into every radio inside. -->
  <div style="display: grid; gap: 0.6rem; --mono-radio-accent: #7c3aed;">
    <label mono-radio mono-checked>
      <input mono-input type="radio" name="cssvars" checked />
      <span mono-circle aria-hidden="true"></span>
      <span mono-label>
        <span mono-label-text>Accent from the wrapper</span>
      </span>
    </label>

    <!-- Inline vars on one element override the wrapper. -->
    <label mono-radio style="--mono-radio-accent: #0d9488;">
      <input mono-input type="radio" name="cssvars" />
      <span mono-circle aria-hidden="true"></span>
      <span mono-label>
        <span mono-label-text>Inline teal (select me)</span>
      </span>
    </label>
  </div>
</template>
