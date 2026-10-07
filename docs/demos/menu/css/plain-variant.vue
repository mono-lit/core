<template>
    <div style="border: 1px solid var(--theme-border); border-radius: 12px; padding: 0.55rem; background: var(--theme-surface); box-shadow: 0 8px 30px rgba(0,0,0,0.08); max-width: 240px;">
        <nav mono-menu mono-density="compact" mono-plain>
            <ul mono-list role="listbox">
                <li mono-item mono-active>
                    <button type="button" mono-action role="option" aria-selected="true">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-content-cut"></span>
                        </span>
                        <span mono-content><span mono-title>Cut</span></span>
                    </button>
                </li>
                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-clipboard-text-outline"></span>
                        </span>
                        <span mono-content><span mono-title>Copy</span></span>
                    </button>
                </li>
                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-paperclip"></span>
                        </span>
                        <span mono-content><span mono-title>Paste</span></span>
                    </button>
                </li>
                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-repeat"></span>
                        </span>
                        <span mono-content><span mono-title>Duplicate</span></span>
                    </button>
                </li>
                <li mono-divider role="separator"></li>
                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-trash-can-outline"></span>
                        </span>
                        <span mono-content><span mono-title>Delete</span></span>
                        <span mono-badge="danger">⌫</span>
                    </button>
                </li>
            </ul>
        </nav>
    </div>
    <div style="margin-top: 0.6rem; font-size: 0.78rem; opacity: 0.7;">
        With <code>nav={false}</code> + <code>density="compact"</code>, the menu
        looks like a context menu / dropdown — softer fill on the active row,
        tighter spacing.
    </div>
</template>
