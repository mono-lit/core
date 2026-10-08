<script setup lang="ts">
/**
 * Example — Odoo Sales Order
 * ─────────────────────────────────────────────────────────────────────────────
 * An Odoo-style sales-order screen built from mono components and static data:
 * a purple `mono-nav`, a status flow, a customer card, an order-lines table on
 * the `[mono-table]` styles, and confirmation modals.
 *
 * It follows the site's theme (flavor + color + dark mode), so every colour
 * below is a theme token, never a hex value.
 */
import { ref, computed, onBeforeUnmount } from 'vue'

if (!import.meta.env.SSR) {
    import('@mono-lit/helper/ui/nav')
    import('@mono-lit/helper/ui/breadcrumb')
    import('@mono-lit/helper/ui/button')
    import('@mono-lit/helper/ui/tabs')
    import('@mono-lit/helper/ui/chip')
    import('@mono-lit/helper/ui/card')
    import('@mono-lit/helper/ui/alert')
    import('@mono-lit/helper/ui/modal')
    import('@mono-lit/helper/ui/dropdown')
    import('@mono-lit/helper/ui/menu')
    import('@mono-lit/helper/ui/input')
    import('@mono-lit/helper/ui/select')
    import('@mono-lit/helper/ui/date')
    import('@mono-lit/helper/ui/textarea')
}

// ── Page-level state ─────────────────────────────────────────────────────────
type Status = 'quotation' | 'quotation-sent' | 'sales-order' | 'cancelled'
type Tone = 'info' | 'success' | 'danger'

const isEditMode = ref(false)
const activeTab = ref('order-lines')
const currentStatus = ref<Status>('sales-order')
const quotationNumber = ref('S00024')

// ── Toast (a mono-alert pinned to the corner) ────────────────────────────────
const toast = ref<{ text: string; tone: Tone } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

const TOAST_ICON: Record<Tone, string> = {
    info: 'i-mdi-information-outline',
    success: 'i-mdi-check-circle-outline',
    danger: 'i-mdi-alert-circle-outline',
}

function flashToast(text: string, tone: Tone = 'info') {
    toast.value = { text, tone }
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => (toast.value = null), 2400)
}

onBeforeUnmount(() => {
    if (toastTimer) clearTimeout(toastTimer)
})

// ── Customer form ────────────────────────────────────────────────────────────
const GST_TREATMENTS = [
    { label: 'Registered Business - Regular', value: 'Registered Business - Regular' },
    { label: 'Registered Business - Composition', value: 'Registered Business - Composition' },
    { label: 'Unregistered Business', value: 'Unregistered Business' },
    { label: 'Consumer', value: 'Consumer' },
]

const PAYMENT_TERMS = [
    { label: 'Immediate Payment', value: 'Immediate Payment' },
    { label: '15 Days', value: '15 Days' },
    { label: '30 Days', value: '30 Days' },
    { label: 'End of Following Month', value: 'End of Following Month' },
]

const customer = ref({
    name: 'Tom',
    address: 'Kerala KL\nIndia — BE0009999',
    gst: 'Registered Business - Regular' as string | null,
    orderDate: '2022-06-30',
    paymentTerms: 'Immediate Payment' as string | null,
})

const tabItems = [
    { id: 'order-lines', label: 'Order Lines' },
    { id: 'other-info', label: 'Other Info' },
]

const crumbItems = computed(() => [
    { id: 'quotations', title: 'Quotations', href: '#' },
    { id: 'current', title: quotationNumber.value, current: true },
])

// ── Order lines ──────────────────────────────────────────────────────────────
type LineKind = 'product' | 'section' | 'note'

interface OrderLine {
    id: number
    kind: LineKind
    product: string
    description: string
    quantity: number
    delivered: number
    invoiced: number
    uom: string
    unitPrice: number
    tax: string
}

let lineSeq = 1

function makeLine(patch: Partial<OrderLine>): OrderLine {
    return {
        id: lineSeq++,
        kind: 'product',
        product: '',
        description: '',
        quantity: 0,
        delivered: 0,
        invoiced: 0,
        uom: '',
        unitPrice: 0,
        tax: '',
        ...patch,
    }
}

const orderLines = ref<OrderLine[]>([
    makeLine({
        product: 'CAKE',
        description: 'Chocolate cake, 1 kg',
        quantity: 1,
        uom: 'Units',
        unitPrice: 600,
        tax: 'GST 5%',
    }),
])

