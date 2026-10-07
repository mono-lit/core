<template>
    <div style="border: 1px solid var(--theme-border); border-radius: 12px; padding: 0.85rem; background: var(--theme-surface); max-width: 280px;">
        <nav mono-menu>
            <ul mono-list role="listbox">
                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-home-outline"></span>
                        </span>
                        <span mono-content><span mono-title>Home</span></span>
                    </button>
                </li>
                <li mono-item mono-active>
                    <button type="button" mono-action role="option" aria-selected="true">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-view-dashboard"></span>
                        </span>
                        <span mono-content><span mono-title>Dashboard</span></span>
                    </button>
                </li>

                <li mono-divider role="separator"></li>
                <li mono-subheader>Main</li>

                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-cash-multiple"></span>
                        </span>
                        <span mono-content><span mono-title>Sales</span></span>
                    </button>
                </li>
                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-target"></span>
                        </span>
                        <span mono-content><span mono-title>Targets</span></span>
                    </button>
                </li>

                <li mono-divider role="separator"></li>
                <li mono-subheader>Operations</li>

                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-clipboard-text-outline"></span>
                        </span>
                        <span mono-content><span mono-title>Klaim</span></span>
                    </button>
                </li>
                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-notebook-outline"></span>
                        </span>
                        <span mono-content><span mono-title>Logbook</span></span>
                    </button>
                </li>

                <li mono-divider role="separator"></li>
                <li mono-subheader>Account</li>

                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-account"></span>
                        </span>
                        <span mono-content><span mono-title>Profile</span></span>
                    </button>
                </li>
                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-cog"></span>
                        </span>
                        <span mono-content><span mono-title>Settings</span></span>
                    </button>
                </li>
            </ul>
        </nav>
    </div>
    <div style="margin-top: 0.6rem; font-size: 0.78rem; opacity: 0.7;">
        Use <code>{ type: 'divider', id }</code> for thin rules and
        <code>{ type: 'subheader', id, title }</code> for section labels — both
        live in the same <code>items</code> array as regular rows.
    </div>
</template>
