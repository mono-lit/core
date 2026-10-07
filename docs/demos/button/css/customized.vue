<template>
    <div>
        <!-- The Vue tab's `css-class` prop appends classes to the same parts: root → wrapper,
             text → [mono-text], main → the control, icon → [mono-icon], badge → [mono-badge]. -->
        <div mono-button class="shadow-2xl">
            <button mono-native>
                <div mono-content>
                    <span mono-icon mono-empty></span>
                    <span mono-text class="tracking-widest">Bold &amp; shadowed</span>
                </div>
            </button>
        </div>
        <br>
        <div mono-button mono-color="success" class="rounded-3xl px-8">
            <button mono-native>
                <div mono-content>
                    <span mono-icon mono-empty></span>
                    <span mono-text class="font-bold">Pill-ish &amp; padded</span>
                </div>
            </button>
        </div>
        <br>
        <div mono-button mono-color="info" class="shadow-md">
            <button mono-native class="gap-3">
                <div mono-content>
                    <span mono-icon class="text-orange-500"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M5 13l4 4L19 7"></path>
                    </svg></span>
                    <span mono-text>Tinted icon</span>
                </div>
            </button>
        </div>
        <br>
        <div mono-button mono-color="danger" class="p-3">
            <button mono-native>
                <div mono-content>
                    <span mono-icon mono-empty></span>
                    <span mono-text>Big badge</span>
                </div>
                <span mono-badge="red" class="text-base px-2">9</span>
            </button>
        </div>
    </div>
</template>
