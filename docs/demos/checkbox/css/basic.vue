<template>
    <div>
        <h3>Default CSS Icon</h3>

        <label mono-checkbox>
            <input mono-input type="checkbox">
            <span mono-box aria-hidden="true"></span>
        </label>

        <br>

        <label mono-checkbox>
            <input mono-input type="checkbox">
            <span mono-box aria-hidden="true"></span>

            <span mono-label>
                <span mono-label-text>Accept terms</span>
            </span>
        </label>

        <br>

        <label mono-checkbox>
            <input mono-input type="checkbox">
            <span mono-box aria-hidden="true"></span>

            <span mono-label>
                <span mono-label-text>Accept terms and conditions</span>
                <span mono-description>I agree to terms of service</span>
            </span>
        </label>

        <br>
        <br>

        <h3>Custom SVG Icon</h3>

        <label mono-checkbox>
            <input mono-input type="checkbox" checked>

            <span mono-box aria-hidden="true">
                <span mono-icon><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"
                    viewBox="0 0 24 24">
                    <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M8.5 11.5L11 14l4-4m6 2a9 9 0 1 1-18 0a9 9 0 0 1 18 0" />
                </svg></span>
            </span>

            <span mono-label>
                <span mono-label-text>Custom checked icon</span>
                <span mono-description>
                    This checkbox uses a custom SVG instead of the default CSS icon.
                </span>
            </span>
        </label>
    </div>
</template>
