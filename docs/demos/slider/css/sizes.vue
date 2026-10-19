<script setup>
const ratio = (v, min, max) => (max > min ? (v - min) / (max - min) : 0)

// The parts <mono-slider> renders: the track cut into pieces at every thumb, the thumbs, the marks.
function slider(values, { min = 0, max = 100, fill = 'auto', marks = [] } = {}) {
    const p = values.map((v) => ratio(v, min, max))
    const ends = [0, ...p, 1]
    const n = values.length
    const filledAt = (k) =>
        fill === 'start' ? k === 0 : fill === 'end' ? k === n : fill === 'none' ? false : n === 1 ? k === 0 : k >= 1 && k <= n - 1
    const pieces = ends.slice(0, -1).map((a, k) => ({ a, b: ends[k + 1], cutStart: k > 0, cutEnd: k < n, filled: filledAt(k) }))
    const filled = pieces.filter((x) => x.filled)
    return {
        pieces,
        thumbs: values.map((v, i) => ({ v, p: p[i] })),
        marks: marks.map((m) => {
            const value = typeof m === 'number' ? m : m.value
            const r = ratio(value, min, max)
            return { value, p: r, label: typeof m === 'number' ? undefined : m.label, active: filled.some((x) => r >= x.a && r <= x.b) }
        }),
    }
}
const on = (b) => (b ? '' : null)
const list = ["xs","sm","md","lg","xl","xxl"]
const parts = list.map((x, i) => slider([10 + i * 5, 60 + i * 5]))
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <div v-for="(x, i) in list" :key="x" mono-slider :mono-size="x === 'md' ? null : x">
            <div mono-label-row>
                <label mono-label>{{ x }}</label>
                <span mono-slider-value aria-hidden="true">{{ parts[i].thumbs.map((t) => t.v).join(' – ') }}</span>
            </div>
            <div mono-slider-field>
                <div mono-slider-control>
                    <div mono-slider-track>
                        <span v-for="(p, k) in parts[i].pieces" :key="k" mono-slider-piece :mono-filled="on(p.filled)" :mono-cut-start="on(p.cutStart)" :mono-cut-end="on(p.cutEnd)" :style="{ '--a': p.a, '--b': p.b }"></span>
                    </div>
                    <div v-for="(t, j) in parts[i].thumbs" :key="j" mono-slider-thumb role="slider" tabindex="0" :aria-label="x" :aria-valuenow="t.v" :style="{ '--p': t.p }"><span mono-slider-tooltip aria-hidden="true">{{ t.v }}</span></div>
                </div>
            </div>
        </div>
    </div>
</template>
