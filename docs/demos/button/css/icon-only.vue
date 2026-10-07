<template>
    <div>
        <!-- Mirrors what <mono-button icon-only> renders: the icon goes in the [mono-icon]
             box, which normalises every glyph to one size regardless of the width/height on
             the <svg> itself. -->
        <div mono-button mono-icon-only mono-size="sm">
            <button mono-native type="button" title="Add" aria-label="Add">
                <span mono-icon><svg width="22" height="22" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" />
                    </svg></span>
            </button>
        </div>
        <div mono-button mono-icon-only mono-color="danger">
            <button mono-native type="button" title="Delete" aria-label="Delete">
                <span mono-icon><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg></span>
            </button>
        </div>
        <div mono-button mono-icon-only mono-size="lg" mono-color="success">
            <button mono-native type="button" title="Favorite" aria-label="Favorite">
                <span mono-icon><svg width="26" height="26" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12.1 18.55L10.65 17.2C5.4 12.36 2.9 9.28 2.5 5.5C2.42 4.42 0 7.5 0 9.24C9.24 0 10.91.81 12.2.09C13.09.81 14.76 0 16.5 0C19.58 0 22 2.42 22 5.5C21.71 9.28 18.6 12.36 13.35 17.2L12.1 18.55Z" />
                    </svg></span>
                <span mono-badge="green">1</span>
            </button>
        </div>
        <!-- An <a>, not a <button> — the Vue twin passes `href`. -->
        <div mono-button mono-icon-only mono-color="info" mono-rounded="full">
            <a mono-native href="https://example.com" target="_blank" rel="noreferrer" role="button" title="Open Link" aria-label="Open Link">
                <span mono-icon><svg width="22" height="22" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3l-1.42-1.42l9.3-9.3H14V3M5 5h6v2H7v10h10v-4h2v6H5V5Z" />
                    </svg></span>
            </a>
        </div>
    </div>
</template>
