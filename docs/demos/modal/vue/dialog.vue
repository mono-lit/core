<script setup>
    import '@mono-lit/helper/ui/modal'
    import '@mono-lit/helper/ui/button'
    import { controlMonoModal } from '@mono-lit/helper'
    import { onBeforeUnmount, ref } from 'vue'

    const status = ref('3 items')
    const items = ref(3)

    // Declared once, next to the other controllers. Nothing about it lives in the
    // template — the question is asked from wherever the flow needs the answer.
    const lockReminder = controlMonoModal({
        dialog: {
            title: 'Lock Budget Reminder',
            body: 'Sudah selesai meng-input budget?<br/>Pastikan sudah <b>lock budget</b> sebelum menambahkan program.',
            buttons: [
                // `value` is the button's answer: pressing it closes and resolves show() with it.
                { label: 'Ya, lanjut', color: 'success', icon: 'i-mdi-check', value: true },
                { label: 'Belum, tetap di sini', variant: 'outline', color: 'secondary', value: false },
            ],
        },
    })

    const deleteConfirm = controlMonoModal({
        dialog: {
            title: 'Hapus item?',
            body: 'Item dan seluruh lampirannya akan dihapus permanen.',
            props: { color: 'danger' },
            buttons: [
                // No `value`, no close: runs and leaves the question open.
                { label: 'Lihat detail', variant: 'text', onClick: () => { status.value = 'details opened — still asking' } },
                {
                    label: 'Hapus', color: 'danger', icon: 'i-mdi-trash-can-outline',
                    value: 'deleted',
                    // Spinner on until this settles, THEN the `value` answers; a rejection would keep the dialog open.
                    onClick: () => new Promise((r) => setTimeout(r, 900)),
                },
                // The other way out: `ctx.dialog` is the dialog controller, and a bare
                // `close()` needs no value — the button already knows it was pressed.
                { label: 'Batal', variant: 'tonal', color: 'secondary', onClick: (_e, { dialog }) => dialog.close() },
            ],
        },
    })

    // The flow, written straight: the reminder is an `await` on the way to the
    // real work, not a wrapper around it. `true` only comes from the `value: true` button.
    const addProgram = async () => {
        if (!(await lockReminder.dialog.show())) {
            status.value = 'stayed — nothing added'
            return
        }
        status.value = 'program added'
    }

    // A custom `value` per button, read back like any other value; a bare
    // `close()` resolves `false`.
    const removeItem = async () => {
        const picked = await deleteConfirm.dialog.show()
        if (picked === 'deleted') {
            items.value -= 1
            status.value = `${items.value} items`
        } else {
            status.value = 'kept'
        }
    }

    onBeforeUnmount(() => { lockReminder.dispose(); deleteConfirm.dispose() })
</script>

<template>
    <div style="display: grid; gap: 0.55rem;">
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <mono-button @click="addProgram()">Tambah program</mono-button>
            <mono-button color="danger" variant="outline" :disabled="items <= 0" @click="removeItem()">Hapus item</mono-button>
        </div>
        <div style="font-size: 0.78rem; opacity: 0.7;">{{ status }}</div>
    </div>
</template>
