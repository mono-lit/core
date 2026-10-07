<script setup lang="ts">
import { ref, computed } from 'vue'

if (!import.meta.env.SSR) {
    import('@mono-lit/helper/ui/nav')
    import('@mono-lit/helper/ui/breadcrumb')
    import('@mono-lit/helper/ui/button')
    import('@mono-lit/helper/ui/tabs')
    import('@mono-lit/helper/ui/chip')
    import('@mono-lit/helper/ui/modal')
    import('@mono-lit/helper/ui/dropdown')
    import('@mono-lit/helper/ui/input')
}

// â”€â”€ Page-level state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type Status = 'quotation' | 'quotation-sent' | 'sales-order' | 'cancelled'

const isEditMode = ref(false)
const activeTab = ref('order-lines')
const currentStatus = ref<Status>('sales-order')
const quotationNumber = ref('S00024')

const toast = ref<{ text: string; tone: 'info' | 'success' | 'danger' } | null>(
    null,
)
let toastTimer: ReturnType<typeof setTimeout> | null = null
function flashToast(text: string, tone: 'info' | 'success' | 'danger' = 'info') {
    toast.value = { text, tone }
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => (toast.value = null), 2400)
}

// â”€â”€ Reactive form data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const customer = ref({
    name: 'Tom',
    address: 'Kerala KL\nIndia â€” bBE0009999',
    gst: 'Registered Business - Regular',
    orderDate: '06/30/2022 19:58:32',
    paymentTerms: 'Immediate Payment',
})

const tabItems = [
    { id: 'order-lines', label: 'Order Lines' },
    { id: 'other-info', label: 'Other Info' },
]

const crumbItems = [
    { id: 'q', title: 'Quotations', href: '#' },
    { id: 's', title: quotationNumber.value, current: true },
]

interface OrderLine {
    id: number
    product: string
    description: string
    quantity: number
    delivered: number
    invoiced: number
    uom: string
    packagingQty: string
    packaging: string
    unitPrice: number
    tax: string
}

let lineSeq = 1
function nextLineId() {
    return lineSeq++
}

const orderLines = ref<OrderLine[]>([
    {
        id: nextLineId(),
        product: 'CAKE',
        description: 'CAKE',
        quantity: 1.0,
        delivered: 0.0,
        invoiced: 0.0,
        uom: 'Units',
        packagingQty: '',
        packaging: '',
        unitPrice: 600.0,
        tax: 'GST 5%',
    },
])

// â”€â”€ Totals (reactive) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const totals = computed(() => {
    const untaxed = orderLines.value.reduce(
        (s, l) => s + l.unitPrice * l.quantity,
        0,
    )
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

// â”€â”€ EDIT / CREATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const newQuotationOpen = ref(false)
function onEditClick() {
    isEditMode.value = true
    flashToast('Edit mode enabled â€” fields are now editable.', 'info')
}
function onCreateClick() {
    newQuotationOpen.value = true
}
function confirmCreateNew() {
    newQuotationOpen.value = false
    quotationNumber.value = `S${String(
        24 + Math.floor(Math.random() * 100),
    ).padStart(5, '0')}`
    customer.value = {
        name: '',
        address: '',
        gst: '',
        orderDate: '',
        paymentTerms: '',
    }
    orderLines.value = []
    currentStatus.value = 'quotation'
    isEditMode.value = true
    crumbItems[1].title = quotationNumber.value
    flashToast(`New quotation ${quotationNumber.value} created.`, 'success')
}

// â”€â”€ STATUS FLOW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const statusSteps: { id: Status; label: string }[] = [
    { id: 'quotation', label: 'Quotation' },
    { id: 'quotation-sent', label: 'Quotation Sent' },
    { id: 'sales-order', label: 'Sales Order' },
]
function goToStatus(s: Status) {
    currentStatus.value = s
    flashToast(`Status: ${s.replace('-', ' ')}`, 'info')
}

// â”€â”€ PRIMARY ACTIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    orderLines.value = orderLines.value.map((l) => ({
        ...l,
        invoiced: l.quantity,
        delivered: l.quantity,
    }))
    currentStatus.value = 'sales-order'
    flashToast('Invoice created â€” order delivered & invoiced.', 'success')
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
    if (currentStatus.value === 'quotation') {
        currentStatus.value = 'quotation-sent'
    }
    flashToast(`Email sent to ${emailDraft.value.to}.`, 'success')
}
function openCancel() {
    cancelOpen.value = true
}
function confirmCancel() {
    cancelOpen.value = false
    currentStatus.value = 'cancelled'
    flashToast('Order cancelled.', 'danger')
}

// â”€â”€ PRINT + ACTION DROPDOWN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const actionMenuOpen = ref(false)
function onPrint() {
    flashToast(`Print preview opened for ${quotationNumber.value}.`, 'info')
}
function runAction(name: string) {
    actionMenuOpen.value = false
    flashToast(`Action: ${name}.`, 'info')
}

