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
const a = slider([18, 24], { min: 10, max: 30, marks: [{ value: 10, label: 'Cold' }, 18, { value: 21, label: 'Comfort' }, 24, { value: 30, label: 'Hot' }] })
const b = slider([40], { marks: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] })
const deg = (v) => v + '°'
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <div mono-slider mono-marks-labelled>
            <div mono-label-row>
                <label mono-label>Thermostat</label>
                <span mono-slider-value aria-hidden="true">18° – 24°</span>
            </div>
            <div mono-slider-field>
                <div mono-slider-control>
                    <div mono-slider-track>
                        <span v-for="(x, k) in a.pieces" :key="k" mono-slider-piece :mono-filled="on(x.filled)" :mono-cut-start="on(x.cutStart)" :mono-cut-end="on(x.cutEnd)" :style="{ '--a': x.a, '--b': x.b }"></span>
                    </div>
                    <div mono-slider-marks aria-hidden="true">
                        <span v-for="m in a.marks" :key="m.value" mono-slider-mark :mono-active="on(m.active)" :style="{ '--p': m.p }"><span mono-slider-mark-label>{{ m.label ?? deg(m.value) }}</span></span>
                    </div>
                    <div v-for="(t, i) in a.thumbs" :key="i" mono-slider-thumb role="slider" tabindex="0" aria-label="Thermostat" :aria-valuenow="t.v" :style="{ '--p': t.p }"><span mono-slider-tooltip aria-hidden="true">{{ deg(t.v) }}</span></div>
                </div>
            </div>
        </div>

        <div mono-slider>
            <div mono-label-row>
                <label mono-label>Every 10</label>
                <span mono-slider-value aria-hidden="true">40</span>
            </div>
            <div mono-slider-field>
                <div mono-slider-control>
                    <div mono-slider-track>
                        <span v-for="(x, k) in b.pieces" :key="k" mono-slider-piece :mono-filled="on(x.filled)" :mono-cut-start="on(x.cutStart)" :mono-cut-end="on(x.cutEnd)" :style="{ '--a': x.a, '--b': x.b }"></span>
                    </div>
                    <div mono-slider-marks aria-hidden="true">
                        <span v-for="m in b.marks" :key="m.value" mono-slider-mark :mono-active="on(m.active)" :style="{ '--p': m.p }"></span>
                    </div>
                    <div v-for="(t, i) in b.thumbs" :key="i" mono-slider-thumb role="slider" tabindex="0" aria-label="Every 10" :aria-valuenow="t.v" :style="{ '--p': t.p }"><span mono-slider-tooltip aria-hidden="true">{{ t.v }}</span></div>
                </div>
            </div>
        </div>
    </div>
</template>
