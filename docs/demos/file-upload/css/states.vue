<template>
    <div style="width: 100%">
        <div mono-file-upload mono-disabled>
            <label mono-label>Disabled</label>
            <label mono-dropzone>
                <div mono-icon aria-hidden="true"><span mono-glyph class="i-mdi-cloud-upload-outline" aria-hidden="true"></span></div>
                <div mono-title>Disabled upload</div>
                <div mono-subtext>This uploader is disabled</div>
                <input mono-native type="file" disabled />
            </label>
        </div>
        <br>
        <div mono-file-upload mono-required>
            <label mono-label>
                Required
                <span mono-required-mark>*</span>
            </label>
            <label mono-dropzone>
                <div mono-icon aria-hidden="true"><span mono-glyph class="i-mdi-cloud-upload-outline" aria-hidden="true"></span></div>
                <div mono-title>Required upload</div>
                <div mono-subtext>Required field example</div>
                <input mono-native type="file" required />
            </label>
            <div mono-message="helper">Required indicator shown in label</div>
        </div>
    </div>
</template>
