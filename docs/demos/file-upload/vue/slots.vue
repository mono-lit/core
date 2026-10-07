<script setup>
import '@mono-lit/helper/ui/file-upload'
</script>

<template>
    <div class="example-file-upload-slots-grid">
        <!-- 1. props: two attributes -->
        <mono-file-upload
            label="Props"
            title="Drop your résumé here"
            subtitle="PDF or DOCX, up to 5 MB"
        ></mono-file-upload>

        <!-- 2. slots: each replaces ONE line, and beats its prop -->
        <mono-file-upload
            label="Slots"
            title="ignored — the slot wins"
            accept=".pdf,.docx"
        >
            <span slot="title">Drop your <strong>résumé</strong> here</span>
            <span slot="subtitle">
                PDF or DOCX ·
                <!-- .stop: the whole dropzone is the picker, a link must not open it -->
                <a href="#title-subtitle" class="example-file-upload-slots-link" @click.stop>
                    what we accept
                </a>
            </span>
        </mono-file-upload>
    </div>
</template>

<style>
.example-file-upload-slots-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
    gap: 1rem;
    width: 100%;
}

.example-file-upload-slots-link {
    text-decoration: underline;
    text-underline-offset: 2px;
}
</style>
