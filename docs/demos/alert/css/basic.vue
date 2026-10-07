<template>
    <div style="width: 100%;">
        <div mono-alert role="alert">
            <span mono-icon aria-hidden="true"><span class="i-mdi-information-outline" mono-glyph></span></span>
            <div mono-title>Heads up!</div>
            <div mono-subtitle>You can add components to your app using the CLI.</div>
        </div>
        <div mono-alert mono-color="danger" role="alert">
            <span mono-icon aria-hidden="true"><span class="i-mdi-alert-circle-outline" mono-glyph></span></span>
            <div mono-title>Unable to process your payment.</div>
            <div mono-subtitle>Please verify your billing information and try again.</div>
        </div>
        <div mono-alert role="alert">
            <div mono-title>A title on its own is fine too.</div>
        </div>
    </div>
</template>
