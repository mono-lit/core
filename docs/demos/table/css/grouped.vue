<template>
  <div class="example-card">
    <div mono-table-scroll>
      <table mono-table>
        <thead>
          <tr><th>Id</th><th>Code</th><th>Name</th></tr>
        </thead>
        <tbody>
          <tr mono-group-row>
            <td colspan="3" mono-group-cell style="--mono-table-group-level: 0">
              <button type="button" mono-group-toggle>
                <span mono-group-caret aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </span>
                <span mono-group-key>Marketing</span>
                <span mono-group-count>(2)</span>
              </button>
            </td>
          </tr>
          <tr><td>19</td><td>MKT</td><td>Marketing</td></tr>
          <tr><td>38</td><td>MKT</td><td>Marketing</td></tr>

          <tr mono-group-row>
            <td colspan="3" mono-group-cell style="--mono-table-group-level: 0">
              <button type="button" mono-group-toggle>
                <span mono-group-caret aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </span>
                <span mono-group-key>Sales</span>
                <span mono-group-count>(1)</span>
              </button>
            </td>
          </tr>
          <tr><td>25</td><td>SLS</td><td>Sales</td></tr>

          <tr mono-group-row>
            <td colspan="3" mono-group-cell style="--mono-table-group-level: 0">
              <button type="button" mono-group-toggle data-collapsed>
                <span mono-group-caret aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </span>
                <span mono-group-key>Trade Marketing</span>
                <span mono-group-count>(1)</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div mono-table-foot>
      <span mono-color="info">Showing 1–3 of 9 groups</span>
      <div mono-table-paging>
        <button mono-pgb aria-label="Previous page">‹</button>
        <button mono-pgb mono-on>1</button>
        <button mono-pgb>2</button>
        <button mono-pgb aria-label="Next page">›</button>
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
</style>
