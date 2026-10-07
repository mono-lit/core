<script setup lang="ts">
import { ref } from 'vue'

type HostId = 'vue' | 'nuxt'

/** One Remote kind a Host can take, and the slot holding its wiring. */
interface RemoteKind {
  title: string
  note: string
  /** Shown on the Remote card, the same as a Host card's. */
  files: string
  slot: string
  /** Cross-framework pairing — possible, but risky and outside the standard. */
  hybrid?: boolean
}

interface HostKind {
  id: HostId
  title: string
  desc: string
  files: string
  /**
   * The same-framework Remote is the standard and comes first. A Nuxt Host also
   * lists the Vue Remote, flagged `hybrid` — possible but risky. Slot names
   * spell out remote-kind + host-kind, because the old `nuxt-remote` slot
   * actually held the VUE Remote wired to a Nuxt Host.
   */
  remotes: RemoteKind[]
}

const hosts: HostKind[] = [
  {
    id: 'vue',
    title: 'Vue Host',
    desc: 'Vite + Vue shell. Source under src/.',
    files: 'vite.config.ts',
    remotes: [
      {
        title: 'Vue Remote',
        note: 'Same vite.config.ts wiring as the Host. Only the dev port differs.',
        files: 'vite.config.ts',
        slot: 'vue-remote-vue-host',
      },
    ],
  },
  {
    id: 'nuxt',
    title: 'Nuxt Host',
    desc: 'Nuxt (SSR) shell. Source under app/, no vite.config.ts.',
    files: 'nuxt.config.ts',
    remotes: [
      {
        title: 'Nuxt Remote',
        note: 'The same module wiring as the Host, with ssr: false. Nothing in this file says "remote".',
        files: 'nuxt.config.ts',
        slot: 'nuxt-remote-nuxt-host',
      },
      {
        title: 'Vue Remote',
        note: 'Hybrid — possible but risky: a Vite app inside the Nuxt (SSR) shell, held together by mono\'s compat layer.',
        files: 'vite.config.ts',
        slot: 'vue-remote-nuxt-host',
        hybrid: true,
      },
    ],
  },
]

const picked = ref<HostKind | null>(null)
/** Step 2 sits behind its own card click, the same as the Host. */
const pickedRemote = ref<RemoteKind | null>(null)

function pick(host: HostKind) {
  picked.value = picked.value?.id === host.id ? null : host
  // A Remote kind belongs to one Host, so changing Host always drops it —
  // otherwise a stale `nuxt-remote-nuxt-host` would survive into the Vue Host.
  pickedRemote.value = null
}

function pickRemote(remote: RemoteKind) {
  pickedRemote.value = pickedRemote.value?.slot === remote.slot ? null : remote
}
</script>

