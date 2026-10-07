<template>
    <div>
        <div mono-chip>
            <span mono-main>
                <span mono-content class="icon-left">
                    <span data-mono-slot="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"></path></svg></span>
                    <span mono-label>Add Label</span>
                </span>
            </span>
        </div>
        <br>
        <div mono-chip mono-color="success" mono-icon-position="right">
            <span mono-main>
                <span mono-content class="icon-right">
                    <span mono-label>Approved</span>
                    <span data-mono-slot="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 13l4 4L19 7"></path></svg></span>
                </span>
            </span>
        </div>
        <br>
        <div mono-chip mono-color="warning">
            <span mono-main>
                <span mono-content class="icon-left">
                    <span data-mono-slot="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 9v4M12 17h.01"></path><path d="M3.85 8.62a4 4 0 017.72 0A6 6 0 0112 9a6 6 0 011.72-.38 4 4 0 017.72 0"></path></svg></span>
                    <span mono-label>Attention</span>
                </span>
            </span>
        </div>
    </div>
</template>
