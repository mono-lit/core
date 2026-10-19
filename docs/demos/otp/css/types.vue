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

const num = otp(6)
// alphanumeric: letters and digits, letters uppercased
const alnum = otp(8, /^[A-Z0-9]$/, (c) => c.toUpperCase())
// text: any non-space character
const text = otp(4, /^\S$/)
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <div mono-otp>
            <label mono-label>numeric (default)</label>
            <div mono-field role="group" aria-label="numeric">
                <div mono-otp-group>
                    <input v-for="i in 6" :key="i" :ref="num.bind(i - 1)" mono-otp-cell type="text" inputmode="numeric" pattern="[0-9]*" :aria-label="`Digit ${i} of 6`" :value="num.code[i - 1] ?? ''" :mono-filled="num.code[i - 1] ? '' : null" v-on="num.on(i - 1)" />
                </div>
            </div>
            <div mono-message-wrap><div mono-message="helper">Letters are ignored.</div></div>
        </div>

        <div mono-otp mono-type="alphanumeric">
            <label mono-label>alphanumeric</label>
            <div mono-field role="group" aria-label="alphanumeric">
                <div mono-otp-group>
                    <input v-for="i in 4" :key="i" :ref="alnum.bind(i - 1)" mono-otp-cell type="text" inputmode="text" autocapitalize="characters" :aria-label="`Character ${i} of 8`" :value="alnum.code[i - 1] ?? ''" :mono-filled="alnum.code[i - 1] ? '' : null" v-on="alnum.on(i - 1)" />
                </div>
                <span mono-otp-separator aria-hidden="true">-</span>
                <div mono-otp-group>
                    <input v-for="i in 4" :key="i" :ref="alnum.bind(i + 3)" mono-otp-cell type="text" inputmode="text" autocapitalize="characters" :aria-label="`Character ${i + 4} of 8`" :value="alnum.code[i + 3] ?? ''" :mono-filled="alnum.code[i + 3] ? '' : null" v-on="alnum.on(i + 3)" />
                </div>
            </div>
            <div mono-message-wrap><div mono-message="helper">Type ab12cd34 and it becomes AB12CD34.</div></div>
        </div>

        <div mono-otp mono-type="text">
            <label mono-label>text</label>
            <div mono-field role="group" aria-label="text">
                <div mono-otp-group>
                    <input v-for="i in 4" :key="i" :ref="text.bind(i - 1)" mono-otp-cell type="text" :aria-label="`Character ${i} of 4`" :value="text.code[i - 1] ?? ''" :mono-filled="text.code[i - 1] ? '' : null" v-on="text.on(i - 1)" />
                </div>
            </div>
            <div mono-message-wrap><div mono-message="helper">Symbols are accepted too.</div></div>
        </div>
    </div>
</template>
