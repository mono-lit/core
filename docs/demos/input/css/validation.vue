<template>
    <div style="display: grid; gap: 1rem; width: 100%;">
        <div mono-input mono-validation-state="valid">
            <label mono-label>Valid</label>
            <div mono-field>
                <input mono-native type="text" value="hello@example.com" />
            </div>
            <div mono-message-wrap>
                <div mono-message="valid">Looks good.</div>
            </div>
        </div>
        <div mono-input mono-validation-state="invalid">
            <label mono-label>Invalid</label>
            <div mono-field>
                <input mono-native type="text" value="not-an-email" aria-invalid="true" />
            </div>
            <div mono-message-wrap>
                <div mono-message="invalid" role="alert">Please enter a valid email address.</div>
            </div>
        </div>
        <div mono-input mono-validation-state="warning">
            <label mono-label>Warning</label>
            <div mono-field>
                <input mono-native type="text" value="abc" />
            </div>
            <div mono-message-wrap>
                <div mono-message="warning">Short values are easy to guess.</div>
            </div>
        </div>
    </div>
</template>
