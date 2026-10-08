<script setup lang="ts">
/**
 * Example — Layout Rule
 * ─────────────────────────────────────────────────────────────────────────────
 * The house layout rule, rebuilt with mono components and static data only.
 *
 * The rule has two shapes and every screen is one of them:
 *
 *   TABLE RULE   page-header → filter-accordion → table
 *                (search/toolbar, content, info/pagination)
 *   FORM RULE    page-header → form-card*, each one
 *                card-header → field-grid → form-actions
 *
 * The rule picker is a `mono-dropdown` + `mono-menu` pinned to the viewport --
 * it selects which shape is on screen, so it is kept outside `main`, given no
 * `data-region`, and left out of the region overlay. It is chrome for the demo,
 * not part of the rule the demo is showing.
 *
 * Every colour is a theme token, so the page follows the site's flavor,
 * palette and dark mode.
 *
 * Both share the same skeleton: a `max-w-1400px` centred column, a 12-column
 * page header (title 8 / actions 4), and every region tagged with
 * `data-region="…"` so the rule is inspectable. Flip "Layout regions" in the
 * page actions to outline and label each region in place.
 *
 * The view/edit switch on a form card is CSS, not `v-if` — `data-mode` on the
 * card gates `.fld-view` / `.fld-edit` and the actions row. That keeps the
 * light-DOM children of `mono-card` stable across mode flips instead of
 * tearing them down and rebuilding them on every toggle.
 */
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'

if (!import.meta.env.SSR) {
    import('@mono-lit/helper/ui/dropdown')
    import('@mono-lit/helper/ui/menu')
    import('@mono-lit/helper/ui/card')
    import('@mono-lit/helper/ui/accordion')
    import('@mono-lit/helper/ui/table')
    import('@mono-lit/helper/ui/button')
    import('@mono-lit/helper/ui/chip')
    import('@mono-lit/helper/ui/input')
    import('@mono-lit/helper/ui/select')
    import('@mono-lit/helper/ui/date')
    import('@mono-lit/helper/ui/textarea')
    import('@mono-lit/helper/ui/switch')
    import('@mono-lit/helper/ui/checkbox')
}

import { controlMonoTable } from '@mono-lit/helper'

// ── Which rule is on screen ──────────────────────────────────────────────────
// `v-show`, not `v-if`: the table controller and its control elements stay
// mounted, so switching back keeps the page / sort / filter state.
type RuleId = 'table' | 'form'

const RULE_TABS: { id: RuleId; label: string }[] = [
    { id: 'table', label: 'Table Rule' },
    { id: 'form', label: 'Form Rule' },
]
const rule = ref<RuleId>('table')

// -- Rule picker: a floating menu, not a region ------------------------------
// Closed it is one pill in the corner; open it lists the available rules.
// mono-dropdown closes itself on ESC and on an outside click.
const ruleMenuOpen = ref(false)
const activeRule = computed(
    () => RULE_TABS.find((t) => t.id === rule.value) ?? RULE_TABS[0],
)

const RULE_MENU_ITEMS = [
    { id: 'head', type: 'subheader', title: 'Rules' },
    { id: 'table', title: 'Table Rule', icon: 'i-mdi-table' },
    { id: 'form', title: 'Form Rule', icon: 'i-mdi-form-select' },
]

function pickRule(id: string): void {
    if (!RULE_TABS.some((t) => t.id === id)) return
    rule.value = id as RuleId
    ruleMenuOpen.value = false
}

// Region overlay — outlines every `[data-region]` and prints its name.
const showRegions = ref(false)

// ── Shared option lists (the filters and the form read the same lists) ───────
const DEPARTMENTS = [
    { label: 'Operations', value: 'Operations' },
    { label: 'Finance', value: 'Finance' },
    { label: 'Marketing', value: 'Marketing' },
    { label: 'IT & Systems', value: 'IT & Systems' },
    { label: 'Warehouse', value: 'Warehouse' },
]