/** Columns of a product row — sections and notes span all of them. */
const COLUMN_COUNT = 8

// ── Totals ───────────────────────────────────────────────────────────────────
const totals = computed(() => {
    const untaxed = orderLines.value
        .filter((l) => l.kind === 'product')
        .reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)
    const sgst = untaxed * 0.025
    const cgst = untaxed * 0.025
    return { untaxed, sgst, cgst, total: untaxed + sgst + cgst }
})

const inrFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})
const formatINR = (n: number) => inrFormatter.format(n)
const formatQty = (n: number) => n.toFixed(2)

// ── EDIT / CREATE ────────────────────────────────────────────────────────────
const newQuotationOpen = ref(false)

function onEditClick() {
    isEditMode.value = true
    flashToast('Edit mode enabled — fields are now editable.')
}

function confirmCreateNew() {
    newQuotationOpen.value = false
    quotationNumber.value = `S${String(24 + Math.floor(Math.random() * 100)).padStart(5, '0')}`
    customer.value = { name: '', address: '', gst: null, orderDate: '', paymentTerms: null }
    orderLines.value = []
    currentStatus.value = 'quotation'
    isEditMode.value = true
    flashToast(`New quotation ${quotationNumber.value} created.`, 'success')
}

function saveChanges() {
    isEditMode.value = false
    flashToast('Changes saved.', 'success')
}

function discardChanges() {
    isEditMode.value = false
    flashToast('Changes discarded.', 'danger')
}

// ── STATUS FLOW ──────────────────────────────────────────────────────────────
const statusSteps: { id: Status; label: string }[] = [
    { id: 'quotation', label: 'Quotation' },
    { id: 'quotation-sent', label: 'Quotation Sent' },
    { id: 'sales-order', label: 'Sales Order' },
]

function goToStatus(s: Status) {
    currentStatus.value = s
    flashToast(`Status: ${s.replace('-', ' ')}`)
}

const statusChip = computed(() => {
    if (currentStatus.value === 'cancelled') return { label: 'Cancelled', color: 'danger' }
    const step = statusSteps.find((s) => s.id === currentStatus.value)!
    return { label: step.label, color: currentStatus.value === 'sales-order' ? 'success' : 'info' }
})

// ── PRIMARY ACTIONS ──────────────────────────────────────────────────────────
const invoiceOpen = ref(false)
const emailOpen = ref(false)
const cancelOpen = ref(false)
const emailDraft = ref({ to: 'tom@example.com', subject: '', body: '' })

function openCreateInvoice() {
    if (currentStatus.value === 'cancelled') {
        flashToast('Cannot invoice a cancelled order.', 'danger')
        return
    }
    invoiceOpen.value = true
}

function confirmCreateInvoice() {
    invoiceOpen.value = false
    orderLines.value = orderLines.value.map((l) =>
        l.kind === 'product' ? { ...l, invoiced: l.quantity, delivered: l.quantity } : l,
    )
    currentStatus.value = 'sales-order'
    flashToast('Invoice created — order delivered & invoiced.', 'success')
}

function openSendByEmail() {
    emailDraft.value = {
        to: 'tom@example.com',
        subject: `Quotation ${quotationNumber.value}`,
        body: `Hi ${customer.value.name || 'there'}, please find your quotation attached.`,
    }
    emailOpen.value = true
}

function confirmSendEmail() {
    emailOpen.value = false
    if (currentStatus.value === 'quotation') currentStatus.value = 'quotation-sent'
    flashToast(`Email sent to ${emailDraft.value.to}.`, 'success')
}

function confirmCancel() {
    cancelOpen.value = false
    currentStatus.value = 'cancelled'
    flashToast('Order cancelled.', 'danger')
}

// ── PRINT + ACTION MENU ──────────────────────────────────────────────────────
const actionMenuOpen = ref(false)

const ACTION_ITEMS = [
    { id: 'duplicate', title: 'Duplicate', icon: 'i-mdi-content-copy' },
    { id: 'share', title: 'Share', icon: 'i-mdi-share-variant-outline' },
    { id: 'archive', title: 'Archive', icon: 'i-mdi-archive-outline' },
    { id: 'sep', type: 'divider' },
    { id: 'delete', title: 'Delete', icon: 'i-mdi-trash-can-outline' },
]

