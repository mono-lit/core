<template>
  <div class="example-card">
    <div mono-table-scroll>
      <table mono-table>
        <thead>
          <tr><th>Id</th><th>Code</th><th>Name</th></tr>
        </thead>
        <tbody>
          <!-- group header -->
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
                <span mono-group-count>(7)</span>
              </button>
            </td>
          </tr>
          <tr><td>1</td><td>MKT-01</td><td>Marketing member 1</td></tr>
          <tr><td>2</td><td>MKT-02</td><td>Marketing member 2</td></tr>
          <tr><td>3</td><td>MKT-03</td><td>Marketing member 3</td></tr>
          <!-- per-group footer pager (rows within this department) -->
          <tr mono-group-foot-row>
            <td colspan="3" mono-group-foot style="--mono-table-group-level: 0">
              <div mono-table-paging>
                <button mono-pgb aria-label="Previous page" disabled>‹</button>
                <button mono-pgb mono-on>1</button>
                <button mono-pgb>2</button>
                <button mono-pgb>3</button>
                <button mono-pgb aria-label="Next page">›</button>
              </div>
            </td>
          </tr>

          <!-- second group -->
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
                <span mono-group-count>(4)</span>
              </button>
            </td>
          </tr>
          <tr><td>8</td><td>SLS-01</td><td>Sales member 1</td></tr>
          <tr><td>9</td><td>SLS-02</td><td>Sales member 2</td></tr>
          <tr><td>10</td><td>SLS-03</td><td>Sales member 3</td></tr>
          <tr mono-group-foot-row>
            <td colspan="3" mono-group-foot style="--mono-table-group-level: 0">
              <div mono-table-paging>
                <button mono-pgb aria-label="Previous page" disabled>‹</button>
                <button mono-pgb mono-on>1</button>
                <button mono-pgb>2</button>
                <button mono-pgb aria-label="Next page">›</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div mono-table-foot>
      <span mono-color="info">Showing 1–3 of 5 groups</span>
      <div mono-table-paging>
        <button mono-pgb aria-label="Previous page" disabled>‹</button>
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