// â”€â”€ STAT TILES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const customerPreviewOpen = ref(false)
const deliveryOpen = ref(false)
const purchaseOpen = ref(false)

// â”€â”€ ORDER-LINE CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function addProduct() {
    orderLines.value.push({
        id: nextLineId(),
        product: 'NEW PRODUCT',
        description: 'New description',
        quantity: 1,
        delivered: 0,
        invoiced: 0,
        uom: 'Units',
        packagingQty: '',
        packaging: '',
        unitPrice: 100,
        tax: 'GST 5%',
    })
    flashToast('Product line added.', 'success')
}
function addShipping() {
    orderLines.value.push({
        id: nextLineId(),
        product: 'SHIPPING',
        description: 'Shipping & handling',
        quantity: 1,
        delivered: 0,
        invoiced: 0,
        uom: 'Units',
        packagingQty: '',
        packaging: '',
        unitPrice: 50,
        tax: 'GST 5%',
    })
    flashToast('Shipping line added.', 'success')
}
function addSection() {
    orderLines.value.push({
        id: nextLineId(),
        product: 'â”€â”€ SECTION â”€â”€',
        description: '',
        quantity: 0,
        delivered: 0,
        invoiced: 0,
        uom: '',
        packagingQty: '',
        packaging: '',
        unitPrice: 0,
        tax: '',
    })
    flashToast('Section added.', 'info')
}
function addNote() {
    orderLines.value.push({
        id: nextLineId(),
        product: 'Note',
        description: 'Add your note here.',
        quantity: 0,
        delivered: 0,
        invoiced: 0,
        uom: '',
        packagingQty: '',
        packaging: '',
        unitPrice: 0,
        tax: '',
    })
    flashToast('Note added.', 'info')
}
function deleteLine(id: number) {
    orderLines.value = orderLines.value.filter((l) => l.id !== id)
    flashToast('Line removed.', 'danger')
}

// â”€â”€ STATUS DERIVED â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const statusLabel = computed(() => {
    if (currentStatus.value === 'cancelled') return 'CANCELLED'
    return statusSteps.find((s) => s.id === currentStatus.value)!.label.toUpperCase()
})
</script>

