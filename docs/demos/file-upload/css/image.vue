<script setup>
import { ref } from 'vue'

const items = ref([])

function format(size) {
    if (size < 1024) return size + ' B'
    if (size < 1048576) return Math.round(size / 1024) + ' KB'
    return (size / 1048576).toFixed(1) + ' MB'
}

function onChange(e) {
    for (const file of Array.from(e.target.files || [])) {
        items.value.push({ file, url: URL.createObjectURL(file) })
    }
    e.target.value = ''
}

function remove(i) {
    URL.revokeObjectURL(items.value[i].url)
    items.value.splice(i, 1)
}
</script>

<template>
    <div style="width: 100%">
        <div mono-file-upload mono-multiple>
            <label mono-label>Gallery Images</label>
            <label mono-dropzone>
                <div mono-icon aria-hidden="true"><span mono-glyph class="i-mdi-cloud-upload-outline" aria-hidden="true"></span></div>
                <div mono-title>Upload multiple images</div>
                <div mono-subtext>Multiple image upload</div>
                <input mono-native type="file" accept="image/*" multiple @change="onChange" />
            </label>
            <div v-if="items.length" mono-list>
                <div v-for="(it, i) in items" :key="i" mono-item>
                    <div mono-thumb><img :src="it.url" :alt="it.file.name" /></div>
                    <div mono-file>
                        <div mono-name>{{ it.file.name }}</div>
                        <div mono-meta>{{ format(it.file.size) }}</div>
                    </div>
                    <button type="button" mono-remove :aria-label="`Remove ${it.file.name}`" @click="remove(i)">
                        <span mono-glyph class="i-mdi-close" aria-hidden="true"></span>
                    </button>
                </div>
            </div>
            <div mono-message="helper">Image previews are generated automatically</div>
        </div>
    </div>
</template>
