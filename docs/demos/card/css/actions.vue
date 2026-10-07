<template>
    <div style="width: 100%;">
        <div mono-card>
            <div mono-header>
                <div mono-header-content>
                    <h3 mono-title>Action Card</h3>
                </div>
            </div>
            <div mono-body>
                <p>This card demonstrates footer actions.</p>
            </div>
            <div mono-actions>
                <div>
                    <div mono-button mono-color="danger">
                        <button mono-native>
                            <div mono-content>
                                <span mono-icon mono-empty></span>
                                <span mono-text>Cancel</span>
                            </div>
                        </button>
                    </div>
                    <div mono-button>
                        <button mono-native>
                            <div mono-content>
                                <span mono-icon mono-empty></span>
                                <span mono-text>Save</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <br>
        <div mono-card mono-variant="tonal" mono-color="primary" mono-hoverable mono-clickable>
            <div mono-header>
                <div mono-header-content>
                    <h3 mono-title>Interactive Card</h3>
                    <p mono-subtitle>Header, content, actions, and interaction</p>
                </div>
            </div>
            <div mono-body>
                <p>This card combines multiple features in one example.</p>
            </div>
            <div mono-actions>
                <div>
                    <div mono-button mono-color="warning">
                        <button mono-native>
                            <div mono-content>
                                <span mono-icon mono-empty></span>
                                <span mono-text>Later</span>
                            </div>
                        </button>
                    </div>
                    <div mono-button>
                        <button mono-native>
                            <div mono-content>
                                <span mono-icon mono-empty></span>
                                <span mono-text>Open</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