<template>
    <div class="oddo-page theme-nova theme-color-basecoat min-h-screen">

        <!-- ===== TOP NAV (Odoo purple) ===== -->
        <mono-nav density="comfortable" variant="flat" :sticky="true" class="oddo-nav">
            <div slot="start" class="flex items-center gap-4 text-white">
                <span class="i-mdi-apps text-[1.4rem] opacity-90 cursor-pointer"></span>
                <span class="text-[1.15rem] font-semibold">Sales</span>
            </div>

            <div class="flex items-center gap-6 text-[.83rem] font-medium uppercase tracking-wide">
                <a href="#" class="oddo-nav-link">Orders</a>
                <a href="#" class="oddo-nav-link">To Invoice</a>
                <a href="#" class="oddo-nav-link">Products</a>
                <a href="#" class="oddo-nav-link">Reporting</a>
                <a href="#" class="oddo-nav-link">Configuration</a>
            </div>
        </mono-nav>

        <main class="px-7 py-5 max-w-7xl mx-auto">

            <!-- ===== BREADCRUMB ===== -->
            <div class="mb-3">
                <mono-breadcrumb :items.prop="crumbItems"></mono-breadcrumb>
            </div>

            <!-- ===== PRIMARY ACTION ROW: EDIT/CREATE  +  Print/Action ===== -->
            <div class="flex items-center justify-between mb-3 flex-wrap gap-3">
                <div class="flex items-center gap-0 oddo-btn-group">
                    <mono-button
                        size="sm"
                        color="primary"
                        :variant="isEditMode ? 'solid' : 'outline'"
                        @click="onEditClick"
                    >EDIT</mono-button>
                    <mono-button
                        size="sm"
                        color="primary"
                        variant="outline"
                        @click="onCreateClick"
                    >CREATE</mono-button>
                </div>

                <div class="flex items-center gap-2">
                    <mono-button size="sm" variant="outline" color="primary" @click="onPrint">
                        <span slot="icon" class="i-mdi-printer text-[1rem]"></span>
                        Print
                    </mono-button>

                    <mono-dropdown
                        placement="bottom-end"
                        :model-value="actionMenuOpen"
                        @change="actionMenuOpen = $event.detail.modelValue"
                    >
                        <mono-button slot="main" size="sm" variant="outline" color="primary">
                            <span slot="icon" class="i-mdi-cog text-[1rem]"></span>
                            Action
                        </mono-button>
                        <div slot="body" class="oddo-menu">
                            <button class="oddo-menu-item" @click="runAction('Duplicate')">
                                <span class="i-mdi-content-copy"></span>
                                Duplicate
                            </button>
                            <button class="oddo-menu-item" @click="runAction('Share')">
                                <span class="i-mdi-share-variant"></span>
                                Share
                            </button>
                            <button class="oddo-menu-item" @click="runAction('Archive')">
                                <span class="i-mdi-archive-outline"></span>
                                Archive
                            </button>
                            <div class="oddo-menu-sep"></div>
                            <button class="oddo-menu-item oddo-menu-item-danger" @click="runAction('Delete')">
                                <span class="i-mdi-trash-can-outline"></span>
                                Delete
                            </button>
                        </div>
                    </mono-dropdown>
                </div>
            </div>

            <!-- ===== STATUS FLOW ROW ===== -->
            <div class="flex items-stretch justify-between gap-4 mb-3 flex-wrap">
                <div class="flex items-center gap-2">
                    <mono-button
                        size="sm"
                        color="primary"
                        variant="solid"
                        :disabled="currentStatus === 'cancelled'"
                        @click="openCreateInvoice"
                    >CREATE INVOICE</mono-button>
                    <mono-button
                        size="sm"
                        color="primary"
                        variant="outline"
                        @click="openSendByEmail"
                    >SEND BY EMAIL</mono-button>
                    <mono-button
                        size="sm"
                        color="danger"
                        variant="outline"
                        :disabled="currentStatus === 'cancelled'"
                        @click="openCancel"
                    >CANCEL</mono-button>
                </div>

                <ol class="oddo-flow">
                    <li
                        v-for="step in statusSteps"
                        :key="step.id"
                        class="oddo-flow-step"
                        :class="{ 'oddo-flow-step-active': step.id === currentStatus }"
                        :title="`Move to ${step.label}`"
                        @click="goToStatus(step.id)"
                    >{{ step.label }}</li>
                    <li
                        v-if="currentStatus === 'cancelled'"
                        class="oddo-flow-step oddo-flow-step-cancelled"
                    >Cancelled</li>
                </ol>
            </div>

            <!-- ===== CARD WRAPPER ===== -->
            <section class="oddo-card">

                <!-- STATS TILES -->
                <div class="flex justify-end gap-2 px-5 pt-4 flex-wrap">
                    <mono-button
                        variant="solid"
                        color="light"
                        size="md"
                        class="oddo-stat-btn"
                        @click="customerPreviewOpen = true"
                    >
                        <span slot="icon" class="i-mdi-earth oddo-stat-icon"></span>
                        <span class="oddo-stat-text">
                            <span class="oddo-stat-line1">Customer</span>
                            <span class="oddo-stat-line2">Preview</span>
                        </span>
                    </mono-button>
                    <mono-button
                        variant="solid"
                        color="light"
                        size="md"
                        class="oddo-stat-btn"
                        @click="deliveryOpen = true"
                    >
                        <span slot="icon" class="i-mdi-truck-outline oddo-stat-icon"></span>
                        <span class="oddo-stat-text">
                            <span class="oddo-stat-line1">1</span>
                            <span class="oddo-stat-line2">Delivery</span>
                        </span>
                    </mono-button>
                    <mono-button
                        variant="solid"
                        color="light"
                        size="md"
                        class="oddo-stat-btn"
                        @click="purchaseOpen = true"
                    >
                        <span slot="icon" class="i-mdi-credit-card-outline oddo-stat-icon"></span>
                        <span class="oddo-stat-text">
                            <span class="oddo-stat-line1">1</span>
                            <span class="oddo-stat-line2">Purchase</span>
                        </span>
                    </mono-button>
                </div>

                <div class="px-8 pt-4 pb-2 flex items-center gap-3 flex-wrap">
                    <h1 class="m-0 text-[2.3rem] font-bold text-[var(--theme-text)] tracking-tight">{{ quotationNumber }}</h1>
                    <mono-chip
                        v-if="currentStatus === 'cancelled'"
                        mode="chip"
                        color="danger"
                        variant="soft"
                        shape="pill"
                        size="sm"
                        label="CANCELLED"
                    ></mono-chip>
                    <mono-chip
                        v-else
                        mode="chip"
                        color="info"
                        variant="soft"
                        shape="pill"
                        size="sm"
                        :label="statusLabel"
                    ></mono-chip>
                </div>

                <!-- CUSTOMER / DATES GRID -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 px-8 pb-6">
                    <!-- LEFT COLUMN -->
                    <div class="grid grid-cols-[140px_1fr] gap-y-3 items-start">
                        <div class="oddo-label">Customer</div>
                        <div>
                            <template v-if="!isEditMode">
                                <a href="#" class="oddo-link font-semibold">{{ customer.name || 'â€”' }}</a>
                                <div class="mt-2 text-[.85rem] text-[var(--theme-text)] leading-snug whitespace-pre-line">{{ customer.address }}</div>
                            </template>
                            <template v-else>
                                <mono-input
                                    size="sm"
                                    variant="outlined"
                                    placeholder="Customer name"
                                    :model-value="customer.name"
                                    @input="customer.name = $event.detail.modelValue"
                                ></mono-input>
                                <div class="mt-2">
                                    <mono-input
                                        size="sm"
                                        variant="outlined"
                                        placeholder="Address"
                                        :model-value="customer.address"
                                        @input="customer.address = $event.detail.modelValue"
                                    ></mono-input>
                                </div>
                            </template>
                        </div>

                        <div class="oddo-label">GST Treatment</div>
                        <div>
                            <span v-if="!isEditMode" class="text-[.85rem] text-[var(--theme-text)]">{{ customer.gst || 'â€”' }}</span>
                            <mono-input
                                v-else
                                size="sm"
                                variant="outlined"
                                placeholder="GST Treatment"
                                :model-value="customer.gst"
                                @input="customer.gst = $event.detail.modelValue"
                            ></mono-input>
                        </div>
                    </div>

                    <!-- RIGHT COLUMN -->
                    <div class="grid grid-cols-[140px_1fr] gap-y-3 items-start">
                        <div class="oddo-label">Order Date</div>
                        <div>
                            <span v-if="!isEditMode" class="text-[.85rem] text-[var(--theme-text)]">{{ customer.orderDate || 'â€”' }}</span>
                            <mono-input
                                v-else
                                size="sm"
                                variant="outlined"
                                :model-value="customer.orderDate"
                                @input="customer.orderDate = $event.detail.modelValue"
                            ></mono-input>
                        </div>

                        <div class="oddo-label">Payment Terms</div>
                        <div>
                            <span v-if="!isEditMode" class="text-[.85rem] text-[var(--theme-text)]">{{ customer.paymentTerms || 'â€”' }}</span>
                            <mono-input
                                v-else
                                size="sm"
                                variant="outlined"
                                :model-value="customer.paymentTerms"
                                @input="customer.paymentTerms = $event.detail.modelValue"
                            ></mono-input>
                        </div>
                    </div>
                </div>

                <!-- TABS -->
                <div class="px-8 pt-2 border-t border-[var(--theme-border)]">
                    <mono-tabs
                        :items.prop="tabItems"
                        :model-value="activeTab"
                        variant="underline"
                        color="primary"
                        @change="activeTab = $event.detail.modelValue"
                    ></mono-tabs>
                </div>

                <!-- ORDER LINES TABLE -->
                <div v-if="activeTab === 'order-lines'" class="px-2 pt-1 pb-6">
                    <div class="overflow-x-auto">
                        <table class="oddo-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Description</th>
                                    <th class="text-right">Quantity</th>
                                    <th class="text-right">Delivered</th>
                                    <th class="text-right">Invoiced</th>
                                    <th>UoM</th>
                                    <th class="text-right">Packaging Qty</th>
                                    <th>Packaging</th>
                                    <th class="text-right">Unit Price</th>
                                    <th>Taxes</th>
                                    <th v-if="isEditMode" class="text-center w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="line in orderLines" :key="line.id">
                                    <td>
                                        <a v-if="!isEditMode" href="#" class="oddo-link">{{ line.product }}</a>
                                        <input v-else type="text" class="oddo-cell-input" v-model="line.product" />
                                    </td>
                                    <td>
                                        <span v-if="!isEditMode">{{ line.description }}</span>
                                        <input v-else type="text" class="oddo-cell-input" v-model="line.description" />
                                    </td>
                                    <td class="text-right">
                                        <a v-if="!isEditMode" href="#" class="oddo-link">{{ formatQty(line.quantity) }}</a>
                                        <input v-else type="number" step="0.01" class="oddo-cell-input text-right" v-model.number="line.quantity" />
                                    </td>
                                    <td class="text-right">
                                        <a href="#" class="oddo-link inline-flex items-center justify-end gap-1">
                                            {{ formatQty(line.delivered) }}
                                            <span v-if="line.delivered < line.quantity" class="i-mdi-chart-bar text-[var(--theme-danger)]"></span>
                                        </a>
                                    </td>
                                    <td class="text-right">
                                        <a href="#" class="oddo-link">{{ formatQty(line.invoiced) }}</a>
                                    </td>
                                    <td>{{ line.uom }}</td>
                                    <td class="text-right">{{ line.packagingQty }}</td>
                                    <td>{{ line.packaging }}</td>
                                    <td class="text-right">
                                        <span v-if="!isEditMode">{{ line.unitPrice.toFixed(2) }}</span>
                                        <input v-else type="number" step="0.01" class="oddo-cell-input text-right" v-model.number="line.unitPrice" />
                                    </td>
                                    <td>
                                        <mono-chip
                                            v-if="line.tax"
                                            mode="chip"
                                            color="info"
                                            variant="soft"
                                            shape="pill"
                                            size="sm"
                                            :label="line.tax"
                                        ></mono-chip>
                                    </td>
                                    <td v-if="isEditMode" class="text-center">
                                        <mono-button
                                            size="xs"
                                            variant="outline"
                                            color="danger"
                                            shape="circle"
                                            icon-only
                                            aria-label-text="Delete line"
                                            @click="deleteLine(line.id)"
                                        >
                                            <span slot="icon" class="i-mdi-trash-can-outline"></span>
                                        </mono-button>
                                    </td>
                                </tr>
                                <tr v-if="!orderLines.length">
                                    <td :colspan="isEditMode ? 11 : 10" class="text-center text-[var(--theme-text-secondary)] py-6">No order lines yet â€” click "Add a product".</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="flex gap-2 px-4 py-3 text-[.83rem] flex-wrap">
                        <mono-button size="sm" variant="outline" color="primary" @click="addProduct">
                            <span slot="icon" class="i-mdi-plus"></span>
                            Add a product
                        </mono-button>
                        <mono-button size="sm" variant="outline" color="primary" @click="addSection">
                            <span slot="icon" class="i-mdi-format-list-bulleted"></span>
                            Add a section
                        </mono-button>
                        <mono-button size="sm" variant="outline" color="primary" @click="addNote">
                            <span slot="icon" class="i-mdi-note-text-outline"></span>
                            Add a note
                        </mono-button>
                    </div>

                    <!-- TOTALS STRIP -->
                    <div class="flex flex-col items-end px-6 mt-10 mb-3">
                        <div class="mb-2">
                            <mono-button size="sm" variant="outline" color="primary" @click="addShipping">
                                <span slot="icon" class="i-mdi-truck-fast-outline"></span>
                                ADD SHIPPING
                            </mono-button>
                        </div>

                        <dl class="w-80 border-t border-[var(--theme-border)] pt-3">
                            <div class="flex justify-between py-1 text-[.88rem]">
                                <dt class="text-[var(--theme-text)] font-medium">Untaxed Amount:</dt>
                                <dd>{{ formatINR(totals.untaxed) }}</dd>
                            </div>
                            <div class="flex justify-between py-1 text-[.88rem]">
                                <dt class="text-[var(--theme-text)] font-medium">SGST:</dt>
                                <dd>{{ formatINR(totals.sgst) }}</dd>
                            </div>
                            <div class="flex justify-between py-1 text-[.88rem]">
                                <dt class="text-[var(--theme-text)] font-medium">CGST:</dt>
                                <dd>{{ formatINR(totals.cgst) }}</dd>
                            </div>
                            <div class="flex justify-between py-2 text-[1rem] border-t border-[var(--theme-border)] mt-1">
                                <dt class="font-bold text-[var(--theme-text)]">Total:</dt>
                                <dd class="font-bold text-[var(--theme-text)]">{{ formatINR(totals.total) }}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                <div v-else class="px-8 py-12 text-[.85rem] text-[var(--theme-text)]">
                    <h3 class="mt-0 mb-3 text-[1rem] font-semibold">Other information</h3>
                    <dl class="grid grid-cols-[180px_1fr] gap-y-2 max-w-2xl">
                        <dt class="oddo-label">Salesperson</dt><dd>Administrator</dd>
                        <dt class="oddo-label">Sales Team</dt><dd>Direct Sales</dd>
                        <dt class="oddo-label">Customer Reference</dt><dd>â€”</dd>
                        <dt class="oddo-label">Tags</dt>
                        <dd class="flex gap-2 flex-wrap">
                            <mono-chip mode="chip" color="purple" variant="soft" shape="pill" size="sm" label="Wholesale"></mono-chip>
                            <mono-chip mode="chip" color="success" variant="soft" shape="pill" size="sm" label="Priority"></mono-chip>
                        </dd>
                    </dl>
                </div>
            </section>

            <!-- EDIT-MODE SAVE / DISCARD BAR -->
            <div v-if="isEditMode" class="oddo-edit-bar">
                <span class="text-[.85rem] text-[var(--theme-text)]">Unsaved changes</span>
                <div class="flex gap-2">
                    <mono-button size="sm" variant="outline" color="primary" @click="isEditMode = false; flashToast('Changes discarded.', 'danger')">Discard</mono-button>
                    <mono-button size="sm" variant="solid" color="primary" @click="isEditMode = false; flashToast('Changes saved.', 'success')">Save</mono-button>
                </div>
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
            <span slot="foot" class="flex justify-end gap-2">
                <mono-button variant="outline" color="primary" @click="newQuotationOpen = false">Cancel</mono-button>
                <mono-button variant="solid" color="primary" @click="confirmCreateNew">Create</mono-button>
            </span>
        </mono-modal>

        <mono-modal
            title="Create Invoice"
            color="success"
            :model-value="invoiceOpen"
            @close="invoiceOpen = false"
        >
            <p class="m-0 mb-2">An invoice will be generated for:</p>
            <p class="m-0 font-bold text-[1.05rem]">{{ formatINR(totals.total) }}</p>
            <p class="m-0 mt-2 text-[var(--theme-text-secondary)] text-[.85rem]">{{ orderLines.length }} line(s), customer: {{ customer.name || 'â€”' }}</p>
            <span slot="foot" class="flex justify-end gap-2">
                <mono-button variant="outline" color="primary" @click="invoiceOpen = false">Cancel</mono-button>
                <mono-button variant="solid" color="primary" @click="confirmCreateInvoice">Create Invoice</mono-button>
            </span>
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
                    variant="outlined"
                    label="To"
                    placeholder="email@example.com"
                    :model-value="emailDraft.to"
                    @input="emailDraft.to = $event.detail.modelValue"
                ></mono-input>
                <mono-input
                    size="sm"
                    variant="outlined"
                    label="Subject"
                    :model-value="emailDraft.subject"
                    @input="emailDraft.subject = $event.detail.modelValue"
                ></mono-input>
                <mono-input
                    size="sm"
                    variant="outlined"
                    label="Message"
                    :model-value="emailDraft.body"
                    @input="emailDraft.body = $event.detail.modelValue"
                ></mono-input>
            </div>
            <span slot="foot" class="flex justify-end gap-2">
                <mono-button variant="outline" color="primary" @click="emailOpen = false">Cancel</mono-button>
                <mono-button variant="solid" color="primary" :disabled="!emailDraft.to" @click="confirmSendEmail">
                    <span slot="icon" class="i-mdi-send"></span>
                    Send
                </mono-button>
            </span>
        </mono-modal>

        <mono-modal
            title="Cancel order?"
            color="danger"
            :model-value="cancelOpen"
            @close="cancelOpen = false"
        >
            <p class="m-0 font-semibold">This will mark {{ quotationNumber }} as cancelled.</p>
            <p class="m-0 mt-1 opacity-80">You can still create a new quotation afterwards.</p>
            <span slot="foot" class="flex justify-end gap-2">
                <mono-button variant="outline" color="primary" @click="cancelOpen = false">Keep order</mono-button>
                <mono-button variant="solid" color="danger" @click="confirmCancel">Cancel order</mono-button>
            </span>
        </mono-modal>

        <mono-modal
            title="Customer Preview"
            color="info"
            :model-value="customerPreviewOpen"
            @close="customerPreviewOpen = false"
        >
            <dl class="grid grid-cols-[140px_1fr] gap-y-2 text-[.88rem]">
                <dt class="oddo-label">Name</dt><dd>{{ customer.name || 'â€”' }}</dd>
                <dt class="oddo-label">Address</dt><dd class="whitespace-pre-line">{{ customer.address || 'â€”' }}</dd>
                <dt class="oddo-label">GST</dt><dd>{{ customer.gst || 'â€”' }}</dd>
                <dt class="oddo-label">Payment Terms</dt><dd>{{ customer.paymentTerms || 'â€”' }}</dd>
            </dl>
            <span slot="foot" class="flex justify-end gap-2">
                <mono-button variant="solid" color="primary" @click="customerPreviewOpen = false">Close</mono-button>
            </span>
        </mono-modal>

        <mono-modal
            title="Delivery â€” DO/00012"
            color="info"
            :model-value="deliveryOpen"
            @close="deliveryOpen = false"
        >
            <p class="m-0 mb-2">Scheduled: <strong>07/03/2022</strong></p>
            <p class="m-0 mb-2">Carrier: <strong>BlueDart Express</strong></p>
            <p class="m-0">Status: <mono-chip mode="chip" color="warning" variant="soft" shape="pill" size="sm" label="Ready"></mono-chip></p>
            <span slot="foot" class="flex justify-end gap-2">
                <mono-button variant="solid" color="primary" @click="deliveryOpen = false">Close</mono-button>
            </span>
        </mono-modal>

        <mono-modal
            title="Purchase â€” PO/00007"
            color="info"
            :model-value="purchaseOpen"
            @close="purchaseOpen = false"
        >
            <p class="m-0 mb-2">Vendor: <strong>Sweet Supplies Co.</strong></p>
            <p class="m-0 mb-2">Total: <strong>{{ formatINR(420) }}</strong></p>
            <p class="m-0">Status: <mono-chip mode="chip" color="success" variant="soft" shape="pill" size="sm" label="Confirmed"></mono-chip></p>
            <span slot="foot" class="flex justify-end gap-2">
                <mono-button variant="solid" color="primary" @click="purchaseOpen = false">Close</mono-button>
            </span>
        </mono-modal>

        <!-- ===== TOAST ===== -->
        <transition name="oddo-toast">
            <div v-if="toast" class="oddo-toast" :class="`oddo-toast-${toast.tone}`">
                <span
                    class="text-[1.05rem]"
                    :class="{
                        'i-mdi-information': toast.tone === 'info',
                        'i-mdi-check-circle': toast.tone === 'success',
                        'i-mdi-alert-circle': toast.tone === 'danger',
                    }"
                ></span>
                <span>{{ toast.text }}</span>
            </div>
        </transition>
    </div>