const STATUSES = [
    { label: 'Draft', value: 'Draft' },
    { label: 'Waiting Approval', value: 'Waiting Approval' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' },
]

const PRIORITIES = [
    { label: 'Low', value: 'Low' },
    { label: 'Normal', value: 'Normal' },
    { label: 'High', value: 'High' },
    { label: 'Urgent', value: 'Urgent' },
]

const WAREHOUSES = [
    { label: 'DC Jakarta Utara', value: 'DC Jakarta Utara' },
    { label: 'DC Surabaya', value: 'DC Surabaya' },
    { label: 'DC Medan', value: 'DC Medan' },
    { label: 'DC Makassar', value: 'DC Makassar' },
]

const rupiah = (n: number) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')

const STATUS_COLOR: Record<string, string> = {
    'Draft': 'neutral',
    'Waiting Approval': 'warning',
    'Approved': 'success',
    'Rejected': 'danger',
}

const PRIORITY_COLOR: Record<string, string> = {
    Low: 'neutral',
    Normal: 'info',
    High: 'warning',
    Urgent: 'danger',
}

// ═════════════════════════════════════════════════════════════════════════════
// TABLE RULE
// ═════════════════════════════════════════════════════════════════════════════
type RequestRow = {
    id: string
    no: string
    title: string
    dept: string
    requester: string
    date: string
    amount: number
    priority: string
    status: string
    warehouse: string
}

const ROWS: RequestRow[] = [
    { id: 'r01', no: 'PR-2026-00184', title: 'Warehouse racking replacement', dept: 'Operations', requester: 'Andi Pratama', date: '2026-08-11', amount: 184_500_000, priority: 'High', status: 'Waiting Approval', warehouse: 'DC Jakarta Utara' },
    { id: 'r02', no: 'PR-2026-00183', title: 'Forklift annual service', dept: 'Warehouse', requester: 'Budi Santoso', date: '2026-08-10', amount: 42_750_000, priority: 'Normal', status: 'Approved', warehouse: 'DC Surabaya' },
    { id: 'r03', no: 'PR-2026-00182', title: 'Q4 trade promo print run', dept: 'Marketing', requester: 'Citra Dewi', date: '2026-08-09', amount: 96_000_000, priority: 'Urgent', status: 'Waiting Approval', warehouse: 'DC Jakarta Utara' },
    { id: 'r04', no: 'PR-2026-00181', title: 'Laptop refresh — sales team', dept: 'IT & Systems', requester: 'Dian Rahayu', date: '2026-08-08', amount: 312_400_000, priority: 'High', status: 'Draft', warehouse: 'DC Jakarta Utara' },
    { id: 'r05', no: 'PR-2026-00180', title: 'Audit fee — external', dept: 'Finance', requester: 'Eko Prasetyo', date: '2026-08-07', amount: 150_000_000, priority: 'Normal', status: 'Approved', warehouse: 'DC Jakarta Utara' },
    { id: 'r06', no: 'PR-2026-00179', title: 'Cold-room compressor spare', dept: 'Warehouse', requester: 'Fira Mahdalena', date: '2026-08-06', amount: 68_900_000, priority: 'Urgent', status: 'Approved', warehouse: 'DC Medan' },
    { id: 'r07', no: 'PR-2026-00178', title: 'Office chairs — 40 units', dept: 'Operations', requester: 'Gilang Ramadhan', date: '2026-08-05', amount: 88_000_000, priority: 'Low', status: 'Rejected', warehouse: 'DC Surabaya' },
    { id: 'r08', no: 'PR-2026-00177', title: 'CRM seat extension', dept: 'IT & Systems', requester: 'Hana Pertiwi', date: '2026-08-04', amount: 54_300_000, priority: 'Normal', status: 'Waiting Approval', warehouse: 'DC Jakarta Utara' },
    { id: 'r09', no: 'PR-2026-00176', title: 'Delivery van tyres', dept: 'Warehouse', requester: 'Ivan Kurniawan', date: '2026-08-03', amount: 27_600_000, priority: 'Normal', status: 'Approved', warehouse: 'DC Makassar' },
    { id: 'r10', no: 'PR-2026-00175', title: 'Booth build — expo Surabaya', dept: 'Marketing', requester: 'Joko Riyanto', date: '2026-08-02', amount: 205_000_000, priority: 'High', status: 'Draft', warehouse: 'DC Surabaya' },
    { id: 'r11', no: 'PR-2026-00174', title: 'Barcode scanner batch', dept: 'Warehouse', requester: 'Kartika Sari', date: '2026-08-01', amount: 39_950_000, priority: 'Low', status: 'Approved', warehouse: 'DC Medan' },
    { id: 'r12', no: 'PR-2026-00173', title: 'Tax consultant retainer', dept: 'Finance', requester: 'Lestari Ningrum', date: '2026-07-31', amount: 120_000_000, priority: 'Normal', status: 'Waiting Approval', warehouse: 'DC Jakarta Utara' },
    { id: 'r13', no: 'PR-2026-00172', title: 'Firewall renewal', dept: 'IT & Systems', requester: 'Maulana Yusuf', date: '2026-07-30', amount: 76_800_000, priority: 'High', status: 'Approved', warehouse: 'DC Jakarta Utara' },
    { id: 'r14', no: 'PR-2026-00171', title: 'Pallet wrap — 6 months', dept: 'Operations', requester: 'Nina Rahayu', date: '2026-07-29', amount: 33_200_000, priority: 'Low', status: 'Approved', warehouse: 'DC Makassar' },
    { id: 'r15', no: 'PR-2026-00170', title: 'Sampling budget — new SKU', dept: 'Marketing', requester: 'Oscar Prasetya', date: '2026-07-28', amount: 175_000_000, priority: 'Urgent', status: 'Rejected', warehouse: 'DC Surabaya' },
    { id: 'r16', no: 'PR-2026-00169', title: 'Generator fuel contract', dept: 'Operations', requester: 'Putri Andini', date: '2026-07-27', amount: 61_400_000, priority: 'Normal', status: 'Draft', warehouse: 'DC Medan' },
]

// A static array in, no fetcher: `controlMonoTable` wraps it in an in-memory
// source, so search / sort / header-filter / paging all run client-side.
const table = controlMonoTable<RequestRow>(ROWS, {
    keyExpr: 'id',
    pageSize: 5,
    searchValue: ['no', 'title', 'requester', 'dept'],
    props: {
        th: [
            { field: 'no', caption: 'Request No', sort: { order: 'desc' } },
            { field: 'title', caption: 'Title', sort: true },
            { field: 'dept', caption: 'Department', sort: true, headerFilter: true },
            { field: 'requester', caption: 'Requested By', sort: true },
            { field: 'date', caption: 'Date', sort: true },
            { field: 'amount', caption: 'Amount', sort: true },
            { field: 'priority', caption: 'Priority', sort: true, headerFilter: true },
            { field: 'status', caption: 'Status', sort: true, headerFilter: true },
        ],
        search: { placeholder: 'Search request no, title, requester…' },
    },
})

const rows = ref<RequestRow[]>([])
const loading = ref(false)

const off = table.subscribe(() => {
    rows.value = [...table.items]
    loading.value = table.loading
})

// ── Filter accordion ─────────────────────────────────────────────────────────
// The panel is one `mono-accordion`; the active-filter count rides in its
// header so a collapsed panel can never hide the fact that the grid is
// filtered.
const filterOpen = ref(true)

const EMPTY_FILTERS = {
    no: '',
    title: '',
    dept: null as string | null,
    requester: '',
    status: null as string | null,
    priority: null as string | null,
    warehouse: null as string | null,
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    urgentOnly: false,
}

const filters = reactive({ ...EMPTY_FILTERS })

const activeFilterCount = computed(
    () =>
        Object.values(filters).filter(
            (v) => v !== '' && v !== null && v !== false,
        ).length,
)

// `setFilter` is one layer of the query: it is AND-ed with the search box and
// the header filters, and it re-runs the query itself.
function applyFilters(): void {
    if (!activeFilterCount.value) {
        void table.setFilter(null)
        return
    }

    const min = Number(filters.minAmount) || 0
    const like = (haystack: string, needle: string) =>
        !needle || haystack.toLowerCase().includes(needle.trim().toLowerCase())

    void table.setFilter((r: RequestRow) => {
        if (!like(r.no, filters.no)) return false
        if (!like(r.title, filters.title)) return false
        if (!like(r.requester, filters.requester)) return false
        if (filters.dept && r.dept !== filters.dept) return false
        if (filters.status && r.status !== filters.status) return false
        if (filters.priority && r.priority !== filters.priority) return false
        if (filters.warehouse && r.warehouse !== filters.warehouse) return false
        if (filters.dateFrom && r.date < filters.dateFrom) return false
        if (filters.dateTo && r.date > filters.dateTo) return false
        if (min && r.amount < min) return false
        if (filters.urgentOnly && r.priority !== 'Urgent') return false
        return true
    })
}

function resetFilters(): void {
    Object.assign(filters, EMPTY_FILTERS)
    applyFilters()
}

// ═════════════════════════════════════════════════════════════════════════════
// FORM RULE
// ═════════════════════════════════════════════════════════════════════════════
type FieldType = 'text' | 'number' | 'select' | 'date' | 'textarea' | 'switch'

interface FormField {
    key: string
    label: string
    type: FieldType
    items?: { label: string; value: string }[]
    /** Column span inside the card's own field grid. */
    span?: string
}

interface FormCard {
    id: string
    title: string
    subtitle: string
    /** The card's field grid — the only thing that varies between cards. */
    grid: string
    fields: FormField[]
}

const FORM_CARDS: FormCard[] = [
    {
        id: 'general',
        title: 'General Information',
        subtitle: 'Identity, owner and amount of the request',
        grid: 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3',
        fields: [
            { key: 'no', label: 'Request No', type: 'text' },
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'dept', label: 'Department', type: 'select', items: DEPARTMENTS },
            { key: 'requester', label: 'Requested By', type: 'text' },
            { key: 'date', label: 'Request Date', type: 'date' },
            { key: 'amount', label: 'Amount', type: 'number' },
            {
                key: 'notes',
                label: 'Notes',
                type: 'textarea',
                span: 'sm:col-span-2 lg:col-span-3',
            },
        ],
    },
    {
        id: 'extra',
        title: 'Additional Details',
        subtitle: 'Routing, destination and approval state',
        grid: 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4',
        fields: [
            { key: 'costCenter', label: 'Cost Center', type: 'text' },
            { key: 'warehouse', label: 'Warehouse', type: 'select', items: WAREHOUSES },
            { key: 'status', label: 'Status', type: 'select', items: STATUSES },
            { key: 'attachment', label: 'Attachment Received', type: 'switch' },
        ],
    },
]

