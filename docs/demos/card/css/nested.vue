<template>
    <div style="width: 100%;">
        <!-- The Vue twin mounts the third card behind a `v-if` and fills its list
             with a `v-for`; plain HTML has neither, so it is written out here —
             everything else is the same markup the element renders. -->
        <div mono-card mono-variant="outlined">
            <div mono-header>
                <div mono-header-content>
                    <h3 mono-title>Outer card</h3>
                    <p mono-subtitle>Cards can be stacked freely, including behind v-if / v-for.</p>
                </div>
            </div>
            <div mono-body>
                <p>Some content in the outer card body.</p>

                <div mono-card mono-variant="tonal" mono-color="primary" style="margin-top: 0.75rem;">
                    <div mono-header>
                        <div mono-header-content>
                            <h3 mono-title>Nested card</h3>
                        </div>
                    </div>
                    <div mono-body>
                        <p>A card living inside another card's body.</p>
                    </div>
                </div>

                <div mono-card mono-variant="tonal" mono-color="success" style="margin-top: 0.75rem;">
                    <div mono-header>
                        <div mono-header-content>
                            <h3 mono-title>Conditional nested card</h3>
                        </div>
                    </div>
                    <div mono-body>
                        <p>Toggled with <code>v-if</code> — no crash when it mounts / unmounts.</p>
                        <ul>
                            <li>Item 1</li>
                            <li>Item 2</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