function onActionClick(event: CustomEvent) {
    const item = event.detail.item
    if (!item?.title) return
    actionMenuOpen.value = false
    flashToast(`Action: ${item.title}.`, item.id === 'delete' ? 'danger' : 'info')
}

function onPrint() {
    flashToast(`Print preview opened for ${quotationNumber.value}.`)
}

// ── STAT BUTTONS ─────────────────────────────────────────────────────────────
const customerPreviewOpen = ref(false)
const deliveryOpen = ref(false)
const purchaseOpen = ref(false)

// ── ORDER-LINE CRUD ──────────────────────────────────────────────────────────
function addProduct() {
    orderLines.value.push(
        makeLine({ product: 'NEW PRODUCT', description: 'New description', quantity: 1, uom: 'Units', unitPrice: 100, tax: 'GST 5%' }),
    )
    flashToast('Product line added.', 'success')
}

function addShipping() {
    orderLines.value.push(
        makeLine({ product: 'SHIPPING', description: 'Shipping & handling', quantity: 1, uom: 'Units', unitPrice: 50, tax: 'GST 5%' }),
    )
    flashToast('Shipping line added.', 'success')
}

function addSection() {
    orderLines.value.push(makeLine({ kind: 'section', description: 'New section' }))
    flashToast('Section added.')
}

function addNote() {
    orderLines.value.push(makeLine({ kind: 'note', description: 'Add your note here.' }))
    flashToast('Note added.')
}

function deleteLine(id: number) {
    orderLines.value = orderLines.value.filter((l) => l.id !== id)
    flashToast('Line removed.', 'danger')
}
</script>

