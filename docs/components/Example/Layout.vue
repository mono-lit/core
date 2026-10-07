<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import DashboardContent from '../DashboardContent.vue'

if (!import.meta.env.SSR) {
    import('@mono-lit/helper/ui/sidebar')
    import('@mono-lit/helper/ui/menu')
    import('@mono-lit/helper/ui/nav')
    import('@mono-lit/helper/ui/card')
    import('@mono-lit/helper/ui/modal')
    import('@mono-lit/helper/ui/button')
    import('@mono-lit/helper/ui/chip')
    import('@mono-lit/helper/ui/input')
    import('@mono-lit/helper/ui/dropdown')
}

const activeMenu = ref('dashboard')
const logoutOpen = ref(false)
const search = ref('')

// ── Sidebar responsive state ─────────────────────────────────────────
// Desktop is always in mono-sidebar's `rail` mode so the component renders
// its built-in chevron toggle (mono-sidebar.ts:535-556). modelValue then
// controls expanded vs. collapsed-icon, and `expand-on-hover` lets the
// collapsed state peek on hover.
//
// - rail (desktop) — true: icon-only with hover-peek; false: full width.
//                    Mirrors the inverse of the sidebar's modelValue.
// - mobileOpen — drives the temporary overlay (< md).
// - isMobile — Tailwind `md` breakpoint = 768px. Rail is desktop-only.
const rail = ref(false)
const mobileOpen = ref(false)
const isMobile = ref(false)

const updateMobile = () => {
    if (typeof window === 'undefined') return
    isMobile.value = window.innerWidth < 768
}
onMounted(() => {
    updateMobile()
    window.addEventListener('resize', updateMobile)
})
onUnmounted(() => {
    if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateMobile)
    }
})

// Mobile → temporary (overlay + scrim). Desktop → rail (with expand-on-hover
// peek). On desktop we drive rail externally via the `:rail.prop` binding
// below, which suppresses mono-sidebar's default chevron and lets us put our
// own button next to the EJI brand inside slot="header".
const sidebarMode = computed<'temporary' | 'rail'>(() =>
    isMobile.value ? 'temporary' : 'rail',
)

// `:rail.prop` semantics (mono-sidebar.ts:143-157): true → expanded full;
// false → collapsed icon-only; null → external control disabled (keeps the
// default chevron). On mobile we pass null so the rail prop never clobbers
// the mobileOpen-driven modelValue (sidebar.ts:244 mirrors rail → modelValue).
const railProp = computed<boolean | null>(() =>
    isMobile.value ? null : !rail.value,
)

// modelValue still owns the mobile overlay's open/closed state. On desktop
// the `:rail.prop` mirror keeps modelValue in sync with our `rail` state.
const sidebarOpen = computed(() =>
    isMobile.value ? mobileOpen.value : !rail.value,
)

const sidebarWidth = computed(() => (isMobile.value ? 280 : 268))

function onSidebarChange(e: CustomEvent) {
    // Desktop rail flips are owned by our chevron click — the sidebar only
    // emits change for scrim/escape on mobile and edge cases. Sync mobile.
    if (isMobile.value) mobileOpen.value = !!e.detail.modelValue
}

function onMenuChange(e: CustomEvent) {
    activeMenu.value = e.detail.modelValue
    if (isMobile.value) mobileOpen.value = false
}