</template>

<style>
/* â”€â”€ ROOT â€” material theme + MUI Blue palette via mono tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€
   The wrapper carries .theme-material .theme-color-material so every
   var(--theme-*) lookup inside resolves to MUI Blue + Roboto + 4px radii
   + Material elevation, regardless of the site's outer theme switcher. */
.oddo-page {
    font-family: var(--theme-font-family);
    color: var(--theme-text);
    background: var(--theme-surface-soft);
    letter-spacing: 0;
}
.oddo-page, .oddo-page * { box-sizing: border-box; }

/* â”€â”€ NAV (MUI primary blue app bar) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.oddo-page .oddo-nav {
    background: var(--theme-primary);
    color: var(--theme-primary-contrast);
    box-shadow: var(--theme-elev-2);
}
.oddo-page .oddo-nav .mono-nav,
.oddo-page .oddo-nav > * {
    background: var(--theme-primary) !important;
    color: var(--theme-primary-contrast);
}
.oddo-page .oddo-nav-link {
    color: var(--theme-primary-contrast);
    opacity: 0.92;
    text-decoration: none;
    transition: opacity var(--theme-duration-fast) var(--theme-motion-standard);
}
.oddo-page .oddo-nav-link:hover { opacity: 1; text-decoration: underline; }

/* â”€â”€ BUTTON GROUP (EDIT / CREATE) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.oddo-page .oddo-btn-group mono-button + mono-button { margin-left: -1px; }

/* â”€â”€ STATUS FLOW (clickable chevron pills) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.oddo-page .oddo-flow {
    display: flex; list-style: none; margin: 0; padding: 0; gap: 0;
}
.oddo-page .oddo-flow-step {
    position: relative;
    padding: .55rem 1.4rem .55rem 1.7rem;
    background: var(--theme-surface);
    color: var(--theme-text-secondary);
    font-size: var(--theme-font-size-xs);
    font-weight: var(--theme-font-weight-medium);
    letter-spacing: var(--theme-letter-spacing-button);
    text-transform: uppercase;
    border: var(--theme-border-width) solid var(--theme-border);
    border-right: none;
    clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%);
    margin-right: -10px;
    white-space: nowrap;
    cursor: pointer;
    transition: background var(--theme-duration-fast) var(--theme-motion-standard),
                color var(--theme-duration-fast) var(--theme-motion-standard);
}
.oddo-page .oddo-flow-step:first-child {
    clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%);
    padding-left: 1.1rem;
}
.oddo-page .oddo-flow-step:hover {
    background: var(--theme-action-hover);
    color: var(--theme-text-primary);
}
.oddo-page .oddo-flow-step-active,
.oddo-page .oddo-flow-step-active:hover {
    background: var(--theme-primary);
    color: var(--theme-primary-contrast);
    border-color: var(--theme-primary);
}
.oddo-page .oddo-flow-step-cancelled,
.oddo-page .oddo-flow-step-cancelled:hover {
    background: var(--theme-danger);
    color: var(--theme-danger-contrast);
    border-color: var(--theme-danger);
}

/* â”€â”€ STATS TILES (mono-button "solid color=light" wrapper) â”€â”€
   variant=solid + color=light gives a light gradient bg + dark theme
   text (button.css:449-461). Material theme uppercases button text,
   so we explicitly opt the stat-tile labels back into natural case. */
