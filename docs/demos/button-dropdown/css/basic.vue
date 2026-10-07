<script setup>
// Hand-written markup, no Lit: the same attributes the element writes on its
// own root. Vue is here only for the two selects and the open state — every
// `mono-*` attribute below is exactly what `<mono-button-dropdown>` renders.
import { ref, computed } from 'vue'

const log = ref([])
const note = (msg) => log.value.unshift(msg)

const all = [
    { label: 'Save', icon: 'i-mdi-content-save', color: 'primary' },
    { label: 'Edit', icon: 'i-mdi-pencil', color: 'secondary', variant: 'outline' },
    { label: 'Duplicate', icon: 'i-mdi-content-copy', variant: 'outline' },
    { label: 'Archive', icon: 'i-mdi-archive', variant: 'outline', disabled: true },
    { label: 'Delete', icon: 'i-mdi-delete', color: 'danger', variant: 'outline' },
]

const count = ref(1)
const min = ref(1)
const open = ref(false)

const buttons = computed(() => all.slice(0, count.value))
const collapsed = computed(() => buttons.value.length > min.value)

function pick(item) {
    if (item.disabled) return
    note(item.label)
    open.value = false
}
</script>

<template>
    <div style="width: 100%">
        <DemoControls>
            <DemoSelect v-model="count" label="buttons" :options="[1, 2, 3, 4, 5]" number />
            <DemoSelect v-model="min" label="min" :options="[1, 2, 3, 4, 5]" number />
            <span class="example-note">
                {{ buttons.length }} &le; {{ min }} ?
                <strong>{{ collapsed ? 'collapsed → ⋮ menu' : 'inline' }}</strong>
            </span>
        </DemoControls>

        <!-- `mono-side`/`mono-align` are the static placement pair; the element
             adds `mono-fixed` once it positions the panel itself, which is what
             switches those rules off. Hand-written markup leaves it out. -->
        <div mono-button-dropdown mono-align="start" :mono-collapsed="collapsed ? '' : null"
            :mono-open="collapsed && open ? '' : null">
            <!-- the inline row: every entry as its real button -->
            <div mono-row :hidden="collapsed">
                <div v-for="item in buttons" :key="item.label" mono-button :mono-variant="item.variant"
                    :mono-color="item.color">
                    <button mono-native type="button" :disabled="item.disabled" @click="pick(item)">
                        <div mono-content>
                            <span mono-icon><span class="mono-icon" :class="item.icon"></span></span>
                            <span mono-text>{{ item.label }}</span>
                        </div>
                    </button>
                </div>
            </div>

            <!-- the ⋮ trigger: a plain button, styled by button.css like any other -->
            <div v-if="collapsed" mono-button mono-trigger mono-color="secondary" mono-variant="outline"
                mono-icon-only>
                <button mono-native type="button" aria-haspopup="menu" :aria-expanded="String(open)"
                    @click.stop="open = !open">
                    <div mono-content>
                        <span mono-icon><span class="mono-icon i-mdi-dots-vertical"></span></span>
                    </div>
                </button>
            </div>

            <div mono-panel role="menu" :aria-hidden="String(!open)" :hidden="!collapsed || !open">
                <!-- the element renders the rows only while collapsed; so does this -->
                <ul mono-list v-if="collapsed">
                    <!-- `mono-item-color` is the entry's `color` INSIDE the menu: it
                         inks the row and washes it on hover, never fills it. -->
                    <li v-for="item in buttons" :key="item.label" mono-item role="none"
                        :mono-item-color="item.color">
                        <div mono-button>
                            <button mono-native type="button" role="menuitem" :disabled="item.disabled"
                                @click="pick(item)">
                                <div mono-content>
                                    <span mono-icon><span class="mono-icon" :class="item.icon"></span></span>
                                    <span mono-text>{{ item.label }}</span>
                                </div>
                            </button>
                        </div>
                    </li>
                </ul>
            </div>
        </div>

        <p class="example-log">
            <strong>events</strong>
            <code>{{ log.slice(0, 4).join('  ·  ') || '—' }}</code>
        </p>
    </div>
</template>

<style scoped>
.example-note {
    font-size: 0.75rem;
    opacity: 0.75;
}

.example-log {
    display: grid;
    grid-template-columns: 4.5rem 1fr;
    gap: 0.6rem;
    margin: 1rem 0 0;
    font-size: 0.74rem;
    opacity: 0.8;
}

.example-log code {
    word-break: break-all;
}
</style>