/** The saved record — what view mode reads. */
const record = reactive<Record<string, any>>({
    no: 'PR-2026-00184',
    title: 'Warehouse racking replacement',
    dept: 'Operations',
    requester: 'Andi Pratama',
    date: '2026-08-11',
    amount: 184_500_000,
    notes:
        'Replace 12 bays of damaged selective racking in zone B. Vendor quote is '
        + 'attached; the install window is the last weekend of the month so outbound '
        + 'is never blocked.',
    costCenter: 'CC-OPS-02',
    warehouse: 'DC Jakarta Utara',
    status: 'Waiting Approval',
    attachment: true,
})

/** The edit buffer — filled on Edit, read by the inputs, dropped on Discard. */
const draft = reactive<Record<string, any>>({})

/** `view` | `edit`, per card. Drives the CSS in the style block below. */
const mode = reactive<Record<string, 'view' | 'edit'>>({
    general: 'view',
    extra: 'view',
})

/** Card id → the "SAVED" chip stays up for a moment after a save. */
const savedFlash = reactive<Record<string, boolean>>({})
const flashTimers: Record<string, ReturnType<typeof setTimeout>> = {}

const cardById = (id: string) => FORM_CARDS.find((c) => c.id === id)!

function enterEdit(id: string): void {
    for (const f of cardById(id).fields) draft[f.key] = record[f.key]
    mode[id] = 'edit'
}

