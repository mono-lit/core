<template>
    <div style="display: flex; flex-direction: column; gap: 0.6rem; width: 100%;">
        <!-- width/height live on the element HOST; mono-sized makes the wrapper + control fill it.
             Hand-written, the wrapper is the host, so the size goes on it. -->
        <div mono-button mono-sized style="width: 220px;">
            <button mono-native>
                <div mono-content>
                    <span mono-icon mono-empty></span>
                    <span mono-text>Fixed 220px</span>
                </div>
            </button>
        </div>
        <div mono-button mono-sized style="width: 100%;">
            <button mono-native>
                <div mono-content>
                    <span mono-icon mono-empty></span>
                    <span mono-text>Full width — width="100%"</span>
                </div>
            </button>
        </div>
        <div mono-button mono-color="success" mono-sized style="min-width: 80px;">
            <button mono-native>
                <div mono-content>
                    <span mono-icon mono-empty></span>
                    <span mono-text>Min-width 80px</span>
                </div>
            </button>
        </div>
    </div>
</template>
