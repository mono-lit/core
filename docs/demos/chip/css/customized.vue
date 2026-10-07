<template>
    <div>
        <!-- `mono-main` is the badge BOX — the part that carries the fill, the
             border and the corner. The root is the layout wrapper around it, so
             a box utility belongs on `mono-main`. -->
        <div mono-chip>
            <span mono-main class="shadow-md">
                <span mono-content>
                    <span mono-label class="font-bold tracking-wide">Bold &amp; shadowed</span>
                </span>
            </span>
        </div>
        <br>
        <div mono-chip mono-color="success">
            <span mono-main class="px-4 py-2">
                <span mono-content>
                    <span mono-label class="text-base">Roomier padding</span>
                </span>
            </span>
        </div>
        <br>
        <!-- Shape is the `mono-rounded` attribute, not a utility: it writes the
             corner the box actually reads. -->
        <div mono-chip mono-color="danger" mono-removable mono-rounded="none">
            <span mono-main>
                <span mono-content>
                    <span mono-label>Square removable</span>
                    <button mono-close class="text-lg" type="button" aria-label="Remove">
                        <span mono-glyph class="i-mdi-close" aria-hidden="true"></span>
                    </button>
                </span>
            </span>
        </div>
    </div>
</template>
