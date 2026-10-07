<script setup>
import { ref, computed } from 'vue'

const value = ref('')
const max = 280

const counterClass = computed(() => {
    const length = value.value.length
    if (length >= max) return 'over'
    if (length >= Math.floor(max * 0.85)) return 'near'
    return ''
})
</script>

<template>
    <div style="width: 100%">
        <div mono-textarea>
            <label mono-label>Tweet</label>
            <textarea
                mono-native
                placeholder="What's happening?"
                rows="3"
                maxlength="280"
                v-model="value"
            ></textarea>
            <div>
                <div mono-footer>
                    <div mono-message-wrap>
                        <div mono-message="helper">Show-counter renders the live count next to the helper.</div>
                    </div>
                    <div mono-counter :class="counterClass">{{ value.length }}/{{ max }}</div>
                </div>
            </div>
        </div>
    </div>
</template>
