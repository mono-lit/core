<script setup>
// The same dashboard bar as the Vue tab, hand-written with no Lit anywhere —
// FOUR components' attribute contracts side by side: `mono-nav` laying out
// `mono-button` (icon-only, badged, and as menu rows), `mono-input` (with a
// slotted prefix and a clear button) and `mono-dropdown`. Every `mono-*`
// attribute below is exactly what the corresponding element renders.
import { ref, onMounted, onUnmounted } from 'vue'

const query = ref('')
const lastAction = ref('')

const menu = ref(null)
const open = ref(false)

const ACCOUNT = [
    ['Profile', 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z'],
    ['Settings', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9Z'],
    ['Sign out', 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9'],
]

function pick(label) {
    lastAction.value = label
    open.value = false
}

function onOutside(e) {
    if (!open.value) return
    if (menu.value && e.composedPath().includes(menu.value)) return
    open.value = false
}

function onKey(e) {
    if (open.value && e.key === 'Escape') {
        e.preventDefault()
        open.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', onOutside, true)
    document.addEventListener('keydown', onKey)
})
onUnmounted(() => {
    document.removeEventListener('click', onOutside, true)
    document.removeEventListener('keydown', onKey)
})
</script>

<template>
    <div class="example-topbar-frame">
        <header mono-nav mono-static role="banner">
            <div mono-inner>
                <div mono-start>
                    <!-- mono-button, icon-only: the glyph lives in the [mono-icon] box -->
                    <div mono-button mono-icon-only mono-variant="text" mono-color="secondary">
                        <button mono-native type="button" title="Menu" aria-label="Menu">
                            <span mono-icon>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round">
                                    <path d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </span>
                        </button>
                    </div>

                    <div class="example-topbar-brand">
                        <span class="example-topbar-logo">EJ</span>
                        <span>
                            <span class="example-topbar-name">EkaJaya BMS</span>
                            <span class="example-topbar-sub">Beauty Management</span>
                        </span>
                    </div>
                </div>

                <div mono-center>
                    <!-- mono-input: [mono-field] wraps the prefix, the native input
                         and the clear button the element renders only when filled -->
                    <div mono-input mono-size="sm" mono-clearable class="example-topbar-search">
                        <div mono-field>
                            <span mono-prefix>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2" stroke-linecap="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                            </span>
                            <input mono-native type="text" v-model="query" aria-label="Search"
                                placeholder="Search products, customers, orders…" />
                            <button v-if="query" mono-clear type="button" aria-label="Clear search"
                                @click="query = ''">
                                <span mono-icon class="mono-icon i-mdi-close" aria-hidden="true"></span>
                            </button>
                        </div>
                    </div>
                </div>

                <div mono-end>
                    <!-- the same button, now carrying a [mono-badge] -->
                    <div mono-button mono-icon-only mono-variant="text" mono-color="secondary">
                        <button mono-native type="button" title="Inbox" aria-label="Inbox"
                            @click="lastAction = 'Inbox'">
                            <span mono-icon>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
                                    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
                                </svg>
                            </span>
                            <span mono-badge="red">3</span>
                        </button>
                    </div>

                    <div mono-button mono-icon-only mono-variant="text" mono-color="secondary">
                        <button mono-native type="button" title="Notifications" aria-label="Notifications"
                            @click="lastAction = 'Notifications'">
                            <span mono-icon>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                                </svg>
                            </span>
                        </button>
                    </div>

                    <!-- mono-dropdown: [mono-activator] + [mono-panel] > [mono-body] -->
                    <div ref="menu" mono-dropdown mono-size="sm" mono-align="end"
                        :mono-open="open ? '' : null">
                        <span mono-activator>
                            <div mono-button mono-variant="text" mono-color="secondary">
                                <button mono-native type="button" @click.stop="open = !open">
                                    <div mono-content>
                                        <span mono-icon mono-empty></span>
                                        <span mono-text>
                                            <span class="example-topbar-avatar">AD</span>
                                            <span class="example-topbar-who">Admin</span>
                                        </span>
                                    </div>
                                </button>
                            </div>
                        </span>
                        <div mono-panel role="dialog" :aria-hidden="String(!open)">
                            <div mono-body>
                                <div class="example-topbar-menu">
                                <div v-for="[label, d] in ACCOUNT" :key="label" mono-button mono-variant="text"
                                    mono-color="secondary" mono-size="sm">
                                    <button mono-native type="button" @click="pick(label)">
                                        <div mono-content>
                                            <span mono-icon>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <path :d="d" />
                                                </svg>
                                            </span>
                                            <span mono-text>{{ label }}</span>
                                        </div>
                                    </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div mono-extension></div>
        </header>

        <div class="example-topbar-body">
            <p style="margin: 0 0 0.5rem;">
                Four attribute contracts in one bar — <code>mono-nav</code> laying out
                <code>mono-button</code>, <code>mono-input</code> and <code>mono-dropdown</code>,
                with no Lit on the page.
            </p>
            <p style="margin: 0;">
                Search: <strong>{{ query || '—' }}</strong> · Last action:
                <strong>{{ lastAction || '—' }}</strong>
            </p>
        </div>
    </div>
</template>

<style>
/* No `overflow: hidden` here on purpose. The frame used to clip the bar's
   square corners to its own radius; the bar carries that radius itself now, so
   the only thing clipping would still catch is the account panel — which the
   Lit dropdown portals out of the way and hand-written markup cannot. */
.example-topbar-frame {
    border: 1px solid var(--border);
    border-radius: var(--mono-nav-radius, var(--mono-radius-xl));
    background: var(--muted);
}

.example-topbar-brand {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    min-width: 0;
}

.example-topbar-logo {
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    border-radius: calc(var(--mono-radius-md) + 2px);
    background: var(--primary);
    color: var(--primary-foreground);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.72rem;
    font-weight: 800;
}

.example-topbar-name {
    display: block;
    font-weight: 800;
    font-size: 0.9rem;
    line-height: 1.15;
}

.example-topbar-sub {
    display: block;
    font-size: 0.64rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: color-mix(in oklab, currentColor 55%, transparent);
}

/* The field takes the slack the nav's center region hands it, up to a measure. */
.example-topbar-search {
    flex: 1;
    min-width: 0;
    max-width: 380px;
}

.example-topbar-avatar {
    /* it shares one [mono-text] with the name, so the gap is its own margin */
    margin-inline-end: 0.4rem;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--primary);
    color: var(--primary-foreground);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.62rem;
    font-weight: 700;
}

.example-topbar-who {
    font-size: 0.78rem;
    font-weight: 700;
}

/* A column of full-width text buttons — `--mono-button-width` / `-justify` are
   the two knobs that make a button behave like a menu row. */
.example-topbar-menu {
    display: grid;
    gap: 0.1rem;
    min-width: 170px;
    --mono-button-width: 100%;
    --mono-button-justify: flex-start;
}

/* Room for the account panel. The Lit dropdown portals its panel to <body>
   and escapes the demo stage; hand-written markup keeps the panel in place, so
   the demo has to leave it somewhere to go — and both twins get the same room
   so the two tabs stay the same size. */
.example-topbar-body {
    min-height: 160px;
    padding: 1.25rem;
    color: var(--foreground);
    font-size: 0.85rem;
    line-height: 1.6;
}
</style>
