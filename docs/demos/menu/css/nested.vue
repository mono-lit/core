<template>
    <div style="border: 1px solid var(--theme-border); border-radius: 12px; padding: 0.85rem; background: var(--theme-surface); max-width: 320px;">
        <nav mono-menu>
            <ul mono-list role="listbox">
                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-package-variant"></span>
                        </span>
                        <span mono-content><span mono-title>Products</span></span>
                    </button>
                    <ul mono-list>
                        <li mono-item mono-active>
                            <button type="button" mono-action role="option" aria-selected="true">
                                <span mono-icon aria-hidden="true">
                                    <span mono-glyph class="i-mdi-lipstick"></span>
                                </span>
                                <span mono-content><span mono-title>Beauty</span></span>
                            </button>
                        </li>
                        <li mono-item>
                            <button type="button" mono-action role="option">
                                <span mono-icon aria-hidden="true">
                                    <span mono-glyph class="i-mdi-bottle-tonic-outline"></span>
                                </span>
                                <span mono-content><span mono-title>Skincare</span></span>
                            </button>
                            <ul mono-list>
                                <li mono-item>
                                    <button type="button" mono-action role="option">
                                        <span mono-icon aria-hidden="true">
                                            <span mono-glyph class="i-mdi-emoticon-happy-outline"></span>
                                        </span>
                                        <span mono-content><span mono-title>Face</span></span>
                                    </button>
                                </li>
                                <li mono-item>
                                    <button type="button" mono-action role="option">
                                        <span mono-icon aria-hidden="true">
                                            <span mono-glyph class="i-mdi-spa-outline"></span>
                                        </span>
                                        <span mono-content><span mono-title>Body</span></span>
                                    </button>
                                </li>
                            </ul>
                        </li>
                        <li mono-item>
                            <button type="button" mono-action role="option">
                                <span mono-icon aria-hidden="true">
                                    <span mono-glyph class="i-mdi-hair-dryer-outline"></span>
                                </span>
                                <span mono-content><span mono-title>Haircare</span></span>
                            </button>
                        </li>
                    </ul>
                </li>
                <li mono-item>
                    <button type="button" mono-action role="option">
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-cash"></span>
                        </span>
                        <span mono-content><span mono-title>Pricing</span></span>
                    </button>
                </li>
            </ul>
        </nav>
    </div>
    <div style="margin-top: 0.6rem; font-size: 0.78rem; opacity: 0.7;">
        Items with a <code>items</code> array auto-render as an indented sub-list.
        Each level adds 1× <code>--menu-indent</code> and a faint guide rail.
    </div>
</template>
