<template>
    <div style="width: 100%">
        <div mono-textarea>
            <label mono-label>📝 Release notes</label>
            <textarea mono-native placeholder="Drop your release notes here"></textarea>
            <div>
                <div mono-footer>
                    <div mono-message-wrap>
                        <div mono-message="helper">Markdown is supported. Pasted images are uploaded automatically.</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
