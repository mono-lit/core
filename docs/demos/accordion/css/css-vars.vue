<template>
  <!-- Accent, radius and padding set on the wrapper cascade into the accordion. -->
  <div style="width: 100%; --mono-accordion-accent: #7c3aed; --mono-accordion-radius: 14px; --mono-accordion-pad-x: 1.25rem;">
    <div mono-accordion mono-open>
      <button type="button" mono-head aria-expanded="true">
        <span mono-heading>
          <span mono-title>Themed via CSS variables</span>
        </span>
        <span mono-arrow aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>
      <div mono-body role="region"><div>
        Accent, radius and padding all come from <code>--mono-accordion-*</code> set on the wrapper.
      </div></div>
    </div>
  </div>
</template>
