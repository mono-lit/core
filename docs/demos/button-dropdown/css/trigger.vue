<script setup>
// Hand-written markup, no Lit. Vue drives only the open state and the log.
import { ref } from 'vue'

const last = ref('—')
const open = ref(0)

const rows = [
    { id: 1, name: 'INV-1042' },
    { id: 2, name: 'INV-1043' },
]

const actions = [
    { label: 'Approve', icon: 'i-mdi-check', color: 'success' },
    { label: 'Print', icon: 'i-mdi-printer' },
    { label: 'Void', icon: 'i-mdi-close-octagon', color: 'danger' },
]

function pick(row, item) {
    last.value = `${item.label.toLowerCase()} ${row.name}`
    open.value = 0
}
</script>

<template>
    <div style="width: 100%">
        <table class="example-table">
            <thead>
                <tr>
                    <th>Document</th>
                    <th style="width: 1%">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="row in rows" :key="row.id">
                    <td>{{ row.name }}</td>
                    <td>
                        <div mono-button-dropdown mono-collapsed
                            :mono-open="open === row.id ? '' : null">
                            <div mono-button mono-trigger mono-size="sm" mono-variant="outline" mono-icon-only>
                                <button mono-native type="button" aria-haspopup="menu"
                                    :aria-expanded="String(open === row.id)"
                                    @click.stop="open = open === row.id ? 0 : row.id">
                                    <div mono-content>
                                        <span mono-icon><span class="mono-icon i-mdi-dots-horizontal"></span></span>
                                    </div>
                                </button>
                            </div>

                            <div mono-panel role="menu" :aria-hidden="String(open !== row.id)"
                                :hidden="open !== row.id">
                                <ul mono-list>
                                    <li v-for="item in actions" :key="item.label" mono-item role="none"
                                        :mono-item-color="item.color">
                                        <div mono-button>
                                            <button mono-native type="button" role="menuitem"
                                                @click="pick(row, item)">
                                                <div mono-content>
                                                    <span mono-icon><span class="mono-icon"
                                                            :class="item.icon"></span></span>
                                                    <span mono-text>{{ item.label }}</span>
                                                </div>
                                            </button>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>

        <p class="example-last">last action: <code>{{ last }}</code></p>
    </div>
</template>

<style scoped>
.example-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    /* VitePress turns a prose table into a scroll container
       (`.vp-doc table { display: block; overflow-x: auto }`), which CLIPS a
       panel that is not portaled. The element's own panel escapes to <body>
       and never notices; this hand-written one has to stay in the cell. */
    display: table;
    overflow: visible;
}

.example-table th,
.example-table td {
    border-bottom: 1px solid var(--border);
    padding: 0.5rem 0.6rem;
    text-align: left;
}

.example-last {
    margin: 0.9rem 0 0;
    font-size: 0.76rem;
    opacity: 0.8;
}
</style>
