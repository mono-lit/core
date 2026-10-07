<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'

const value = ref('')
const textareaRef = ref(null)
const minRows = 2
const maxRows = 8

function resize() {
    const el = textareaRef.value
    if (!el) return
    const style = window.getComputedStyle(el)
    const lineHeight = parseFloat(style.lineHeight) || 20
    const padTop = parseFloat(style.paddingTop) || 0
    const padBottom = parseFloat(style.paddingBottom) || 0
    const borderTop = parseFloat(style.borderTopWidth) || 0
    const borderBottom = parseFloat(style.borderBottomWidth) || 0
    const verticalChrome = padTop + padBottom + borderTop + borderBottom
    const minHeight = lineHeight * minRows + verticalChrome
    const maxHeight = lineHeight * maxRows + verticalChrome
    el.style.height = 'auto'
    const next = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight)
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
    el.style.height = next + 'px'
}

onMounted(() => {
    resize()
})

watch(value, () => {
    nextTick(resize)
})
</script>

<template>
    <div style="width: 100%">
        <div mono-textarea mono-auto-resize>
            <label mono-label>Notes</label>
            <textarea
                ref="textareaRef"
                mono-native
                placeholder="Start typing — the field grows from 2 to 8 rows."
                rows="2"
                v-model="value"
            ></textarea>
            <div>
                <div mono-footer>
                    <div mono-message-wrap>
                        <div mono-message="helper">Auto-grow stops at max-rows; the textarea scrolls beyond that.</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
