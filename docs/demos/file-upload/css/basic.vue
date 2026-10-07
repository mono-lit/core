<template>
    <div style="width: 100%">
        <div mono-file-upload>
            <label mono-label>Supporting Document</label>
            <label mono-dropzone>
                <div mono-icon aria-hidden="true"><span mono-glyph class="i-mdi-cloud-upload-outline" aria-hidden="true"></span></div>
                <div mono-title>Click or drag file here</div>
                <div mono-subtext>PDF, DOCX, XLSX</div>
                <input mono-native type="file" />
            </label>
            <div mono-message="helper">Single file upload</div>
        </div>
    </div>
</template>
