<script setup>
const sizes = ['xs', 'sm', 'md', 'lg', 'xl']
</script>

<template>
    <div class="example-button-with-input-demo">
        <!-- Attached: input flush against the button, one seamless control -->
        <div class="example-button-with-input-attach">
            <div mono-input class="example-button-with-input-attach-input">
                <div mono-field>
                    <input mono-native type="text" placeholder="Nama flow…" />
                </div>
            </div>
            <div mono-button mono-color="success" class="example-button-with-input-attach-btn">
                <button mono-native>
                    <div mono-content>
                        <span mono-icon><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"> <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path> <path d="M17 21v-8H7v8M7 3v5h8"></path> </svg></span>
                        <span mono-text>Simpan</span>
                    </div>
                </button>
            </div>
        </div>

        <!-- Gapped: every control lines up with a button of the same size -->
        <div class="example-button-with-input-block" v-for="s in sizes" :key="s">
            <span class="example-button-with-input-label">{{ s }}</span>

            <!-- input -->
            <div class="example-button-with-input-row">
                <div mono-input :mono-size="s === 'md' ? null : s" class="example-button-with-input-grow">
                    <div mono-field>
                        <input mono-native type="text" :placeholder="`Input (${s})`" />
                    </div>
                </div>
                <div mono-button :mono-size="s">
                <button mono-native>
                    <div mono-content>
                        <span mono-icon mono-empty></span>
                        <span mono-text>Go</span>
                    </div>
                </button>
                </div>
            </div>

            <!-- select -->
            <div class="example-button-with-input-row">
                <div mono-select :mono-size="s === 'md' ? null : s" class="example-button-with-input-grow">
                    <button type="button" mono-trigger aria-haspopup="listbox" aria-expanded="false">
                        <span mono-value mono-placeholder>Select…</span>
                        <span mono-actions>
                            <span mono-arrow role="button" tabindex="-1" aria-label="Toggle options"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                        </span>
                    </button>
                </div>
                <div mono-button :mono-size="s" mono-variant="outline">
                <button mono-native>
                    <div mono-content>
                        <span mono-icon mono-empty></span>
                        <span mono-text>Apply</span>
                    </div>
                </button>
                </div>
            </div>

            <!-- tag-input -->
            <div class="example-button-with-input-row">
                <div :class="`mono-tag-input ${s} primary outlined has-value example-button-with-input-grow`">
                    <div :class="`mono-tag-input-field ${s} primary outlined`">
                        <div class="mono-chip mono-tag-input-chip sm soft-primary pill">
                            <span>
                                <span class="chip-content">
                                    <span class="chip-label">vue</span>
                                </span>
                            </span>
                        </div>
                        <input class="mono-tag-input-native" type="text" placeholder="Add tags…" autocomplete="off" />
                    </div>
                </div>
                <div mono-button :mono-size="s" mono-variant="outline">
                <button mono-native>
                    <div mono-content>
                        <span mono-icon mono-empty></span>
                        <span mono-text>Add</span>
                    </div>
                </button>
                </div>
            </div>

            <!-- date -->
            <div class="example-button-with-input-row">
                <div :class="`mono-date ${s} example-button-with-input-grow`">
                    <div :class="`mono-date-field ${s}`">
                        <input class="mono-date-native" type="text" placeholder="Pick a date…" />
                    </div>
                </div>
                <div mono-button :mono-size="s">
                <button mono-native>
                    <div mono-content>
                        <span mono-icon mono-empty></span>
                        <span mono-text>Set</span>
                    </div>
                </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
.example-button-with-input-demo {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
    max-width: 480px;
}

/* --- attached group --- */
.example-button-with-input-attach {
    display: flex;
    align-items: stretch;
    width: 100%;
}

.example-button-with-input-attach .example-button-with-input-attach-input {
    flex: 1;
    min-width: 0;
}

.example-button-with-input-attach .example-button-with-input-attach-input [mono-field] {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}

.example-button-with-input-attach .example-button-with-input-attach-btn {
    margin: 0;
}

/* Descendant, not a child: the class sits on the <mono-button> HOST, whose
   only child is the component's own .mono-button wrapper — a '>' combinator
   never reached the control, so the attached button kept both left corners. The
   hand-written twin puts the class on the wrapper itself, where '>' did match;
   the descendant form is correct for both. */
.example-button-with-input-attach .example-button-with-input-attach-btn button {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    margin-left: -1.5px;
}

/* --- gapped rows, grouped by size --- */
.example-button-with-input-block {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.example-button-with-input-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    opacity: 0.55;
}

.example-button-with-input-row {
    display: flex;
    align-items: stretch;
    gap: 0.5rem;
    width: 100%;
}

.example-button-with-input-row .example-button-with-input-grow {
    flex: 1;
    min-width: 0;
}

.example-button-with-input-row [mono-button] {
    margin: 0;
    flex: 0 0 auto;
}
</style>
