<script setup lang="ts">
import { ref, computed } from 'vue'

// Register only the web components this page uses (client-only — keeps them out
// of the SSR pass, same approach as the Odoo example).
if (!import.meta.env.SSR) {
    import('@mono-lit/helper/ui/nav')
    import('@mono-lit/helper/ui/card')
    import('@mono-lit/helper/ui/button')
    import('@mono-lit/helper/ui/chip')
    import('@mono-lit/helper/ui/input')
    import('@mono-lit/helper/ui/textarea')
    import('@mono-lit/helper/ui/dropdown')
    import('@mono-lit/helper/ui/modal')
    import('@mono-lit/helper/ui/drawer')
    import('@mono-lit/helper/ui/tabs')
}

/* ── Toast ─────────────────────────────────────────────────────────────── */
const toast = ref<{ text: string; tone: 'info' | 'success' | 'danger' } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null
function flashToast(text: string, tone: 'info' | 'success' | 'danger' = 'info') {
    toast.value = { text, tone }
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => (toast.value = null), 2400)
}

/* ── Avatar helper (initials, no external images) ──────────────────────── */
function initials(name: string) {
    return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}
const AVATAR_TINTS = ['var(--theme-primary)', 'var(--theme-info)', 'var(--theme-teal)', 'var(--theme-purple)', 'var(--theme-warning)']
function tintFor(seed: string) {
    let h = 0
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
    return AVATAR_TINTS[h % AVATAR_TINTS.length]
}

/* ── Current user ──────────────────────────────────────────────────────── */
const profile = {
    name: 'Alex Morgan',
    headline: 'Senior Frontend Engineer · Building design systems',
    profileViewers: 312,
    postImpressions: 1894,
}

/* ── Top-bar state ─────────────────────────────────────────────────────── */
const search = ref('')
const meOpen = ref(false)
const notifOpen = ref(false)
const messagingOpen = ref(false)

const notifications = ref([
    { id: 1, who: 'Priya Nair', text: 'liked your post about web components', time: '2h', unread: true },
    { id: 2, who: 'Daniel Kim', text: 'commented: "This is exactly what we needed."', time: '5h', unread: true },
    { id: 3, who: 'Mono UI', text: 'Your post reached 1,000 impressions 🎉', time: '1d', unread: false },
])
const unreadCount = computed(() => notifications.value.filter((n) => n.unread).length)
function markAllRead() {
    notifications.value = notifications.value.map((n) => ({ ...n, unread: false }))
    flashToast('All notifications marked as read.', 'success')
}

const conversations = ref([
    { id: 1, who: 'Priya Nair', last: 'Sounds great — let’s sync tomorrow.', time: '10:24', unread: true },
    { id: 2, who: 'Daniel Kim', last: 'Sent the figma file 👍', time: '09:02', unread: false },
    { id: 3, who: 'Sara Lopez', last: 'Thanks for the referral!', time: 'Mon', unread: false },
])

/* ── Composer ──────────────────────────────────────────────────────────── */
const composeOpen = ref(false)
const draft = ref('')
function openCompose() {
    draft.value = ''
    composeOpen.value = true
}
function publishPost() {
    const body = draft.value.trim()
    if (!body) return
    posts.value.unshift({
        id: postSeq++,
        author: profile.name,
        headline: 'You · just now',
        time: 'now',
        body,
        liked: false,
        likes: 0,
        comments: [],
        reposts: 0,
        you: true,
    })
    composeOpen.value = false
    feedFilter.value = 'recent'
    flashToast('Post shared to your network.', 'success')
}

/* ── Feed ──────────────────────────────────────────────────────────────── */
interface Comment { id: number; who: string; text: string }
interface Post {
    id: number
    author: string
    headline: string
    time: string
    body: string
    liked: boolean
    likes: number
    comments: Comment[]
    reposts: number
    you?: boolean
}
let postSeq = 100
let commentSeq = 1

