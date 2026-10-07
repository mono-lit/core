<template>
    <div style="width: 100%">
        <div mono-file-upload mono-validation-state="valid">
            <label mono-label>Valid</label>
            <label mono-dropzone>
                <div mono-icon aria-hidden="true"><span mono-glyph class="i-mdi-cloud-upload-outline" aria-hidden="true"></span></div>
                <div mono-title>Upload valid file</div>
                <div mono-subtext>Looks good</div>
                <input mono-native type="file" />
            </label>
            <div mono-message="valid">File requirements are valid</div>
        </div>
        <br>
        <div mono-file-upload mono-validation-state="invalid">
            <label mono-label>Invalid</label>
            <label mono-dropzone>
                <div mono-icon aria-hidden="true"><span mono-glyph class="i-mdi-cloud-upload-outline" aria-hidden="true"></span></div>
                <div mono-title>Upload required file</div>
                <div mono-subtext>Validation error state</div>
                <input mono-native type="file" />
            </label>
            <div mono-message="invalid" role="alert">This field is required</div>
        </div>
        <br>
        <div mono-file-upload mono-validation-state="warning">
            <label mono-label>Warning</label>
            <label mono-dropzone>
                <div mono-icon aria-hidden="true"><span mono-glyph class="i-mdi-cloud-upload-outline" aria-hidden="true"></span></div>
                <div mono-title>Upload warning file</div>
                <div mono-subtext>Warning state</div>
                <input mono-native type="file" />
            </label>
            <div mono-message="warning">Please double-check uploaded file</div>
        </div>
    </div>
</template>
