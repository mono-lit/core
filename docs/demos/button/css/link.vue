<template>
    <div>
        <!-- `href` makes the element render an <a>; the structure inside is the same. -->
        <div mono-button>
            <a mono-native href="https://example.com" target="_blank" role="button">
                <div mono-content>
                    <span mono-icon mono-empty></span>
                    <span mono-text>External Link</span>
                </div>
            </a>
        </div>
        <div mono-button mono-color="success">
            <a mono-native href="#icon-buttons-section" role="button">
                <div mono-content>
                    <span mono-icon mono-empty></span>
                    <span mono-text>Scroll to Icon Buttons</span>
                </div>
            </a>
        </div>
    </div>
</template>