<template>
    <div class="oddo-page min-h-screen">

        <!-- ===== TOP NAV ===== -->
        <mono-nav density="compact" variant="flat" color="purple">
            <div slot="start" class="flex items-center gap-3">
                <span class="i-mdi-apps text-[1.3rem] opacity-90"></span>
                <span class="text-[1.05rem] font-semibold">Sales</span>
            </div>

            <div class="oddo-nav-links">
                <a href="#" class="oddo-nav-link">Orders</a>
                <a href="#" class="oddo-nav-link">To Invoice</a>
                <a href="#" class="oddo-nav-link">Products</a>
                <a href="#" class="oddo-nav-link">Reporting</a>
                <a href="#" class="oddo-nav-link">Configuration</a>
            </div>
        </mono-nav>

        <main class="mx-auto max-w-7xl px-4 py-5 md:px-7">

            <!-- ===== BREADCRUMB ===== -->
            <div class="mb-3">
                <mono-breadcrumb :items.prop="crumbItems"></mono-breadcrumb>
            </div>

            <!-- ===== EDIT / CREATE  +  Print / Action ===== -->
            <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                    <mono-button
                        size="sm"
                        :variant="isEditMode ? 'solid' : 'outline'"
                        @click="onEditClick"
                    >Edit</mono-button>
                    <mono-button size="sm" variant="outline" @click="newQuotationOpen = true">
                        Create
                    </mono-button>
                </div>

                <div class="flex items-center gap-2">
                    <mono-button size="sm" variant="outline" color="secondary" @click="onPrint">
                        <span slot="icon" class="i-mdi-printer-outline"></span>
                        Print
                    </mono-button>

                    <mono-dropdown
                        placement="bottom-end"
                        :model-value="actionMenuOpen"
                        @toggle="actionMenuOpen = $event.detail.modelValue"
                    >
                        <mono-button slot="main" size="sm" variant="outline" color="secondary">
                            <span slot="icon" class="i-mdi-cog-outline"></span>
                            Action
                        </mono-button>
                        <div slot="body" class="oddo-menu">
                            <mono-menu
                                :items.prop="ACTION_ITEMS"
                                :nav="false"
                                :selectable="false"
                                density="compact"
                                @click="onActionClick"
                            ></mono-menu>
                        </div>
                    </mono-dropdown>
                </div>
            </div>

            <!-- ===== STATUS ACTIONS + FLOW ===== -->
            <div class="mb-3 flex flex-wrap items-center justify-between gap-4">
                <div class="flex flex-wrap items-center gap-2">
                    <mono-button
                        size="sm"
                        :disabled="currentStatus === 'cancelled'"
                        @click="openCreateInvoice"
                    >Create Invoice</mono-button>
                    <mono-button size="sm" variant="tonal" @click="openSendByEmail">
                        Send by Email
                    </mono-button>
                    <mono-button
                        size="sm"
                        variant="outline"
                        color="danger"
                        :disabled="currentStatus === 'cancelled'"
                        @click="cancelOpen = true"
                    >Cancel</mono-button>
                </div>

                <ol class="oddo-flow">
                    <li
                        v-for="step in statusSteps"
                        :key="step.id"
                        class="oddo-flow-step"
                        :data-active="step.id === currentStatus ? '' : null"
                        :title="`Move to ${step.label}`"
                        @click="goToStatus(step.id)"
                    >{{ step.label }}</li>
                    <li
                        v-if="currentStatus === 'cancelled'"
                        class="oddo-flow-step"
                        data-cancelled
                    >Cancelled</li>
                </ol>
            </div>

            <!-- ===== ORDER CARD ===== -->
            <mono-card bordered width="100%" class="oddo-card">

                <!-- STAT BUTTONS -->
                <div class="flex flex-wrap justify-end gap-2 px-5 pt-4">
                    <mono-button variant="outline" color="secondary" size="sm" @click="customerPreviewOpen = true">
                        <span slot="icon" class="i-mdi-earth"></span>
                        Customer Preview
                    </mono-button>
                    <mono-button variant="outline" color="secondary" size="sm" badge="1" @click="deliveryOpen = true">
                        <span slot="icon" class="i-mdi-truck-outline"></span>
                        Delivery
                    </mono-button>
                    <mono-button variant="outline" color="secondary" size="sm" badge="1" @click="purchaseOpen = true">
                        <span slot="icon" class="i-mdi-credit-card-outline"></span>
                        Purchase
                    </mono-button>
                </div>

                <div class="flex flex-wrap items-center gap-3 px-6 pb-2 pt-4 md:px-8">
                    <h1 class="oddo-title">{{ quotationNumber }}</h1>
                    <mono-chip size="sm" :color="statusChip.color"><span>{{ statusChip.label }}</span></mono-chip>
                </div>

                <!-- CUSTOMER / DATES GRID -->
                <div class="grid grid-cols-1 gap-x-12 gap-y-3 px-6 pb-6 md:grid-cols-2 md:px-8">
                    <div class="oddo-fields">
                        <div class="oddo-label">Customer</div>
                        <div v-if="!isEditMode">
                            <a href="#" class="oddo-link font-semibold">{{ customer.name || '—' }}</a>
                            <div class="mt-2 whitespace-pre-line text-[.85rem] leading-snug">{{ customer.address }}</div>
                        </div>
                        <div v-else class="flex flex-col gap-2">
                            <mono-input
                                size="sm"
                                placeholder="Customer name"
                                :model-value="customer.name"
                                @input="customer.name = $event.detail.modelValue"
                            ></mono-input>
                            <mono-textarea
                                size="sm"
                                rows="2"
                                placeholder="Address"
                                :model-value="customer.address"
                                @input="customer.address = $event.detail.modelValue"
                            ></mono-textarea>
                        </div>

                        <div class="oddo-label">GST Treatment</div>
                        <span v-if="!isEditMode" class="text-[.85rem]">{{ customer.gst || '—' }}</span>
                        <mono-select
                            v-else
                            size="sm"
                            placeholder="GST Treatment"
                            clearable
                            :items.prop="GST_TREATMENTS"
                            key-value="value"
                            display-value="label"
                            :model-value="customer.gst"
                            @change="customer.gst = $event.detail.modelValue"
                            @clear="customer.gst = null"
                        ></mono-select>
                    </div>

                    <div class="oddo-fields">
                        <div class="oddo-label">Order Date</div>
                        <span v-if="!isEditMode" class="text-[.85rem]">{{ customer.orderDate || '—' }}</span>
                        <mono-date
                            v-else
                            size="sm"
                            placeholder="Order date"
                            :model-value="customer.orderDate"
                            @change="customer.orderDate = $event.detail.modelValue"
                        ></mono-date>

                        <div class="oddo-label">Payment Terms</div>
                        <span v-if="!isEditMode" class="text-[.85rem]">{{ customer.paymentTerms || '—' }}</span>
                        <mono-select
                            v-else
                            size="sm"
                            placeholder="Payment terms"
                            :items.prop="PAYMENT_TERMS"
                            key-value="value"
                            display-value="label"
                            :model-value="customer.paymentTerms"
                            @change="customer.paymentTerms = $event.detail.modelValue"
                        ></mono-select>
                    </div>
                </div>

                <!-- TABS -->
                <div class="oddo-tabs px-6 pt-2 md:px-8">
                    <mono-tabs
                        :items.prop="tabItems"
                        :model-value="activeTab"
                        @change="activeTab = $event.detail.modelValue"
                    ></mono-tabs>
                </div>

                <!-- ORDER LINES -->
                <div v-show="activeTab === 'order-lines'" class="px-2 pb-6 pt-1">
                    <div mono-table-scroll>
                        <table mono-table mono-wide class="oddo-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Description</th>
                                    <th class="text-right">Quantity</th>
                                    <th class="text-right">Delivered</th>
                                    <th class="text-right">Invoiced</th>
                                    <th>UoM</th>
                                    <th class="text-right">Unit Price</th>
                                    <th>Taxes</th>
                                    <th v-if="isEditMode" class="w-12"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="line in orderLines" :key="line.id" :data-kind="line.kind">

                                    <!-- Section / note rows: one wide cell -->
                                    <td v-if="line.kind !== 'product'" :colspan="COLUMN_COUNT">
                                        <span v-if="!isEditMode">{{ line.description }}</span>
                                        <mono-input
                                            v-else
                                            size="sm"
                                            :model-value="line.description"
                                            @input="line.description = $event.detail.modelValue"
                                        ></mono-input>
                                    </td>

                                    <template v-else>
                                        <td>
                                            <a v-if="!isEditMode" href="#" class="oddo-link">{{ line.product }}</a>
                                            <mono-input
                                                v-else
                                                size="sm"
                                                :model-value="line.product"
                                                @input="line.product = $event.detail.modelValue"
                                            ></mono-input>
                                        </td>
                                        <td>
                                            <span v-if="!isEditMode">{{ line.description }}</span>
                                            <mono-input
                                                v-else
                                                size="sm"
                                                :model-value="line.description"
                                                @input="line.description = $event.detail.modelValue"
                                            ></mono-input>
                                        </td>
                                        <td class="text-right">
                                            <span v-if="!isEditMode">{{ formatQty(line.quantity) }}</span>
                                            <mono-input
                                                v-else
                                                size="sm"
                                                type="number"
                                                step="0.01"
                                                :model-value="String(line.quantity)"
                                                @input="line.quantity = Number($event.detail.modelValue) || 0"
                                            ></mono-input>
                                        </td>
                                        <td class="text-right">
                                            <span class="inline-flex items-center justify-end gap-1">
                                                {{ formatQty(line.delivered) }}
                                                <span
                                                    v-if="line.delivered < line.quantity"
                                                    class="i-mdi-truck-alert-outline oddo-warn"
                                                    title="Not fully delivered"
                                                ></span>
                                            </span>
                                        </td>
                                        <td class="text-right">{{ formatQty(line.invoiced) }}</td>
                                        <td>{{ line.uom }}</td>
                                        <td class="text-right">
                                            <span v-if="!isEditMode">{{ line.unitPrice.toFixed(2) }}</span>
                                            <mono-input
                                                v-else
                                                size="sm"
                                                type="number"
                                                step="0.01"
                                                :model-value="String(line.unitPrice)"
                                                @input="line.unitPrice = Number($event.detail.modelValue) || 0"
                                            ></mono-input>
                                        </td>
                                        <td>
                                            <mono-chip v-if="line.tax" size="xs" color="info"><span>{{ line.tax }}</span></mono-chip>
                                        </td>
                                    </template>

                                    <td v-if="isEditMode" class="text-center">
                                        <mono-button
                                            size="xs"
                                            variant="text"
                                            color="danger"
                                            rounded="full"
                                            icon-only
                                            tooltip="Delete line"
                                            aria-label-text="Delete line"
                                            @click="deleteLine(line.id)"
                                        >
                                            <span slot="icon" class="i-mdi-trash-can-outline"></span>
                                        </mono-button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div v-show="!orderLines.length" mono-table-empty>
                        <div mono-empty-title>No order lines yet</div>
                        <div mono-empty-sub>Click "Add a product" to start the quotation.</div>
                    </div>

                    <div class="flex flex-wrap gap-2 px-4 py-3">
                        <mono-button size="sm" variant="text" @click="addProduct">
                            <span slot="icon" class="i-mdi-plus"></span>
                            Add a product
                        </mono-button>
                        <mono-button size="sm" variant="text" @click="addSection">
                            <span slot="icon" class="i-mdi-format-section"></span>
                            Add a section
                        </mono-button>
                        <mono-button size="sm" variant="text" @click="addNote">
                            <span slot="icon" class="i-mdi-note-text-outline"></span>
                            Add a note
                        </mono-button>
                    </div>

                    <!-- TOTALS -->
                    <div class="mb-3 mt-8 flex flex-col items-end px-6">
                        <mono-button class="mb-2" size="sm" variant="outline" color="secondary" @click="addShipping">
                            <span slot="icon" class="i-mdi-truck-fast-outline"></span>
                            Add Shipping
                        </mono-button>

                        <dl class="oddo-totals">
                            <div><dt>Untaxed Amount:</dt><dd>{{ formatINR(totals.untaxed) }}</dd></div>
                            <div><dt>SGST:</dt><dd>{{ formatINR(totals.sgst) }}</dd></div>
                            <div><dt>CGST:</dt><dd>{{ formatINR(totals.cgst) }}</dd></div>
                            <div data-total><dt>Total:</dt><dd>{{ formatINR(totals.total) }}</dd></div>
                        </dl>
                    </div>
                </div>

                <!-- OTHER INFO -->
                <div v-show="activeTab === 'other-info'" class="px-6 py-10 text-[.85rem] md:px-8">
                    <h3 class="mb-3 mt-0 text-[1rem] font-semibold">Other information</h3>
                    <dl class="grid max-w-2xl grid-cols-[180px_1fr] gap-y-2">
                        <dt class="oddo-label">Salesperson</dt><dd>Administrator</dd>
                        <dt class="oddo-label">Sales Team</dt><dd>Direct Sales</dd>
                        <dt class="oddo-label">Customer Reference</dt><dd>—</dd>
                        <dt class="oddo-label">Tags</dt>
                        <dd class="flex flex-wrap gap-2">
                            <mono-chip size="sm" color="purple">Wholesale</mono-chip>
                            <mono-chip size="sm" color="success">Priority</mono-chip>
                        </dd>
                    </dl>
                </div>
            </mono-card>

            <!-- EDIT-MODE SAVE / DISCARD BAR -->
            <!-- A plain bar, not a mono-alert: light-DOM mono-buttons nested in
                 another light component's slot get captured by it. -->
            <div v-if="isEditMode" class="oddo-edit-bar">
                <span class="flex items-center gap-2">
                    <span class="i-mdi-pencil-outline"></span>
                    <strong>Unsaved changes</strong>
                </span>
                <span class="flex gap-2">
                    <mono-button size="sm" variant="outline" color="secondary" @click="discardChanges">Discard</mono-button>
                    <mono-button size="sm" @click="saveChanges">Save</mono-button>
                </span>
            </div>
        </main>

        <!-- ===== MODALS ===== -->
        <mono-modal
            title="Create new quotation?"
            color="info"
            :model-value="newQuotationOpen"
            @close="newQuotationOpen = false"
        >
            <p class="m-0">This will clear the current form and start a fresh quotation.</p>
            <mono-button slot="footer" size="sm" variant="tonal" color="secondary" @click="newQuotationOpen = false">Cancel</mono-button>
            <mono-button slot="footer" size="sm" @click="confirmCreateNew">Create</mono-button>
        </mono-modal>

        <mono-modal
            title="Create Invoice"
            color="success"
            :model-value="invoiceOpen"
            @close="invoiceOpen = false"
        >
            <p class="m-0 mb-2">An invoice will be generated for:</p>
            <p class="m-0 text-[1.05rem] font-bold">{{ formatINR(totals.total) }}</p>
            <p class="oddo-muted m-0 mt-2 text-[.85rem]">
                {{ orderLines.filter((l) => l.kind === 'product').length }} line(s), customer: {{ customer.name || '—' }}
            </p>
            <mono-button slot="footer" size="sm" variant="tonal" color="secondary" @click="invoiceOpen = false">Cancel</mono-button>
            <mono-button slot="footer" size="sm" color="success" @click="confirmCreateInvoice">Create Invoice</mono-button>
        </mono-modal>

        <mono-modal
            title="Send Quotation by Email"
            color="info"
            :model-value="emailOpen"
            @close="emailOpen = false"
        >
            <div class="flex flex-col gap-3">
                <mono-input
                    size="sm"
                    type="email"
                    label="To"
                    placeholder="email@example.com"
                    :model-value="emailDraft.to"
                    @input="emailDraft.to = $event.detail.modelValue"
                ></mono-input>
                <mono-input
                    size="sm"
                    label="Subject"
                    :model-value="emailDraft.subject"
                    @input="emailDraft.subject = $event.detail.modelValue"
                ></mono-input>
                <mono-textarea
                    size="sm"
                    label="Message"
                    rows="4"
                    :model-value="emailDraft.body"
                    @input="emailDraft.body = $event.detail.modelValue"
                ></mono-textarea>
            </div>
            <mono-button slot="footer" size="sm" variant="tonal" color="secondary" @click="emailOpen = false">Cancel</mono-button>
            <mono-button slot="footer" size="sm" :disabled="!emailDraft.to" @click="confirmSendEmail">
                <span slot="icon" class="i-mdi-send"></span>
                Send
            </mono-button>
        </mono-modal>

        <mono-modal
            title="Cancel order?"
            color="danger"
            :model-value="cancelOpen"
            @close="cancelOpen = false"
        >
            <p class="m-0 font-semibold">This will mark {{ quotationNumber }} as cancelled.</p>
            <p class="oddo-muted m-0 mt-1">You can still create a new quotation afterwards.</p>
            <mono-button slot="footer" size="sm" variant="tonal" color="secondary" @click="cancelOpen = false">Keep order</mono-button>
            <mono-button slot="footer" size="sm" color="danger" @click="confirmCancel">Cancel order</mono-button>
        </mono-modal>

        <mono-modal
            title="Customer Preview"
            color="info"
            :model-value="customerPreviewOpen"
            @close="customerPreviewOpen = false"
        >
            <dl class="grid grid-cols-[140px_1fr] gap-y-2 text-[.88rem]">
                <dt class="oddo-label">Name</dt><dd>{{ customer.name || '—' }}</dd>
                <dt class="oddo-label">Address</dt><dd class="whitespace-pre-line">{{ customer.address || '—' }}</dd>
                <dt class="oddo-label">GST</dt><dd>{{ customer.gst || '—' }}</dd>
                <dt class="oddo-label">Payment Terms</dt><dd>{{ customer.paymentTerms || '—' }}</dd>
            </dl>
            <mono-button slot="footer" size="sm" @click="customerPreviewOpen = false">Close</mono-button>
        </mono-modal>

        <mono-modal
            title="Delivery — DO/00012"
            color="info"
            :model-value="deliveryOpen"
            @close="deliveryOpen = false"
        >
            <p class="m-0 mb-2">Scheduled: <strong>2022-07-03</strong></p>
            <p class="m-0 mb-2">Carrier: <strong>BlueDart Express</strong></p>
            <p class="m-0">Status: <mono-chip size="sm" color="warning">Ready</mono-chip></p>
            <mono-button slot="footer" size="sm" @click="deliveryOpen = false">Close</mono-button>
        </mono-modal>

        <mono-modal
            title="Purchase — PO/00007"
            color="info"
            :model-value="purchaseOpen"
            @close="purchaseOpen = false"
        >
            <p class="m-0 mb-2">Vendor: <strong>Sweet Supplies Co.</strong></p>
            <p class="m-0 mb-2">Total: <strong>{{ formatINR(420) }}</strong></p>
            <p class="m-0">Status: <mono-chip size="sm" color="success">Confirmed</mono-chip></p>
            <mono-button slot="footer" size="sm" @click="purchaseOpen = false">Close</mono-button>
        </mono-modal>

        <!-- ===== TOAST ===== -->
        <transition name="oddo-toast">
            <div v-if="toast" class="oddo-toast">
                <mono-alert
                    variant="solid"
                    size="sm"
                    :color="toast.tone"
                    :icon="TOAST_ICON[toast.tone]"
                    :title="toast.text"
                ></mono-alert>
            </div>
        </transition>
    </div>
