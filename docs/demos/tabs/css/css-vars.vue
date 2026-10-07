<template>
  <!-- Accent + spacing set on the strip cascade into every tab. -->
  <div
    mono-tabs
    role="tablist"
    style="width: fit-content; --mono-tabs-accent: #7c3aed; --mono-tabs-pad-x: 1.25rem; --mono-tabs-gap: 0.6rem;"
  >
    <button type="button" mono-tab role="tab" aria-selected="true">
      <span mono-label>Overview</span>
    </button>
    <button type="button" mono-tab role="tab" aria-selected="false">
      <span mono-label>Details</span>
    </button>
    <button type="button" mono-tab role="tab" aria-selected="false">
      <span mono-label>History</span>
    </button>
  </div>
</template>
