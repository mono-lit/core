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
const a = slider([20, 60])
const b = slider([45])
const c = slider([30])
const d = slider([5, 95])
const e = slider([30, 60])
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <div mono-slider mono-disabled>
            <div mono-label-row>
                <label mono-label>Disabled</label>
                <span mono-slider-value aria-hidden="true">20 – 60</span>
            </div>
            <div mono-slider-field>
                <div mono-slider-control>
                    <div mono-slider-track>
                        <span v-for="(x, k) in a.pieces" :key="k" mono-slider-piece :mono-filled="on(x.filled)" :mono-cut-start="on(x.cutStart)" :mono-cut-end="on(x.cutEnd)" :style="{ '--a': x.a, '--b': x.b }"></span>
                    </div>
                    <div v-for="(t, i) in a.thumbs" :key="i" mono-slider-thumb role="slider" tabindex="-1" aria-label="Disabled" :aria-valuenow="t.v" :style="{ '--p': t.p }"><span mono-slider-tooltip aria-hidden="true">{{ t.v }}</span></div>
                </div>
            </div>
            <div mono-message-wrap>
                <div mono-message="helper">Not adjustable now.</div>
            </div>
        </div>

        <div mono-slider mono-readonly>
            <div mono-label-row>
                <label mono-label>Readonly</label>
                <span mono-slider-value aria-hidden="true">45</span>
            </div>
            <div mono-slider-field>
                <div mono-slider-control>
                    <div mono-slider-track>
                        <span v-for="(x, k) in b.pieces" :key="k" mono-slider-piece :mono-filled="on(x.filled)" :mono-cut-start="on(x.cutStart)" :mono-cut-end="on(x.cutEnd)" :style="{ '--a': x.a, '--b': x.b }"></span>
                    </div>
                    <div v-for="(t, i) in b.thumbs" :key="i" mono-slider-thumb role="slider" tabindex="0" aria-label="Readonly" :aria-valuenow="t.v" :style="{ '--p': t.p }"><span mono-slider-tooltip aria-hidden="true">{{ t.v }}</span></div>
                </div>
            </div>
            <div mono-message-wrap>
                <div mono-message="helper">Focusable, but it never moves.</div>
            </div>
        </div>

        <div mono-slider mono-required>
            <div mono-label-row>
                <label mono-label>Required<span mono-required-mark>*</span></label>
                <span mono-slider-value aria-hidden="true">30</span>
            </div>
            <div mono-slider-field>
                <div mono-slider-control>
                    <div mono-slider-track>
                        <span v-for="(x, k) in c.pieces" :key="k" mono-slider-piece :mono-filled="on(x.filled)" :mono-cut-start="on(x.cutStart)" :mono-cut-end="on(x.cutEnd)" :style="{ '--a': x.a, '--b': x.b }"></span>
                    </div>
                    <div v-for="(t, i) in c.thumbs" :key="i" mono-slider-thumb role="slider" tabindex="0" aria-label="Required" :aria-valuenow="t.v" :style="{ '--p': t.p }"><span mono-slider-tooltip aria-hidden="true">{{ t.v }}</span></div>
                </div>
            </div>
        </div>

        <div mono-slider mono-validation-state="invalid">
            <div mono-label-row>
                <label mono-label>Invalid</label>
                <span mono-slider-value aria-hidden="true">5 – 95</span>
            </div>
            <div mono-slider-field>
                <div mono-slider-control>
                    <div mono-slider-track>
                        <span v-for="(x, k) in d.pieces" :key="k" mono-slider-piece :mono-filled="on(x.filled)" :mono-cut-start="on(x.cutStart)" :mono-cut-end="on(x.cutEnd)" :style="{ '--a': x.a, '--b': x.b }"></span>
                    </div>
                    <div v-for="(t, i) in d.thumbs" :key="i" mono-slider-thumb role="slider" tabindex="0" aria-label="Invalid" :aria-valuenow="t.v" :style="{ '--p': t.p }"><span mono-slider-tooltip aria-hidden="true">{{ t.v }}</span></div>
                </div>
            </div>
            <div mono-message-wrap>
                <div mono-message="invalid">The range is too wide.</div>
            </div>
        </div>

        <div mono-slider mono-validation-state="valid">
            <div mono-label-row>
                <label mono-label>Valid</label>
                <span mono-slider-value aria-hidden="true">30 – 60</span>
            </div>
            <div mono-slider-field>
                <div mono-slider-control>
                    <div mono-slider-track>
                        <span v-for="(x, k) in e.pieces" :key="k" mono-slider-piece :mono-filled="on(x.filled)" :mono-cut-start="on(x.cutStart)" :mono-cut-end="on(x.cutEnd)" :style="{ '--a': x.a, '--b': x.b }"></span>
                    </div>
                    <div v-for="(t, i) in e.thumbs" :key="i" mono-slider-thumb role="slider" tabindex="0" aria-label="Valid" :aria-valuenow="t.v" :style="{ '--p': t.p }"><span mono-slider-tooltip aria-hidden="true">{{ t.v }}</span></div>
                </div>
            </div>
            <div mono-message-wrap>
                <div mono-message="valid">Looks good.</div>
            </div>
        </div>
    </div>
</template>
