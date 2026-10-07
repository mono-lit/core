<template>
    <label mono-checkbox mono-size="lg" mono-color="success" class="example-checkbox-custom">
        <input mono-input type="checkbox" checked />

        <span mono-box aria-hidden="true"></span>

        <span mono-label>
            <span mono-label-text>
                Revenue Growth
            </span>

            <span mono-description>
                Enable monthly performance tracking
            </span>
        </span>
    </label>
</template>

<style>
    .example-checkbox-custom {
        padding: 0.9rem 1rem;
        border: 1px solid rgba(16, 185, 129, 0.28);
        border-radius: 1.25rem;
        background:
            radial-gradient(circle at top left, rgba(110, 231, 183, 0.28), transparent 38%),
            linear-gradient(135deg, #ffffff, #ecfdf5 55%, #f0fdfa);
        box-shadow: 0 14px 35px rgba(16, 185, 129, 0.13);
        transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            border-color 0.25s ease;
    }

    .example-checkbox-custom:hover {
        transform: translateY(-2px);
        border-color: rgba(16, 185, 129, 0.45);
        box-shadow: 0 20px 55px rgba(16, 185, 129, 0.2);
    }

    .example-checkbox-custom [mono-box] {
        margin-top: 0.125rem;
        border-radius: 0.75rem;
        border-color: rgba(16, 185, 129, 0.55);
        box-shadow: 0 6px 18px rgba(16, 185, 129, 0.16);
    }

    .example-checkbox-custom [mono-label-text] {
        font-size: 0.9rem;
        font-weight: 800;
        color: #064e3b;
        letter-spacing: -0.01em;
    }

    .example-checkbox-custom [mono-description] {
        margin-top: 0.25rem;
        font-size: 0.78rem;
        color: rgba(4, 120, 87, 0.75);
    }
</style>