const posts = ref<Post[]>([
    {
        id: 1,
        author: 'Priya Nair',
        headline: 'Design Systems Lead @ Northwind',
        time: '3h',
        body: 'Shipped our new component library on top of web components today. Framework-agnostic, themeable with CSS variables, and the team is already moving 2× faster. Standards-based UI is having a moment. 🚀',
        liked: false,
        likes: 128,
        comments: [
            { id: commentSeq++, who: 'Daniel Kim', text: 'Congrats! How are you handling SSR?' },
        ],
        reposts: 12,
    },
    {
        id: 2,
        author: 'Daniel Kim',
        headline: 'Engineering Manager · Hiring',
        time: '6h',
        body: 'We’re hiring 3 frontend engineers who love clean architecture and design systems. Remote-friendly. DMs open — tell me what you’re building. 👇',
        liked: true,
        likes: 86,
        comments: [],
        reposts: 5,
    },
    {
        id: 3,
        author: 'Sara Lopez',
        headline: 'Product Designer',
        time: '1d',
        body: 'Reminder: a design system is a product, not a project. Treat it like one — roadmap, versioning, docs, and real users (your devs).',
        liked: false,
        likes: 240,
        comments: [
            { id: commentSeq++, who: 'Alex Morgan', text: 'This. Docs are the feature.' },
            { id: commentSeq++, who: 'Priya Nair', text: '100%' },
        ],
        reposts: 34,
    },
])

const feedFilter = ref<'top' | 'recent'>('top')
const feedTabs = [
    { id: 'top', label: 'Top' },
    { id: 'recent', label: 'Recent' },
]
const visiblePosts = computed(() => {
    const list = [...posts.value]
    return feedFilter.value === 'top'
        ? list.sort((a, b) => b.likes + b.comments.length * 2 - (a.likes + a.comments.length * 2))
        : list.sort((a, b) => b.id - a.id)
})

function toggleLike(p: Post) {
    p.liked = !p.liked
    p.likes += p.liked ? 1 : -1
}
function repost(p: Post) {
    p.reposts++
    flashToast(`Reposted ${p.author}'s post.`, 'success')
}

/* ── Comments drawer ───────────────────────────────────────────────────── */
const commentsOpen = ref(false)
const activePostId = ref<number | null>(null)
const commentDraft = ref('')
const activePost = computed(() => posts.value.find((p) => p.id === activePostId.value) ?? null)
function openComments(p: Post) {
    activePostId.value = p.id
    commentDraft.value = ''
    commentsOpen.value = true
}
function submitComment() {
    const text = commentDraft.value.trim()
    if (!text || !activePost.value) return
    activePost.value.comments.push({ id: commentSeq++, who: profile.name, text })
    commentDraft.value = ''
}

/* ── Right rail ────────────────────────────────────────────────────────── */
const suggestions = ref([
    { id: 1, name: 'Mono UI', meta: 'Open-source design system', following: false },
    { id: 2, name: 'Frontend Weekly', meta: 'Newsletter · 120k followers', following: false },
    { id: 3, name: 'Lena Park', meta: 'Staff Engineer @ Vela', following: true },
])
function toggleFollow(s: { name: string; following: boolean }) {
    s.following = !s.following
    flashToast(s.following ? `Following ${s.name}.` : `Unfollowed ${s.name}.`, 'info')
}

const news = [
    { id: 1, title: 'Web components see record adoption', meta: 'Top news · 4,210 readers' },
    { id: 2, title: 'The case for design tokens', meta: '2h ago · 1,803 readers' },
    { id: 3, title: 'Remote hiring rebounds in Q3', meta: '5h ago · 980 readers' },
    { id: 4, title: 'CSS nesting lands everywhere', meta: '1d ago · 642 readers' },
]

const savedLinks = [
    { icon: 'i-mdi-bookmark-outline', label: 'Saved items' },
    { icon: 'i-mdi-account-group-outline', label: 'Groups' },
    { icon: 'i-mdi-newspaper-variant-outline', label: 'Newsletters' },
    { icon: 'i-mdi-calendar-outline', label: 'Events' },
]
</script>

