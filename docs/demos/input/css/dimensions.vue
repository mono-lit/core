<template>
    <div style="display: flex; flex-direction: column; gap: 1rem;">
        <!-- width / height props land on the wrapper's inline style. -->
        <div mono-input style="width: 260px;">
            <label mono-label>Fixed 260px</label>
            <div mono-field>
                <input mono-native type="text" placeholder="260px wide" />
            </div>
        </div>
        <div mono-input style="max-width: 360px;">
            <label mono-label>Max-width 360px</label>
            <div mono-field>
                <input mono-native type="text" placeholder="caps at 360px" />
            </div>
        </div>
        <div mono-input style="width: 100%;">
            <label mono-label>Full width</label>
            <div mono-field>
                <input mono-native type="text" placeholder="fills its container" />
            </div>
        </div>
    </div>
</template>
