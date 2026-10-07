<template>
  <div class="example-css-table-card">
    <div mono-table-scroll>
      <table mono-table mono-fixed class="example-fixed-table">
        <thead>
          <tr>
            <th mono-sticky-left class="example-col-name">Name</th>
            <th mono-sticky-left class="example-col-id">ID</th>
            <th class="example-col-email">Email</th>
            <th class="example-col-dept">Department</th>
            <th class="example-col-role">Role</th>
            <th class="example-col-location">Location</th>
            <th mono-sticky-right class="example-col-status">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td mono-sticky-left class="example-cell-name">Andi Pratama</td>
            <td mono-sticky-left class="example-col-id">EMP-001</td>
            <td>andi@ekajaya.co.id</td><td>Sales</td><td>Manager</td><td>Jakarta</td>
            <td mono-sticky-right>Active</td>
          </tr>
          <tr>
            <td mono-sticky-left class="example-cell-name">Budi Santoso</td>
            <td mono-sticky-left class="example-col-id">EMP-002</td>
            <td>budi@ekajaya.co.id</td><td>Engineering</td><td>Staff</td><td>Surabaya</td>
            <td mono-sticky-right>On leave</td>
          </tr>
          <tr>
            <td mono-sticky-left class="example-cell-name">Citra Dewi</td>
            <td mono-sticky-left class="example-col-id">EMP-003</td>
            <td>citra@ekajaya.co.id</td><td>Finance</td><td>Supervisor</td><td>Bandung</td>
            <td mono-sticky-right>Inactive</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="example-css-hint">Scroll horizontally — Name/ID pin left, Status pins right.</div>
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
.example-fixed-table { width: 62rem; }
.example-col-name { width: 12rem; }
/* second pinned-left column: offset by the first column's width */
.example-col-id { width: 7rem; --mono-table-sticky-left: 12rem; }
.example-col-email { width: 15rem; }
.example-col-dept { width: 10rem; }
.example-col-role { width: 9rem; }
.example-col-location { width: 10rem; }
.example-col-status { width: 9rem; text-align: center; }
.example-cell-name { font-weight: 600; color: var(--foreground); }
.example-css-hint {
  padding: 0.5rem 1rem;
  font-size: 0.74rem;
  color: color-mix(in oklab, var(--foreground) 55%, transparent);
  border-top: 1px solid var(--border);
}
</style>
