<script setup>
import { ref } from 'vue'

const items = [
  { id: 'dashboard', title: 'Dashboard', icon: 'i-mdi-view-dashboard' },
  { id: 'sales', title: 'Sales', icon: 'i-mdi-cash-multiple' },
  { id: 'settings', title: 'Settings', icon: 'i-mdi-cog' },
]
const active = ref('dashboard')

const paneStyle =
  'position: relative; height: 320px; border: 1px solid var(--border); border-radius: var(--mono-sidebar-radius, var(--mono-radius-lg)); overflow: hidden; background: var(--muted); --mono-sidebar-surface: #faf5ff; --mono-sidebar-accent: #7c3aed; --mono-menu-accent: #7c3aed;'
const contentStyle =
  'padding: 1.25rem 1.25rem 1.25rem calc(220px + 1.25rem); height: 100%; box-sizing: border-box; color: var(--foreground); font-size: 0.85rem;'
</script>

<template>
  <div :style="paneStyle">
    <div mono-sidebar mono-mode="permanent" mono-effective="permanent" mono-contained style="--mono-sidebar-width: 220px; --mono-sidebar-rail-width: 64px;">
      <aside mono-panel style="width: 220px;">
        <div mono-topbar>
            <div mono-header>
              <div style="font-weight: 800; font-size: 0.9rem; color: #7c3aed;">Mono UI</div>
            </div>
        </div>
        <div mono-body>
          <nav mono-menu>
            <ul mono-list role="listbox">
              <li
                v-for="it in items"
                :key="it.id"
                mono-item
                :mono-active="active === it.id ? '' : null"
              >
                <button
                  type="button"
                  mono-action
                  role="option"
                  :aria-selected="active === it.id"
                  @click="active = it.id"
                >
                  <span mono-icon aria-hidden="true">
                      <span mono-glyph :class="it.icon"></span>
                  </span>
                  <span mono-content><span mono-title>{{ it.title }}</span></span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </aside>
    </div>
    <div :style="contentStyle">
      Sidebar surface + accent and the menu accent all come from
      <code>--mono-sidebar-*</code> / <code>--mono-menu-*</code> on the pane.
    </div>
  </div>
</template>