</template>

<style>
/* Every colour is a theme token, so the page follows the site's flavor,
   palette and dark mode. */
.oddo-page {
    font-family: var(--font-sans);
    color: var(--foreground);
    background: var(--muted);
}

/* ── NAV ─────────────────────────────────────────────────────────────────── */
.oddo-page .oddo-nav-links {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    font-size: .8rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: .04em;
}

.oddo-page .oddo-nav-link {
    color: inherit;
    opacity: .9;
    text-decoration: none;
}

.oddo-page .oddo-nav-link:hover {
    opacity: 1;
    text-decoration: underline;
}

/* ── STATUS FLOW (clickable chevrons) ────────────────────────────────────── */
.oddo-page .oddo-flow {
    display: flex;
    margin: 0;
    padding: 0;
    list-style: none;
}

.oddo-page .oddo-flow-step {
    margin-right: -10px;
    padding: .5rem 1.4rem .5rem 1.7rem;
    background: var(--card);
    color: var(--muted-foreground);
    font-size: .72rem;
    font-weight: 600;
    letter-spacing: .04em;
    text-transform: uppercase;
    white-space: nowrap;
    cursor: pointer;
    clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%);
    transition: background var(--mono-duration) var(--mono-ease), color var(--mono-duration) var(--mono-ease);
}

