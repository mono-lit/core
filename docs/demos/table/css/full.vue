<template>
  <div class="example-css-table-card">
    <div class="example-css-table-toolbar">
      <strong class="example-css-table-title">Daftar Salesman</strong>
      <div mono-table-search mono-input mono-variant="outlined">
        <div mono-field>
          <span mono-prefix aria-hidden="true">
            <svg viewBox="0 0 16 16" width="1.1em" height="1.1em" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="7" cy="7" r="5" />
              <path d="M11 11l3 3" stroke-linecap="round" />
            </svg>
          </span>
          <input mono-native type="search" placeholder="Cari nama, area, ID…" />
        </div>
      </div>
    </div>

    <div mono-table-scroll>
      <table mono-table mono-wide class="example-full-table">
        <thead>
          <tr>
            <th mono-sticky-left class="example-col-check"><input type="checkbox" /></th>
            <th class="example-col-id">ID</th>
            <th class="example-col-salesman">Salesman</th>
            <th class="example-col-area">Area</th>
            <th class="example-col-division">Divisi</th>
            <th class="example-col-status">Status</th>
            <th class="example-col-action">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr mono-selected>
            <td mono-sticky-left class="example-cell-center"><input type="checkbox" checked /></td>
            <td class="example-cell-id">SM-001</td>
            <td>
              <div class="example-salesman-cell">
                <span class="example-avatar example-avatar-a">AP</span>
                <span class="example-salesman-text">
                  <span class="example-salesman-name">Andi Pratama</span>
                  <span class="example-salesman-email">andi@ekajaya.co.id</span>
                </span>
              </div>
            </td>
            <td>Jakarta Utara</td>
            <td><span class="example-chip example-chip-primary">Modern Trade</span></td>
            <td><span class="example-chip example-chip-success">Aktif</span></td>
            <td class="example-cell-center">
              <button class="example-icon-btn example-icon-success" title="Approve">✓</button>
              <button class="example-icon-btn example-icon-danger" title="Hapus">🗑</button>
            </td>
          </tr>
          <tr>
            <td mono-sticky-left class="example-cell-center"><input type="checkbox" /></td>
            <td class="example-cell-id">SM-002</td>
            <td>
              <div class="example-salesman-cell">
                <span class="example-avatar example-avatar-b">BS</span>
                <span class="example-salesman-text">
                  <span class="example-salesman-name">Budi Santoso</span>
                  <span class="example-salesman-email">budi@ekajaya.co.id</span>
                </span>
              </div>
            </td>
            <td>Jakarta Barat</td>
            <td><span class="example-chip example-chip-info">E-Commerce</span></td>
            <td><span class="example-chip example-chip-warning">Cuti</span></td>
            <td class="example-cell-center">
              <button class="example-icon-btn example-icon-danger" title="Hapus">🗑</button>
            </td>
          </tr>
          <tr>
            <td mono-sticky-left class="example-cell-center"><input type="checkbox" /></td>
            <td class="example-cell-id">SM-004</td>
            <td>
              <div class="example-salesman-cell">
                <span class="example-avatar example-avatar-c">DR</span>
                <span class="example-salesman-text">
                  <span class="example-salesman-name">Dian Rahayu</span>
                  <span class="example-salesman-email">dian@ekajaya.co.id</span>
                </span>
              </div>
            </td>
            <td>Medan</td>
            <td><span class="example-chip example-chip-secondary">General Trade</span></td>
            <td><span class="example-chip example-chip-danger">Non-Aktif</span></td>
            <td class="example-cell-center">
              <button class="example-icon-btn example-icon-danger" title="Hapus">🗑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- empty-state markup (hidden while there are rows) -->
    <div mono-table-empty hidden>
      <div mono-empty-title>Data tidak ditemukan</div>
      <div mono-empty-sub>Coba ubah filter atau kata kunci.</div>
    </div>

    <div mono-table-foot>
      <div class="example-footer-left">
        <label mono-table-page-size>
          <span>Tampilkan</span>
          <select mono-sel>
            <option>8</option><option>16</option><option>All</option>
          </select>
        </label>
        <span mono-color="info">1–3 dari 16</span>
      </div>
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
.example-css-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.72rem 1rem;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--border);
}
.example-css-table-title { font-size: 0.9rem; color: var(--foreground); }
.example-full-table { width: max-content; min-width: 720px; }
.example-col-check { width: 40px; text-align: center; }
.example-col-id { width: 5.5rem; }
.example-col-salesman { min-width: 16rem; }
.example-col-area { width: 9rem; }
.example-col-division { width: 9rem; }
.example-col-status { width: 7rem; }
.example-col-action { width: 8rem; text-align: center; }
.example-cell-center { text-align: center; }
.example-cell-id {
  font-weight: 600;
  color: var(--secondary-foreground);
  font-variant-numeric: tabular-nums;
}
.example-salesman-cell { display: flex; align-items: center; gap: 0.55rem; }
.example-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  color: #fff; font-size: 0.66rem; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.example-avatar-a { background: #2563a8; }
.example-avatar-b { background: #3aaa8c; }
.example-avatar-c { background: #ea580c; }
.example-salesman-text { min-width: 0; }
.example-salesman-name { display: block; font-weight: 600; color: var(--foreground); }
.example-salesman-email { display: block; font-size: 0.7rem; color: color-mix(in oklab, var(--muted-foreground) 80%, transparent); }
.example-chip {
  display: inline-block;
  padding: 0.12rem 0.55rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  line-height: 1.5;
}
.example-chip-primary { background: color-mix(in oklab, var(--primary) 14%, var(--card)); color: var(--primary); }
.example-chip-info { background: color-mix(in oklab, var(--info) 14%, var(--card)); color: var(--info); }
.example-chip-secondary { background: color-mix(in oklab, var(--muted-foreground) 16%, var(--card)); color: var(--muted-foreground); }
.example-chip-success { background: color-mix(in oklab, var(--success) 14%, var(--card)); color: var(--success); }
.example-chip-warning { background: color-mix(in oklab, var(--warning) 16%, var(--card)); color: var(--warning); }
.example-chip-danger { background: color-mix(in oklab, var(--destructive) 12%, var(--card)); color: var(--destructive); }
.example-icon-btn {
  border: 0;
  border-radius: 7px;
  width: 26px;
  height: 26px;
  cursor: pointer;
  font-size: 0.78rem;
  margin: 0 1px;
}
.example-icon-success { background: color-mix(in oklab, var(--success) 16%, var(--card)); color: var(--success); }
.example-icon-danger { background: color-mix(in oklab, var(--destructive) 12%, var(--card)); color: var(--destructive); }
.example-footer-left { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
</style>
