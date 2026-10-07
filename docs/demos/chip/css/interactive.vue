<template>
    <div>
        <div mono-chip mono-clickable>
            <span mono-main role="button" tabindex="0">
                <span mono-content>
                    <span mono-label>Clickable</span>
                </span>
            </span>
        </div>
        <br>
        <div mono-chip mono-clickable mono-selected>
            <span mono-main role="button" tabindex="0">
                <span mono-content>
                    <span mono-label>Selected</span>
                </span>
            </span>
        </div>
        <br>
        <div mono-chip mono-disabled>
            <span mono-main aria-disabled="true">
                <span mono-content>
                    <span mono-label>Disabled</span>
                </span>
            </span>
        </div>
        <br>
        <div mono-chip mono-color="danger" mono-removable>
            <span mono-main role="button" tabindex="0">
                <span mono-content>
                    <span mono-label>Serum Vit C</span>
                    <button mono-close type="button" aria-label="Remove">
                        <span mono-glyph class="i-mdi-close" aria-hidden="true"></span>
                    </button>
                </span>
            </span>
        </div>
    </div>
</template>
