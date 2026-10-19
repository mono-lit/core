<script setup>
import { ref } from 'vue'

const picker = ref(null)
const name = ref('')

function onPick(event) {
    name.value = Array.from(event.target.files ?? []).map((f) => f.name).join(', ')
}

function clear() {
    name.value = ''
    if (picker.value) picker.value.value = ''
}
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1rem">
        <!-- type="file": a hidden native picker behind a read-only name field, the
             upload glyph a [mono-file-icon] suffix. The element wires the clicks. -->
        <div mono-input mono-type="file" mono-clearable>
            <label mono-label for="example-file">Attachment</label>
            <div mono-field>
                <input ref="picker" mono-file-input type="file" hidden accept=".pdf,image/*" @change="onPick" />
                <input
                    id="example-file"
                    mono-native
                    mono-file
                    type="text"
                    readonly
                    placeholder="Choose a file"
                    :value="name"
                    @click="picker?.click()"
                    @keydown.enter.prevent="picker?.click()"
                />
                <button v-if="name" mono-clear type="button" aria-label="Clear input" @click="clear">
                    <span mono-icon class="mono-icon i-mdi-close" aria-hidden="true"></span>
                </button>
                <span mono-suffix mono-file-icon aria-hidden="true" @click="picker?.click()">
                    <span mono-icon class="mono-icon i-mdi-cloud-upload-outline"></span>
                </span>
            </div>
            <div mono-message-wrap>
                <div mono-message="helper">Click the field or the cloud icon.</div>
            </div>
        </div>
    </div>
</template>
