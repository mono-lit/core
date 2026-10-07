<template>
  <div class="example-css-table-card">
    <div mono-table-scroll>
      <table mono-table>
        <thead>
          <tr>
            <th>No. Dokumen</th>
            <th>Program</th>
            <th>COA</th>
            <th class="example-budget-num">Total Budget</th>
          </tr>
        </thead>
        <tbody>
          <!-- group header with subtotal cell -->
          <tr mono-group-row>
            <td colspan="3" mono-group-cell>
              <button type="button" mono-group-toggle>
                <span mono-group-caret aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </span>
                <span mono-group-key>Marketing</span>
                <span mono-group-count>(12 programs)</span>
              </button>
            </td>
            <td class="example-budget-num example-budget-subtotal">Rp 1.480.000.000</td>
          </tr>
          <tr>
            <td class="example-budget-doc">DOC-0001</td>
            <td>Brand Activation Q3</td>
            <td>
              <span class="example-budget-coa-code">5101</span>
              <span class="example-budget-coa">Biaya Promosi</span>
            </td>
            <td class="example-budget-num">Rp 420.000.000</td>
          </tr>
          <tr>
            <td class="example-budget-doc">DOC-0002</td>
            <td>Digital Campaign</td>
            <td>
              <span class="example-budget-coa-code">5102</span>
              <span class="example-budget-coa">Biaya Iklan Digital</span>
            </td>
            <td class="example-budget-num">Rp 310.000.000</td>
          </tr>
          <!-- per-group footer pager -->
          <tr mono-group-foot-row>
            <td colspan="4" mono-group-foot>
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
            <td colspan="3" mono-group-cell>
              <button type="button" mono-group-toggle data-collapsed>
                <span mono-group-caret aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </span>
                <span mono-group-key>Sales</span>
                <span mono-group-count>(8 programs)</span>
              </button>
            </td>
            <td class="example-budget-num example-budget-subtotal">Rp 960.000.000</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div mono-table-foot>
      <span mono-color="info">Showing 1–3 of 6 departments</span>
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
.example-css-table-card {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--card);
}
.example-budget-num {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.example-budget-subtotal {
  font-weight: 600;
  color: var(--foreground);
}
.example-budget-doc {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.example-budget-coa-code {
  display: inline-block;
  padding: 0.1rem 0.4rem;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  background: color-mix(in oklab, var(--info) 14%, var(--card));
  color: var(--info);
}
.example-budget-coa {
  margin-left: 0.45rem;
  color: var(--muted-foreground);
  font-size: 0.78rem;
}
</style>