.oddo-page .oddo-flow-step:first-child {
    padding-left: 1.1rem;
    clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%);
}

.oddo-page .oddo-flow-step:hover {
    background: var(--accent);
    color: var(--foreground);
}

.oddo-page .oddo-flow-step[data-active] {
    background: var(--primary);
    color: var(--primary-foreground);
}

.oddo-page .oddo-flow-step[data-cancelled] {
    background: var(--destructive);
    color: var(--destructive-foreground);
}

/* ── CARD ────────────────────────────────────────────────────────────────── */
.oddo-page .oddo-card {
    --mono-card-padding: 0;
}

.oddo-page .oddo-title {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -.01em;
}

.oddo-page .oddo-fields {
    display: grid;
    grid-template-columns: 140px 1fr;
    align-items: start;
    gap: .75rem 0;
}

.oddo-page .oddo-label {
    font-size: .85rem;
    font-weight: 500;
    color: var(--muted-foreground);
}

.oddo-page .oddo-muted {
    color: var(--muted-foreground);
}

.oddo-page .oddo-link {
    color: var(--primary);
    text-decoration: none;
}

.oddo-page .oddo-link:hover {
    text-decoration: underline;
}

.oddo-page .oddo-tabs {
    border-top: 1px solid var(--border);
}

/* ── ORDER LINES ─────────────────────────────────────────────────────────── */
.oddo-page .oddo-table .text-right {
    text-align: right;
}