<template>
    <div class="li-page theme-color-light-blue">
        <!-- ===== TOP BAR ===== -->
        <mono-nav density="comfortable" variant="flat" :sticky="true" class="li-nav">
            <div slot="start" class="flex items-center gap-2">
                <span class="li-brand">in</span>
                <label class="li-search">
                    <span class="i-mdi-magnify li-search-ic"></span>
                    <input
                        class="li-search-input"
                        placeholder="Search"
                        :value="search"
                        @input="search = ($event.target as HTMLInputElement).value"
                    />
                </label>
            </div>

            <nav slot="end" class="li-navlinks">
                <a href="#" class="li-navlink li-navlink-active"><span class="i-mdi-home-variant"></span><span>Home</span></a>
                <a href="#" class="li-navlink"><span class="i-mdi-account-multiple-outline"></span><span>Network</span></a>
                <a href="#" class="li-navlink"><span class="i-mdi-briefcase-outline"></span><span>Jobs</span></a>

                <button class="li-navlink" @click="messagingOpen = true">
                    <span class="i-mdi-message-text-outline"></span><span>Messaging</span>
                    <span class="li-dot"></span>
                </button>

                <mono-dropdown
                    placement="bottom-end"
                    :model-value="notifOpen"
                    @change="notifOpen = $event.detail.modelValue"
                >
                    <button slot="main" class="li-navlink">
                        <span class="i-mdi-bell-outline"></span><span>Notifications</span>
                        <mono-chip v-if="unreadCount" mode="chip" color="danger" variant="solid" shape="pill" size="xs" :label="String(unreadCount)" class="li-navbadge"></mono-chip>
                    </button>
                    <div slot="body" class="li-pop">
                        <div class="li-pop-head">
                            <strong>Notifications</strong>
                            <button class="li-link" @click="markAllRead">Mark all read</button>
                        </div>
                        <div v-for="n in notifications" :key="n.id" class="li-pop-row" :class="{ 'li-pop-row-unread': n.unread }">
                            <span class="li-avatar li-avatar-sm" :style="{ background: tintFor(n.who) }">{{ initials(n.who) }}</span>
                            <div class="li-pop-text">
                                <div><strong>{{ n.who }}</strong> {{ n.text }}</div>
                                <div class="li-muted li-xs">{{ n.time }}</div>
                            </div>
                        </div>
                    </div>
                </mono-dropdown>

                <mono-dropdown
                    placement="bottom-end"
                    :model-value="meOpen"
                    @change="meOpen = $event.detail.modelValue"
                >
                    <button slot="main" class="li-navlink li-me">
                        <span class="li-avatar li-avatar-sm" :style="{ background: tintFor(profile.name) }">{{ initials(profile.name) }}</span>
                        <span>Me <span class="i-mdi-chevron-down"></span></span>
                    </button>
                    <div slot="body" class="li-pop li-pop-narrow">
                        <div class="li-pop-profile">
                            <span class="li-avatar" :style="{ background: tintFor(profile.name) }">{{ initials(profile.name) }}</span>
                            <div>
                                <strong>{{ profile.name }}</strong>
                                <div class="li-muted li-xs">{{ profile.headline }}</div>
                            </div>
                        </div>
                        <mono-button size="sm" variant="outline" color="primary" class="li-block-btn" @click="meOpen = false; flashToast('Opening your profile…')">View profile</mono-button>
                        <div class="li-pop-menu">
                            <button class="li-pop-item" @click="meOpen = false; flashToast('Settings')"><span class="i-mdi-cog-outline"></span>Settings &amp; privacy</button>
                            <button class="li-pop-item" @click="meOpen = false; flashToast('Help')"><span class="i-mdi-help-circle-outline"></span>Help</button>
                            <button class="li-pop-item li-danger" @click="meOpen = false; flashToast('Signed out.', 'danger')"><span class="i-mdi-logout"></span>Sign out</button>
                        </div>
                    </div>
                </mono-dropdown>
            </nav>
        </mono-nav>

        <!-- ===== BODY GRID ===== -->
        <main class="li-grid">
            <!-- LEFT RAIL -->
            <aside class="li-left">
                <mono-card variant="elevated" class="li-card li-profile-card">
                    <div class="li-cover"></div>
                    <div class="li-profile-body">
                        <span class="li-avatar li-avatar-lg li-profile-avatar" :style="{ background: tintFor(profile.name) }">{{ initials(profile.name) }}</span>
                        <a href="#" class="li-profile-name">{{ profile.name }}</a>
                        <div class="li-muted li-sm">{{ profile.headline }}</div>
                    </div>
                    <div class="li-profile-stats">
                        <div class="li-stat">
                            <span class="li-muted li-xs">Profile viewers</span>
                            <span class="li-stat-num">{{ profile.profileViewers }}</span>
                        </div>
                        <div class="li-stat">
                            <span class="li-muted li-xs">Post impressions</span>
                            <span class="li-stat-num">{{ profile.postImpressions.toLocaleString() }}</span>
                        </div>
                    </div>
                </mono-card>

                <mono-card variant="elevated" class="li-card li-saved">
                    <button v-for="l in savedLinks" :key="l.label" class="li-saved-item" @click="flashToast(l.label)">
                        <span :class="l.icon"></span>{{ l.label }}
                    </button>
                </mono-card>
            </aside>

            <!-- CENTER FEED -->
            <section class="li-center">
                <mono-card variant="elevated" class="li-card li-composer">
                    <div class="li-composer-top">
                        <span class="li-avatar" :style="{ background: tintFor(profile.name) }">{{ initials(profile.name) }}</span>
                        <button class="li-composer-trigger" @click="openCompose">Start a post</button>
                    </div>
                    <div class="li-composer-actions">
                        <mono-button size="sm" variant="ghost" color="info" @click="openCompose"><span slot="icon" class="i-mdi-image-outline"></span>Photo</mono-button>
                        <mono-button size="sm" variant="ghost" color="success" @click="openCompose"><span slot="icon" class="i-mdi-video-outline"></span>Video</mono-button>
                        <mono-button size="sm" variant="ghost" color="warning" @click="openCompose"><span slot="icon" class="i-mdi-calendar-star"></span>Event</mono-button>
                        <mono-button size="sm" variant="ghost" color="danger" @click="openCompose"><span slot="icon" class="i-mdi-text-box-outline"></span>Article</mono-button>
                    </div>
                </mono-card>

                <div class="li-feed-filter">
                    <mono-tabs
                        :items.prop="feedTabs"
                        :model-value="feedFilter"
                        variant="underline"
                        color="primary"
                        @change="feedFilter = $event.detail.modelValue"
                    ></mono-tabs>
                </div>

                <mono-card v-for="p in visiblePosts" :key="p.id" variant="elevated" class="li-card li-post">
                    <header class="li-post-head">
                        <span class="li-avatar" :style="{ background: tintFor(p.author) }">{{ initials(p.author) }}</span>
                        <div class="li-post-meta">
                            <a href="#" class="li-post-author">{{ p.author }}</a>
                            <div class="li-muted li-xs">{{ p.headline }}</div>
                            <div class="li-muted li-xs">{{ p.time }} · <span class="i-mdi-earth"></span></div>
                        </div>
                        <mono-chip v-if="p.you" mode="chip" color="primary" variant="soft" shape="pill" size="xs" label="You"></mono-chip>
                    </header>

                    <p class="li-post-body">{{ p.body }}</p>

                    <div class="li-post-stats">
                        <span><span class="i-mdi-thumb-up li-react-ic"></span> {{ p.likes }}</span>
                        <span>{{ p.comments.length }} comments · {{ p.reposts }} reposts</span>
                    </div>

                    <div class="li-post-actions">
                        <button class="li-action" :class="{ 'li-action-on': p.liked }" @click="toggleLike(p)">
                            <span :class="p.liked ? 'i-mdi-thumb-up' : 'i-mdi-thumb-up-outline'"></span>Like
                        </button>
                        <button class="li-action" @click="openComments(p)">
                            <span class="i-mdi-comment-outline"></span>Comment
                        </button>
                        <button class="li-action" @click="repost(p)">
                            <span class="i-mdi-repeat-variant"></span>Repost
                        </button>
                        <button class="li-action" @click="flashToast('Share sheet opened.')">
                            <span class="i-mdi-send-outline"></span>Send
                        </button>
                    </div>
                </mono-card>
            </section>

            <!-- RIGHT RAIL -->
            <aside class="li-right">
                <mono-card variant="elevated" class="li-card">
                    <div class="li-card-title">Add to your feed</div>
                    <div v-for="s in suggestions" :key="s.id" class="li-sugg">
                        <span class="li-avatar" :style="{ background: tintFor(s.name) }">{{ initials(s.name) }}</span>
                        <div class="li-sugg-text">
                            <a href="#" class="li-sugg-name">{{ s.name }}</a>
                            <div class="li-muted li-xs">{{ s.meta }}</div>
                        </div>
                        <mono-button
                            size="xs"
                            :variant="s.following ? 'soft' : 'outline'"
                            color="primary"
                            shape="pill"
                            @click="toggleFollow(s)"
                        >
                            <span slot="icon" :class="s.following ? 'i-mdi-check' : 'i-mdi-plus'"></span>
                            {{ s.following ? 'Following' : 'Follow' }}
                        </mono-button>
                    </div>
                </mono-card>

                <mono-card variant="elevated" class="li-card">
                    <div class="li-card-title">Mono News</div>
                    <button v-for="n in news" :key="n.id" class="li-news" @click="flashToast(n.title)">
                        <span class="li-news-dot"></span>
                        <span class="li-news-text">
                            <span class="li-news-title">{{ n.title }}</span>
                            <span class="li-muted li-xs">{{ n.meta }}</span>
                        </span>
                    </button>
                </mono-card>
            </aside>
        </main>

        <!-- ===== CREATE POST MODAL ===== -->
        <mono-modal
            title="Create a post"
            color="primary"
            width="540px"
            :model-value="composeOpen"
            @close="composeOpen = false"
        >
            <div class="li-modal-author">
                <span class="li-avatar" :style="{ background: tintFor(profile.name) }">{{ initials(profile.name) }}</span>
                <div>
                    <strong>{{ profile.name }}</strong>
                    <div class="li-muted li-xs">Post to anyone</div>
                </div>
            </div>
            <mono-textarea
                placeholder="What do you want to talk about?"
                :rows="5"
                :model-value="draft"
                @input="draft = $event.detail.modelValue"
            ></mono-textarea>
            <span slot="foot" class="li-modal-foot">
                <div class="li-modal-tools">
                    <mono-button size="sm" variant="ghost" color="info" icon-only aria-label-text="Add photo" @click="flashToast('Photo picker')"><span slot="icon" class="i-mdi-image-outline"></span></mono-button>
                    <mono-button size="sm" variant="ghost" color="success" icon-only aria-label-text="Add emoji" @click="flashToast('Emoji')"><span slot="icon" class="i-mdi-emoticon-happy-outline"></span></mono-button>
                </div>
                <mono-button variant="solid" color="primary" shape="pill" :disabled="!draft.trim()" @click="publishPost">Post</mono-button>
            </span>
        </mono-modal>

        <!-- ===== COMMENTS DRAWER ===== -->
        <mono-drawer
            position="right"
            title="Comments"
            :model-value="commentsOpen"
            @close="commentsOpen = false"
        >
            <!-- Single stable wrapper so the drawer captures it as the body at
                 connect (dynamic content updates inside it, in the portal). -->
            <div class="li-cmt-body">
                <!-- Composer pinned to the top, full-width input -->
                <div class="li-cmt-compose-top">
                    <mono-input
                        size="sm"
                        variant="outlined"
                        placeholder="Add a comment…"
                        :model-value="commentDraft"
                        @input="commentDraft = $event.detail.modelValue"
                    ></mono-input>
                    <div class="li-cmt-compose-actions">
                        <mono-button size="sm" variant="solid" color="primary" shape="pill" :disabled="!commentDraft.trim()" @click="submitComment">Comment</mono-button>
                    </div>
                </div>

                <template v-if="activePost">
                    <div class="li-cmt-post">
                        <span class="li-avatar li-avatar-sm" :style="{ background: tintFor(activePost.author) }">{{ initials(activePost.author) }}</span>
                        <div>
                            <strong>{{ activePost.author }}</strong>
                            <p class="li-cmt-postbody">{{ activePost.body }}</p>
                        </div>
                    </div>
                    <div class="li-cmt-list">
                        <div v-for="c in activePost.comments" :key="c.id" class="li-cmt">
                            <span class="li-avatar li-avatar-sm" :style="{ background: tintFor(c.who) }">{{ initials(c.who) }}</span>
                            <div class="li-cmt-bubble">
                                <strong>{{ c.who }}</strong>
                                <div>{{ c.text }}</div>
                            </div>
                        </div>
                        <div v-if="!activePost.comments.length" class="li-muted li-sm li-cmt-empty">Be the first to comment.</div>
                    </div>
                </template>
            </div>
        </mono-drawer>

        <!-- ===== MESSAGING DRAWER ===== -->
        <mono-drawer
            position="right"
            title="Messaging"
            :model-value="messagingOpen"
            @close="messagingOpen = false"
        >
            <div class="li-conv-list">
                <button v-for="c in conversations" :key="c.id" class="li-conv" @click="flashToast(`Opening chat with ${c.who}…`)">
                    <span class="li-avatar" :style="{ background: tintFor(c.who) }">{{ initials(c.who) }}</span>
                    <div class="li-conv-text">
                        <div class="li-conv-top">
                            <strong>{{ c.who }}</strong>
                            <span class="li-muted li-xs">{{ c.time }}</span>
                        </div>
                        <div class="li-muted li-sm li-conv-last" :class="{ 'li-conv-unread': c.unread }">{{ c.last }}</div>
                    </div>
                </button>
            </div>
        </mono-drawer>

        <!-- ===== TOAST ===== -->
        <transition name="li-toast">
            <div v-if="toast" class="li-toast" :class="`li-toast-${toast.tone}`">
                <span :class="{ 'i-mdi-information': toast.tone === 'info', 'i-mdi-check-circle': toast.tone === 'success', 'i-mdi-alert-circle': toast.tone === 'danger' }"></span>
                <span>{{ toast.text }}</span>
            </div>
        </transition>
    </div>
