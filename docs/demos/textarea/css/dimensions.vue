<template>
    <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div mono-textarea style="width: 320px;">
            <label mono-label>Fixed 320px</label>
            <textarea mono-native placeholder="320px wide" rows="3"></textarea>
        </div>
        <div mono-textarea style="max-width: 480px;">
            <label mono-label>Max-width 480px</label>
            <textarea mono-native placeholder="caps at 480px" rows="3"></textarea>
        </div>
        <div mono-textarea style="width: 100%;">
            <label mono-label>Full width</label>
            <textarea mono-native placeholder="fills its container" rows="3"></textarea>
        </div>
    </div>
</template>
