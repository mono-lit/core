<script setup>
import { ref } from 'vue'

const files = ref([
    { name: 'design-spec.pdf', meta: '139 KB', icon: 'i-mdi-file-pdf-box' },
    { name: 'reference-photo.png', meta: '471 KB', icon: 'i-mdi-file-image' },
])

function remove(i) {
    files.value.splice(i, 1)
}
</script>

<template>
    <div style="width: 100%">
        <div mono-file-upload>
            <label mono-label>Existing Attachments</label>
            <label mono-dropzone>
                <div mono-icon aria-hidden="true"><span mono-glyph class="i-mdi-cloud-upload-outline" aria-hidden="true"></span></div>
                <div mono-title>Add more files</div>
                <div mono-subtext>Preloaded file list</div>
                <input mono-native type="file" />
            </label>
            <div mono-list>
                <div v-for="(f, i) in files" :key="i" mono-item>
                    <div mono-thumb><span mono-glyph :class="f.icon" aria-hidden="true"></span></div>
                    <div mono-file>
                        <div mono-name>{{ f.name }}</div>
                        <div mono-meta>{{ f.meta }}</div>
                    </div>
                    <button type="button" mono-remove :aria-label="`Remove ${f.name}`" @click="remove(i)">
                        <span mono-glyph class="i-mdi-close" aria-hidden="true"></span>
                    </button>
                </div>
            </div>
            <div mono-message="helper">Model value injected from JavaScript</div>
        </div>
    </div>
</template>
