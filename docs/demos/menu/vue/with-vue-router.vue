<script setup>
import '@mono-lit/helper/ui/menu'
import { ref, computed } from 'vue'

// Simulated Vue Router instance — in your app this is `useRouter()` /
// `useRoute()` from 'vue-router'. The integration code below works
// identically with the real ones.
const routes = {
    dashboard: '/app/dashboard',
    'user-list': '/app/users',
    'user-42': '/app/users/42',
    settings: '/app/settings',
}
const route = ref({ name: 'dashboard', path: routes.dashboard })
const router = {
    push: (href) => {
        const entry = Object.entries(routes).find(([, path]) => path === href)
        if (entry) route.value = { name: entry[0], path: entry[1] }
    },
    resolve: (to) => ({
        href: typeof to === 'string' ? to : routes[to.name] || '/',
    }),
}

const r = (to) => router.resolve(to).href
const activeName = computed(() => route.value.name)

function onMenuClick(e) {
    // `click` is the native click, so it also fires for a group header —
    // only an ITEM activation carries `detail.item`.
    if (!e.detail?.item?.href) return
    const ev = e.detail.sourceEvent
    // Hand cmd/ctrl/shift/middle-click back to the browser so "open in new tab"
    // and friends keep working as they would on any plain <a>.
    if (ev?.metaKey || ev?.ctrlKey || ev?.shiftKey || ev?.button === 1) return
    ev?.preventDefault()
    router.push(e.detail.item.href)
}

const wrapStyle =
    'box-sizing: border-box; width: 100%; border: 1px solid var(--theme-border); border-radius: 12px; padding: 0.85rem; background: var(--theme-surface); max-width: 320px;'
</script>

<template>
    <div :style="wrapStyle">
        <mono-menu
            controlled
            :model-value="activeName"
            @click="onMenuClick"
        >
            <div slot="body">
                <mono-menu-list type="subheader" id="sh-app" title="App"></mono-menu-list>

                <mono-menu-list
                    type="children"
                    id="dashboard"
                    title="Dashboard"
                    icon="i-mdi-view-dashboard"
                    :href="r({ name: 'dashboard' })"
                ></mono-menu-list>

                <mono-menu-list type="group" id="users-grp" title="Users" icon="i-mdi-account-group" default-open>
                    <mono-menu-list
                        type="children"
                        id="user-list"
                        title="All users"
                        icon="i-mdi-card-account-details-outline"
                        :href="r({ name: 'user-list' })"
                    ></mono-menu-list>
                    <mono-menu-list
                        type="children"
                        id="user-42"
                        title="User #42"
                        icon="i-mdi-account"
                        :href="r({ name: 'user-42' })"
                    ></mono-menu-list>
                </mono-menu-list>

                <mono-menu-list type="divider" id="d-1"></mono-menu-list>
                <mono-menu-list
                    type="children"
                    id="settings"
                    title="Settings"
                    icon="i-mdi-cog"
                    :href="r({ name: 'settings' })"
                ></mono-menu-list>
            </div>
        </mono-menu>
    </div>
    <div style="margin-top: 0.6rem; font-size: 0.78rem; opacity: 0.7;">
        Current route: <code>{{ route.name }}</code> → <code>{{ route.path }}</code>.
        Hover any row — the browser shows the URL in the status bar. Right-click
        to "Open in new tab" or "Copy link". Cmd/Ctrl-click also opens a new
        tab. Plain click is intercepted by <code>onMenuClick</code> and routed
        through <code>router.push</code>.
    </div>
</template>
