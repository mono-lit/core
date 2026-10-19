<script setup>
import { ref, computed } from 'vue'

const limit = ref(5)
const achievement = ref(80)
const volume = ref(40)

// The element writes the fill position as --mono-input-range-value; raw markup sets it itself.
const fill = (value, min, max) => `--mono-input-range-value: ${((value - min) / (max - min)) * 100}%`
const rupiah = computed(() => 'Rp ' + (limit.value * 1e6).toLocaleString('id-ID'))
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.25rem">
        <!-- type="range": no bordered field; the readout ends the label row. -->
        <div mono-input mono-type="range">
            <label mono-label for="example-range-limit">
                Limit budget klaim
                <span mono-range-value aria-hidden="true">{{ rupiah }}</span>
            </label>
            <div mono-field>
                <input
                    id="example-range-limit"
                    mono-native
                    mono-range
                    type="range"
                    min="0"
                    max="20"
                    step="0.5"
                    :aria-valuetext="rupiah"
                    :style="fill(limit, 0, 20)"
                    v-model.number="limit"
                />
            </div>
        </div>

        <div mono-input mono-type="range">
            <label mono-label for="example-range-achievement">
                Pencapaian minimum
                <span mono-range-value aria-hidden="true">{{ achievement }}%</span>
            </label>
            <div mono-field>
                <input
                    id="example-range-achievement"
                    mono-native
                    mono-range
                    type="range"
                    min="0"
                    max="100"
                    :aria-valuetext="achievement + '%'"
                    :style="fill(achievement, 0, 100)"
                    v-model.number="achievement"
                />
            </div>
        </div>

        <!-- No label: the readout follows the slider instead. -->
        <div mono-input mono-type="range" mono-color="success">
            <div mono-field>
                <input
                    mono-native
                    mono-range
                    type="range"
                    min="0"
                    max="100"
                    aria-label="Volume"
                    :style="fill(volume, 0, 100)"
                    v-model.number="volume"
                />
                <span mono-range-value aria-hidden="true">{{ volume }}</span>
            </div>
        </div>
    </div>
</template>