</template>

<style>
/* Root — pinned to the light-blue palette so the page looks consistent and
   self-contained regardless of the site's theme switcher. All values come from
   theme tokens. */
.li-page {
    font-family: var(--theme-font-family);
    color: var(--theme-text);
    background: color-mix(in srgb, var(--theme-primary) 5%, #eef1f3);
    min-height: 100vh;
}
.li-page, .li-page * { box-sizing: border-box; }
.li-muted { color: var(--theme-text-secondary, rgba(0,0,0,.6)); }
.li-xs { font-size: var(--theme-font-size-xs); }
.li-sm { font-size: var(--theme-font-size-sm); }
.li-link {
    background: none; border: none; cursor: pointer; font: inherit;
    color: var(--theme-primary); font-weight: var(--theme-font-weight-medium);
}
.li-link:hover { text-decoration: underline; }
.li-danger { color: var(--theme-danger); }

/* Avatars */
.li-avatar {
    flex: none;
    display: inline-flex; align-items: center; justify-content: center;
    width: 3rem; height: 3rem; border-radius: var(--theme-radius-full);
    color: #fff; font-weight: var(--theme-font-weight-bold);
    font-size: var(--theme-font-size-sm); letter-spacing: 0;
}
.li-avatar-sm { width: 2.1rem; height: 2.1rem; font-size: var(--theme-font-size-xs); }
.li-avatar-lg { width: 4.5rem; height: 4.5rem; font-size: var(--theme-font-size-lg); }

/* ── Top bar ───────────────────────────────────────────────────────────── */
.li-page .li-nav {
    background: var(--theme-surface);
    box-shadow: var(--theme-elev-1);
    border-bottom: 1px solid var(--theme-border);
}
.li-page .li-nav .mono-nav, .li-page .li-nav > * { background: var(--theme-surface); }
.li-brand {
    display: inline-flex; align-items: center; justify-content: center;
    width: 2.1rem; height: 2.1rem; border-radius: var(--theme-radius-sm);
    background: var(--theme-primary); color: var(--theme-primary-contrast, #fff);
    font-weight: 800; font-size: 1.1rem;
}
.li-search {
    display: inline-flex; align-items: center; gap: .4rem;
    background: color-mix(in srgb, var(--theme-primary) 8%, var(--theme-surface));
    border-radius: var(--theme-radius-sm); padding: .4rem .7rem; min-width: 14rem;
}
.li-search-ic { color: var(--theme-text-secondary); font-size: 1.1rem; }
.li-search-input { border: none; background: none; outline: none; font: inherit; color: var(--theme-text); width: 100%; }
.li-navlinks { display: flex; align-items: center; gap: .35rem; }
.li-navlink {
    position: relative;
    display: inline-flex; flex-direction: column; align-items: center; gap: 1px;
    background: none; border: none; cursor: pointer; font: inherit;
    padding: .35rem .7rem; border-radius: var(--theme-radius-sm);
    color: var(--theme-text-secondary); font-size: var(--theme-font-size-xs);
    text-decoration: none; transition: color var(--theme-duration-fast) var(--theme-motion-standard), background var(--theme-duration-fast) var(--theme-motion-standard);
}
.li-navlink > span:first-child { font-size: 1.3rem; }
.li-navlink:hover { color: var(--theme-text); background: var(--theme-action-hover, rgba(0,0,0,.04)); }
.li-navlink-active { color: var(--theme-primary); }
.li-me { flex-direction: row; gap: .35rem; }
.li-navbadge { position: absolute; top: .1rem; right: .45rem; }
.li-dot { position: absolute; top: .35rem; right: .8rem; width: .5rem; height: .5rem; border-radius: 9999px; background: var(--theme-danger); }

/* Popovers (dropdown body) */
.li-pop { width: 22rem; max-width: 88vw; background: var(--theme-surface); border-radius: var(--theme-radius-md); overflow: hidden; }
.li-pop-narrow { width: 16rem; padding: .9rem; }
.li-pop-head { display: flex; align-items: center; justify-content: space-between; padding: .8rem 1rem; border-bottom: 1px solid var(--theme-border); }
.li-pop-row { display: flex; gap: .65rem; padding: .7rem 1rem; align-items: flex-start; cursor: pointer; }
.li-pop-row:hover { background: var(--theme-action-hover, rgba(0,0,0,.04)); }
.li-pop-row-unread { background: color-mix(in srgb, var(--theme-primary) 7%, transparent); }
.li-pop-text { font-size: var(--theme-font-size-sm); line-height: var(--theme-line-height-base); }
.li-pop-profile { display: flex; gap: .65rem; align-items: center; margin-bottom: .75rem; }
.li-block-btn { width: 100%; }
.li-pop-menu { margin-top: .6rem; border-top: 1px solid var(--theme-border); padding-top: .4rem; display: flex; flex-direction: column; }
.li-pop-item { display: flex; align-items: center; gap: .55rem; padding: .5rem .3rem; background: none; border: none; cursor: pointer; font: inherit; font-size: var(--theme-font-size-sm); color: var(--theme-text); text-align: left; border-radius: var(--theme-radius-xs); }
.li-pop-item:hover { background: var(--theme-action-hover, rgba(0,0,0,.04)); }

/* ── Grid ──────────────────────────────────────────────────────────────── */
.li-grid {
    display: grid; gap: 1.5rem;
    grid-template-columns: 18rem minmax(0, 1fr) 20rem;
    align-items: start;
    max-width: 76rem; margin: 0 auto; padding: 1.5rem 1rem 3rem;
}
.li-left, .li-right { display: flex; flex-direction: column; gap: 1rem; position: sticky; top: 5rem; }
.li-center { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
@media (max-width: 1080px) { .li-grid { grid-template-columns: 18rem minmax(0,1fr); } .li-right { display: none; } }
@media (max-width: 800px) { .li-grid { grid-template-columns: 1fr; } .li-left { display: none; } .li-left, .li-right { position: static; } }

.li-card { background: var(--theme-surface); border-radius: var(--theme-radius-md); overflow: hidden; }
.li-card-title { font-weight: var(--theme-font-weight-bold); font-size: var(--theme-font-size-sm); padding: 1rem 1rem .25rem; }

/* Profile card */
.li-cover { height: 3.5rem; background: linear-gradient(120deg, var(--theme-primary), var(--theme-info)); }
.li-profile-body { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0 1rem 1rem; }
.li-profile-avatar { margin-top: -2.4rem; border: 3px solid var(--theme-surface); }
.li-profile-name { margin-top: .5rem; font-weight: var(--theme-font-weight-bold); color: var(--theme-text); text-decoration: none; }
.li-profile-name:hover { text-decoration: underline; }
.li-profile-stats { border-top: 1px solid var(--theme-border); padding: .5rem 1rem; }
.li-stat { display: flex; justify-content: space-between; align-items: center; padding: .35rem 0; }
.li-stat-num { font-weight: var(--theme-font-weight-bold); color: var(--theme-primary); font-size: var(--theme-font-size-sm); }

/* Saved links */
.li-saved { padding: .4rem; }
.li-saved-item { width: 100%; display: flex; align-items: center; gap: .6rem; padding: .55rem .7rem; background: none; border: none; cursor: pointer; font: inherit; font-size: var(--theme-font-size-sm); color: var(--theme-text-secondary); text-align: left; border-radius: var(--theme-radius-sm); }
.li-saved-item:hover { background: var(--theme-action-hover, rgba(0,0,0,.04)); color: var(--theme-text); }
.li-saved-item span:first-child { font-size: 1.2rem; }

/* Composer */
.li-composer { padding: 1rem; }
.li-composer-top { display: flex; align-items: center; gap: .7rem; }
.li-composer-trigger { flex: 1; text-align: left; padding: .8rem 1rem; border-radius: var(--theme-radius-full); border: 1px solid var(--theme-border); background: var(--theme-surface); color: var(--theme-text-secondary); font: inherit; cursor: pointer; font-weight: var(--theme-font-weight-medium); }
.li-composer-trigger:hover { background: var(--theme-action-hover, rgba(0,0,0,.04)); }
.li-composer-actions { display: flex; justify-content: space-around; gap: .25rem; margin-top: .6rem; flex-wrap: wrap; }

.li-feed-filter { display: flex; justify-content: flex-end; padding: 0 .25rem; }

/* Post */
.li-post { padding: 1rem 1rem .25rem; }
.li-post-head { display: flex; gap: .7rem; align-items: flex-start; }
.li-post-meta { flex: 1; min-width: 0; }
.li-post-author { font-weight: var(--theme-font-weight-bold); color: var(--theme-text); text-decoration: none; }
.li-post-author:hover { text-decoration: underline; color: var(--theme-primary); }
.li-post-body { margin: .8rem 0 .6rem; font-size: var(--theme-font-size-sm); line-height: var(--theme-line-height-base); white-space: pre-line; color: var(--theme-text); }
.li-post-stats { display: flex; justify-content: space-between; font-size: var(--theme-font-size-xs); color: var(--theme-text-secondary); padding: .35rem 0; border-bottom: 1px solid var(--theme-border); }
.li-react-ic { color: var(--theme-primary); }
.li-post-actions { display: flex; justify-content: space-around; padding: .25rem 0 .5rem; gap: .25rem; flex-wrap: wrap; }
.li-action { display: inline-flex; align-items: center; gap: .4rem; background: none; border: none; cursor: pointer; font: inherit; font-size: var(--theme-font-size-sm); font-weight: var(--theme-font-weight-medium); color: var(--theme-text-secondary); padding: .45rem .8rem; border-radius: var(--theme-radius-sm); transition: background var(--theme-duration-fast) var(--theme-motion-standard), color var(--theme-duration-fast) var(--theme-motion-standard); }
.li-action span { font-size: 1.15rem; }
.li-action:hover { background: var(--theme-action-hover, rgba(0,0,0,.04)); color: var(--theme-text); }
.li-action-on { color: var(--theme-primary); }

/* Right rail */
.li-sugg { display: flex; align-items: center; gap: .65rem; padding: .6rem 1rem; }
.li-sugg-text { flex: 1; min-width: 0; }
.li-sugg-name { font-weight: var(--theme-font-weight-semibold); color: var(--theme-text); text-decoration: none; font-size: var(--theme-font-size-sm); }
.li-sugg-name:hover { text-decoration: underline; }
.li-news { width: 100%; display: flex; gap: .6rem; padding: .5rem 1rem; background: none; border: none; cursor: pointer; text-align: left; font: inherit; }
.li-news:hover { background: var(--theme-action-hover, rgba(0,0,0,.04)); }
.li-news-dot { width: .4rem; height: .4rem; border-radius: 9999px; background: var(--theme-text-secondary); margin-top: .5rem; flex: none; }
.li-news-text { display: flex; flex-direction: column; }
.li-news-title { font-weight: var(--theme-font-weight-semibold); font-size: var(--theme-font-size-sm); color: var(--theme-text); }

/* Modal / drawer bits */
.li-modal-author { display: flex; gap: .65rem; align-items: center; margin-bottom: .8rem; }
.li-modal-foot { display: flex; align-items: center; justify-content: space-between; width: 100%; }
.li-modal-tools { display: flex; gap: .25rem; }
.li-cmt-post { display: flex; gap: .6rem; padding-bottom: .8rem; border-bottom: 1px solid var(--theme-border); margin-bottom: .8rem; }
.li-cmt-postbody { margin: .3rem 0 0; font-size: var(--theme-font-size-sm); color: var(--theme-text-secondary); }
.li-cmt-list { display: flex; flex-direction: column; gap: .8rem; }
.li-cmt { display: flex; gap: .6rem; }
.li-cmt-bubble { background: color-mix(in srgb, var(--theme-primary) 6%, var(--theme-surface)); border-radius: var(--theme-radius-md); padding: .55rem .8rem; font-size: var(--theme-font-size-sm); }
.li-cmt-empty { padding: 1rem 0; }
.li-cmt-compose-top {
    display: flex; flex-direction: column; gap: .55rem;
    padding-bottom: .9rem; margin-bottom: .9rem;
    border-bottom: 1px solid var(--theme-border);
}
.li-cmt-compose-top mono-input { width: 100%; display: block; }
.li-cmt-compose-actions { display: flex; justify-content: flex-end; }
.li-conv-list { display: flex; flex-direction: column; }
.li-conv { display: flex; gap: .65rem; padding: .7rem .25rem; background: none; border: none; cursor: pointer; text-align: left; font: inherit; border-bottom: 1px solid var(--theme-border); }
.li-conv:hover { background: var(--theme-action-hover, rgba(0,0,0,.04)); }
.li-conv-text { flex: 1; min-width: 0; }
.li-conv-top { display: flex; justify-content: space-between; }
.li-conv-last { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.li-conv-unread { color: var(--theme-text); font-weight: var(--theme-font-weight-semibold); }

/* Toast (reused from the Odoo example) */
.li-page .li-toast { position: fixed; bottom: 1.5rem; right: 1.5rem; display: flex; align-items: center; gap: .6rem; padding: .75rem 1.1rem; background: var(--theme-dark, #222); color: #fff; border-radius: var(--theme-radius-sm); font-size: var(--theme-font-size-sm); font-weight: var(--theme-font-weight-medium); box-shadow: var(--theme-elev-3); z-index: 1000; max-width: 360px; }
.li-page .li-toast-success { background: var(--theme-success); }
.li-page .li-toast-danger { background: var(--theme-danger); }
.li-toast-enter-active, .li-toast-leave-active { transition: opacity var(--theme-duration-base) var(--theme-motion-standard), transform var(--theme-duration-base) var(--theme-motion-standard); }
.li-toast-enter-from, .li-toast-leave-to { opacity: 0; transform: translateY(8px); }
</style>
