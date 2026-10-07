<script setup>
import '@mono-lit/helper/ui/file-upload'
</script>

<template>
  <!-- Icon plate and dropzone edge set on the wrapper cascade into the uploader
       inside (custom properties inherit — and pierce the shadow boundary). -->
  <div
    style="box-sizing: border-box; width: 100%; --mono-file-upload-icon-color: #7c3aed; --mono-file-upload-icon-bg: #ede9fe; --mono-file-upload-border-color: #c4b5fd;"
  >
    <mono-file-upload
      label="Supporting Document"
      title="Click or drag file here"
      subtitle="Themed via --mono-file-upload-*"
      helper-text="Accent icon plate + dropzone border from CSS vars"
    ></mono-file-upload>
  </div>
</template>
