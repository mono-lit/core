<template>
    <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
        <!-- Re-tint the primary fill (and its 80% hover) via the palette knob. -->
        <div mono-button style="--mono-button-primary: #7c3aed;">
            <button mono-native>
                <div mono-content>
                    <span mono-icon mono-empty></span>
                    <span mono-text>Branded primary</span>
                </div>
            </button>
        </div>
        <!-- Override the resolved background + shadow directly. -->
        <div mono-button style="--mono-button-bg: #0d9488; --mono-button-shadow: 0 3px 12px rgba(13, 148, 136, 0.35);">
            <button mono-native>
                <div mono-content>
                    <span mono-icon mono-empty></span>
                    <span mono-text>Custom solid</span>
                </div>
            </button>
        </div>
    </div>
</template>
