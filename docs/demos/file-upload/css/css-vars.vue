<template>
  <!-- Icon plate and dropzone edge set on the wrapper cascade into the uploader
       inside (custom properties inherit — and pierce the shadow boundary). -->
  <div
    style="box-sizing: border-box; width: 100%; --mono-file-upload-icon-color: #7c3aed; --mono-file-upload-icon-bg: #ede9fe; --mono-file-upload-border-color: #c4b5fd;"
  >
    <div mono-file-upload>
      <label mono-label>Supporting Document</label>
      <label mono-dropzone>
        <div mono-icon aria-hidden="true"><span mono-glyph class="i-mdi-cloud-upload-outline" aria-hidden="true"></span></div>
        <div mono-title>Click or drag file here</div>
        <div mono-subtext>Themed via --mono-file-upload-*</div>
        <input mono-native type="file" />
      </label>
      <div mono-message="helper">Accent icon plate + dropzone border from CSS vars</div>
    </div>
  </div>
</template>
