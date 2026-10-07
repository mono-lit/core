<template>
    <div style="width: 100%">
        <div mono-file-upload class="max-full">
            <label mono-label class="font-bold text-base">Customized via cssClass</label>
            <label mono-dropzone class="p-9">
                <div mono-icon aria-hidden="true"><span mono-glyph class="i-mdi-cloud-upload-outline" aria-hidden="true"></span></div>
                <div mono-title class="text-lg">Drop a wide file here</div>
                <div mono-subtext>Uses utility classes per element</div>
                <input mono-native type="file" />
            </label>
            <div mono-message="helper" class="italic">Width, padding and weight are overridden per element.</div>
        </div>
    </div>
</template>