function saveEdit(id: string): void {
    for (const f of cardById(id).fields) {
        const value = draft[f.key]
        record[f.key] = f.type === 'number' ? Number(value) || 0 : value
    }
    mode[id] = 'view'

    savedFlash[id] = true
    if (flashTimers[id]) clearTimeout(flashTimers[id])
    flashTimers[id] = setTimeout(() => (savedFlash[id] = false), 2200)
}

/** Discard never touches `record` — the draft is simply abandoned. */
function discardEdit(id: string): void {
    mode[id] = 'view'
}

/** ESC inside a card being typed in discards that card, and only that card. */
function onCardKeydown(id: string, event: KeyboardEvent): void {
    if (event.key !== 'Escape') return
    if (mode[id] !== 'edit') return
    discardEdit(id)
}

const EMPTY = '—'

/** What view mode prints for a field. */
function viewText(field: FormField): string {
    const value = record[field.key]

    if (field.type === 'switch') return value ? 'Yes' : 'No'
    if (field.type === 'number') return rupiah(Number(value))
    if (value === '' || value === null || value === undefined) return EMPTY
    if (field.type === 'select') {
        return field.items?.find((i) => i.value === value)?.label ?? String(value)
    }
    return String(value)
}

onMounted(() => {
    void table.load()
})

onBeforeUnmount(() => {
    off()
    table.dispose()
    for (const id of Object.keys(flashTimers)) clearTimeout(flashTimers[id])
})
</script>

