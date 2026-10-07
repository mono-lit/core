<script setup>
import { ref } from 'vue'

const MAX_FILES = 3
const MAX_SIZE = 2097152

const files = ref([])
const message = ref('Try uploading too many files or an oversized file')

function format(size) {
    if (size < 1024) return size + ' B'
    if (size < 1048576) return Math.round(size / 1024) + ' KB'
    return (size / 1048576).toFixed(1) + ' MB'
}

function onChange(e) {
    const incoming = Array.from(e.target.files || [])
    const allowed = Math.max(MAX_FILES - files.value.length, 0)
    const next = []
    let oversize = false
    for (const f of incoming.slice(0, allowed)) {
        if (f.size > MAX_SIZE) { oversize = true; continue }
        next.push(f)
    }
    files.value.push(...next)
    if (incoming.length > allowed) {
        message.value = 'Max 3 files reached'
    } else if (oversize) {
        message.value = 'Some files exceeded the 2MB limit and were skipped'
    } else {
        message.value = files.value.length + ' file(s) selected'
    }
    e.target.value = ''
}

function remove(i) {
    files.value.splice(i, 1)
}
</script>

<template>
    <div style="width: 100%">
        <div mono-file-upload mono-multiple>
            <label mono-label>Limited Files</label>
            <label mono-dropzone>
                <div mono-icon aria-hidden="true"><span mono-glyph class="i-mdi-cloud-upload-outline" aria-hidden="true"></span></div>
                <div mono-title>Upload up to 3 files</div>
                <div mono-subtext>Max 3 files · 2MB each</div>
                <input mono-native type="file" multiple @change="onChange" />
            </label>
            <div v-if="files.length" mono-list>
                <div v-for="(f, i) in files" :key="i" mono-item>
                    <div mono-thumb><span mono-glyph class="i-mdi-file" aria-hidden="true"></span></div>
                    <div mono-file>
                        <div mono-name>{{ f.name }}</div>
                        <div mono-meta>{{ format(f.size) }}</div>
                    </div>
                    <button type="button" mono-remove :aria-label="`Remove ${f.name}`" @click="remove(i)">
                        <span mono-glyph class="i-mdi-close" aria-hidden="true"></span>
                    </button>
                </div>
            </div>
            <div mono-message="helper">{{ message }}</div>
        </div>
    </div>
</template>
