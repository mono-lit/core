<script setup>
import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/select'
import '@mono-lit/helper/ui/tag-input'
import '@mono-lit/helper/ui/date'
import { ref } from 'vue'

const flow = ref('')
const sizes = ['xs', 'sm', 'md', 'lg', 'xl']

const fruits = ref([
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
])
const skills = ref([
    { label: 'Vue', value: 'vue' },
    { label: 'Lit', value: 'lit' },
    { label: 'React', value: 'react' },
])
</script>

<template>
    <div class="example-button-with-input-demo">
        <!-- Attached: input flush against the button, one seamless control -->
        <div class="example-button-with-input-attach">
            <mono-input
                class="example-button-with-input-attach-input"
                placeholder="Nama flow…"
                :model-value="flow"
                @input="flow = $event.detail.modelValue"
            ></mono-input>
            <mono-button color="success" icon-position="left" class="example-button-with-input-attach-btn">
                <svg slot="icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <path d="M17 21v-8H7v8M7 3v5h8"></path>
                </svg>
                Simpan
            </mono-button>
        </div>

        <!-- Gapped: every control lines up with a button of the same size -->
        <div v-for="s in sizes" :key="s" class="example-button-with-input-block">
            <span class="example-button-with-input-label">{{ s }}</span>

            <div class="example-button-with-input-row">
                <mono-input :size="s" class="example-button-with-input-grow" :placeholder="`Input (${s})`"></mono-input>
                <mono-button :size="s" color="primary">Go</mono-button>
            </div>

            <div class="example-button-with-input-row">
                <mono-select
                    :size="s"
                    class="example-button-with-input-grow"
                    placeholder="Select…"
                    :items.prop="fruits"
                    key-value="value"
                    display-value="label"
                ></mono-select>
                <mono-button :size="s" color="primary" variant="outline">Apply</mono-button>
            </div>

            <div class="example-button-with-input-row">
                <mono-tag-input
                    :size="s"
                    class="example-button-with-input-grow"
                    placeholder="Add tags…"
                    :items.prop="skills"
                    key-value="value"
                    display-value="label"
                ></mono-tag-input>
                <mono-button :size="s" color="primary" variant="outline">Add</mono-button>
            </div>

            <div class="example-button-with-input-row">
                <mono-date :size="s" class="example-button-with-input-grow" placeholder="Pick a date…"></mono-date>
                <mono-button :size="s" color="primary">Set</mono-button>
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

/* square the touching corners so the pair reads as a single control */
.example-button-with-input-attach .example-button-with-input-attach-input .mono-input-field {
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
    margin-left: -1.5px; /* overlap the borders into one seam */
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

.example-button-with-input-row mono-button {
    margin: 0;
    flex: 0 0 auto;
}
</style>