const menuItems = [
    { id: 'sh-main', type: 'subheader', title: 'Main' },
    { id: 'dashboard', title: 'Dashboard',           icon: 'i-mdi-view-dashboard-outline' },
    { id: 'sellout',   title: 'Sell Out',            icon: 'i-mdi-cash-multiple' },
    { id: 'sellin',    title: 'Sell In',             icon: 'i-mdi-receipt-text-outline' },
    { id: 'target',    title: 'Target & Periode',    icon: 'i-mdi-bullseye-arrow' },
    { id: 'salesman',  title: 'Salesman & BA',       icon: 'i-mdi-car-outline' },
    { id: 'promo',     title: 'Promo & Kompetitor',  icon: 'i-mdi-gift-outline' },
    { id: 'd-1', type: 'divider' },
    { id: 'sh-ops', type: 'subheader', title: 'Operations' },
    { id: 'klaim',     title: 'Klaim',               icon: 'i-mdi-clipboard-text-outline', badge: 'NEW', badgeColor: 'danger' },
    { id: 'logbook',   title: 'Logbook',             icon: 'i-mdi-book-open-outline' },
    { id: 'report',    title: 'Report & Analisis',   icon: 'i-mdi-chart-line' },
    { id: 'finance',   title: 'Keuangan',            icon: 'i-mdi-wallet-outline' },
    { id: 'd-2', type: 'divider' },
    { id: 'sh-data', type: 'subheader', title: 'Master' },
    { id: 'master',    title: 'Data Master',         icon: 'i-mdi-database-outline' },
    { id: 'visit',     title: 'Visit & Monitoring',  icon: 'i-mdi-eye-outline' },
]
</script>

