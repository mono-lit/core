<template>
    <div style="width: 100%;">
        <div mono-alert mono-color="info" role="alert">
            <span mono-icon aria-hidden="true"><span class="i-mdi-information-outline" mono-glyph></span></span>
            <div mono-title>outline (default)</div>
            <div mono-subtitle>The card surface and edge; the colour paints the ink.</div>
        </div>
        <div mono-alert mono-color="info" mono-variant="tonal" role="alert">
            <span mono-icon aria-hidden="true"><span class="i-mdi-information-outline" mono-glyph></span></span>
            <div mono-title>tonal</div>
            <div mono-subtitle>A soft tint of the colour, no edge.</div>
        </div>
        <div mono-alert mono-color="info" mono-variant="solid" role="alert">
            <span mono-icon aria-hidden="true"><span class="i-mdi-information-outline" mono-glyph></span></span>
            <div mono-title>solid</div>
            <div mono-subtitle>The colour as the plate.</div>
        </div>
        <div mono-alert mono-color="info" mono-variant="text" role="alert">
            <span mono-icon aria-hidden="true"><span class="i-mdi-information-outline" mono-glyph></span></span>
            <div mono-title>text</div>
            <div mono-subtitle>No plate, no edge — an inline notice.</div>
        </div>
    </div>
</template>