<template>
    <div
        class="lr-page min-h-screen p-4 md:p-6 lg:p-8"
        :class="{ 'show-regions': showRegions }"
    >
        <!-- ═══ SHELL — one centred column, every region a direct child ═══ -->
        <main class="mx-auto grid max-w-1400px grid-cols-1 gap-4">

            <!-- ═══ PAGE HEADER — 12 cols: title 8 / actions 4 ═══════════ -->
            <section
                data-region="page-header"
                class="grid grid-cols-1 gap-4 md:grid-cols-12"
            >
                <div
                    data-region="title"
                    class="lr-block lr-title min-h-72px flex items-center justify-start px-5 py-3 md:col-span-8"
                >
                    <h1 class="m-0 min-w-0 text-[1.05rem] font-800 leading-tight">
                        {{ activeRule.label }}
                    </h1>
                </div>

                <div
                    data-region="page-actions"
                    class="lr-block min-h-72px flex flex-wrap items-center justify-end gap-2 px-5 py-3 md:col-span-4"
                >
                    <mono-switch
                        size="sm"
                        label="Layout regions"
                        :model-value.prop="showRegions"
                        @change="showRegions = $event.detail.modelValue"
                    ></mono-switch>

                    <mono-button size="sm" variant="outline" color="primary">
                        Export
                    </mono-button>

                    <mono-button size="sm" color="primary">
                        <span slot="icon" class="i-mdi-plus"></span>
                        New Request
                    </mono-button>
                </div>
            </section>

            <!-- ═══════════════════════════════════════════════════════════
                 TABLE RULE
                 page-header → filter-accordion → table
                 ═══════════════════════════════════════════════════════════ -->
            <div v-show="rule === 'table'" class="grid grid-cols-1 gap-4">

                <!-- ── FILTER ACCORDION ────────────────────────────────── -->
                <mono-accordion
                    data-region="filter-accordion"
                    color="primary"
                    title="Filters"
                    subtitle="Narrow the grid before searching inside it"
                    :model-value="filterOpen"
                    @toggle="filterOpen = $event.detail.modelValue"
                >
                    <span slot="actions">
                        <mono-chip
                            size="xs"
                            variant="soft"
                            :color="activeFilterCount ? 'primary' : 'neutral'"
                        >
                            <span>{{ activeFilterCount }} active</span>
                        </mono-chip>
                    </span>

                    <div slot="body" class="grid grid-cols-1 gap-3">

                        <!-- FILTER GRID — 1 → 2 → 3 → 4 → 5 columns -->
                        <div
                            data-region="filter-grid"
                            class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                        >
                            <mono-input
                                size="sm"
                                label="Request No"
                                placeholder="PR-2026-…"
                                clearable
                                :model-value="filters.no"
                                @input="filters.no = $event.detail.modelValue"
                                @clear="filters.no = ''"
                            ></mono-input>

                            <mono-input
                                size="sm"
                                label="Title"
                                placeholder="Contains…"
                                clearable
                                :model-value="filters.title"
                                @input="filters.title = $event.detail.modelValue"
                                @clear="filters.title = ''"
                            ></mono-input>

                            <mono-select
                                size="sm"
                                label="Department"
                                placeholder="All departments"
                                clearable
                                :items.prop="DEPARTMENTS"
                                key-value="value"
                                display-value="label"
                                :model-value="filters.dept"
                                @change="filters.dept = $event.detail.modelValue"
                                @clear="filters.dept = null"
                            ></mono-select>

                            <mono-input
                                size="sm"
                                label="Requested By"
                                placeholder="Name…"
                                clearable
                                :model-value="filters.requester"
                                @input="filters.requester = $event.detail.modelValue"
                                @clear="filters.requester = ''"
                            ></mono-input>

                            <mono-select
                                size="sm"
                                label="Status"
                                placeholder="Any status"
                                clearable
                                :items.prop="STATUSES"
                                key-value="value"
                                display-value="label"
                                :model-value="filters.status"
                                @change="filters.status = $event.detail.modelValue"
                                @clear="filters.status = null"
                            ></mono-select>

                            <mono-select
                                size="sm"
                                label="Priority"
                                placeholder="Any priority"
                                clearable
                                :items.prop="PRIORITIES"
                                key-value="value"
                                display-value="label"
                                :model-value="filters.priority"
                                @change="filters.priority = $event.detail.modelValue"
                                @clear="filters.priority = null"
                            ></mono-select>

                            <mono-select
                                size="sm"
                                label="Warehouse"
                                placeholder="Any warehouse"
                                clearable
                                :items.prop="WAREHOUSES"
                                key-value="value"
                                display-value="label"
                                :model-value="filters.warehouse"
                                @change="filters.warehouse = $event.detail.modelValue"
                                @clear="filters.warehouse = null"
                            ></mono-select>

                            <mono-date
                                size="sm"
                                label="Date From"
                                placeholder="Start date"
                                :model-value="filters.dateFrom"
                                @change="filters.dateFrom = $event.detail.modelValue"
                            ></mono-date>

                            <mono-date
                                size="sm"
                                label="Date To"
                                placeholder="End date"
                                :model-value="filters.dateTo"
                                @change="filters.dateTo = $event.detail.modelValue"
                            ></mono-date>

                            <mono-input
                                size="sm"
                                type="number"
                                label="Min Amount"
                                placeholder="0"
                                clearable
                                :model-value="filters.minAmount"
                                @input="filters.minAmount = $event.detail.modelValue"
                                @clear="filters.minAmount = ''"
                            ></mono-input>
                        </div>

                        <!-- FILTER ACTIONS — always the last row, right-aligned -->
                        <div
                            data-region="filter-actions"
                            class="lr-subblock min-h-60px flex flex-wrap items-center justify-end gap-3 px-4 py-2"
                        >
                            <mono-checkbox
                                size="sm"
                                label="Urgent only"
                                :model-value="filters.urgentOnly"
                                @change="filters.urgentOnly = $event.detail.modelValue"
                            ></mono-checkbox>

                            <span class="flex-1"></span>

                            <mono-button
                                size="sm"
                                variant="outline"
                                color="secondary"
                                @click="resetFilters"
                            >
                                Reset
                            </mono-button>

                            <mono-button size="sm" color="primary" @click="applyFilters">
                                Apply Filters
                            </mono-button>
                        </div>
                    </div>
                </mono-accordion>

                <!-- ── TABLE AREA ──────────────────────────────────────────
                     search + toolbar (12 cols, 5 / 7) → content → footer. -->
                <mono-card
                    data-region="table"
                    bordered
                    width="100%"
                    class="lr-table-card"
                >
                    <div class="grid grid-cols-1 gap-3">

                        <!-- SEARCH + TOOLBAR -->
                        <div class="grid grid-cols-1 gap-3 md:grid-cols-12">
                            <div
                                data-region="table-search"
                                class="lr-subblock min-h-64px flex items-center px-4 py-2 md:col-span-5"
                            >
                                <mono-table-search
                                    :control-table.prop="table"
                                    class="w-full"
                                />
                            </div>

                            <div
                                data-region="table-toolbar"
                                class="lr-subblock min-h-64px flex flex-wrap items-center justify-end gap-2 px-4 py-2 md:col-span-7"
                            >
                                <mono-chip size="xs" variant="soft" color="info">
                                    <span>Right-click a header to sort or filter</span>
                                </mono-chip>

                                <mono-button size="sm" variant="outline" color="secondary">
                                    Columns
                                </mono-button>

                                <mono-button size="sm" variant="outline" color="secondary">
                                    Print
                                </mono-button>

                                <mono-button size="sm" color="primary">
                                    Download
                                </mono-button>
                            </div>
                        </div>

                        <!-- TABLE CONTENT -->
                        <div
                            data-region="table-content"
                            class="lr-subblock overflow-hidden"
                        >
                            <div mono-table-scroll>
                                <table mono-table mono-wide class="lr-table">
                                    <caption>
                                        <mono-table-loading :control-table.prop="table" />
                                    </caption>

                                    <thead>
                                        <tr>
                                            <th class="lr-col-no">No</th>
                                            <th class="lr-col-req">
                                                <mono-table-th
                                                    :control-table.prop="table"
                                                    field="no"
                                                />
                                            </th>
                                            <th class="lr-col-title">
                                                <mono-table-th
                                                    :control-table.prop="table"
                                                    field="title"
                                                />
                                            </th>
                                            <th class="lr-col-dept">
                                                <mono-table-th
                                                    :control-table.prop="table"
                                                    field="dept"
                                                />
                                            </th>
                                            <th class="lr-col-user">
                                                <mono-table-th
                                                    :control-table.prop="table"
                                                    field="requester"
                                                />
                                            </th>
                                            <th class="lr-col-date">
                                                <mono-table-th
                                                    :control-table.prop="table"
                                                    field="date"
                                                />
                                            </th>
                                            <th class="lr-col-amount">
                                                <mono-table-th
                                                    :control-table.prop="table"
                                                    field="amount"
                                                />
                                            </th>
                                            <th class="lr-col-prio">
                                                <mono-table-th
                                                    :control-table.prop="table"
                                                    field="priority"
                                                />
                                            </th>
                                            <th class="lr-col-status">
                                                <mono-table-th
                                                    :control-table.prop="table"
                                                    field="status"
                                                />
                                            </th>
                                            <th class="lr-col-act">Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        <tr v-for="(row, index) in rows" :key="row.id">
                                            <td class="lr-cell-muted">
                                                {{ index + 1 }}
                                            </td>

                                            <td class="lr-cell-key">
                                                {{ row.no }}
                                            </td>

                                            <td>{{ row.title }}</td>

                                            <td>
                                                <mono-chip
                                                    size="xs"
                                                    variant="soft"
                                                    color="primary"
                                                >
                                                    <span>{{ row.dept }}</span>
                                                </mono-chip>
                                            </td>

                                            <td>{{ row.requester }}</td>

                                            <td class="lr-cell-num">
                                                {{ row.date }}
                                            </td>

                                            <td class="lr-cell-num lr-cell-strong">
                                                {{ rupiah(row.amount) }}
                                            </td>

                                            <td>
                                                <mono-chip
                                                    size="xs"
                                                    variant="soft"
                                                    :color="PRIORITY_COLOR[row.priority]"
                                                >
                                                    <span>{{ row.priority }}</span>
                                                </mono-chip>
                                            </td>

                                            <td>
                                                <mono-chip
                                                    size="xs"
                                                    variant="soft"
                                                    :color="STATUS_COLOR[row.status]"
                                                >
                                                    <span>{{ row.status }}</span>
                                                </mono-chip>
                                            </td>

                                            <td>
                                                <span class="flex justify-center gap-1">
                                                    <mono-button
                                                        size="xs"
                                                        variant="tonal"
                                                        color="primary"
                                                        icon-only
                                                        tooltip="Open"
                                                    >
                                                        <span
                                                            slot="icon"
                                                            class="i-mdi-open-in-new"
                                                        ></span>
                                                    </mono-button>

                                                    <mono-button
                                                        size="xs"
                                                        variant="tonal"
                                                        color="danger"
                                                        icon-only
                                                        tooltip="Delete"
                                                    >
                                                        <span
                                                            slot="icon"
                                                            class="i-mdi-trash-can-outline"
                                                        ></span>
                                                    </mono-button>
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div
                                v-show="!rows.length && !loading"
                                mono-table-empty
                            >
                                <div mono-empty-title>
                                    No requests match
                                </div>
                                <div mono-empty-sub>
                                    Reset the filters or clear the search box.
                                </div>
                            </div>
                        </div>

                        <!-- TABLE FOOTER — info 6 / pagination 6 -->
                        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-12">
                            <div
                                data-region="table-info"
                                class="lr-subblock min-h-56px flex flex-wrap items-center gap-4 px-4 py-2 md:col-span-6"
                            >
                                <!-- `sizes` has to contain the controller's own
                                     `pageSize`, otherwise the select opens on a
                                     value the grid is not actually using. -->
                                <mono-table-page-size
                                    :control-table.prop="table"
                                    label="Rows:"
                                    :sizes.prop="[5, 10, 20, 50]"
                                />

                                <mono-table-info
                                    :control-table.prop="table"
                                    template="{from}–{to} of {total}"
                                />
                            </div>

                            <div
                                data-region="table-pagination"
                                class="lr-subblock min-h-56px flex items-center justify-end px-4 py-2 md:col-span-6"
                            >
                                <mono-table-paging :control-table.prop="table" />
                            </div>
                        </div>
                    </div>
                </mono-card>
            </div>

            <!-- ═══════════════════════════════════════════════════════════
                 FORM RULE
                 page-header → form-card*, each one
                 card-header → field-grid → form-actions.
                 One card = one independent edit scope.
                 ═══════════════════════════════════════════════════════════ -->
            <div v-show="rule === 'form'" class="grid grid-cols-1 gap-4">
                <mono-card
                    v-for="card in FORM_CARDS"
                    :key="card.id"
                    data-region="form-card"
                    :data-mode="mode[card.id]"
                    bordered
                    width="100%"
                    class="lr-form-card"
                    @keydown="onCardKeydown(card.id, $event)"
                >
                    <div class="grid grid-cols-1 gap-3">

                        <!-- CARD HEADER — title left, edit affordance right -->
                        <div
                            data-region="card-header"
                            class="lr-subblock min-h-60px flex flex-wrap items-center gap-3 px-4 py-2"
                        >
                            <span class="min-w-0">
                                <span class="block text-[.9rem] font-700">
                                    {{ card.title }}
                                </span>
                                <span class="block text-[.72rem] opacity-65">
                                    {{ card.subtitle }}
                                </span>
                            </span>

                            <mono-chip
                                data-badge="editing"
                                size="xs"
                                variant="soft"
                                color="warning"
                            >
                                <span>EDITING</span>
                            </mono-chip>

                            <mono-chip
                                v-show="savedFlash[card.id]"
                                size="xs"
                                variant="soft"
                                color="success"
                            >
                                <span>SAVED</span>
                            </mono-chip>

                            <span class="ml-auto"></span>

                            <mono-button
                                data-action="edit"
                                size="sm"
                                variant="tonal"
                                color="primary"
                                icon-only
                                rounded="full"
                                tooltip="Edit this card"
                                @click="enterEdit(card.id)"
                            >
                                <span slot="icon" class="i-mdi-pencil-outline"></span>
                            </mono-button>
                        </div>

                        <!-- FIELD GRID — each card owns its own column count -->
                        <div data-region="field-grid" :class="card.grid">
                            <div
                                v-for="field in card.fields"
                                :key="field.key"
                                data-field
                                :data-region="'field-' + field.key"
                                class="lr-field"
                                :class="field.span"
                            >
                                <span class="lr-field-label">
                                    {{ field.label }}
                                </span>

                                <!-- VIEW — plain text, the default state -->
                                <span class="fld-view lr-field-value">
                                    {{ viewText(field) }}
                                </span>

                                <!-- EDIT — one mono control per field type -->
                                <mono-input
                                    v-if="field.type === 'text'"
                                    class="fld-edit"
                                    size="sm"
                                    :model-value="draft[field.key]"
                                    @input="draft[field.key] = $event.detail.modelValue"
                                ></mono-input>

                                <mono-input
                                    v-else-if="field.type === 'number'"
                                    class="fld-edit"
                                    size="sm"
                                    type="number"
                                    :model-value="draft[field.key]"
                                    @input="draft[field.key] = $event.detail.modelValue"
                                ></mono-input>

                                <mono-select
                                    v-else-if="field.type === 'select'"
                                    class="fld-edit"
                                    size="sm"
                                    :items.prop="field.items"
                                    key-value="value"
                                    display-value="label"
                                    :model-value="draft[field.key]"
                                    @change="draft[field.key] = $event.detail.modelValue"
                                ></mono-select>

                                <mono-date
                                    v-else-if="field.type === 'date'"
                                    class="fld-edit"
                                    size="sm"
                                    :model-value="draft[field.key]"
                                    @change="draft[field.key] = $event.detail.modelValue"
                                ></mono-date>

                                <mono-textarea
                                    v-else-if="field.type === 'textarea'"
                                    class="fld-edit"
                                    size="sm"
                                    rows="3"
                                    :model-value="draft[field.key]"
                                    @input="draft[field.key] = $event.detail.modelValue"
                                ></mono-textarea>

                                <mono-switch
                                    v-else-if="field.type === 'switch'"
                                    class="fld-edit"
                                    size="sm"
                                    :model-value.prop="draft[field.key]"
                                    @change="draft[field.key] = $event.detail.modelValue"
                                ></mono-switch>
                            </div>
                        </div>

                        <!-- FORM ACTIONS — edit mode only, right-aligned -->
                        <div
                            data-region="form-actions"
                            class="lr-subblock min-h-60px flex flex-wrap items-center justify-end gap-3 px-4 py-2"
                        >
                            <span class="mr-auto text-[.72rem] opacity-65">
                                Press <kbd class="lr-kbd">Esc</kbd> to discard this card.
                            </span>

                            <mono-button
                                data-action="cancel"
                                size="sm"
                                variant="outline"
                                color="secondary"
                                @click="discardEdit(card.id)"
                            >
                                Discard
                            </mono-button>

                            <mono-button
                                data-action="save"
                                size="sm"
                                color="primary"
                                @click="saveEdit(card.id)"
                            >
                                Save
                            </mono-button>
                        </div>
                    </div>
                </mono-card>
            </div>
        </main>

        <!-- ═══ RULE PICKER — floating, outside the skeleton ═════
             Deliberately not inside `main` and deliberately not a region:
             it chooses the rule, so it must not read as part of one. -->
        <div class="lr-rulemenu">
            <mono-dropdown
                placement="top-end"
                :model-value="ruleMenuOpen"
                @toggle="ruleMenuOpen = $event.detail.modelValue"
            >
                <mono-button
                    slot="main"
                    variant="outline"
                    color="secondary"
                    rounded="full"
                    class="lr-rulemenu-fab"
                    :aria-expanded="ruleMenuOpen"
                >
                    <span
                        slot="icon"
                        :class="ruleMenuOpen ? 'i-mdi-close' : 'i-mdi-format-list-bulleted-square'"
                    ></span>
                    <span class="lr-rulemenu-label">{{ activeRule.label }}</span>
                </mono-button>

                <div slot="body" class="lr-rulemenu-panel">
                    <mono-menu
                        :items.prop="RULE_MENU_ITEMS"
                        :nav="false"
                        density="compact"
                        :model-value="rule"
                        @change="pickRule($event.detail.value)"
                    ></mono-menu>
                </div>
            </mono-dropdown>
        </div>
    </div>
