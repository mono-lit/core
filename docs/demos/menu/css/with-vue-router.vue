<script setup>
import { ref } from 'vue'

const routes = {
    dashboard: '/app/dashboard',
    'user-list': '/app/users',
    'user-42': '/app/users/42',
    settings: '/app/settings',
}
const route = ref({ name: 'dashboard', path: routes.dashboard })
const open = ref(new Set(['users-grp']))

function toggle(id) {
    if (open.value.has(id)) open.value.delete(id)
    else open.value.add(id)
    open.value = new Set(open.value)
}

function navigate(name, ev) {
    if (ev?.metaKey || ev?.ctrlKey || ev?.shiftKey || ev?.button === 1) return
    ev?.preventDefault()
    route.value = { name, path: routes[name] }
}

const wrapStyle =
    'box-sizing: border-box; width: 100%; border: 1px solid var(--theme-border); border-radius: 12px; padding: 0.85rem; background: var(--theme-surface); max-width: 320px;'
</script>

<template>
    <div :style="wrapStyle">
        <nav mono-menu>
            <ul mono-list role="listbox">
                <li mono-subheader>App</li>

                <li mono-item :mono-active="route.name === 'dashboard' ? '' : null">
                    <a
                        mono-action
                        role="option"
                        :aria-current="route.name === 'dashboard' ? 'page' : 'false'"
                        :href="routes.dashboard"
                        @click="navigate('dashboard', $event)"
                    >
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-view-dashboard"></span>
                        </span>
                        <span mono-content><span mono-title>Dashboard</span></span>
                    </a>
                </li>

                <li mono-item mono-group :mono-open="open.has('users-grp') ? '' : null">
                    <button
                        type="button"
                        mono-group-header
                        :aria-expanded="open.has('users-grp')"
                        @click="toggle('users-grp')"
                    >
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-account-group"></span>
                        </span>
                        <span mono-content><span mono-title>Users</span></span>
                        <span mono-chevron>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </span>
                    </button>
                    <ul mono-list mono-group-body>
                        <li mono-item :mono-active="route.name === 'user-list' ? '' : null">
                            <a
                                mono-action
                                role="option"
                                :aria-current="route.name === 'user-list' ? 'page' : 'false'"
                                :href="routes['user-list']"
                                @click="navigate('user-list', $event)"
                            >
                                <span mono-icon aria-hidden="true">
                                    <span mono-glyph class="i-mdi-card-account-details-outline"></span>
                                </span>
                                <span mono-content><span mono-title>All users</span></span>
                            </a>
                        </li>
                        <li mono-item :mono-active="route.name === 'user-42' ? '' : null">
                            <a
                                mono-action
                                role="option"
                                :aria-current="route.name === 'user-42' ? 'page' : 'false'"
                                :href="routes['user-42']"
                                @click="navigate('user-42', $event)"
                            >
                                <span mono-icon aria-hidden="true">
                                    <span mono-glyph class="i-mdi-account"></span>
                                </span>
                                <span mono-content><span mono-title>User #42</span></span>
                            </a>
                        </li>
                    </ul>
                </li>

                <li mono-divider role="separator"></li>
                <li mono-item :mono-active="route.name === 'settings' ? '' : null">
                    <a
                        mono-action
                        role="option"
                        :aria-current="route.name === 'settings' ? 'page' : 'false'"
                        :href="routes.settings"
                        @click="navigate('settings', $event)"
                    >
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-cog"></span>
                        </span>
                        <span mono-content><span mono-title>Settings</span></span>
                    </a>
                </li>
            </ul>
        </nav>
    </div>
    <div style="margin-top: 0.6rem; font-size: 0.78rem; opacity: 0.7;">
        Current route: <code>{{ route.name }}</code> → <code>{{ route.path }}</code>.
        Hover any row — the browser shows the URL in the status bar. Right-click
        to "Open in new tab" or "Copy link". Cmd/Ctrl-click also opens a new
        tab. Plain click is intercepted by <code>onMenuClick</code> and routed
        through <code>router.push</code>.
    </div>
</template>
