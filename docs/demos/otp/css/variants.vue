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

// outlined is the default: it writes no attribute.
const variants = ['outlined', 'filled', 'underlined'].map((variant) => ({ variant, field: otp(6) }))
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <div v-for="{ variant, field } in variants" :key="variant" mono-otp :mono-variant="variant === 'outlined' ? null : variant">
            <label mono-label>{{ variant }}</label>
            <div mono-field role="group" :aria-label="variant">
                <template v-for="g in 2" :key="g">
                    <span v-if="g === 2" mono-otp-separator aria-hidden="true">-</span>
                    <div mono-otp-group>
                        <input v-for="k in 3" :key="k" :ref="field.bind((g - 1) * 3 + k - 1)" mono-otp-cell type="text" inputmode="numeric" :aria-label="`Digit ${(g - 1) * 3 + k} of 6`" :value="field.code[(g - 1) * 3 + k - 1] ?? ''" :mono-filled="field.code[(g - 1) * 3 + k - 1] ? '' : null" v-on="field.on((g - 1) * 3 + k - 1)" />
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>
