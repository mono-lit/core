<template>
    <div style="display: grid; gap: 1rem; width: 100%;">
        <div mono-textarea mono-disabled>
            <label mono-label>Disabled</label>
            <textarea mono-native placeholder="Cannot focus or type" rows="3" disabled>Disabled value</textarea>
        </div>
        <div mono-textarea mono-readonly>
            <label mono-label>Readonly</label>
            <textarea mono-native placeholder="Focus allowed, but read-only" rows="3" readonly>Readonly value</textarea>
        </div>
        <div mono-textarea>
            <label mono-label>
                Required
                <span mono-required-mark>*</span>
            </label>
            <textarea mono-native placeholder="This field is required" rows="3" required></textarea>
            <div>
                <div mono-footer>
                    <div mono-message-wrap>
                        <div mono-message="helper">The asterisk indicates a required field.</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
