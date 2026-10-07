<template>
  <div class="example-card">
    <div class="example-toolbar">
      <strong class="example-title">Departments</strong>
      <div mono-table-search mono-input mono-variant="outlined">
        <div mono-field>
          <span mono-prefix aria-hidden="true">
            <svg viewBox="0 0 16 16" width="1.1em" height="1.1em" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="7" cy="7" r="5" />
              <path d="M11 11l3 3" stroke-linecap="round" />
            </svg>
          </span>
          <input mono-native type="search" placeholder="Search code or name…" />
        </div>
      </div>
    </div>

    <div mono-table-scroll>
      <table mono-table>
        <thead>
          <tr>
            <th>Id</th>
            <th>Code</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>19</td><td>MKT</td><td>Marketing</td></tr>
          <tr><td>16</td><td>MPE</td><td>Marketplace</td></tr>
          <tr><td>25</td><td>SLS</td><td>Sales</td></tr>
        </tbody>
      </table>
    </div>

    <div mono-table-foot>
      <span mono-color="info">Showing 1–3 of 3</span>
      <div mono-table-paging>
        <button mono-pgb aria-label="Previous page" disabled>‹</button>
        <button mono-pgb mono-on>1</button>
        <button mono-pgb aria-label="Next page" disabled>›</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.example-card {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--card);
}
.example-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.72rem 1rem;
  flex-wrap: wrap;
}
.example-title {
  font-size: 0.9rem;
  color: var(--foreground);
}
</style>
