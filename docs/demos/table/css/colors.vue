<template>
  <div class="example-colors">
    <div
      v-for="c in ['primary', 'success', 'danger']"
      :key="c"
      class="example-card"
      :mono-color="c === 'primary' ? null : c"
    >
      <div class="example-toolbar">
        <strong class="example-title">{{ c }}</strong>
      </div>

      <div mono-table-scroll>
        <table mono-table>
          <thead>
            <tr><th>Id</th><th>Code</th><th>Name</th></tr>
          </thead>
          <tbody>
            <tr><td>19</td><td>MKT</td><td>Marketing</td></tr>
            <tr><td>16</td><td>MPE</td><td>Marketplace</td></tr>
            <tr><td>25</td><td>SLS</td><td>Sales</td></tr>
          </tbody>
        </table>
      </div>

      <div mono-table-foot>
        <span mono-color="info">Showing 1–3 of 9</span>
        <div mono-table-paging>
          <button mono-pgb aria-label="Previous page">‹</button>
          <button mono-pgb mono-on>1</button>
          <button mono-pgb>2</button>
          <button mono-pgb aria-label="Next page">›</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.example-colors {
  display: grid;
  gap: 0.85rem;
  width: 100%;
}
.example-card {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--card);
}
.example-toolbar {
  padding: 0.6rem 1rem;
}
.example-title {
  font-size: 0.82rem;
  text-transform: capitalize;
  color: var(--foreground);
}
</style>
