<script setup>
import { ref } from 'vue'

const value = ref('')
</script>

<template>
    <div style="width: 100%">
        <div mono-textarea>
            <label mono-label>Bio</label>
            <textarea mono-native placeholder="Tell us a bit about yourself" rows="3" v-model="value"></textarea>
            <div>
                <div mono-footer>
                    <div mono-message-wrap>
                        <div mono-message="helper">Plain text. A few sentences is enough.</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
