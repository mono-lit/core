<template>
    <div style="border: 1px solid var(--theme-border); border-radius: 12px; padding: 0.85rem; background: var(--theme-surface); max-width: 280px;">
        <nav mono-menu mono-color="success">
            <ul mono-list role="listbox">
                <li mono-item mono-active>
                    <button type="button" mono-action class="example-menu-action" role="option" aria-selected="true">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-view-dashboard"></span>
                        </span>
                        <span mono-content><span mono-title class="example-menu-title">Dashboard</span></span>
                    </button>
                </li>
                <li mono-item>
                    <button type="button" mono-action class="example-menu-action" role="option">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-cash-multiple"></span>
                        </span>
                        <span mono-content><span mono-title class="example-menu-title">Sales</span></span>
                        <span mono-badge="" class="example-menu-badge">12</span>
                    </button>
                </li>
                <li mono-item>
                    <button type="button" mono-action class="example-menu-action" role="option">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-target"></span>
                        </span>
                        <span mono-content><span mono-title class="example-menu-title">Targets</span></span>
                    </button>
                </li>
                <li mono-item>
                    <button type="button" mono-action class="example-menu-action" role="option">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-cog"></span>
                        </span>
                        <span mono-content><span mono-title class="example-menu-title">Settings</span></span>
                    </button>
                </li>
            </ul>
        </nav>
    </div>
    <div style="margin-top: 0.6rem; font-size: 0.78rem; opacity: 0.7;">
        The <code>cssClass</code> prop appends per-element classes —
        <code>example-menu-action</code>, <code>example-menu-title</code>,
        <code>example-menu-badge</code> in this demo. Combine with utility classes
        (Tailwind / UnoCSS) to override styling without forking
        <code>menu.css</code>.
    </div>
</template>

<style scoped>
:deep(.example-menu-action) {
    border-radius: 99px !important;
}

:deep(.example-menu-title) {
    letter-spacing: 0.01em;
    font-weight: 600;
}

:deep(.example-menu-badge) {
    font-family: ui-monospace, monospace;
    border: 1px dashed currentColor;
}
</style>
