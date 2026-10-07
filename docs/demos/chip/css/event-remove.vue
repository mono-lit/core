<script setup>
import { ref } from 'vue'

const items = ref(['Apple', 'Orange', 'Banana'])

function remove(name) {
    items.value = items.value.filter((n) => n !== name)
}
</script>

<template>
    <div>
        <template v-for="name in items" :key="name">
            <div mono-chip mono-removable>
                <span mono-main>
                    <span mono-content>
                        <span mono-label>{{ name }}</span>
                        <button
                            mono-close
                            type="button"
                            :aria-label="`Remove ${name}`"
                            @click="remove(name)"
                        >
                            <span mono-glyph class="i-mdi-close" aria-hidden="true"></span>
                        </button>
                    </span>
                </span>
            </div>
            <br>
        </template>
        <br>
        <div class="event-demo-status">{{ items.length }} items remaining</div>
    </div>
</template>