.oddo-page .oddo-table .text-center {
    text-align: center;
}

.oddo-page .oddo-table tr[data-kind='section'] td {
    font-weight: 700;
    background: var(--muted);
}

.oddo-page .oddo-table tr[data-kind='note'] td {
    font-style: italic;
    color: var(--muted-foreground);
}

.oddo-page .oddo-warn {
    color: var(--destructive);
}

.oddo-page .oddo-totals {
    width: 20rem;
    max-width: 100%;
    margin: 0;
    padding-top: .75rem;
    border-top: 1px solid var(--border);
    font-size: .88rem;
}

.oddo-page .oddo-totals > div {
    display: flex;
    justify-content: space-between;
    padding: .25rem 0;
}

.oddo-page .oddo-totals dt {
    font-weight: 500;
}

.oddo-page .oddo-totals dd {
    margin: 0;
}

.oddo-page .oddo-totals > div[data-total] {
    margin-top: .25rem;
    padding-top: .5rem;
    border-top: 1px solid var(--border);
    font-size: 1rem;
    font-weight: 700;
}

/* ── ACTION MENU PANEL ───────────────────────────────────────────────────── */
.oddo-page .oddo-menu {
    min-width: 12rem;
}

/* ── EDIT BAR ────────────────────────────────────────────────────────────── */
.oddo-page .oddo-edit-bar {
    position: sticky;
    bottom: 1rem;
    z-index: 10;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: .5rem;
    margin-top: 1rem;
    padding: .65rem 1rem;
    background: var(--card);
    border: 1px solid var(--warning);
    border-left-width: 4px;
    border-radius: var(--mono-radius-md);
    box-shadow: var(--mono-shadow-md);
    font-size: .85rem;
}

/* ── TOAST ───────────────────────────────────────────────────────────────── */
.oddo-page .oddo-toast {
    position: fixed;
    right: 1.5rem;
    bottom: 1.5rem;
    z-index: 1000;
    max-width: 360px;
    box-shadow: var(--mono-shadow-lg);
}

.oddo-toast-enter-active,
.oddo-toast-leave-active {
    transition: opacity var(--mono-duration) var(--mono-ease), transform var(--mono-duration) var(--mono-ease);
}

.oddo-toast-enter-from,
.oddo-toast-leave-to {
    opacity: 0;
    transform: translateY(8px);
}
</style>
