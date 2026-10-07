<template>
    <div style="display: grid; gap: 0.5rem;">
        <label mono-switch>
            <input mono-input type="checkbox" role="switch" />
            <span mono-track aria-hidden="true"><span mono-thumb></span></span>
            <span mono-label><span mono-label-text>Default off</span></span>
        </label>
        <label mono-switch>
            <input mono-input type="checkbox" role="switch" checked />
            <span mono-track aria-hidden="true"><span mono-thumb></span></span>
            <span mono-label><span mono-label-text>Default on</span></span>
        </label>
        <label mono-switch>
            <input mono-input type="checkbox" role="switch" disabled />
            <span mono-track aria-hidden="true"><span mono-thumb></span></span>
            <span mono-label><span mono-label-text>Disabled, off</span></span>
        </label>
        <label mono-switch>
            <input mono-input type="checkbox" role="switch" checked disabled />
            <span mono-track aria-hidden="true"><span mono-thumb></span></span>
            <span mono-label><span mono-label-text>Disabled, on</span></span>
        </label>
        <label mono-switch mono-loading mono-checked>
            <input mono-input type="checkbox" role="switch" checked disabled />
            <span mono-track aria-hidden="true"><span mono-thumb></span></span>
            <span mono-label><span mono-label-text>Loading</span></span>
        </label>
    </div>
</template>
