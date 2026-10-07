<template>
    <div class="example-loading-icon">
        <!-- The Vue tab goes busy on click (`:handler.prop`); this tab shows the busy state
             itself: mono-loading on the wrapper, the ring drawn in the [mono-icon] box —
             which is exactly where the icon was, so it follows icon-position. -->
        <div mono-button mono-loading>
            <button mono-native aria-busy="true">
                <div mono-content>
                    <span mono-icon mono-spinning><span class="i-mdi-content-save"></span></span>
                    <span mono-text>Leading icon</span>
                </div>
            </button>
        </div>

        <div mono-button mono-icon-position="right" mono-loading>
            <button mono-native aria-busy="true">
                <div mono-content>
                    <span mono-text>Trailing icon</span>
                    <span mono-icon mono-spinning><span class="i-mdi-arrow-right"></span></span>
                </div>
            </button>
        </div>

        <!-- No icon: the box is only reserved while spinning; mono-empty collapses it otherwise. -->
        <div mono-button mono-color="secondary" mono-variant="outline" mono-loading>
            <button mono-native aria-busy="true">
                <div mono-content>
                    <span mono-icon mono-spinning></span>
                    <span mono-text>No icon</span>
                </div>
            </button>
        </div>

        <!-- Icon-only: the icon is the whole content, so the ring simply replaces it. -->
        <div mono-button mono-icon-only mono-loading>
            <button mono-native aria-busy="true">
                <span mono-icon mono-spinning><span class="i-mdi-refresh"></span></span>
            </button>
        </div>
    </div>
</template>

<style scoped>
.example-loading-icon {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
}
</style>
