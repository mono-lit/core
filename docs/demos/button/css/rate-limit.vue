<template>
    <div class="example-rate-limit-demo">
        <!-- Idle -->
        <div class="example-rate-limit-row">
            <div mono-button>
                <button mono-native>
                    <div mono-content>
                        <span mono-icon mono-empty></span>
                        <span mono-text>Save</span>
                    </div>
                </button>
            </div>
            <span class="example-rate-limit-note">idle</span>
        </div>

        <!-- Loading: the spinner is drawn in the icon box, so it takes the icon's
             place instead of joining it. The caption stays readable. -->
        <div class="example-rate-limit-row">
            <div mono-button mono-loading>
                <button mono-native aria-disabled="true" aria-busy="true">
                    <div mono-content>
                        <span mono-icon mono-spinning></span>
                        <span mono-text>Save</span>
                    </div>
                </button>
            </div>
            <span class="example-rate-limit-note"><code>.loading</code> — spinner in the icon's place</span>
        </div>

        <!-- Waiting out the debounce timer / throttle queue. Reads as disabled
             but is NOT natively disabled: it still has to receive clicks so a
             debounce can re-arm its timer. The component swallows them. -->
        <div class="example-rate-limit-row">
            <div mono-button mono-loading mono-pending>
                <button mono-native aria-disabled="true" aria-busy="true">
                    <div mono-content>
                        <span mono-icon mono-spinning></span>
                        <span mono-text>Save</span>
                    </div>
                </button>
            </div>
            <span class="example-rate-limit-note"><code>.loading.pending</code> — queued, clicks swallowed</span>
        </div>

        <!-- Work actually running: natively disabled and completely dead. -->
        <div class="example-rate-limit-row">
            <div mono-button mono-loading>
                <button mono-native disabled aria-busy="true">
                    <div mono-content>
                        <span mono-icon mono-spinning></span>
                        <span mono-text>Save</span>
                    </div>
                </button>
            </div>
            <span class="example-rate-limit-note"><code>.loading</code> — working</span>
        </div>
    </div>
</template>

<style>
.example-rate-limit-demo {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    align-items: flex-start;
}

.example-rate-limit-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.example-rate-limit-note {
    font-size: 0.85rem;
    opacity: 0.7;
}
</style>
