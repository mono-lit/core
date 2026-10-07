<script setup lang="ts">
if (!import.meta.env.SSR) {
    import('@mono-lit/helper/ui/card')
    import('@mono-lit/helper/ui/chip')
}

type AccentColor = 'cobalt' | 'sky' | 'teal' | 'danger'

interface MenuItem {
    href: string
    icon: string
    title: string
    desc: string
    badge: string
    color: AccentColor
}

interface Section {
    id: string
    title: string
    sub?: string
    headerBadge?: string
    barFrom: string
    barTo: string
    items: MenuItem[]
}

// ── Quick stats (4 cards under the hero stats) ────────────────────────
const quickStats: { icon: string; num: string; label: string; color: AccentColor }[] = [
    { icon: 'i-mdi-bottle-tonic-outline', num: '1,248', label: 'Produk Aktif', color: 'cobalt' },
    { icon: 'i-mdi-store-outline', num: '386', label: 'Outlet Aktif', color: 'sky' },
    { icon: 'i-mdi-car-outline', num: '94', label: 'Salesman', color: 'teal' },
    { icon: 'i-mdi-gift-outline', num: '12', label: 'Promo Aktif', color: 'cobalt' },
]

// ── Section data — mirrors template/Opsi/dashboardV2.html ─────────────
const sections: Section[] = [
    {
        id: 'sellout',
        title: 'Sell Out',
        sub: 'Penjualan Harian & Bulanan',
        barFrom: '#2563a8',
        barTo: '#4a9fd4',
        items: [
            { href: '#', icon: 'i-mdi-cash-multiple', title: 'Sell Out (Hari)', desc: 'Menu penjualan harian', badge: 'Harian', color: 'cobalt' },
            { href: '#', icon: 'i-mdi-calendar-month-outline', title: 'Sell Out (Bulan)', desc: 'Menu penjualan bulanan', badge: 'Bulanan', color: 'sky' },
            { href: '#', icon: 'i-mdi-lock-clock', title: 'Periode Sales', desc: 'Tutup/buka periode', badge: 'Periode', color: 'cobalt' },
            { href: '#', icon: 'i-mdi-chart-bar', title: 'Report Sell Out', desc: 'Laporan Sales BA', badge: 'Report', color: 'sky' },
        ],
    },
    {
        id: 'sellin',
        title: 'Sell In',
        sub: 'Transaksi & Faktur',
        barFrom: '#4a9fd4',
        barTo: '#3aaa8c',
        items: [
            { href: '#', icon: 'i-mdi-receipt-text-outline', title: 'Sell In', desc: 'Transaksi Sell In', badge: 'Transaksi', color: 'sky' },
            { href: '#', icon: 'i-mdi-clipboard-text-outline', title: 'Faktur Penjualan', desc: 'Laporan Faktur Penjualan', badge: 'Faktur', color: 'cobalt' },
            { href: '#', icon: 'i-mdi-chart-line', title: 'Laporan Sell In', desc: 'Proses laporan Sell In', badge: 'Laporan', color: 'teal' },
            { href: '#', icon: 'i-mdi-swap-horizontal', title: 'Retur Distributor', desc: 'Form Retur', badge: 'Retur', color: 'sky' },
            { href: '#', icon: 'i-mdi-package-variant', title: 'Stock Outlet BA', desc: 'Tambah Stock', badge: 'Stock', color: 'cobalt' },
            { href: '#', icon: 'i-mdi-truck-delivery-outline', title: 'Tracking Order', desc: 'Tracking Order TMS', badge: 'Tracking', color: 'teal' },
            { href: '#', icon: 'i-mdi-refresh', title: 'SMT', desc: 'Monitoring SMT', badge: 'SMT', color: 'sky' },
        ],
    },
    {
        id: 'target',
        title: 'Target & Periode',
        barFrom: '#2563a8',
        barTo: '#3aaa8c',
        items: [
            { href: '#', icon: 'i-mdi-bullseye-arrow', title: 'Target Sales BA', desc: 'Input Target Sales BA', badge: 'Target', color: 'cobalt' },
            { href: '#', icon: 'i-mdi-briefcase-outline', title: 'Sales Quotation', desc: 'Form sales quotation', badge: 'Form', color: 'sky' },
            { href: '#', icon: 'i-mdi-scale-balance', title: 'SQ VS SO', desc: 'Laporan SQ VS SO', badge: 'Analisis', color: 'teal' },
            { href: '#', icon: 'i-mdi-medal-outline', title: 'Target Insentif Salesman', desc: 'Input Target Insentif', badge: 'Insentif', color: 'cobalt' },
        ],
    },
    {
        id: 'salesman',
        title: 'Salesman & BA',
        barFrom: '#4a9fd4',
        barTo: '#3aaa8c',
        items: [
            { href: '#', icon: 'i-mdi-car-outline', title: 'Salesman', desc: 'Monitoring Salesman', badge: 'Monitoring', color: 'cobalt' },
            { href: '#', icon: 'i-mdi-book-multiple-outline', title: 'Materi BA', desc: 'Materi untuk BA', badge: 'Materi', color: 'teal' },
            { href: '#', icon: 'i-mdi-test-tube', title: 'PK Test BA', desc: 'Form Test BA', badge: 'Test', color: 'sky' },
            { href: '#', icon: 'i-mdi-flask-outline', title: 'Sample Tester', desc: 'Alokasi sample tester', badge: 'Alokasi', color: 'teal' },
            { href: '#', icon: 'i-mdi-clipboard-check-outline', title: 'PPL', desc: 'Menu PPL', badge: 'PPL', color: 'cobalt' },
            { href: '#', icon: 'i-mdi-chart-bar', title: 'Report Realisasi PPL', desc: 'Laporan Realisasi PPL', badge: 'Report', color: 'sky' },
            { href: '#', icon: 'i-mdi-star-outline', title: 'Monitoring Bonus', desc: 'Monitoring bonus salesman', badge: 'Bonus', color: 'teal' },
            { href: '#', icon: 'i-mdi-medal-outline', title: 'Report Insentif BA', desc: 'Laporan insentif BA', badge: 'Insentif', color: 'cobalt' },
        ],
    },
    {
        id: 'promo',
        title: 'Promo & Kompetitor',
        barFrom: '#4a9fd4',
        barTo: '#2563a8',
        items: [
            { href: '#', icon: 'i-mdi-gift-outline', title: 'Promo Hanasui', desc: 'Aktivitas Promo Hanasui', badge: 'Promo', color: 'sky' },
            { href: '#', icon: 'i-mdi-trophy-outline', title: 'Kompetitor', desc: 'Promo Kompetitor', badge: 'Kompetitor', color: 'cobalt' },
            { href: '#', icon: 'i-mdi-tag-outline', title: 'Price Monitoring', desc: 'Menu Price Monitoring', badge: 'Monitoring', color: 'teal' },
            { href: '#', icon: 'i-mdi-folder-outline', title: 'Post Budget', desc: 'Post Budget PPL/Proposal', badge: 'Budget', color: 'cobalt' },
        ],
    },
    {
        id: 'klaim',
        title: 'Manajemen Klaim',
        headerBadge: '4,445 Pending',
        barFrom: '#ef4444',
        barTo: '#f87171',
        items: [
            { href: '#', icon: 'i-mdi-alert-octagon-outline', title: 'Klaim Sales', desc: 'Input klaim', badge: 'Klaim', color: 'danger' },
            { href: '#', icon: 'i-mdi-email-arrow-right-outline', title: 'Pengajuan Klaim', desc: 'Transaksi pengajuan klaim', badge: 'Pengajuan', color: 'danger' },
            { href: '#', icon: 'i-mdi-credit-card-outline', title: 'Pembayaran Klaim', desc: 'Form pembayaran klaim', badge: 'Pembayaran', color: 'danger' },
            { href: '#', icon: 'i-mdi-paperclip', title: 'Bukti Potong', desc: 'Bukti potong klaim', badge: 'Bukti', color: 'danger' },
            { href: '#', icon: 'i-mdi-message-text-outline', title: 'Form Keluhan', desc: 'Isi Form Keluhan', badge: 'Keluhan', color: 'danger' },
        ],
    },
    {
        id: 'logbook',
        title: 'Logbook',
        barFrom: '#2563a8',
        barTo: '#4a9fd4',
        items: [
            { href: '#', icon: 'i-mdi-book-open-outline', title: 'Logbook', desc: 'Logbook klaim', badge: 'Logbook', color: 'cobalt' },
            { href: '#', icon: 'i-mdi-wrench-outline', title: 'Logbook OPS', desc: 'Logbook Operasional', badge: 'OPS', color: 'sky' },
            { href: '#', icon: 'i-mdi-book-outline', title: 'Logbook NKA', desc: 'Logbook NKA-Klaim', badge: 'NKA', color: 'teal' },
            { href: '#', icon: 'i-mdi-bookmark-outline', title: 'Logbook MKT', desc: 'Logbook MKT-Klaim', badge: 'MKT', color: 'cobalt' },
        ],
    },
    {
        id: 'report',
        title: 'Report & Analisis',
        barFrom: '#4a9fd4',
        barTo: '#3aaa8c',
        items: [
            { href: '#', icon: 'i-mdi-chart-bar', title: 'Report Listing', desc: 'Laporan listing', badge: 'Listing', color: 'cobalt' },
            { href: '#', icon: 'i-mdi-folder-outline', title: '[SAP] Report Sales', desc: 'Laporan sales SAP', badge: 'SAP', color: 'sky' },
            { href: '#', icon: 'i-mdi-folder-multiple-outline', title: 'Report All', desc: 'Semua laporan', badge: 'All', color: 'teal' },
            { href: '#', icon: 'i-mdi-file-document-outline', title: 'Report Acc VS PPL', desc: 'Report Budget Acc VS PPL', badge: 'Budget', color: 'cobalt' },
            { href: '#', icon: 'i-mdi-cash', title: 'Report AR', desc: 'Account Receivable', badge: 'AR', color: 'sky' },
            { href: '#', icon: 'i-mdi-medal-outline', title: 'Report Insentif BA', desc: 'Laporan insentif BA', badge: 'Insentif', color: 'teal' },
        ],
    },
    {
        id: 'finance',
        title: 'Keuangan',
        barFrom: '#3aaa8c',
        barTo: '#4a9fd4',
        items: [
            { href: '#', icon: 'i-mdi-cash', title: 'Petty Cash', desc: 'Form Petty Cash', badge: 'Keuangan', color: 'teal' },
            { href: '#', icon: 'i-mdi-bank-outline', title: 'Master Vendor', desc: 'Data Master Vendor', badge: 'Vendor', color: 'sky' },
        ],
    },
    {
        id: 'master',
        title: 'Data Master',
        barFrom: '#2563a8',
        barTo: '#3aaa8c',
        items: [
            { href: '#', icon: 'i-mdi-database-outline', title: 'Master All Database', desc: 'Master seluruh database', badge: 'Master', color: 'cobalt' },
            { href: '#', icon: 'i-mdi-bottle-tonic-outline', title: 'Tambah Produk', desc: 'Tambah Produk Baru', badge: 'Produk', color: 'sky' },
            { href: '#', icon: 'i-mdi-store-outline', title: 'Store Baru', desc: 'Tambah Store Baru', badge: 'Store', color: 'teal' },
            { href: '#', icon: 'i-mdi-home-outline', title: 'Pengajuan Outlet', desc: 'Form pengajuan outlet', badge: 'Outlet', color: 'cobalt' },
            { href: '#', icon: 'i-mdi-account-outline', title: 'User Login', desc: 'Tambah user login', badge: 'User', color: 'sky' },
        ],
    },
    {
        id: 'visit',
        title: 'Visit & Monitoring',
        barFrom: '#4a9fd4',
        barTo: '#2563a8',
        items: [
            { href: '#', icon: 'i-mdi-eye-outline', title: 'Visit BA', desc: 'Form Visit BA Assessment', badge: 'Visit', color: 'cobalt' },
            { href: '#', icon: 'i-mdi-walk', title: 'Visit TL', desc: 'Visit Team Leader', badge: 'Visit', color: 'teal' },
        ],
    },
]

