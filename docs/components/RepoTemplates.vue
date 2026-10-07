<script setup lang="ts">
import { ref } from 'vue'

interface Repo {
  title: string
  repo?: string
  ref: string
  desc: string
  url: string
}

interface Host extends Repo {
  id: 'vue' | 'nuxt'
  /**
   * Every Remote that pairs with this Host. The standard is same-framework:
   * Vue Host + Vue Remote, Nuxt Host + Nuxt Remote. A Nuxt Host can also take
   * a Vue Remote — a possible-but-risky hybrid merged by mono's compat layer,
   * not by Nuxt itself. A Vue Host takes only the Vue one - a Nuxt app ships
   * no vite.config for a Vite Host to drive.
   */
  remotes: Repo[]
}

const hosts: Host[] = [
  {
    id: 'vue',
    title: 'Vue Host',
    ref: 'main',
    desc: 'Vite + Vue shell.',
    url: 'https://github.com/mono-lit/templates/tree/main/vue-host',
    remotes: [
      {
        title: 'Vue Remote',
        ref: 'example-vue-host',
        desc: 'Already wired to a Vue Host.',
        url: 'https://github.com/mono-lit/templates/tree/main/vue-remote',
      },
    ],
  },
  {
    id: 'nuxt',
    title: 'Nuxt Host',
    ref: 'main',
    desc: 'Nuxt (SSR) shell.',
    url: 'https://github.com/mono-lit/templates/tree/main/nuxt-host',
    remotes: [
      {
        title: 'Nuxt Remote',
        ref: 'main',
        desc: 'Nuxt pages inside the Host shell. Merged as a native Nuxt layer.',
        url: 'https://github.com/mono-lit/templates/tree/main/nuxt-remote',
      },
    ],
  },
]

const picked = ref<Host | null>(null)

function pick(host: Host) {
  picked.value = picked.value?.id === host.id ? null : host
}
</script>

<template>
  <div class="repo-picker">
    <p class="repo-picker__q">What Host does your team use?</p>

    <div class="repo-cards">
      <button
        v-for="host in hosts"
        :key="host.id"
        type="button"
        class="repo-card"
        :class="{ 'is-picked': picked?.id === host.id }"
        :aria-pressed="picked?.id === host.id"
        @click="pick(host)"
      >
        <span class="repo-card__accent"></span>
        <span class="repo-card__body">
          <span class="repo-card__title">{{ host.title }}</span>
          <code class="repo-card__repo">{{ host.repo }}</code>
          <span class="repo-card__desc">{{ host.desc }}</span>
          <span class="repo-card__ref">{{ host.ref }}</span>
        </span>
      </button>
    </div>

    <div v-if="picked" class="repo-picker__answer">
      <p class="repo-picker__q">
        Download the Host, plus
        {{ picked.remotes.length > 1 ? 'whichever Remote you want — the same-framework one is the standard' : 'its Remote' }}:
      </p>

      <div class="repo-cards">
        <a
          class="repo-card repo-card--link"
          :href="picked.url"
          target="_blank"
          rel="noreferrer"
        >
          <span class="repo-card__accent"></span>
          <span class="repo-card__body">
            <span class="repo-card__step">Host</span>
            <span class="repo-card__title">{{ picked.title }}</span>
            <code class="repo-card__repo">{{ picked.repo }}</code>
            <span class="repo-card__desc">{{ picked.desc }}</span>
            <span class="repo-card__ref">{{ picked.ref }}</span>
          </span>
        </a>
        <a
          v-for="remote in picked.remotes"
          :key="remote.url"
          class="repo-card repo-card--link"
          :href="remote.url"
          target="_blank"
          rel="noreferrer"
        >
          <span class="repo-card__accent"></span>
          <span class="repo-card__body">
            <span class="repo-card__step">Remote</span>
            <span class="repo-card__title">{{ remote.title }}</span>
            <code class="repo-card__repo">{{ remote.repo }}</code>
            <span class="repo-card__desc">{{ remote.desc }}</span>
            <span class="repo-card__ref">{{ remote.ref }}</span>
          </span>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.repo-picker {
  margin: 1.25rem 0;
}
.repo-picker__q {
  margin: 0 0 0.75rem;
  font-weight: 600;
}
.repo-picker__answer {
  margin-top: 1.5rem;
}

.repo-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}
@media (max-width: 640px) {
  .repo-cards {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* `.vp-doc a` paints brand color + underline — the attribute selector on this
   scoped rule (0,2,0) out-specifies it (0,1,1), so links read as cards. */
.repo-card,
.repo-card:hover {
  color: var(--vp-c-text-1);
  font-weight: 400;
  text-decoration: none;
}
.repo-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
  padding: 0;
  text-align: left;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--vp-c-bg-soft);
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}
.repo-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
  box-shadow: 0 18px 36px -16px color-mix(in srgb, var(--vp-c-brand-1) 22%, transparent);
}
.repo-card.is-picked {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.repo-card__accent {
  height: 3px;
  background: linear-gradient(90deg, #a855f7 0%, #7c3aed 50%, #4f46e5 100%);
}
.repo-card__body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  padding: 0.9rem 1rem 1rem;
}
.repo-card__step {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
}
.repo-card__title {
  font-weight: 600;
  font-size: 1.05rem;
  letter-spacing: -0.01em;
}
.repo-card__repo {
  padding: 0;
  background: transparent;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
}
.repo-card__desc {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}
.repo-card__ref {
  margin-top: 0.15rem;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  line-height: 1.6;
}
.repo-card.is-picked .repo-card__ref {
  background: var(--vp-c-bg);
}
</style>
