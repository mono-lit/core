<template>
    <div style="display: grid; gap: 1rem">
        <!-- One attribute for corners. Unset follows the flavor's per-size radius. -->
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center">
            <div mono-button mono-rounded="none">
                <button mono-native>
                    <div mono-content>
                        <span mono-icon mono-empty></span>
                        <span mono-text>none</span>
                    </div>
                </button>
            </div>
            <div mono-button mono-rounded="xs">
                <button mono-native>
                    <div mono-content>
                        <span mono-icon mono-empty></span>
                        <span mono-text>xs</span>
                    </div>
                </button>
            </div>
            <div mono-button mono-rounded="sm">
                <button mono-native>
                    <div mono-content>
                        <span mono-icon mono-empty></span>
                        <span mono-text>sm</span>
                    </div>
                </button>
            </div>
            <div mono-button mono-rounded="md">
                <button mono-native>
                    <div mono-content>
                        <span mono-icon mono-empty></span>
                        <span mono-text>md</span>
                    </div>
                </button>
            </div>
            <div mono-button mono-rounded="lg">
                <button mono-native>
                    <div mono-content>
                        <span mono-icon mono-empty></span>
                        <span mono-text>lg</span>
                    </div>
                </button>
            </div>
            <div mono-button mono-rounded="xl">
                <button mono-native>
                    <div mono-content>
                        <span mono-icon mono-empty></span>
                        <span mono-text>xl</span>
                    </div>
                </button>
            </div>
            <div mono-button mono-rounded="xxl">
                <button mono-native>
                    <div mono-content>
                        <span mono-icon mono-empty></span>
                        <span mono-text>xxl</span>
                    </div>
                </button>
            </div>
            <div mono-button mono-rounded="full">
                <button mono-native>
                    <div mono-content>
                        <span mono-icon mono-empty></span>
                        <span mono-text>full</span>
                    </div>
                </button>
            </div>
            <div mono-button>
                <button mono-native>
                    <div mono-content>
                        <span mono-icon mono-empty></span>
                        <span mono-text>unset</span>
                    </div>
                </button>
            </div>
        </div>
        <!-- A FAB is a fixed square with a full radius — any colour or variant. -->
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center">
            <div mono-button mono-icon-only mono-rounded="full" mono-sized style="width: 56px; height: 56px;">
                <button mono-native>
                    <span mono-icon><span class="mono-icon i-mdi-plus"></span></span>
                </button>
            </div>
            <div mono-button mono-icon-only mono-color="danger" mono-variant="outline" mono-rounded="full" mono-sized style="width: 56px; height: 56px;">
                <button mono-native>
                    <span mono-icon><span class="mono-icon i-mdi-delete"></span></span>
                </button>
            </div>
            <div mono-button mono-icon-only mono-color="success" mono-variant="tonal" mono-rounded="full" mono-sized style="width: 40px; height: 40px;">
                <button mono-native>
                    <span mono-icon><span class="mono-icon i-mdi-check"></span></span>
                </button>
            </div>
        </div>
    </div>
</template>