<template>
    <div class="example-layout min-h-screen bg-[#f4f8fc] overflow-x-clip">

        <!-- ===== SIDEBAR =====
             - Desktop (≥ md) → mode="rail", externally controlled via
               `:rail.prop` (mono-sidebar.ts:143-157). Setting the prop
               hides the default chevron — we place our own next to the
               EJI brand inside the header (sidebar.css:341-348 puts the
               header on a flex row inside .mono-sidebar-topbar so the
               chevron sits beside the brand).
             - Mobile (< md)  → mode="temporary" (overlay + scrim);
               railProp is null so it doesn't clobber mobileOpen. -->
        <mono-sidebar
            :mode="sidebarMode"
            :width="sidebarWidth"
            :rail-width="64"
            :expand-on-hover="!isMobile"
            :rail.prop="railProp"
            color="surface"
            :model-value="sidebarOpen"
            @change="onSidebarChange"
        >


            <!-- BRAND header — compact gradient banner with 40px EJ logo box.
                 Chevron sits at the end of the row, wrapped in
                 `.mono-sidebar-label` so it auto-hides in collapsed-rail
                 (sidebar.css:455) and reappears on hover-peek / toggled-open
                 (sidebar.css:532-535). -->
            <div
                slot="header"
                class="brand-header relative w-full flex items-center gap-2.5 px-3 py-2.5 overflow-hidden bg-gradient-to-br from-[#0f3060] via-[#2563a8] to-[#4a9fd4] rounded-md"
            >
                <div
                    class="relative z-1 w-10 h-10 rounded-lg bg-white border border-white/50 shadow-[0_2px_8px_rgba(0,0,0,.16)] flex items-center justify-center text-[#2563a8] text-[1rem] font-black flex-shrink-0"
                >EJI</div>
                <div class="mono-sidebar-label relative z-1 leading-tight flex-1 min-w-0">
                    <div class="text-white text-[.95rem] font-extrabold tracking-[.02em] truncate">Eka Jaya</div>
                    <div class="text-white/70 text-[.6rem] font-medium uppercase tracking-[.13em] mt-0.5 truncate">Beauty Mgmt</div>
                </div>

                <!-- Rail toggle — desktop only. Wrapped in mono-sidebar-label
                     so it disappears in collapsed-rail and returns on peek/open. -->
                <button
                    v-if="!isMobile"
                    type="button"
                    :aria-label="rail ? 'Expand sidebar' : 'Collapse sidebar'"
                    :title="rail ? 'Expand sidebar' : 'Collapse sidebar'"
                    class="mono-sidebar-label rail-chevron relative z-1 flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md bg-white/18 border border-white/28 text-white cursor-pointer transition-colors backdrop-blur-sm hover:bg-white/28 hover:border-white/45"
                    @click="rail = !rail"
                >
                    <span
                        :class="rail ? 'i-mdi-chevron-right' : 'i-mdi-chevron-left'"
                        class="text-[.95rem]"
                    ></span>
                </button>

                <span
                    class="mono-sidebar-label absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/8 pointer-events-none"
                ></span>
            </div>

            <!-- NAV body -->
            <mono-menu
                :items.prop="menuItems"
                :model-value="activeMenu"
                @change="onMenuChange"
            ></mono-menu>

            <!-- FOOTER — Help + Log Out rendered as mono-menu so labels
                 collapse correctly in rail mode. The Logout item is styled
                 red via the `.footer-menu [data-id="logout"]` selector in
                 the <style> block (mono-menu sets data-id on each row). -->
           
        </mono-sidebar>

        <!-- ===== RAIL TOGGLE — desktop only (≥ sm) =====
             Floating chevron on the sidebar's right edge. Click flips between
             permanent (full) and rail (icon-only with hover-expand). -->
      

        <!-- ===== MAIN WRAPPER =====
             margin-left tracks --mono-sidebar-left-width set by mono-sidebar
             (268px permanent → 64px rail → 0 mobile/temporary). -->
        <div
            class="flex flex-col min-h-screen"
            style="margin-left: var(--mono-sidebar-left-width, 0px);"
        >

            <!-- ===== TOPBAR ===== -->
            <mono-nav color="surface" variant="elevated" density="comfortable">

                <!-- LEFT — hamburger (mobile) + page title + welcome -->
                <div slot="start" class="flex items-center gap-3">
                    <!-- Hamburger — only on < md; opens the temporary sidebar -->
                    <button
                        v-if="isMobile"
                        type="button"
                        title="Open menu"
                        class="flex items-center justify-center w-9 h-9 rounded-[10px] bg-transparent border border-transparent text-[#3a5068] cursor-pointer transition-all hover:bg-[#eff6ff] hover:border-[#dbeafe]"
                        @click="mobileOpen = true"
                    >
                        <span class="i-mdi-menu text-[1.25rem]"></span>
                    </button>

                    <div class="flex flex-col leading-tight">
                        <h1 class="m-0 text-[1.05rem] font-bold text-[#0f3060] leading-tight">Dashboard</h1>
                        <p class="m-0 mt-0.5 text-[.73rem] text-[#6a8098]">Selamat datang kembali, Administrator!</p>
                    </div>
                </div>

                <!-- RIGHT — search + icon buttons + avatar -->
                <div slot="end" class="flex items-center gap-1 min-w-0">
                    <!-- Search (hidden on small screens; shrinkable) -->
                    <div class="hidden md:block flex-shrink min-w-0 max-w-65 mr-2">
                        <mono-input
                            type="search"
                            size="sm"
                            variant="outlined"
                            placeholder="Cari proposal, klaim..."
                            :model-value="search"
                            clearable
                            @input="search = $event.detail.modelValue"
                        >
                            <span slot="prefix" class="i-mdi-magnify text-[#6a8098]"></span>
                        </mono-input>
                    </div>

                    <!-- Inbox icon button + badge -->
                    <button
                        type="button"
                        title="My Inbox"
                        class="flex-shrink-0 relative px-2.3 py-2 rounded-[10px] bg-transparent border border-transparent text-[#3a5068] cursor-pointer transition-all flex items-center justify-center hover:bg-[#eff6ff] hover:border-[#dbeafe]"
                    >
                        <span class="i-mdi-email-outline text-[1.05rem]"></span>
                        <span
                            class="absolute top-1 right-1 min-w-4 h-4 rounded-full bg-[#ef4444] text-white text-[.58rem] font-bold leading-none flex items-center justify-center px-1 border-1.5 border-white"
                        >3</span>
                    </button>

                    <!-- Apps icon button (hide < xl) -->
                    <button
                        type="button"
                        title="Apps"
                        class="hidden xl:flex flex-shrink-0 relative px-2.3 py-2 rounded-[10px] bg-transparent border border-transparent text-[#3a5068] cursor-pointer transition-all items-center justify-center hover:bg-[#eff6ff] hover:border-[#dbeafe]"
                    >
                        <span class="i-mdi-apps text-[1.05rem]"></span>
                    </button>

                    <!-- Settings icon button (hide < lg) -->
                    <button
                        type="button"
                        title="Pengaturan"
                        class="hidden lg:flex flex-shrink-0 relative px-2.3 py-2 rounded-[10px] bg-transparent border border-transparent text-[#3a5068] cursor-pointer transition-all items-center justify-center hover:bg-[#eff6ff] hover:border-[#dbeafe]"
                    >
                        <span class="i-mdi-cog-outline text-[1.05rem]"></span>
                    </button>

                    <!-- Avatar pill + dropdown -->
                    <mono-dropdown
                        placement="bottom-start"
                        color="primary"
                        class="flex-shrink-0"
                        style="--mono-dropdown-pad-x: 0; --mono-dropdown-pad-y: 0;"
                    >
                        <button
                            slot="main"
                            type="button"
                            class="ml-1 flex items-center gap-2 pl-1.3 pr-2.2 py-1.3 rounded-[10px] bg-transparent border border-transparent cursor-pointer transition-all hover:bg-[#eff6ff] hover:border-[#dbeafe]"
                        >
                            <div
                                class="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563a8] to-[#4a9fd4] text-white text-[.72rem] font-bold flex items-center justify-center flex-shrink-0"
                            >AD</div>
                            <div class="leading-tight text-left hidden lg:block">
                                <div class="text-[.8rem] font-semibold text-[#1a2d42]">Administrator</div>
                                <div class="text-[.68rem] text-[#6a8098]">Super Admin</div>
                            </div>
                            <span class="i-mdi-chevron-down text-[.7rem] text-[#9ab0c0] ml-0.5"></span>
                        </button>

                        <div slot="body" class="w-72 overflow-hidden rounded-[12px]">
                            <!-- Profile header — cobalt-soft -->
                            <div class="flex items-center gap-3 px-4 py-3.5 bg-[#eff6ff] border-b border-[#dbeafe]">
                                <div
                                    class="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563a8] to-[#4a9fd4] text-white text-[.85rem] font-bold flex items-center justify-center flex-shrink-0"
                                >AD</div>
                                <div class="leading-tight min-w-0">
                                    <div class="text-[.85rem] font-bold text-[#0f3060] truncate">Administrator</div>
                                    <div class="text-[.72rem] text-[#6a8098] truncate">Super Admin · EkaJaya</div>
                                    <div class="text-[.7rem] text-[#9ab0c0] mt-0.5 truncate">admin@ekajaya.co.id</div>
                                </div>
                            </div>

                            <!-- Menu items -->
                            <button
                                type="button"
                                class="w-full flex items-center gap-3 px-4 py-2.5 text-left bg-transparent border-none cursor-pointer text-[#3a5068] text-[.83rem] transition-colors hover:bg-[#eff6ff] hover:text-[#2563a8]"
                            >
                                <div
                                    class="w-8 h-8 rounded-lg bg-[#dbeafe] flex items-center justify-center flex-shrink-0"
                                >
                                    <span class="i-mdi-account-circle-outline text-[1.05rem] text-[#2563a8]"></span>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="text-[.83rem] font-semibold text-[#1a2d42]">Profil Saya</div>
                                    <div class="text-[.7rem] text-[#6a8098] mt-0.5">Lihat & edit profil</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                class="w-full flex items-center gap-3 px-4 py-2.5 text-left bg-transparent border-none cursor-pointer text-[#3a5068] text-[.83rem] transition-colors hover:bg-[#eff6ff] hover:text-[#2563a8]"
                            >
                                <div
                                    class="w-8 h-8 rounded-lg bg-[#e8f0f5] flex items-center justify-center flex-shrink-0"
                                >
                                    <span class="i-mdi-key-outline text-[1.05rem] text-[#3a5068]"></span>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="text-[.83rem] font-semibold text-[#1a2d42]">Ganti Password</div>
                                    <div class="text-[.7rem] text-[#6a8098] mt-0.5">Perbarui kata sandi</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                class="w-full flex items-center gap-3 px-4 py-2.5 text-left bg-transparent border-none cursor-pointer text-[#3a5068] text-[.83rem] transition-colors hover:bg-[#eff6ff] hover:text-[#2563a8]"
                            >
                                <div
                                    class="w-8 h-8 rounded-lg bg-[#e8f0f5] flex items-center justify-center flex-shrink-0"
                                >
                                    <span class="i-mdi-clipboard-text-clock-outline text-[1.05rem] text-[#3a5068]"></span>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="text-[.83rem] font-semibold text-[#1a2d42]">Aktivitas Login</div>
                                    <div class="text-[.7rem] text-[#6a8098] mt-0.5">Riwayat sesi masuk</div>
                                </div>
                            </button>

                            <!-- Divider -->
                            <div class="h-px bg-[#e8f2f8] my-1"></div>

                            <!-- Danger Log Out -->
                            <button
                                type="button"
                                class="w-full flex items-center gap-3 px-4 py-2.5 text-left bg-transparent border-none cursor-pointer text-[#dc2626] text-[.83rem] transition-colors hover:bg-[#fef2f2]"
                                @click="logoutOpen = true"
                            >
                                <div
                                    class="w-8 h-8 rounded-lg bg-[#fee2e2] flex items-center justify-center flex-shrink-0"
                                >
                                    <span class="i-mdi-logout text-[1.05rem] text-[#dc2626]"></span>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="text-[.83rem] font-semibold text-[#dc2626]">Log Out</div>
                                    <div class="text-[.7rem] opacity-75 mt-0.5">Keluar dari sistem</div>
                                </div>
                            </button>
                        </div>
                    </mono-dropdown>
                </div>
            </mono-nav>

            <!-- ===== MAIN CONTENT ===== -->
            <main class="flex-1 px-7 py-6">
                <DashboardContent />
            </main>
        </div>

        <!-- ===== LOGOUT MODAL ===== -->
        <mono-modal
            color="danger"
            title="Keluar dari aplikasi?"
            :model-value="logoutOpen"
            @close="logoutOpen = false"
        >
            <p class="m-0 font-semibold">Sesi Anda akan diakhiri.</p>
            <p class="m-0 mt-1 opacity-80">Anda perlu masuk lagi untuk melanjutkan.</p>

            <span slot="foot" class="flex justify-end gap-2">
                <mono-button variant="outline" @click="logoutOpen = false">Batal</mono-button>
                <mono-button variant="solid" color="danger" @click="logoutOpen = false">Log Out</mono-button>
            </span>
        </mono-modal>
    </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

