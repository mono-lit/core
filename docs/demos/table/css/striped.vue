<template>
  <!-- Striping is pure CSS: `.mono-table` alternates rows on its own, with no
       component and no classes on the rows. The separator row opts out with
       `data-mono-stripe-skip`, so it neither takes a stripe nor shifts the
       alternation of the rows below it. -->
  <div style="width: 100%; box-sizing: border-box">
    <div class="example-card">
      <div mono-table-scroll class="example-scroll">
        <table mono-table>
          <thead>
            <tr>
              <th>Id</th>
              <th>Code</th>
              <th>Department</th>
              <th>Head</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>19</td><td>MKT</td><td>Marketing</td><td>Rina</td></tr>
            <tr><td>16</td><td>MPE</td><td>Marketplace</td><td>Dimas</td></tr>
            <tr><td>21</td><td>MRS</td><td>Market Research</td><td>Ayu</td></tr>
            <tr><td>25</td><td>SLS</td><td>Sales</td><td>Bagus</td></tr>

            <tr data-mono-stripe-skip class="example-sep">
              <td colspan="4">Support functions</td>
            </tr>

            <tr><td>22</td><td>TMM</td><td>Trade Marketing</td><td>Sari</td></tr>
            <tr><td>31</td><td>FIN</td><td>Finance</td><td>Nadia</td></tr>
            <tr><td>34</td><td>HRD</td><td>People</td><td>Yoga</td></tr>
            <tr><td>38</td><td>ENG</td><td>Engineering</td><td>Prita</td></tr>
          </tbody>
        </table>
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
}
/* Deliberately NO background here: the table paints its own rows, so striping
   has to read correctly without a card behind it. */
.example-scroll {
  width: 100%;
}
.example-sep :deep(td),
.example-sep td {
  background: var(--muted);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}
</style>
