<template>
    <div>
        <div mono-chip mono-clickable>
            <a mono-main href="https://example.com" target="_blank" role="button">
                <span mono-content>
                    <span mono-label>External Link</span>
                </span>
            </a>
        </div>
        <br>
        <div mono-chip mono-color="success" mono-clickable>
            <a mono-main href="/dashboard" target="_blank" role="button">
                <span mono-content>
                    <span mono-label>Dashboard</span>
                </span>
            </a>
        </div>
        <br>
        <div mono-chip mono-color="info" mono-clickable>
            <a mono-main href="/profile" target="_blank" role="button">
                <span mono-content>
                    <span mono-label>Profile</span>
                </span>
            </a>
        </div>
    </div>
</template>
