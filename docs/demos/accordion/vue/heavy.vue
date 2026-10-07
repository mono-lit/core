<script setup>
    import '@mono-lit/helper/ui/accordion'
    import '@mono-lit/helper/ui/select'
    import '@mono-lit/helper/ui/input'
    import '@mono-lit/helper/ui/textarea'
    import { ref, computed } from 'vue'

    // A collapsed accordion body is still fully rendered — only `content-visibility`
    // keeps it out of layout and paint. This demo exists to make that measurable: raise
    // the count and the per-toggle cost should stay flat, because the closed bodies
    // cost nothing no matter how many components are slotted into them.
    const COUNTS = [5, 12, 40]
    const count = ref(12)

    /** Independent open state per panel — all closed initially, which is the case that matters. */
    const open = ref({})

    /** The escape hatch: `--mono-accordion-duration: 0s` skips the animation entirely. */
    const instant = ref(false)

    const rows = computed(() => Array.from({ length: count.value }, (_, i) => i))

    const categories = ref([
        { label: 'Operational', value: 'ops' },
        { label: 'Marketing', value: 'mkt' },
        { label: 'Capital expenditure', value: 'capex' },
    ])

    const channels = ref([
        { label: 'GT', value: 'gt' },
        { label: 'MT-LKA', value: 'lka' },
        { label: 'MT-NKA', value: 'nka' },
    ])

    const elapsed = ref(null)

    /**
     * Time from the toggle to the first painted frame that includes it. Two nested
     * rAFs: the first runs before the frame's paint, the second once it has committed
     * — so the gap covers style, layout and paint of the toggle.
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

        <p style="font-size: 0.75rem; opacity: 0.7; margin: 0 0 0.75rem;">
            Each panel holds four form components. Closed panels are skipped for layout
            and paint, so raising the count barely changes how long the list takes to
            appear. The <em>toggle</em> cost is a different thing: it is mostly the
            expand animation re-measuring the body every frame — tick
            <code>0s</code> above to see it drop sharply.
        </p>

        <div
            mono-accordion-group
            :style="instant ? '--mono-accordion-duration: 0s' : ''"
        >
            <mono-accordion
                v-for="i in rows"
                :key="i"
                size="xs"
                color="primary"
                :title="`${i + 1}. Activity budget entry`"
                subtitle="Four slotted components, rendered whether open or closed."
                :model-value.prop="!!open[i]"
                @toggle="toggle(i)"
            >
                <div
                    slot="body"
                    style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem;"
                >
                    <mono-select
                        label="Kategori"
                        placeholder="Pick one"
                        size="sm"
                        width="100%"
                        :items.prop="categories"
                        key-value="value"
                        display-value="label"
                    ></mono-select>

                    <mono-select
                        label="Channel"
                        placeholder="Pick one"
                        size="sm"
                        width="100%"
                        :items.prop="channels"
                        key-value="value"
                        display-value="label"
                    ></mono-select>

                    <mono-input
                        label="Nama activity"
                        placeholder="e.g. Promo akhir tahun"
                        size="sm"
                        width="100%"
                        style="grid-column: 1 / -1;"
                    ></mono-input>

                    <mono-textarea
                        label="Deskripsi"
                        placeholder="Optional notes"
                        size="sm"
                        width="100%"
                        style="grid-column: 1 / -1;"
                    ></mono-textarea>
                </div>
            </mono-accordion>
        </div>
    </div>
</template>
