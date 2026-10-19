<script setup>
import { reactive } from 'vue'

// What <mono-otp> wires up: one character per box, focus moves on, Backspace steps back,
// a paste fills from the box on, and focus never lands past the first empty box.
function otp(length, accept = /^[0-9]$/, transform = (c) => c) {
    const boxes = []
    const s = reactive({ code: '' })
    const focus = (i) => {
        const el = boxes[Math.max(0, Math.min(i, s.code.length, length - 1))]
        el?.focus()
        el?.select()
    }
    const put = (i, text) => {
        const chars = [...text].map(transform).filter((c) => accept.test(c))
        if (!chars.length) return
        const next = [...s.code]
        if (chars.length === 1) next[Math.min(i, next.length)] = chars[0]
        else next.splice(i, next.length, ...chars)
        s.code = next.join('').slice(0, length)
        focus(i + chars.length)
    }
    const remove = (i) => {
        s.code = s.code.slice(0, i) + s.code.slice(i + 1)
        focus(i)
    }
    s.bind = (i) => (el) => {
        if (el) boxes[i] = el
    }
    s.on = (i) => ({
        input: (e) => {
            const typed = e.target.value
            e.target.value = s.code[i] ?? ''
            put(i, typed.length > 1 && s.code[i] ? typed.replace(s.code[i], '') : typed)
        },
        keydown: (e) => {
            if (e.key === 'Backspace') {
                e.preventDefault()
                const at = i < s.code.length ? i : s.code.length - 1
                if (at >= 0) remove(at)
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault()
                focus(i - 1)
            } else if (e.key === 'ArrowRight') {
                e.preventDefault()
                focus(i + 1)
            }
        },
        paste: (e) => {
            e.preventDefault()
            put(i, e.clipboardData.getData('text'))
        },
        focus: (e) => (i > s.code.length ? focus(s.code.length) : e.target.select()),
    })
    s.clear = () => {
        s.code = ''
        focus(0)
    }
    return s
}

// Box indexes per group, e.g. runs(6, 3) → [[0, 1, 2], [3, 4, 5]].
const runs = (length, size) => Array.from({ length: Math.ceil(length / size) }, (_, g) => Array.from({ length: Math.min(size, length - g * size) }, (_, k) => g * size + k))

const a = otp(6)
const b = otp(6)
const c = otp(8, /^[A-Z0-9]$/, (ch) => ch.toUpperCase())
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <div mono-otp>
            <label mono-label>groups="3"</label>
            <div mono-field role="group" aria-label="Code">
                <template v-for="(group, g) in runs(6, 3)" :key="g">
                    <span v-if="g" mono-otp-separator aria-hidden="true">-</span>
                    <div mono-otp-group>
                        <input v-for="i in group" :key="i" :ref="a.bind(i)" mono-otp-cell type="text" inputmode="numeric" :aria-label="`Digit ${i + 1} of 6`" :value="a.code[i] ?? ''" :mono-filled="a.code[i] ? '' : null" v-on="a.on(i)" />
                    </div>
                </template>
            </div>
        </div>

        <div mono-otp>
            <label mono-label>groups="2,2,2" separator="·"</label>
            <div mono-field role="group" aria-label="Code">
                <template v-for="(group, g) in runs(6, 2)" :key="g">
                    <span v-if="g" mono-otp-separator aria-hidden="true">·</span>
                    <div mono-otp-group>
                        <input v-for="i in group" :key="i" :ref="b.bind(i)" mono-otp-cell type="text" inputmode="numeric" :aria-label="`Digit ${i + 1} of 6`" :value="b.code[i] ?? ''" :mono-filled="b.code[i] ? '' : null" v-on="b.on(i)" />
                    </div>
                </template>
            </div>
        </div>

        <!-- An empty separator: the span stays for the gap, with no text. -->
        <div mono-otp mono-type="alphanumeric">
            <label mono-label>[4, 4] with no separator</label>
            <div mono-field role="group" aria-label="Code">
                <template v-for="(group, g) in runs(8, 4)" :key="g">
                    <span v-if="g" mono-otp-separator aria-hidden="true"></span>
                    <div mono-otp-group>
                        <input v-for="i in group" :key="i" :ref="c.bind(i)" mono-otp-cell type="text" autocapitalize="characters" :aria-label="`Character ${i + 1} of 8`" :value="c.code[i] ?? ''" :mono-filled="c.code[i] ? '' : null" v-on="c.on(i)" />
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>
