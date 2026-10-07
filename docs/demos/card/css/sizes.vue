<!--
    The size step is just a class on the root: `mono-card <size>`. It drives the
    content scale (padding, type, gaps, icon box) through the `--_mono-card-*-preset`
    layer — width stays whatever you set, and the corner radius belongs to the
    `rounded` steps, not to size.
-->
<template>
    <div style="display: grid; gap: 0.75rem; width: 100%;">
        <div mono-card mono-size="xs" mono-color="primary" >
            <div mono-header>
                <div mono-icon><span class="i-mdi-star flex items-center justify-center"></span></div>
                <div mono-header-content>
                    <h3 mono-title>Extra small</h3>
                    <p mono-subtitle>mono-card mono-size="xs"</p>
                </div>
            </div>
            <div mono-body>
                <p style="margin: 0;">Same width at every step — only the density scales.</p>
            </div>
        </div>
        <div mono-card mono-size="sm" mono-color="primary">
            <div mono-header>
                <div mono-icon><span class="i-mdi-star flex items-center justify-center"></span></div>
                <div mono-header-content>
                    <h3 mono-title>Small</h3>
                    <p mono-subtitle>mono-card mono-size="sm"</p>
                </div>
            </div>
            <div mono-body>
                <p style="margin: 0;">Same width at every step — only the density scales.</p>
            </div>
        </div>
        <div mono-card mono-color="primary">
            <div mono-header>
                <div mono-icon><span class="i-mdi-star flex items-center justify-center"></span></div>
                <div mono-header-content>
                    <h3 mono-title>Medium (default)</h3>
                    <p mono-subtitle>mono-card</p>
                </div>
            </div>
            <div mono-body>
                <p style="margin: 0;">Same width at every step — only the density scales.</p>
            </div>
        </div>
        <div mono-card mono-size="lg" mono-color="primary">
            <div mono-header>
                <div mono-icon><span class="i-mdi-star flex items-center justify-center"></span></div>
                <div mono-header-content>
                    <h3 mono-title>Large</h3>
                    <p mono-subtitle>mono-card mono-size="lg"</p>
                </div>
            </div>
            <div mono-body>
                <p style="margin: 0;">Same width at every step — only the density scales.</p>
            </div>
        </div>
        <div mono-card mono-size="xl" mono-color="primary">
            <div mono-header>
                <div mono-icon><span class="i-mdi-star flex items-center justify-center"></span></div>
                <div mono-header-content>
                    <h3 mono-title>Extra large</h3>
                    <p mono-subtitle>mono-card mono-size="xl"</p>
                </div>
            </div>
            <div mono-body>
                <p style="margin: 0;">Same width at every step — only the density scales.</p>
            </div>
        </div>
        <div mono-card mono-size="xxl" mono-color="primary">
            <div mono-header>
                <div mono-icon><span class="i-mdi-star flex items-center justify-center"></span></div>
                <div mono-header-content>
                    <h3 mono-title>Extra extra large</h3>
                    <p mono-subtitle>mono-card mono-size="xxl"</p>
                </div>
            </div>
            <div mono-body>
                <p style="margin: 0;">Same width at every step — only the density scales.</p>
            </div>
        </div>
    </div>
</template>
