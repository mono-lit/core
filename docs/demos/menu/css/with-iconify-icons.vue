<template>
    <div style="border: 1px solid var(--theme-border); border-radius: 12px; padding: 0.85rem; background: var(--theme-surface); max-width: 280px;">
        <nav mono-menu>
            <ul mono-list role="listbox">
                <li mono-item mono-active>
                    <button type="button" mono-action role="option" aria-selected="true">
                        <span mono-icon>
                            <span mono-glyph class="i-mdi-view-dashboard"></span>
                        </span>
                        <span mono-content><span mono-title>Dashboard</span></span>
                    </button>
                </li>
                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon>
                            <span mono-glyph class="i-mdi-chart-line"></span>
                        </span>
                        <span mono-content><span mono-title>Analytics</span></span>
                    </button>
                </li>
                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon>
                            <span mono-glyph class="i-mdi-account-group"></span>
                        </span>
                        <span mono-content><span mono-title>Customers</span></span>
                    </button>
                </li>
                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon>
                            <span mono-glyph class="i-mdi-package-variant"></span>
                        </span>
                        <span mono-content><span mono-title>Orders</span></span>
                        <span mono-badge="primary">12</span>
                    </button>
                </li>
                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon>
                            <span mono-glyph class="i-mdi-email-outline"></span>
                        </span>
                        <span mono-content><span mono-title>Inbox</span></span>
                        <span mono-badge="danger">3</span>
                    </button>
                </li>

                <li mono-divider role="separator"></li>
                <li mono-subheader>Account</li>

                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon>
                            <span mono-glyph class="i-mdi-account-circle"></span>
                        </span>
                        <span mono-content><span mono-title>Profile</span></span>
                    </button>
                </li>
                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon>
                            <span mono-glyph class="i-mdi-cog"></span>
                        </span>
                        <span mono-content><span mono-title>Settings</span></span>
                    </button>
                </li>
                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon>
                            <span mono-glyph class="i-mdi-logout"></span>
                        </span>
                        <span mono-content><span mono-title>Logout</span></span>
                    </button>
                </li>
            </ul>
        </nav>
    </div>
    <div style="margin-top: 0.6rem; font-size: 0.78rem; opacity: 0.7;">
        Set <code>item.icon</code> to any iconify class — <code>i-mdi-*</code>,
        <code>i-tabler-*</code>, <code>i-lucide-*</code>, <code>i-simple-icons-*</code>,
        etc. The component renders <code>&lt;span class="i-mdi-cog"&gt;</code> and
        UnoCSS's <code>presetIcons</code> paints the SVG via mask +
        <code>currentColor</code>, so the active row inherits white automatically.
        Browse <a href="https://icones.js.org" target="_blank" rel="noreferrer">icones.js.org</a>
        for the full catalog.
    </div>
</template>
