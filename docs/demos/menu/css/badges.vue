<template>
    <div style="border: 1px solid var(--theme-border); border-radius: 12px; padding: 0.85rem; background: var(--theme-surface); max-width: 280px;">
        <nav mono-menu>
            <ul mono-list role="listbox">
                <li mono-item mono-active>
                    <button type="button" mono-action role="option" aria-selected="true">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-inbox-arrow-down"></span>
                        </span>
                        <span mono-content><span mono-title>Inbox</span></span>
                        <span mono-badge="">12</span>
                    </button>
                </li>
                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-flag-outline"></span>
                        </span>
                        <span mono-content><span mono-title>Flagged</span></span>
                        <span mono-badge="danger">3</span>
                    </button>
                </li>
                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-eye-outline"></span>
                        </span>
                        <span mono-content><span mono-title>Pending review</span></span>
                        <span mono-badge="success">NEW</span>
                    </button>
                </li>
                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon>⏸️</span>
                        <span mono-content><span mono-title>Paused</span></span>
                        <span mono-badge="warning">PRO</span>
                    </button>
                </li>
                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-package-variant"></span>
                        </span>
                        <span mono-content><span mono-title>Archive</span></span>
                    </button>
                </li>
            </ul>
        </nav>
    </div>
    <div style="margin-top: 0.6rem; font-size: 0.78rem; opacity: 0.7;">
        <code>badge</code> can be a number or string. <code>badgeColor</code> picks
        from <code>default</code> / <code>primary</code> / <code>success</code> /
        <code>danger</code> / <code>warning</code> / <code>info</code>.
    </div>
</template>
