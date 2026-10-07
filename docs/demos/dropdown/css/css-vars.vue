<template>
  <!-- Panel accent, radius and padding set on the wrapper cascade into the dropdown.
       A static `mono-open` keeps the panel visible (no JS in this demo). -->
  <div style="padding: 1rem 1rem 8rem; display: flex; justify-content: center; --mono-dropdown-accent: #7c3aed; --mono-dropdown-radius: 16px; --mono-dropdown-pad-x: 1.25rem;">
    <div mono-dropdown mono-open>
      <span mono-activator>
        <button type="button" style="padding: 0.45rem 0.9rem; border-radius: 8px; border: 1px solid var(--border); background: var(--background); color: var(--foreground); cursor: pointer; font: inherit; font-weight: 600; font-size: 0.82rem;">
          Themed dropdown
        </button>
      </span>
      <div mono-panel role="dialog" aria-hidden="false">
        <div mono-body>Panel accent, radius and padding come from <code>--mono-dropdown-*</code>.</div>
      </div>
    </div>
  </div>
</template>
