<template>
    <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%;">
        <div mono-card mono-bordered style="width: 320px;">
            <div mono-header>
                <div mono-header-content>
                    <div mono-title>Fixed 320px</div>
                </div>
            </div>
            <div mono-body>A card constrained to 320px wide.</div>
        </div>
        <div mono-card mono-bordered style="max-width: 480px;">
            <div mono-header>
                <div mono-header-content>
                    <div mono-title>Max-width 480px</div>
                </div>
            </div>
            <div mono-body>Caps at 480px and shrinks on narrower screens.</div>
        </div>
        <div mono-card mono-bordered style="width: 100%;">
            <div mono-header>
                <div mono-header-content>
                    <div mono-title>Full width</div>
                </div>
            </div>
            <div mono-body><code>width="100%"</code></div>
        </div>
    </div>
</template>