.example-layout,
.example-layout * {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
}

/* ── Brand header layout in rail-collapsed only ──────────────────────
   In collapsed-rail (no .open, no hover-peek) drop the brand's own
   horizontal padding and center the 40px EJ logo box inside the 64px
   rail width. When the panel is open OR hover-peeked, the inner padding
   stays so the brand row breathes properly at the md+ desktop width. */
.example-layout
    .mono-sidebar.effective-rail:not(.open):not(.expand-on-hover:hover)
    .brand-header {
    padding-left: 0;
    padding-right: 0;
    justify-content: center;
}

/* The default chevron and rail bar are suppressed because we've taken over
   via `:rail.prop` (mono-sidebar.ts:541-546). Our custom chevron lives
   inside the brand header as `.rail-chevron`; it's wrapped in
   `.mono-sidebar-label` so it auto-collapses with the brand text. No
   extra styling needed beyond what's on the button itself. */

/* ── .mono-sidebar-label restoration as block/flex ──────────────────
   sidebar.css line 532-535 restores `display: inline` on hover/open,
   which breaks our div-based layouts. Override to `revert` so divs
   come back as block and spans as inline. */
.example-layout .mono-sidebar.effective-rail.open .mono-sidebar-label,
.example-layout .mono-sidebar.effective-rail.expand-on-hover:hover .mono-sidebar-label {
    display: revert;
}

/* ── Logout item — red styling via the menu's data-id selector.
   mono-menu writes data-id on each row's action element
   (menu-render.ts:255). Higher specificity beats menu's defaults. */
.example-layout .footer-menu [data-id="logout"] {
    color: #dc2626;
}
.example-layout .footer-menu [data-id="logout"]:hover {
    background: #fef2f2;
}
</style>
