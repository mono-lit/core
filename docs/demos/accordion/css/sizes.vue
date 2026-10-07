<template>
    <div style="width: 100%; display: grid; gap: 0.55rem;">
        <div mono-accordion mono-size="xs" mono-open>
            <button type="button" mono-head aria-expanded="true">
                <span mono-heading><span mono-title>Extra small accordion</span></span>
                <span mono-arrow aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>
            <div mono-body role="region"><div>Extra small — the tightest padding and type.</div></div>
        </div>
        <div mono-accordion mono-size="sm" mono-open>
            <button type="button" mono-head aria-expanded="true">
                <span mono-heading><span mono-title>Small accordion</span></span>
                <span mono-arrow aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>
            <div mono-body role="region"><div>Small — compact padding and type.</div></div>
        </div>
        <div mono-accordion mono-open>
            <button type="button" mono-head aria-expanded="true">
                <span mono-heading><span mono-title>Medium accordion</span></span>
                <span mono-arrow aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>
            <div mono-body role="region"><div>Medium (the default) — standard padding and type.</div></div>
        </div>
        <div mono-accordion mono-size="lg" mono-open>
            <button type="button" mono-head aria-expanded="true">
                <span mono-heading><span mono-title>Large accordion</span></span>
                <span mono-arrow aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>
            <div mono-body role="region"><div>Large — roomier padding, larger type.</div></div>
        </div>
        <div mono-accordion mono-size="xl" mono-open>
            <button type="button" mono-head aria-expanded="true">
                <span mono-heading><span mono-title>Extra large accordion</span></span>
                <span mono-arrow aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>
            <div mono-body role="region"><div>Extra large — roomier still.</div></div>
        </div>
        <div mono-accordion mono-size="xxl" mono-open>
            <button type="button" mono-head aria-expanded="true">
                <span mono-heading><span mono-title>2X large accordion</span></span>
                <span mono-arrow aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>
            <div mono-body role="region"><div>2X large — the roomiest step.</div></div>
        </div>
    </div>
</template>
