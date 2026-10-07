<script setup>
import { ref } from 'vue'

const MAX_FILES = 2
const MAX_SIZE = 1048576

const files = ref([])
const lines = ref([])

function format(size) {
    if (size < 1024) return size + ' B'
    if (size < 1048576) return Math.round(size / 1024) + ' KB'
    return (size / 1048576).toFixed(1) + ' MB'
}

function append(line) {
    lines.value.unshift(line)
}

function onChange(e) {
    const incoming = Array.from(e.target.files || [])
    for (const f of incoming) {
        if (f.size > MAX_SIZE) {
            append('[error] reason=max-file-size message=' + f.name + ' exceeds 1MB')
            continue
        }
        if (files.value.length >= MAX_FILES) {
            append('[error] reason=max-files message=Cannot add more than ' + MAX_FILES + ' files')
            break
        }
        files.value.push(f)
        append('[change] action=add files=' + files.value.length)
    }
    e.target.value = ''
}

function remove(i) {
    const removed = files.value.splice(i, 1)[0]
    append('[remove] file=' + removed.name)
}
</script>

<template>
    <div style="width: 100%">
        <div mono-file-upload mono-multiple>
            <label mono-label>Event Upload</label>
            <label mono-dropzone>
                <div mono-icon aria-hidden="true"><span mono-glyph class="i-mdi-cloud-upload-outline" aria-hidden="true"></span></div>
                <div mono-title>Upload files to see events</div>
                <div mono-subtext>Try multiple files or one over 1MB</div>
                <input mono-native type="file" multiple @change="onChange" />
            </label>
            <div v-if="files.length" mono-list>
                <div v-for="(f, i) in files" :key="i" mono-item>
                    <div mono-thumb><span mono-glyph class="i-mdi-file" aria-hidden="true"></span></div>
                    <div mono-file>
                        <div mono-name>{{ f.name }}</div>
                        <div mono-meta>{{ format(f.size) }}</div>
                    </div>
                    <button type="button" mono-remove aria-label="Remove" @click="remove(i)">
                        <span mono-glyph class="i-mdi-close" aria-hidden="true"></span>
                    </button>
                </div>
            </div>
        </div>
        <br>
        <DemoLog :lines="lines" max-height="100px" />
    </div>
</template>
