<script setup lang="ts">
/*
 * Section 7: llms.txt.
 *
 * Purple band, title on the left, a white card holding an example prompt on the
 * right.
 *
 * Deliberately built from plain elements rather than `<mono-card>`: everything
 * here is text, so it can be server-rendered. Using a mono component would
 * force the whole card behind `<ClientOnly>` (see MonoHome.vue's header note)
 * and keep the prompt out of the static HTML for no benefit.
 */
import { onBeforeUnmount, ref } from 'vue'

const LLMS_URL = 'https://mono-libs.netlify.app/llms.txt'

/*
 * A real task, written the way you would actually hand it over: point the agent
 * at llms.txt, then name the exact symbols and files. Every API named here is
 * the real one — controlMonoTable, monoCreateFetcher, the mono-table-* elements
 * and the menu[] entry all match the Table and Config docs.
 */
const PROMPT = `Read ${LLMS_URL} first, then open the
Table, DataSource and Config pages it lists.

In my Vue Remote, build a User master page:

- src/pages/master/user.vue
- controlMonoTable<UserRow> with keyExpr 'UserName' and
  searchValue ['UserName', 'FirstName', 'LastName']
- feed it from the myOdata entry in mono.config.ts using
  monoCreateFetcher, so search, sort and paging all run
  server-side
- columns: UserName, FirstName, LastName, Gender
- <mono-table-search> in the toolbar, <mono-table-paging>
  underneath at 25 rows per page, <mono-table-loading>
  inside the table
- register it in menu[] as { title: 'User', url:
  '/master/user', icon: 'i-mdi-account-group' } so the
  Host picks it up`

const copied = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined

async function copyPrompt() {
  try {
    await navigator.clipboard.writeText(PROMPT)
    copied.value = true
    clearTimeout(resetTimer)
    resetTimer = setTimeout(() => (copied.value = false), 1600)
  } catch {
    /* clipboard blocked (insecure origin, denied permission) — leave the label */
  }
}

onBeforeUnmount(() => clearTimeout(resetTimer))
</script>

<template>
  <section class="mono-llms">
    <div class="mono-llms__inner">
      <!-- Left: the pitch -->
      <div class="mono-llms__intro">
        <h2 class="mono-llms__title">
          Need an AI agent to explore the mono ecosystem? Use llms.txt every time
          you want to prompt something.
        </h2>
        <p class="mono-llms__lede">
          llms.txt helps an AI agent explore the documentation from its markdown
          version. Usually an agent goes to the web and reads the whole HTML —
          this time the agent only reads completely readable text.
        </p>

        <ul class="mono-llms__files">
          <li>
            <a :href="LLMS_URL">llms.txt</a>
            <span>the index, every page with a summary</span>
          </li>
          <li>
            <a href="https://mono-libs.netlify.app/llms-full.txt">llms-full.txt</a>
            <span>every page in full, one file</span>
          </li>
        </ul>
      </div>

      <!-- Right: the white prompt card -->
      <div class="mono-llms__card">
        <div class="mono-llms__card-head">
          <span class="mono-llms__label">Example prompt</span>
          <button type="button" class="mono-llms__copy" @click="copyPrompt()">
            {{ copied ? 'Copied' : 'Copy' }}
          </button>
        </div>

        <pre class="mono-llms__prompt"><code>{{ PROMPT }}</code></pre>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* The same band as the UI and Data fetching sections. */
.mono-llms {
  padding: 72px 24px 88px;
  background: var(--cyber-band);
}
@media (min-width: 960px) {
  .mono-llms {
    padding: 104px 48px 120px;
  }
}

.mono-llms__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  gap: 32px;
  max-width: 1152px;
  margin: 0 auto;
}
@media (min-width: 900px) {
  .mono-llms__inner {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 48px;
  }
}

/* Type sits on the gradient, so it is light rather than theme-coloured. */
.mono-llms__title {
  margin: 0;
  font-size: clamp(1.6rem, 3.2vw, 2.3rem);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: #ffffff;
}
.mono-llms__lede {
  margin: 14px 0 0;
  font-size: clamp(0.98rem, 1.5vw, 1.1rem);
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.82);
}

.mono-llms__files {
  margin: 22px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mono-llms__files li {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 10px;
  font-size: 0.86rem;
}
.mono-llms__files a {
  color: #ffffff;
  font-family: var(--vp-font-family-mono);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.mono-llms__files span {
  color: rgba(255, 255, 255, 0.7);
}

/* The prompt card: white on the band, whatever the site theme is. */
/* Was a hard white slab, deliberately fixed in both themes. On a dark page it
   punched a hole straight through the design, so it is dark glass with a neon
   rim instead.

   The glow HAS to be an outer box-shadow: the `overflow: hidden` above is what
   clips the head and the <pre> to the radius, and it would clip an inner
   pseudo-element halo just the same. */
.mono-llms__card {
  overflow: hidden;
  border: 1px solid var(--cyber-card-edge);
  border-radius: 16px;
  background: var(--cyber-card);
  backdrop-filter: blur(10px);
  box-shadow:
    inset 0 1px 0 var(--cyber-inner-hi),
    var(--cyber-card-shadow);
}

.mono-llms__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(167, 139, 250, 0.22);
}
.mono-llms__label {
  font-family: var(--vp-font-family-mono);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}
.mono-llms__copy {
  /* min-width holds the box steady across the Copy -> Copied text swap, which
     otherwise makes the button jump width on click. */
  min-width: 68px;
  padding: 5px 12px;
  border: 1px solid rgba(167, 139, 250, 0.28);
  border-radius: 7px;
  background: rgba(167, 139, 250, 0.1);
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}
.mono-llms__copy:hover {
  border-color: var(--cyber-edge-hi);
  background: rgba(167, 139, 250, 0.18);
  color: var(--vp-c-text-1);
}

/* Light-on-dark now that the card is glass rather than a white slab. */
.mono-llms__prompt {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  color: var(--cyber-card-ink);
  font-family: var(--vp-font-family-mono);
  font-size: 0.8rem;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}
.mono-llms__prompt code {
  font-family: inherit;
}
</style>
