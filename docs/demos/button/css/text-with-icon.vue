<template>
    <div style="width: 100%;">
        <!-- The icon always sits in the [mono-icon] box — that is what normalises every glyph
             to one size (16px at md) whatever width/height the <svg> was authored with. The box is
             the row's first child for icon-position="left" and its last for "right". -->
        <div mono-button mono-icon-position="right">
            <button mono-native>
                <div mono-content>
                    <span mono-text>Add Item</span>
                    <span mono-icon><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M12 5v14M5 12h14"></path>
                    </svg></span>
                </div>
            </button>
        </div>
        <br>
        <div mono-button mono-color="success">
            <button mono-native>
                <div mono-content>
                    <span mono-icon><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M5 13l4 4L19 7"></path>
                    </svg></span>
                    <span mono-text>Save</span>
                </div>
            </button>
        </div>
        <br>
        <div mono-button mono-color="danger" mono-icon-position="right">
            <button mono-native>
                <div mono-content>
                    <span mono-text>Delete</span>
                    <span mono-icon><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg></span>
                </div>
            </button>
        </div>
        <br>
        <div mono-button mono-color="info">
            <button mono-native>
                <div mono-content>
                    <span mono-icon><span class="i-mdi-close"></span></span>
                    <span mono-text>Continue</span>
                </div>
            </button>
        </div>
    </div>
</template>
