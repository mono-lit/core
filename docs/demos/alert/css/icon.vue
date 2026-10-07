<template>
    <div style="width: 100%;">
        <div mono-alert mono-color="success" role="alert">
            <span mono-icon aria-hidden="true"><span class="i-mdi-check-circle-outline" mono-glyph></span></span>
            <div mono-title>An iconify class</div>
            <div mono-subtitle>icon="i-mdi-check-circle-outline"</div>
        </div>
        <div mono-alert mono-color="warning" role="alert">
            <span mono-icon aria-hidden="true">⚡</span>
            <div mono-title>Plain text</div>
            <div mono-subtitle>icon="⚡" — an emoji or a letter</div>
        </div>
        <div mono-alert mono-color="primary" role="alert">
            <span mono-icon aria-hidden="true">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                >
                    <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"></path>
                </svg>
            </span>
            <div mono-title>slot="icon"</div>
            <div mono-subtitle>Any markup, e.g. your own svg.</div>
        </div>
    </div>
</template>
