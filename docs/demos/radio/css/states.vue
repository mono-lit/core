<template>
    <div style="display: grid; gap: 0.5rem;">
        <label mono-radio>
            <input mono-input type="radio" name="states-a" value="a" checked />
            <span mono-circle aria-hidden="true"></span>
            <span mono-label><span mono-label-text>Selected</span></span>
        </label>
        <label mono-radio>
            <input mono-input type="radio" name="states-b" value="b" />
            <span mono-circle aria-hidden="true"></span>
            <span mono-label><span mono-label-text>Unselected</span></span>
        </label>
        <label mono-radio>
            <input mono-input type="radio" name="states-c" value="c" disabled />
            <span mono-circle aria-hidden="true"></span>
            <span mono-label><span mono-label-text>Disabled, unselected</span></span>
        </label>
        <label mono-radio>
            <input mono-input type="radio" name="states-d" value="d" checked disabled />
            <span mono-circle aria-hidden="true"></span>
            <span mono-label><span mono-label-text>Disabled, selected</span></span>
        </label>
    </div>
</template>