</template>

<style>
/* Every colour below is a theme token (shadcn/Basecoat vocabulary), so the
   page follows the site's flavor, palette and dark mode. */

/* ── Page shell ──────────────────────────────────────────────────────────── */
.lr-page {
    background: var(--muted);
    color: var(--foreground);
    font-family: var(--font-sans);
}

/* Region panels. `lr-block` is a page-level region, `lr-subblock` a region
   inside a card — the two levels are what keeps the rule readable at a glance
   without every block turning into a card of its own. */
.lr-page .lr-block {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--mono-radius-lg);
}

.lr-page .lr-subblock {
    background: var(--muted);
    border: 1px solid var(--border);
    border-radius: var(--mono-radius-md);
}

.lr-page .lr-title {
    background: linear-gradient(135deg, var(--accent) 0%, var(--card) 60%);
}

.lr-page .lr-table-card,
.lr-page .lr-form-card {
    --mono-card-padding: 0.85rem;
    min-width: 0;
    max-width: 100%;
}

/* ── Field cell — the atom of the form rule ──────────────────────────────── */
.lr-page .lr-field {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.35rem;
    min-height: 88px;
    min-width: 0;
    padding: 0.7rem 0.9rem;
    background: var(--muted);
    border: 1px solid var(--border);
    border-radius: var(--mono-radius-md);
}

