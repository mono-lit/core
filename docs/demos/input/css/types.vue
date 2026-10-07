<template>
    <div style="display: grid; gap: 1rem; width: 100%;">
        <div mono-input>
            <label mono-label>Text</label>
            <div mono-field>
                <input mono-native type="text" placeholder="Plain text" />
            </div>
        </div>
        <div mono-input>
            <label mono-label>Email</label>
            <div mono-field>
                <input mono-native type="email" placeholder="you@example.com" />
            </div>
        </div>
        <div mono-input>
            <label mono-label>Password</label>
            <div mono-field>
                <input mono-native type="password" placeholder="••••••••" />
            </div>
        </div>
        <div mono-input>
            <label mono-label>Number</label>
            <div mono-field>
                <input mono-native type="number" placeholder="42" min="0" max="100" step="1" />
            </div>
        </div>
        <div mono-input>
            <label mono-label>Phone</label>
            <div mono-field>
                <input mono-native type="tel" placeholder="+1 555 0100" />
            </div>
        </div>
        <div mono-input>
            <label mono-label>Website</label>
            <div mono-field>
                <input mono-native type="url" placeholder="https://" />
            </div>
        </div>
        <div mono-input>
            <label mono-label>Date</label>
            <div mono-field>
                <input mono-native type="date" />
            </div>
        </div>
        <div mono-input>
            <label mono-label>Time</label>
            <div mono-field>
                <input mono-native type="time" />
            </div>
        </div>
        <div mono-input>
            <label mono-label>Search</label>
            <div mono-field>
                <input mono-native type="search" placeholder="Search…" />
            </div>
        </div>
    </div>
</template>
