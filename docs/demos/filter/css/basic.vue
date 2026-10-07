<template>
  <!-- The builder is one element, so it has no hand-written form of its own —
       this is the DOM `<mono-filter-builder>` renders for the tree `basic.vue`
       starts from, written by hand: a root with its two action buttons, the
       root group (`Match all of …`), one rule and one nested group with two
       rules (`Match any of …`), and the two add links. Every label is the
       builder's default. A row is field | operator | value | nested | trash. -->
  <div class="example-card">
    <div mono-filter-builder>
      <div mono-filter-actions>
        <button type="button" mono-filter-btn>Apply</button>
        <button type="button" mono-filter-btn mono-variant="ghost">Clear</button>
      </div>

      <div mono-filter-group>
        <div mono-filter-group-head>
          <span mono-filter-match>Match</span>
          <select mono-filter-control mono-filter-group-op aria-label="Group operator">
            <option value="and" selected>all</option>
                <option value="or">any</option>
          </select>
          <span mono-filter-match>of the following rules:</span>
        </div>

        <div mono-filter-children>
            <div mono-filter-row>
              <select mono-filter-control mono-filter-field aria-label="Field">
                <option value="Nama" selected>Display Name</option>
                <option value="Pesan">Message</option>
                <option value="Jumlah">Payment</option>
                <option value="Aktif">Active</option>
                <option value="Tanggal">Date</option>
              </select>
              <select mono-filter-control mono-filter-op aria-label="Operator">
                <option value="contains" selected>contains</option>
                <option value="eq">is equal to</option>
              </select>
              <span mono-filter-value-cell>
                <input mono-filter-control mono-filter-value type="text" value="Andy" />
              </span>
              <button type="button" mono-filter-icon-btn title="Add nested rule" aria-label="Add nested rule">
                <span class="mono-icon i-mdi-file-tree-outline" aria-hidden="true"></span>
              </button>
              <button type="button" mono-filter-icon-btn mono-danger title="Remove" aria-label="Remove">
                <span class="mono-icon i-mdi-trash-can-outline" aria-hidden="true"></span>
              </button>
            </div>

          <div mono-filter-group>
            <div mono-filter-group-head>
              <span mono-filter-match>Match</span>
              <select mono-filter-control mono-filter-group-op aria-label="Group operator">
                <option value="and">all</option>
                <option value="or" selected>any</option>
              </select>
              <span mono-filter-match>of the following rules:</span>
              <span mono-filter-group-actions>
                <button type="button" mono-filter-icon-btn title="Add rule" aria-label="Add rule">
                  <span class="mono-icon i-mdi-plus" aria-hidden="true"></span>
                </button>
                <button type="button" mono-filter-icon-btn mono-danger title="Remove" aria-label="Remove">
                  <span class="mono-icon i-mdi-trash-can-outline" aria-hidden="true"></span>
                </button>
              </span>
            </div>
            <div mono-filter-children>
            <div mono-filter-row>
              <select mono-filter-control mono-filter-field aria-label="Field">
                <option value="Nama">Display Name</option>
                <option value="Pesan" selected>Message</option>
                <option value="Jumlah">Payment</option>
                <option value="Aktif">Active</option>
                <option value="Tanggal">Date</option>
              </select>
              <select mono-filter-control mono-filter-op aria-label="Operator">
                <option value="contains">contains</option>
                <option value="eq" selected>is equal to</option>
              </select>
              <span mono-filter-value-cell>
                <input mono-filter-control mono-filter-value type="text" value="hi" />
              </span>
              <button type="button" mono-filter-icon-btn title="Add nested rule" aria-label="Add nested rule">
                <span class="mono-icon i-mdi-file-tree-outline" aria-hidden="true"></span>
              </button>
              <button type="button" mono-filter-icon-btn mono-danger title="Remove" aria-label="Remove">
                <span class="mono-icon i-mdi-trash-can-outline" aria-hidden="true"></span>
              </button>
            </div>
            <div mono-filter-row>
              <select mono-filter-control mono-filter-field aria-label="Field">
                <option value="Nama">Display Name</option>
                <option value="Pesan">Message</option>
                <option value="Jumlah" selected>Payment</option>
                <option value="Aktif">Active</option>
                <option value="Tanggal">Date</option>
              </select>
              <select mono-filter-control mono-filter-op aria-label="Operator">
                <option value="eq">is equal to</option>
                <option value="gt" selected>is greater than</option>
              </select>
              <span mono-filter-value-cell>
                <input mono-filter-control mono-filter-value type="number" value="100" />
              </span>
              <button type="button" mono-filter-icon-btn title="Add nested rule" aria-label="Add nested rule">
                <span class="mono-icon i-mdi-file-tree-outline" aria-hidden="true"></span>
              </button>
              <button type="button" mono-filter-icon-btn mono-danger title="Remove" aria-label="Remove">
                <span class="mono-icon i-mdi-trash-can-outline" aria-hidden="true"></span>
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>

      <div mono-filter-add>
        <button type="button" mono-filter-link>Add rule</button>
        <button type="button" mono-filter-link>Add group</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.example-card {
  width: 100%;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: var(--mono-radius-lg);
  background: var(--card);
}
</style>