.lr-page .lr-field-label {
    font-size: 0.66rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted-foreground);
}

.lr-page .lr-field-value {
    font-size: 0.85rem;
    font-weight: 600;
    line-height: 1.35;
    overflow-wrap: anywhere;
}

.lr-page .lr-kbd {
    font-family: ui-monospace, monospace;
    font-size: 0.68rem;
    padding: 1px 5px;
    border: 1px solid var(--border);
    border-bottom-width: 2px;
    border-radius: var(--mono-radius-sm);
    background: var(--card);
}

/* ── View / edit switch — CSS, not v-if ──────────────────────────────────
   `data-mode` sits on the mono-card, so the whole card flips at once and the
   light-DOM children of the card are never torn down. */
.lr-page [data-mode='view'] .fld-edit,
.lr-page [data-mode='view'] [data-region='form-actions'],
.lr-page [data-mode='view'] [data-badge='editing'] {
    display: none !important;
}

.lr-page [data-mode='edit'] .fld-view,
.lr-page [data-mode='edit'] [data-action='edit'] {
    display: none !important;
}

/* ── Table ───────────────────────────────────────────────────────────────── */
.lr-page .lr-table {
    min-width: 1180px;
}

.lr-page .lr-col-no {
    width: 3.5rem;
    text-align: center;
}