<template>
  <div class="setup-wiring">
    <p class="setup-wiring__q">Which Host are you setting up?</p>

    <div class="setup-cards">
      <button
        v-for="host in hosts"
        :key="host.id"
        type="button"
        class="setup-card"
        :class="{ 'is-picked': picked?.id === host.id }"
        :aria-pressed="picked?.id === host.id"
        @click="pick(host)"
      >
        <span class="setup-card__accent"></span>
        <span class="setup-card__body">
          <span class="setup-card__title">{{ host.title }}</span>
          <span class="setup-card__desc">{{ host.desc }}</span>
          <code class="setup-card__files">{{ host.files }}</code>
        </span>
      </button>
    </div>

    <template v-if="picked">
      <section class="setup-panel">
        <header class="setup-panel__head">
          <span class="setup-panel__step">Step 1 · Host</span>
          <span class="setup-panel__title">{{ picked.title }}</span>
          <span class="setup-panel__note">{{ picked.desc }}</span>
        </header>
        <div class="setup-panel__body">
          <slot v-if="picked.id === 'vue'" name="vue-host" />
          <slot v-else name="nuxt-host" />
        </div>
      </section>

      <p class="setup-wiring__q setup-wiring__q--sub">
        {{ picked.remotes.length > 1
          ? 'Two Remote kinds pair with this Host — the first is the standard, the flagged one a possible-but-risky hybrid.'
          : 'One Remote kind pairs with this Host.' }}
      </p>

      <div class="setup-cards">
        <button
          v-for="remote in picked.remotes"
          :key="remote.slot"
          type="button"
          class="setup-card"
          :class="{ 'is-picked': pickedRemote?.slot === remote.slot }"
          :aria-pressed="pickedRemote?.slot === remote.slot"
          @click="pickRemote(remote)"
        >
          <span class="setup-card__accent"></span>
          <span class="setup-card__body">
            <span class="setup-card__title"
              >{{ remote.title
              }}<span v-if="remote.hybrid" class="setup-card__hybrid">hybrid · risky</span></span
            >
            <span class="setup-card__desc">{{ remote.note }}</span>
            <code class="setup-card__files">{{ remote.files }}</code>
          </span>
        </button>
      </div>

      <section v-if="pickedRemote" class="setup-panel">
        <header class="setup-panel__head">
          <span class="setup-panel__step">Step 2 · Remote</span>
          <span class="setup-panel__title">{{ pickedRemote.title }} for the {{ picked.title }}</span>
          <span class="setup-panel__note">{{ pickedRemote.note }}</span>
        </header>
        <div class="setup-panel__body">
          <!-- Dynamic slot name: each RemoteKind names the block that holds its
               wiring, so adding a Remote kind is a data change, not a v-if. -->
          <slot :name="pickedRemote.slot" />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.setup-wiring {
  margin: 1.25rem 0;
}
.setup-wiring__q {
  margin: 0 0 0.75rem;
  font-weight: 600;
}
.setup-wiring__q--sub {
  margin-top: 1.75rem;
}

.setup-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}
@media (max-width: 640px) {
  .setup-cards {
    grid-template-columns: minmax(0, 1fr);
  }
}

.setup-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
  padding: 0;
  text-align: left;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}
.setup-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
  box-shadow: 0 18px 36px -16px color-mix(in srgb, var(--vp-c-brand-1) 22%, transparent);
}
.setup-card.is-picked {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  transform: none;
}

.setup-card__accent {
  height: 3px;
  background: linear-gradient(90deg, #a855f7 0%, #7c3aed 50%, #4f46e5 100%);
}
.setup-card__body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  padding: 0.9rem 1rem 1rem;
}
.setup-card__title {
  font-weight: 600;
  font-size: 1.05rem;
  letter-spacing: -0.01em;
}
.setup-card__hybrid {
  margin-left: 0.5rem;
  padding: 0.08rem 0.5rem;
  border-radius: 999px;
  background: var(--vp-c-warning-soft, rgba(234, 179, 8, 0.14));
  color: var(--vp-c-warning-1, #94850b);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  vertical-align: 1px;
}
.setup-card__desc {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}
.setup-card__files {
  padding: 0;
  background: transparent;
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
}

.setup-panel {
  margin-top: 1.25rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}
.setup-panel__head {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
}
.setup-panel__step {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
}
.setup-panel__title {
  font-weight: 600;
}
.setup-panel__note {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}
.setup-panel__body {
  padding: 1rem;
}

/* Slot content is the page's own markdown. Each `.setup-file` wrapper is one
   file — its own framed editor with a name bar, never one continuous run of code. */
.setup-panel__body :deep(.setup-file) {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  overflow: hidden;
}
.setup-panel__body :deep(.setup-file + .setup-file) {
  margin-top: 1rem;
}
.setup-panel__body :deep(.setup-file > p:first-child) {
  margin: 0;
  padding: 0.5rem 0.85rem;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
}
.setup-panel__body :deep(.setup-file > p:first-child strong) {
  font-family: var(--vp-font-family-mono);
  font-weight: 600;
  color: var(--vp-c-text-1);
}
.setup-panel__body :deep(.setup-file div[class*='language-']) {
  margin: 0;
  border-radius: 0;
}
</style>
