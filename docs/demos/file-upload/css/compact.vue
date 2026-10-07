<template>
    <div style="width: 100%">
        <div mono-file-upload mono-variant="compact">
            <label mono-label>Compact Upload</label>
            <label mono-dropzone>
                <div mono-icon aria-hidden="true"><span mono-glyph class="i-mdi-cloud-upload-outline" aria-hidden="true"></span></div>
                <div mono-title>Upload one file</div>
                <div mono-subtext>Compact dropzone style</div>
                <input mono-native type="file" />
            </label>
            <div mono-message="helper">Compact mode</div>
        </div>
    </div>
</template>