.lr-page .lr-col-req {
    width: 9.5rem;
}

.lr-page .lr-col-title {
    min-width: 15rem;
}

.lr-page .lr-col-dept,
.lr-page .lr-col-user,
.lr-page .lr-col-amount {
    width: 10rem;
}

.lr-page .lr-col-date {
    width: 7.5rem;
}

.lr-page .lr-col-prio {
    width: 7rem;
}

.lr-page .lr-col-status {
    width: 9.5rem;
}

.lr-page .lr-col-act {
    width: 6.5rem;
    text-align: center;
}

.lr-page .lr-cell-muted {
    text-align: center;
    color: var(--muted-foreground);
    font-variant-numeric: tabular-nums;
}

.lr-page .lr-cell-key {
    font-weight: 700;
    color: var(--primary);
    font-variant-numeric: tabular-nums;
}

.lr-page .lr-cell-num {
    font-variant-numeric: tabular-nums;
}

.lr-page .lr-cell-strong {
    font-weight: 700;
}

/* ── Region overlay — the rule, made visible ─────────────────────────────
   Every block on this page carries `data-region="…"`; with the switch on,
   each one is outlined and labelled where it sits. */
.lr-page.show-regions [data-region] {
    position: relative;
    outline: 1px dashed var(--primary);
    outline-offset: 2px;
}

.lr-page.show-regions [data-region]::after {
    content: attr(data-region);
    position: absolute;
    top: 0;
    right: 0;
    z-index: 3;
    padding: 1px 6px;
    font-family: ui-monospace, monospace;
    font-size: 9px;
    line-height: 1.5;
    letter-spacing: 0.04em;
    color: var(--primary-foreground);
    background: var(--primary);
    border-radius: 0 0 0 6px;
    pointer-events: none;
}

/* Container regions take the accent AND the opposite corner. A container and
   its first child share the top-right corner, so moving containers to the
   bottom-left is what keeps both labels readable — and keeps them off the
   heading text a container's first row usually starts with. */
.lr-page.show-regions [data-region='page-header']::after,
.lr-page.show-regions [data-region='filter-accordion']::after,
.lr-page.show-regions [data-region='filter-grid']::after,
.lr-page.show-regions [data-region='table']::after,
.lr-page.show-regions [data-region='table-content']::after,
.lr-page.show-regions [data-region='form-card']::after,
.lr-page.show-regions [data-region='field-grid']::after {
    top: auto;
    bottom: 0;
    left: 0;
    right: auto;
    color: var(--purple-foreground);
    background: var(--purple);
    border-radius: 0 6px 0 0;
}

/* ── Rule picker: floating chrome, never a region ───────────────────────
   Pinned to the viewport so it costs the layout nothing: the skeleton below
   it is exactly the rule, with no picker row wedged into the flow. */
.lr-page .lr-rulemenu {
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 60;
}

.lr-page .lr-rulemenu-fab {
    background: var(--card);
    box-shadow: var(--mono-shadow-md);
    border-radius: 999px;
}

.lr-page .lr-rulemenu-panel {
    min-width: 13rem;
}

@media (max-width: 520px) {
    .lr-page .lr-rulemenu-label {
        display: none;
    }
}
</style>
