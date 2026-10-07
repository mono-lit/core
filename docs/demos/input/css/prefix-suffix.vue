<template>
    <div style="display: grid; gap: 1rem; width: 100%;">
        <div mono-input>
            <label mono-label>Search</label>
            <div mono-field>
                <span mono-prefix>🔍</span>
                <input mono-native type="text" placeholder="Find a project" />
            </div>
        </div>
        <div mono-input>
            <label mono-label>Website</label>
            <div mono-field>
                <span mono-prefix>https://</span>
                <input mono-native type="text" placeholder="example" />
                <span mono-suffix>.com</span>
            </div>
        </div>
        <div mono-input>
            <label mono-label>Price</label>
            <div mono-field>
                <span mono-prefix>$</span>
                <input mono-native type="number" placeholder="0.00" />
                <span mono-suffix>USD</span>
            </div>
        </div>
    </div>
</template>
