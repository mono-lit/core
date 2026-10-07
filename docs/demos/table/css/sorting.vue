<template>
  <div class="example-card">
    <div mono-table-scroll>
      <table mono-table>
        <thead>
          <tr>
            <th>
              <button type="button" mono-sort-btn data-dir="asc">
                <span mono-sort-label>Id</span>
                <span mono-sort-ind aria-hidden="true">
                  <svg mono-sort-caret class="up" viewBox="0 0 10 6" fill="none"
                    stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 5 L5 1.5 L9 5" />
                  </svg>
                  <svg mono-sort-caret class="down" viewBox="0 0 10 6" fill="none"
                    stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 1 L5 4.5 L9 1" />
                  </svg>
                </span>
              </button>
            </th>
            <th>
              <button type="button" mono-sort-btn data-dir="none">
                <span mono-sort-label>Code</span>
                <span mono-sort-ind aria-hidden="true">
                  <svg mono-sort-caret class="up" viewBox="0 0 10 6" fill="none"
                    stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 5 L5 1.5 L9 5" />
                  </svg>
                  <svg mono-sort-caret class="down" viewBox="0 0 10 6" fill="none"
                    stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 1 L5 4.5 L9 1" />
                  </svg>
                </span>
              </button>
            </th>
            <th>
              <button type="button" mono-sort-btn data-dir="desc">
                <span mono-sort-label>Name</span>
                <span mono-sort-ind aria-hidden="true">
                  <svg mono-sort-caret class="up" viewBox="0 0 10 6" fill="none"
                    stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 5 L5 1.5 L9 5" />
                  </svg>
                  <svg mono-sort-caret class="down" viewBox="0 0 10 6" fill="none"
                    stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 1 L5 4.5 L9 1" />
                  </svg>
                </span>
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr><td>16</td><td>MPE</td><td>Marketplace</td></tr>
          <tr><td>19</td><td>MKT</td><td>Marketing</td></tr>
          <tr><td>21</td><td>MRS</td><td>Market Research</td></tr>
          <tr><td>25</td><td>SLS</td><td>Sales</td></tr>
        </tbody>
      </table>
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
