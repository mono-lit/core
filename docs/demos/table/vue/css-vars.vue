<script setup>
import '@mono-lit/helper/ui/table'
</script>

<template>
  <!-- Accent set on the wrapper cascades into the table inside — header, zebra
       and borders all derive from --mono-table-accent (custom properties inherit
       + pierce the shadow boundary). -->
  <div style="--mono-table-accent: #7c3aed">
    <table mono-table>
      <thead>
        <tr><th>Id</th><th>Code</th><th>Department</th></tr>
      </thead>
      <tbody>
        <tr><td>1</td><td>ENG</td><td>Engineering</td></tr>
        <tr><td>2</td><td>SAL</td><td>Sales</td></tr>
        <tr><td>3</td><td>HR</td><td>People</td></tr>
      </tbody>
    </table>
  </div>
</template>
