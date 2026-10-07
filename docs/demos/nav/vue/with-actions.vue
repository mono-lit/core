<script setup>
// A dashboard top bar built out of OTHER mono components — the nav is only
// layout, so everything in its three regions is a real element: two
// `<mono-button icon-only>`s, a `<mono-input>` with a slotted prefix icon, and a
// `<mono-dropdown>` whose body is a column of text buttons.
//
// The Shadow tab is derived from this file: `<mono-nav>` becomes
// `<mono-shadow-nav>` and the rest stay LIGHT, which is exactly how a real app
// mixes the two builds — the bar's own slots are the boundary.
import '@mono-lit/helper/ui/nav'
import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/dropdown'
import { ref } from 'vue'

const query = ref('')
const lastAction = ref('')

const ACCOUNT = [
    ['Profile', 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z'],
    ['Settings', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9Z'],
    ['Sign out', 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9'],
]
</script>

<template>
    <div class="example-topbar-frame">
        <mono-nav :sticky="false">
            <!-- start: a real icon button, then the brand block -->
            <mono-button slot="start" icon-only variant="text" color="secondary" tooltip="Menu">
                <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round">
                    <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </mono-button>

            <div slot="start" class="example-topbar-brand">
                <span class="example-topbar-logo">EJ</span>
                <span>
                    <span class="example-topbar-name">EkaJaya BMS</span>
                    <span class="example-topbar-sub">Beauty Management</span>
                </span>
            </div>

            <!-- center: a real field, prefix icon slotted in -->
            <mono-input class="example-topbar-search" size="sm" clearable
                placeholder="Search products, customers, orders…" :model-value="query"
                @input="query = $event.detail.modelValue" @clear="query = ''">
                <svg slot="prefix" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
            </mono-input>

            <!-- end: two icon buttons (one carrying a badge) and an account menu -->
            <mono-button slot="end" icon-only variant="text" color="secondary" tooltip="Inbox" badge="3"
                badge-color="red" @click="lastAction = 'Inbox'">
                <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
                    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
                </svg>
            </mono-button>

            <mono-button slot="end" icon-only variant="text" color="secondary" tooltip="Notifications"
                @click="lastAction = 'Notifications'">
                <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
            </mono-button>

            <mono-dropdown slot="end" size="sm" placement="bottom-end">
                <mono-button slot="main" variant="text" color="secondary">
                    <span class="example-topbar-avatar">AD</span>
                    <span class="example-topbar-who">Admin</span>
                </mono-button>
                <div slot="body" class="example-topbar-menu">
                    <mono-button v-for="[label, d] in ACCOUNT" :key="label" variant="text" color="secondary" size="sm"
                        @click="lastAction = label">
                        <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round">
                            <path :d="d" />
                        </svg>
                        {{ label }}
                    </mono-button>
                </div>
            </mono-dropdown>
        </mono-nav>

        <div class="example-topbar-body">
            <p style="margin: 0 0 0.5rem;">
                Every control in the bar is a real mono element — the nav only lays them out.
                The icon buttons, the field and the account menu are slotted children, so they
                keep their own props, events and theming.
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
