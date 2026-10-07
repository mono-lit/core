<template>
    <div style="display: grid; gap: 0.75rem;">
        <label mono-radio mono-size="xs">
            <input mono-input type="radio" name="sizes-xs" value="xs" checked />
            <span mono-circle aria-hidden="true"></span>
            <span mono-label>
                <span mono-label-text>Extra small</span>
            </span>
        </label>
        <label mono-radio mono-size="sm">
            <input mono-input type="radio" name="sizes-sm" value="sm" checked />
            <span mono-circle aria-hidden="true"></span>
            <span mono-label>
                <span mono-label-text>Small</span>
            </span>
        </label>
        <label mono-radio>
            <input mono-input type="radio" name="sizes-md" value="md" checked />
            <span mono-circle aria-hidden="true"></span>
            <span mono-label>
                <span mono-label-text>Medium</span>
            </span>
        </label>
        <label mono-radio mono-size="lg">
            <input mono-input type="radio" name="sizes-lg" value="lg" checked />
            <span mono-circle aria-hidden="true"></span>
            <span mono-label>
                <span mono-label-text>Large</span>
            </span>
        </label>
        <label mono-radio mono-size="xl">
            <input mono-input type="radio" name="sizes-xl" value="xl" checked />
            <span mono-circle aria-hidden="true"></span>
            <span mono-label>
                <span mono-label-text>Extra large</span>
            </span>
        </label>
        <label mono-radio mono-size="xxl">
            <input mono-input type="radio" name="sizes-xxl" value="xxl" checked />
            <span mono-circle aria-hidden="true"></span>
            <span mono-label>
                <span mono-label-text>2X large</span>
            </span>
        </label>
    </div>
</template>
