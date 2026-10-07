<template>
    <div style="display: grid; gap: 1rem; width: 100%;">
        <div mono-textarea mono-validation-state="valid">
            <label mono-label>Valid</label>
            <textarea mono-native rows="3">Looks good to me.</textarea>
            <div>
                <div mono-footer>
                    <div mono-message-wrap>
                        <div mono-message="valid">Looks good.</div>
                    </div>
                </div>
            </div>
        </div>
        <div mono-textarea mono-validation-state="invalid">
            <label mono-label>Invalid</label>
            <textarea mono-native rows="3">too short</textarea>
            <div>
                <div mono-footer>
                    <div mono-message-wrap>
                        <div mono-message="invalid">Please write at least 20 characters.</div>
                    </div>
                </div>
            </div>
        </div>
        <div mono-textarea mono-color="warning">
            <label mono-label>Warning</label>
            <textarea mono-native rows="3">Quick draft</textarea>
            <div>
                <div mono-footer>
                    <div mono-message-wrap>
                        <div mono-message="warning">Drafts may be reviewed before publishing.</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