// ── Per-color UnoCSS class maps ──────────────────────────────────────
const iwBg: Record<AccentColor, string> = {
    cobalt: 'bg-[#eff6ff]',
    sky: 'bg-[#f0f8fd]',
    teal: 'bg-[#f0faf7]',
    danger: 'bg-[#fef2f2]',
}
const iwIcon: Record<AccentColor, string> = {
    cobalt: 'text-[#2563a8]',
    sky: 'text-[#4a9fd4]',
    teal: 'text-[#3aaa8c]',
    danger: 'text-[#dc2626]',
}
const titleClr: Record<AccentColor, string> = {
    cobalt: 'text-[#2563a8]',
    sky: 'text-[#2e7db0]',
    teal: 'text-[#2a8870]',
    danger: 'text-[#dc2626]',
}
const badgeBg: Record<AccentColor, string> = {
    cobalt: 'bg-[#eff6ff] text-[#2563a8] border-[#dbeafe]',
    sky: 'bg-[#f0f8fd] text-[#2e7db0] border-[#cde8f8]',
    teal: 'bg-[#f0faf7] text-[#2a8870] border-[#c6ede3]',
    danger: 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]',
}
</script>

<template>
    <div class="flex flex-col gap-8">

        <!-- ===== HERO STATS ROW ===== -->
        <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">

            <!-- Total Klaim — white card with progress -->
            <mono-card bordered shape="soft">
                <div class="relative overflow-hidden">
                    <span
                        class="pointer-events-none absolute right-2 top-2 text-[3.8rem] font-black leading-none tracking-tight text-[#2563a8] opacity-[.045] select-none">EJI</span>

                    <div class="text-[.7rem] font-bold uppercase tracking-[.13em] text-[#4a9fd4] mb-3">Total Klaim</div>

                    <div class="flex items-baseline gap-2 flex-wrap">
                        <span class="font-mono text-[2.8rem] font-bold leading-none text-[#2563a8]">53,129</span>
                        <span class="text-[1.5rem] text-[#d0e4f0]">/</span>
                        <span class="font-mono text-[1.9rem] font-semibold leading-none text-[#4a9fd4]">57,840</span>
                    </div>
                    <div class="text-[.73rem] text-[#6a8098] mt-1">Klaim Selesai / Total Klaim Masuk</div>

                    <div class="mt-4 max-w-90 h-1.75 rounded-full bg-[#eff6ff] overflow-hidden">
                        <div class="h-full rounded-full bg-gradient-to-r from-[#2563a8] via-[#4a9fd4] to-[#3aaa8c]"
                            style="width: 91.7%;"></div>
                    </div>
                    <div class="font-mono text-[.72rem] text-[#6a8098] mt-2">91.7% completion rate</div>
                </div>
            </mono-card>

            <!-- Klaim Dalam Proses — dark gradient card.
                 mono-card's `_updateHostClasses()` (mono-card.ts) wipes any
                 class on the host that isn't in its managed list, so a plain
                 `class="klaim-process-card"` would silently disappear. Route
                 the class through the official `cssClass.root` prop instead —
                 mono-card adds it to its own managed-class set so it sticks. -->
            <mono-card shape="soft" :css-class.prop="{ root: 'klaim-process-card' }">
                <span class="pointer-events-none absolute -right-6 -bottom-6 w-30 h-30 rounded-full bg-white/8"></span>
                <span
                    class="pointer-events-none absolute right-2 top-2 w-12.5 h-12.5 rounded-full bg-[#4a9fd4]/20"></span>

                <div class="relative flex flex-col justify-between gap-3 min-h-[8rem]">

                    <div class="relative">
                        <div class="text-[.7rem] font-bold uppercase tracking-[.13em] text-[#cde8f8] mb-3">Klaim Dalam
                            Proses</div>
                        <div class="font-mono text-[2.8rem] font-bold leading-none text-white">4,445</div>
                        <div class="text-[.73rem] text-white/65 mt-1">Menunggu tindak lanjut</div>
                    </div>

                    <span
                        class="relative self-start inline-flex items-center gap-1.5 text-[.7rem] font-semibold px-3 py-1.25 rounded-full bg-white/15 text-white border border-white/25">
                        <span class="i-mdi-clock-outline"></span>
                        Pending Review
                    </span>
                </div>
            </mono-card>
        </div>

        <!-- ===== QUICK STATS (4) ===== -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <mono-card v-for="qs in quickStats" :key="qs.label" bordered shape="soft">
                <div class="flex items-center gap-3.5">
                    <div
                        :class="['w-10.5 h-10.5 rounded-[11px] flex items-center justify-center flex-shrink-0', iwBg[qs.color]]">
                        <span :class="[qs.icon, iwIcon[qs.color], 'text-[1.15rem]']"></span>
                    </div>
                    <div class="leading-tight min-w-0">
                        <div class="font-mono text-[1.25rem] font-bold text-[#2563a8]">{{ qs.num }}</div>
                        <div class="text-[.72rem] text-[#6a8098] truncate">{{ qs.label }}</div>
                    </div>
                </div>
            </mono-card>
        </div>

        <!-- ===== SECTIONS ===== -->
        <section v-for="sec in sections" :key="sec.id" class="flex flex-col gap-4">
            <!-- sec-rule header -->
            <div class="flex items-center gap-3">
                <div class="w-1 h-5.5 rounded-sm flex-shrink-0"
                    :style="{ background: `linear-gradient(180deg, ${sec.barFrom}, ${sec.barTo})` }"></div>
                <h2 class="m-0 text-[1rem] font-bold text-[#0f3060] whitespace-nowrap">{{ sec.title }}</h2>
                <span v-if="sec.sub" class="text-[.73rem] text-[#6a8098]">{{ sec.sub }}</span>
                <span v-if="sec.headerBadge"
                    class="text-[.68rem] font-bold px-2.5 py-0.75 rounded-full bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] whitespace-nowrap">{{
                        sec.headerBadge }}</span>
                <div class="flex-1 h-px bg-gradient-to-r from-[#e8f2f8] to-transparent"></div>
            </div>

            <!-- menu-grid -->
            <div class="grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
                <mono-card v-for="item in sec.items" :key="item.title" :href="item.href" bordered hoverable
                    shape="soft">
                    <div class="flex flex-col gap-2.5 h-full">
                        <div
                            :class="['w-10.5 h-10.5 rounded-[11px] flex items-center justify-center flex-shrink-0', iwBg[item.color]]">
                            <span :class="[item.icon, iwIcon[item.color], 'text-[1.15rem]']"></span>
                        </div>

                        <div :class="['text-[.88rem] font-bold leading-tight', titleClr[item.color]]">
                            {{ item.title }}
                        </div>
                        <div class="text-[.74rem] text-[#6a8098] leading-snug">{{ item.desc }}</div>

                        <span
                            :class="['mt-auto self-start inline-flex items-center text-[.64rem] font-semibold tracking-wide px-2.25 py-0.75 rounded-full border', badgeBg[item.color]]">{{
                                item.badge }}</span>
                    </div>
                </mono-card>
            </div>
        </section>

        <!-- ===== PAGE FOOTER ===== -->
        <div class="text-center pt-6 pb-2 text-[.72rem] text-[#9ab0c0] border-t border-[#e8f2f8]">
            EkaJaya Internasional — Beauty Management System &nbsp;·&nbsp; v2.5.0 &nbsp;·&nbsp; © 2025 PT EkaJaya
        </div>
    </div>
</template>

<style>
/* Doubled `.mono-card.klaim-process-card` selector (specificity 0,2,0) beats
   `.mono-card` (0,1,0) so the dark gradient applies cleanly without
   !important. Used for the "Klaim Dalam Proses" hero card. */
.mono-card.klaim-process-card {
    background: linear-gradient(135deg, #0f3060 0%, #2563a8 60%, #4a9fd4 100%);
    color: #fff;
    border-color: transparent;
    box-shadow: 0 6px 24px rgba(37, 99, 168, 0.28);
}
</style>
