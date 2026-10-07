<template>
    <div style="display: grid; gap: 1rem; width: 100%;">
        <div mono-input mono-disabled>
            <label mono-label>Disabled</label>
            <div mono-field>
                <input mono-native type="text" placeholder="Cannot focus or type" value="Disabled value" disabled />
            </div>
        </div>
        <div mono-input mono-readonly>
            <label mono-label>Readonly</label>
            <div mono-field>
                <input mono-native type="text" placeholder="Focus allowed, but read-only" value="Readonly value" readonly />
            </div>
        </div>
        <div mono-input mono-required>
            <label mono-label>Required<span mono-required-mark>*</span></label>
            <div mono-field>
                <input mono-native type="text" placeholder="This field is required" required />
            </div>
            <div mono-message-wrap>
                <div mono-message="helper">The asterisk indicates a required field.</div>
            </div>
        </div>
    </div>
</template>
