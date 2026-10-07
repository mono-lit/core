<script setup>
    import { ref, computed } from 'vue'

    // Lit-free variant: the perf behaviour lives entirely in `accordion.css`, so raw
    // `[mono-accordion]` markup gets the same treatment — a closed `[mono-body]` is
    // skipped for layout and paint regardless of what is inside it.
    const COUNTS = [5, 12, 40]
    const count = ref(12)
    const open = ref({})
    const instant = ref(false)
    const elapsed = ref(null)

    const rows = computed(() => Array.from({ length: count.value }, (_, i) => i))

    // The body's two pickers; one value shared by every row is all a weight demo needs.
    const kategori = ref('Operational')
    const channel = ref('GT')

    /**
     * Time from the toggle to the first painted frame that includes it. Two nested
     * rAFs: the first runs before the frame's paint, the second once it has committed.
     */
    function toggle(i) {
        const start = performance.now()
        open.value = { ...open.value, [i]: !open.value[i] }

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                elapsed.value = (performance.now() - start).toFixed(1)
            })
        })
    }

    function setCount(next) {
        count.value = next
        open.value = {}
        elapsed.value = null
    }
</script>

<template>
    <div style="width: 100%;">
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; margin-bottom: 0.75rem;">
            <span style="font-size: 0.8rem; font-weight: 600;">Panels:</span>

            <button
                v-for="n in COUNTS"
                :key="n"
                type="button"
                :style="{
                    padding: '2px 10px',
                    borderRadius: '99px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    border: '1px solid var(--theme-border)',
                    background: n === count ? 'var(--theme-primary)' : 'transparent',
                    color: n === count ? 'var(--primary-foreground)' : 'inherit',
                }"
                @click="setCount(n)"
            >
                {{ n }}
            </button>

            <DemoCheck v-model="instant"><code>--mono-accordion-duration: 0s</code></DemoCheck>

            <DemoReadout inline>
                Toggle to paint:
                <strong>{{ elapsed === null ? '—' : elapsed + ' ms' }}</strong>
            </DemoReadout>
        </div>

        <div
            mono-accordion-group
            :style="instant ? '--mono-accordion-duration: 0s' : ''"
        >
            <div
                v-for="i in rows"
                :key="i"
                mono-accordion mono-size="xs"
                :mono-open="!!open[i] ? '' : null"
            >
                <button
                    type="button"
                    mono-head
                    :aria-expanded="!!open[i]"
                    @click="toggle(i)"
                >
                    <span mono-heading>
                        <span mono-title>{{ i + 1 }}. Activity budget entry</span>
                        <span mono-description>
                            Four form controls, rendered whether open or closed.
                        </span>
                    </span>
                    <span mono-arrow aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </span>
                </button>

                <div mono-body role="region">
                    <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; font-size: 0.75rem;">
                        <DemoSelect v-model="kategori" label="Kategori" :options="['Operational', 'Marketing', 'Capital expenditure']" />

                        <DemoSelect v-model="channel" label="Channel" :options="['GT', 'MT-LKA', 'MT-NKA']" />

                        <label style="display: grid; gap: 0.2rem; grid-column: 1 / -1;">
                            Nama activity
                            <input
                                type="text"
                                placeholder="e.g. Promo akhir tahun"
                                style="padding: 0.3rem; border: 1px solid var(--theme-border); border-radius: 4px;"
                            >
                        </label>

                        <label style="display: grid; gap: 0.2rem; grid-column: 1 / -1;">
                            Deskripsi
                            <textarea
                                rows="2"
                                placeholder="Optional notes"
                                style="padding: 0.3rem; border: 1px solid var(--theme-border); border-radius: 4px; resize: vertical;"
                            ></textarea>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
