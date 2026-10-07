<template>
    <div>
        <label mono-checkbox mono-disabled>
            <input mono-input type="checkbox" disabled>
            <span mono-box aria-hidden="true"></span>
            <div mono-label>
                <span mono-label-text>Disabled checkbox</span>
            </div>
        </label>

        <br>

        <label mono-checkbox mono-disabled>
            <input mono-input type="checkbox" checked disabled>
            <span mono-box aria-hidden="true"></span>
            <div mono-label>
                <span mono-label-text>Disabled checked</span>
            </div>
        </label>

        <br>

        <label mono-checkbox mono-indeterminate>
            <input mono-input type="checkbox">
            <span mono-box aria-hidden="true"></span>
            <div mono-label>
                <span mono-label-text>Indeterminate state</span>
            </div>
        </label>

        <br>

        <label mono-checkbox>
            <input mono-input type="checkbox" checked>
            <span mono-box aria-hidden="true"></span>
            <div mono-label>
                <span mono-label-text>Initially checked</span>
            </div>
        </label>
    </div>
</template>
