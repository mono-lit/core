<template>
    <div style="display: grid; gap: 1.25rem; width: 100%;">
        <!-- The icon glyph is any element inside [mono-icon]; mark it [mono-glyph]
             and the plate sizes it, exactly like the element's own default. -->
        <div mono-file-upload mono-multiple>
            <label mono-label>Iconify icon prop</label>
            <label mono-dropzone>
                <div mono-icon aria-hidden="true">
                    <span mono-glyph class="i-mdi-cloud-upload"></span>
                </div>
                <div mono-title>Click or drag file here</div>
                <div mono-subtext>icon = i-mdi-cloud-upload</div>
                <input mono-native type="file" multiple />
            </label>
        </div>

        <!-- Any custom markup works as the icon. -->
        <div mono-file-upload>
            <label mono-label>Slot icon (overrides the prop)</label>
            <label mono-dropzone>
                <div mono-icon aria-hidden="true">
                    <span class="i-mdi-folder-upload"></span>
                </div>
                <div mono-title>Click or drag file here</div>
                <div mono-subtext>slot wins over the icon prop</div>
                <input mono-native type="file" />
            </label>
        </div>
    </div>
</template>