.oddo-page .oddo-stat-btn > button,
.oddo-page .oddo-stat-btn > a {
    text-transform: none !important;
    letter-spacing: 0 !important;
}
.oddo-page .oddo-stat-icon {
    color: var(--theme-text-secondary);
    font-size: 1.25rem;
}
.oddo-page .oddo-stat-text {
    display: flex; flex-direction: column; align-items: flex-start;
    line-height: var(--theme-line-height-tight);
    text-align: left;
    text-transform: none;
}
.oddo-page .oddo-stat-line1 {
    font-weight: var(--theme-font-weight-medium);
    color: var(--theme-text-primary);
    font-size: var(--theme-font-size-sm);
}
.oddo-page .oddo-stat-line2 {
    color: var(--theme-text-secondary);
    font-size: var(--theme-font-size-xs);
}

/* â”€â”€ CARD WRAPPER (MUI Paper, elevation 1) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.oddo-page .oddo-card {
    background: var(--theme-surface);
    border-radius: var(--theme-radius-sm);
    box-shadow: var(--theme-elev-1);
}

/* â”€â”€ LABELS / LINKS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.oddo-page .oddo-label {
    font-size: var(--theme-font-size-sm);
    font-weight: var(--theme-font-weight-medium);
    color: var(--theme-text-secondary);
}
.oddo-page .oddo-link {
    color: var(--theme-primary);
    text-decoration: none;
    cursor: pointer;
    transition: color var(--theme-duration-fast) var(--theme-motion-standard);
}
.oddo-page .oddo-link:hover {
    text-decoration: underline;
    color: var(--theme-primary-dark);
}

/* â”€â”€ TABLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.oddo-page .oddo-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--theme-font-size-sm);
    min-width: 920px;
}
.oddo-page .oddo-table thead th {
    text-align: left;
    font-weight: var(--theme-font-weight-medium);
    color: var(--theme-text-secondary);
    padding: .75rem .75rem;
    border-bottom: var(--theme-border-width) solid var(--theme-border);
    background: var(--theme-surface);
    white-space: nowrap;
    text-transform: none;
}
.oddo-page .oddo-table tbody td {
    padding: .6rem .75rem;
    border-bottom: 1px solid var(--theme-divider);
    color: var(--theme-text-primary);
    vertical-align: middle;
}
.oddo-page .oddo-table tbody tr {
    transition: background var(--theme-duration-fast) var(--theme-motion-standard);
}
.oddo-page .oddo-table tbody tr:hover { background: var(--theme-action-hover); }
.oddo-page .oddo-table .text-right { text-align: right; }
.oddo-page .oddo-table .text-center { text-align: center; }
.oddo-page .oddo-cell-input {
    width: 100%;
    padding: .3rem .5rem;
    border: var(--theme-border-width) solid var(--theme-border);
    border-radius: var(--theme-radius-xs);
    font: inherit;
    font-family: var(--theme-font-family);
    font-size: var(--theme-font-size-sm);
    background: var(--theme-surface);
    color: var(--theme-text-primary);
    transition: border-color var(--theme-duration-fast) var(--theme-motion-standard),
                box-shadow var(--theme-duration-fast) var(--theme-motion-standard);
}
.oddo-page .oddo-cell-input:focus {
    outline: none;
    border-color: var(--theme-primary);
    box-shadow: var(--theme-focus-ring);
}

/* â”€â”€ TABS UNDERLINE TINT (uses theme primary) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.oddo-page mono-tabs {
    --mono-tabs-active-color: var(--theme-primary);
    --mono-tabs-indicator-color: var(--theme-primary);
}

/* â”€â”€ DROPDOWN MENU (MUI Menu look) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.oddo-page .oddo-menu {
    min-width: 180px;
    padding: .35rem 0;
    background: var(--theme-surface);
    border-radius: var(--theme-radius-sm);
}
.oddo-page .oddo-menu-item {
    width: 100%;
    display: flex; align-items: center; gap: .55rem;
    padding: .55rem 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
    font: inherit;
    font-family: var(--theme-font-family);
    font-size: var(--theme-font-size-sm);
    color: var(--theme-text-primary);
    text-align: left;
    transition: background var(--theme-duration-fast) var(--theme-motion-standard);
}
.oddo-page .oddo-menu-item:hover {
    background: var(--theme-action-hover);
    color: var(--theme-primary);
}
.oddo-page .oddo-menu-item-danger { color: var(--theme-danger); }
.oddo-page .oddo-menu-item-danger:hover {
    background: rgba(var(--theme-danger-rgb), .08);
    color: var(--theme-danger);
}
.oddo-page .oddo-menu-sep {
    height: 1px;
    background: var(--theme-divider);
    margin: .3rem 0;
}

/* â”€â”€ EDIT BAR (Material warning surface) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.oddo-page .oddo-edit-bar {
    position: sticky;
    bottom: 1rem;
    margin-top: 1rem;
    background: rgba(var(--theme-warning-rgb), .12);
    border: var(--theme-border-width) solid var(--theme-warning);
    border-radius: var(--theme-radius-sm);
    padding: .65rem 1rem;
    display: flex; align-items: center; justify-content: space-between;
    box-shadow: var(--theme-elev-2);
    color: var(--theme-text-primary);
    z-index: 10;
}

/* â”€â”€ TOAST (MUI Snackbar look) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.oddo-page .oddo-toast {
    position: fixed;
    bottom: 1.5rem; right: 1.5rem;
    display: flex; align-items: center; gap: .6rem;
    padding: .75rem 1.1rem;
    background: var(--theme-dark);
    color: #fff;
    border-radius: var(--theme-radius-sm);
    font-family: var(--theme-font-family);
    font-size: var(--theme-font-size-sm);
    font-weight: var(--theme-font-weight-medium);
    box-shadow: var(--theme-elev-3);
    z-index: 1000;
    max-width: 360px;
}
.oddo-page .oddo-toast-success { background: var(--theme-success); }
.oddo-page .oddo-toast-danger { background: var(--theme-danger); }
.oddo-toast-enter-active,
.oddo-toast-leave-active {
    transition: opacity var(--theme-duration-base) var(--theme-motion-standard),
                transform var(--theme-duration-base) var(--theme-motion-standard);
}
.oddo-toast-enter-from,
.oddo-toast-leave-to { opacity: 0; transform: translateY(8px); }

/* â”€â”€ ORDER NUMBER HEADING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.oddo-page h1 { color: var(--theme-text-primary); }
</style>
