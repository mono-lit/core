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

const required = otp(6)
const invalid = otp(6)
const warning = otp(6)
// Seed the boxes the way a bound value would.
invalid.code = '000000'
warning.code = '52'
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <!-- disabled: each box disabled, the row faded -->
        <div mono-otp mono-disabled>
            <label mono-label>Disabled</label>
            <div mono-field role="group" aria-label="Disabled">
                <div mono-otp-group>
                    <input v-for="i in 6" :key="i" mono-otp-cell type="text" disabled :aria-label="`Digit ${i} of 6`" :value="'123'[i - 1] ?? ''" />
                </div>
            </div>
            <div mono-message-wrap><div mono-message="helper">Not editable right now.</div></div>
        </div>

        <!-- readonly: focusable, no edits (no handlers bound) -->
        <div mono-otp mono-readonly>
            <label mono-label>Readonly</label>
            <div mono-field role="group" aria-label="Readonly">
                <div mono-otp-group>
                    <input v-for="i in 6" :key="i" mono-otp-cell type="text" readonly :aria-label="`Digit ${i} of 6`" :value="'482913'[i - 1]" mono-filled />
                </div>
            </div>
            <div mono-message-wrap><div mono-message="helper">Focusable, but the code never changes.</div></div>
        </div>

        <div mono-otp mono-required>
            <label mono-label>Required <span mono-required-mark>*</span></label>
            <div mono-field role="group" aria-label="Required" aria-required="true">
                <div mono-otp-group>
                    <input v-for="i in 6" :key="i" :ref="required.bind(i - 1)" mono-otp-cell type="text" inputmode="numeric" :aria-label="`Digit ${i} of 6`" :value="required.code[i - 1] ?? ''" :mono-filled="required.code[i - 1] ? '' : null" v-on="required.on(i - 1)" />
                </div>
            </div>
        </div>

        <div mono-otp mono-validation-state="invalid">
            <label mono-label>Invalid</label>
            <div mono-field role="group" aria-label="Invalid">
                <div mono-otp-group>
                    <input v-for="i in 6" :key="i" :ref="invalid.bind(i - 1)" mono-otp-cell type="text" inputmode="numeric" aria-invalid="true" :aria-label="`Digit ${i} of 6`" :value="invalid.code[i - 1] ?? ''" :mono-filled="invalid.code[i - 1] ? '' : null" v-on="invalid.on(i - 1)" />
                </div>
            </div>
            <div mono-message-wrap><div mono-message="invalid" role="alert">That code is wrong. Try again.</div></div>
        </div>

        <div mono-otp mono-validation-state="warning">
            <label mono-label>Warning</label>
            <div mono-field role="group" aria-label="Warning">
                <div mono-otp-group>
                    <input v-for="i in 6" :key="i" :ref="warning.bind(i - 1)" mono-otp-cell type="text" inputmode="numeric" :aria-label="`Digit ${i} of 6`" :value="warning.code[i - 1] ?? ''" :mono-filled="warning.code[i - 1] ? '' : null" v-on="warning.on(i - 1)" />
                </div>
            </div>
            <div mono-message-wrap><div mono-message="warning">This code expires in 30 seconds.</div></div>
        </div>

        <div mono-otp mono-validation-state="valid">
            <label mono-label>Valid</label>
            <div mono-field role="group" aria-label="Valid">
                <div mono-otp-group>
                    <input v-for="i in 6" :key="i" mono-otp-cell type="text" readonly :aria-label="`Digit ${i} of 6`" :value="'482913'[i - 1]" mono-filled />
                </div>
            </div>
            <div mono-message-wrap><div mono-message="valid">Code verified.</div></div>
        </div>
    </div>
</template>
