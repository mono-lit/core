
<script setup lang="ts">
// @ts-nocheck
import { useDraggable, useStorage } from '@vueuse/core'
import { reactive, ref, onMounted, watch, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import type { MonoConfig } from '../composables/create-config'
import MonoLogin from './Login.vue'
import MonoUsers from './Users.vue'
import { type MonoFetchCookieOptions, useMyToken } from '../token'

type CookieFetchOpt = MonoFetchCookieOptions

const { menus, host, tokenName, refreshTokenName, refreshAfterExp = false, jwtExp, cookieFetchOptions } = defineProps<{
    menus?: MonoConfig['menu']
    host?: string,
    tokenName?: string,
    refreshTokenName?: string,
    cookieFetchOptions?: CookieFetchOpt,
    jwtExp?: number,
    refreshAfterExp?: boolean,
}>()

/* ---------- shared inline-style helpers ---------- */
const baseLinkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',                       // gap-2
    padding: '0.25rem 0.75rem',          // py-1 px-3
    borderRadius: '0.5rem',              // rounded-lg
    transition: 'background-color 150ms ease-in-out, transform 150ms ease-in-out',
}
function linkStyle(level: number) {
    if (level === 0) return {
        ...baseLinkStyle,
        fontWeight: 500,                   // font-medium
        color: '#1F2937',                  // gray-800
    }
    if (level === 1) return {
        ...baseLinkStyle,
        fontSize: '0.875rem',              // text-sm
        color: '#374151',                  // gray-700
    }
    return {
        ...baseLinkStyle,
        fontSize: '0.75rem',               // text-xs
        color: '#4B5563',                  // gray-600
    }
}
function arrowStyle(open: boolean) {
    return {
        width: '1rem',
        height: '1rem',
        transition: 'transform 150ms ease-in-out',
        transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
    }
}

/* ---------- component state ---------- */
const drawerOpen = ref(false)
const draggable = ref<HTMLElement | null>(null)
const expanded = reactive<Record<string, boolean>>({})
const toggle = (url?: string) => {

    if (url) expanded[url] = !expanded[url]
}

const { style: draggableStyle } = useDraggable(draggable, {
    containerElement: document.body,
})

const storeDragPosition = useStorage<string | null>('feds-bundle-menu-drag-position', null)

function placeBottomRight() {
    const el = draggable.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    const xVal = window.innerWidth - rect.width
    const yVal = window.innerHeight - rect.height
    if (!storeDragPosition.value) {
        storeDragPosition.value = `left:${xVal}px;top:${yVal}px`;
    }
}

onMounted(() => {
    placeBottomRight()
})

let openMenu = () => {
    if (Number(menus?.length) > 0) drawerOpen.value = !drawerOpen.value
}

watch(draggableStyle, (next) => {
    storeDragPosition.value = next
})


/* ---------- popup state ---------- */
const showPopup = ref(false)

const openPopup = () => {
    showPopup.value = true
}
const closePopup = () => {
    showPopup.value = false
}


const showUser = ref(false)

const openUser = () => {
    showUser.value = true
}
const closeUser = () => {
    showUser.value = false
}

let timer: number | undefined;
// const jwt = useMyJwt()
const slTkn = useMyToken()
// const cookie = useMyCookie();

let checkExpired = async () => {
    const remainingMs = (Number(jwtExp) * 1000) - Date.now();
    if (remainingMs <= 0) {
        window.clearInterval(timer);
        timer = undefined;

        const refreshTokenFetch = await slTkn.fetch(cookieFetchOptions)

        if (refreshTokenFetch && refreshAfterExp) {
            window.location.reload();
        }
    }
}

onMounted(() => {

    if (cookieFetchOptions) {
        checkExpired();                 // immediate check
        timer = window.setInterval(checkExpired, 1000);

        // re-check when user returns to tab / wakes device
        window.addEventListener("focus", checkExpired);
        document.addEventListener("visibilitychange", checkExpired);

    }
});

onUnmounted(() => {

    if (cookieFetchOptions) {
        if (timer) {

            window.clearInterval(timer);
        }

        window.removeEventListener("focus", checkExpired);
        document.removeEventListener("visibilitychange", checkExpired);

    }

});





</script>

<template>
    <div v-if="Number(menus?.length) > 0"
        :style="[storeDragPosition || draggableStyle, { position: 'fixed', zIndex: 99999999 }]">
        <!-- FAB -------------------------------------------------------------->

        <div
            style="position: relative; user-select: none; display: flex; justify-content: center; align-items: center;">
            <div ref="draggable"
                style="position: absolute; display: flex; justify-content: center; align-items: center; cursor: move;">
                <div style="padding: 3.75rem; border-radius: 9999px; background-color: rgba(96, 165, 250, 0.05);"></div>
            </div>



            <button aria-label="Toggle menu" :style="{
                width: '3rem',            /* w-14  */
                height: '3rem',           /* h-14  */
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '9999px',
                background: '#2563EB',      /* blue-600 */
                color: '#FFFFFF',
                zIndex: 99999999,
                boxShadow:
                    '0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05)',
                transition: 'transform 150ms ease-in-out, box-shadow 150ms ease-in-out',
            }" @click="openMenu()">
                <!-- icons -->
                <svg v-if="!drawerOpen" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" style="width:1.5rem; height:1.5rem">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    style="width:1.5rem; height:1.5rem">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

        </div>


        <!-- Drawer container ------------------------------------------------->
        <div :style="{
            position: 'absolute',
            right: 0,
            top: '-100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
        }">
            <nav v-if="drawerOpen" :style="{
                marginBottom: '0.5rem',               /* mb-2            */
                paddingLeft: '0.75rem',              /* px-3            */
                paddingRight: '0.75rem',
                width: '13rem',                       /* w-52            */
                maxHeight: '70vh',                    /* max-h-[70vh]    */
                overflowY: 'auto',
                background: '#FFFFFF',                /* bg-white        */
                borderRadius: '1rem',                 /* rounded-2xl     */
                boxShadow:
                    '0 20px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1)',
                border: '1px solid #E5E7EB',          /* ring-1 gray-200 */
                backdropFilter: 'blur(12px)',         /* blur-md         */

            }">
                <!-- top-level list ---------------------------------------------->
                <ul :style="{
                    listStyle: 'none',
                    margin: 0,
                    padding: '0.5rem 0',                  /* py-2 */
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',                       /* space-y-1 */
                }">

                    <template v-if="host">
                        <li>
                            <button type="button" @click="openPopup()" :style="[
                                linkStyle(0),
                                { width: '100%', justifyContent: 'space-between', outline: 'none' },
                            ]">
                                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                                    Login
                                </span>
                            </button>
                        </li>
                        <li>
                            <button type="button" @click="openUser()" :style="[
                                linkStyle(0),
                                { width: '100%', justifyContent: 'space-between', outline: 'none' },
                            ]">
                                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                                    Login by Users
                                </span>
                            </button>
                        </li>

                    </template>

                    <li v-for="top in menus" :key="top.url">
                        <!-- parent with children -->
                        <button v-if="top.items" type="button" @click="toggle(top.url)" :style="[
                            linkStyle(0),
                            { opacity: top.visible == true || top.visible === undefined ? '100%' : '50%' },
                            { width: '100%', justifyContent: 'space-between', outline: 'none' },
                        ]">
                            <span style="display:flex;align-items:center;gap:.5rem;min-width:0;">
                                <span v-if="top.icon" :class="top.icon"
                                    style="width:1rem;height:1rem;flex:0 0 auto;"></span>
                                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                                    {{ top.title }}
                                </span>
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor" :style="arrowStyle(expanded[String(top.url)])">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <!-- leaf link -->
                        <RouterLink v-else :to="`${top.url}`" :style="[
                            linkStyle(0),
                            { opacity: top.visible == true || top.visible === undefined ? '100%' : '50%' },
                            { width: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }

                        ]">
                            <span style="display:flex;align-items:center;gap:.5rem;min-width:0;">
                                <span v-if="top.icon" :class="top.icon"
                                    style="width:1rem;height:1rem;flex:0 0 auto;"></span>
                                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                                    {{ top.title }}
                                </span>
                            </span>
                        </RouterLink>


                        <!-- first-level submenu -------------------------------------->
                        <transition name="fade" mode="out-in">
                            <ul v-if="top.items && expanded[String(top.url)]" :style="{
                                paddingLeft: '1rem',          /* pl-4 */
                                marginTop: '0.25rem',         /* mt-1 */
                                borderLeft: '2px solid #F3F4F6', /* border-l-2 gray-100 */
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem',
                            }">
                                <li v-for="mid in top.items" :key="`${top.url}${mid.url}`">
                                    <!-- mid-level parent -->
                                    <button v-if="mid.items" type="button" @click="toggle(mid.url)" :style="[
                                        linkStyle(1),
                                        { opacity: mid.visible == true || mid.visible === undefined ? '100%' : '50%' },
                                        { width: '100%', justifyContent: 'space-between' },
                                    ]">
                                        <span style="display:flex;align-items:center;gap:.5rem;min-width:0;">
                                            <span v-if="mid.icon" :class="mid.icon"
                                                style="width:1rem;height:1rem;flex:0 0 auto;"></span>
                                            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                                                {{ mid.title }}
                                            </span>
                                        </span>

                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                            stroke="currentColor" :style="arrowStyle(expanded[String(mid.url)])">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>

                                    <!-- mid-level leaf -->
                                    <RouterLink v-else :to="`${top.url}${mid.url}`" :style="[
                                        linkStyle(1),
                                        { width: '100%' },
                                        { opacity: mid.visible == true || mid.visible === undefined ? '100%' : '50%' },

                                    ]">
                                        <span style="display:flex;align-items:center;gap:.5rem;min-width:0;">
                                            <span v-if="mid.icon" :class="mid.icon"
                                                style="width:1rem;height:1rem;flex:0 0 auto;"></span>
                                            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                                                {{ mid.title }}
                                            </span>
                                        </span>
                                    </RouterLink>


                                    <!-- second-level submenu ------------------------------>
                                    <transition name="fade" mode="out-in">
                                        <ul v-if="mid.items && expanded[String(mid.url)]" :style="{
                                            paddingLeft: '1rem',
                                            marginTop: '0.25rem',
                                            borderLeft: '2px solid #F3F4F6',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.25rem',
                                        }">
                                            <li v-for="inner in mid.items" :key="`${top.url}${mid.url}${inner.url}`">
                                                <RouterLink :to="`${top.url}${mid.url}${inner.url}`" :style="[

                                                    linkStyle(2),
                                                    { opacity: inner.visible == true || inner.visible === undefined ? '100%' : '50%' },
                                                    { width: '100%' }

                                                ]">
                                                    {{ inner.title }}
                                                </RouterLink>
                                            </li>
                                        </ul>
                                    </transition>
                                </li>
                            </ul>
                        </transition>
                    </li>
                </ul>
            </nav>
        </div>





        <Teleport to="body" v-if="host">



            <div v-if="showUser" :style="{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(15,23,42,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100000000,
            }" @click.self="closeUser()">
                <div :style="{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '0.75rem',
                    padding: '1rem 1.25rem',
                    // minWidth: '18rem',
                    // maxWidth: '90vw',
                    // width: '450px',
                    // height: '450px',
                    scale: 0.80,
                    width: 'auto',
                    height: 'auto',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1)',
                }">
                    <div :style="{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem',
                    }">
                        <h2 :style="{ margin: 0, fontSize: '1rem', fontWeight: 600 }">
                            <!-- Login -->
                        </h2>
                        <button type="button" @click="closeUser()" :style="{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '1.25rem',
                            lineHeight: 1,
                            padding: '0.25rem',
                            marginLeft: '0.5rem',
                        }">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor" style="width:1.8rem; height:1.8rem">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div>

                        <MonoUsers />

                    </div>
                </div>
            </div>

            <!-- Popup overlay -->
            <div v-if="showPopup" :style="{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(15,23,42,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100000000,
            }" @click.self="closePopup()">
                <div :style="{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '0.75rem',
                    padding: '1rem 1.25rem',
                    // minWidth: '18rem',
                    // maxWidth: '90vw',
                    // width: '450px',
                    // height: '450px',
                    scale: 0.80,
                    width: 'auto',
                    height: 'auto',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1)',
                }">
                    <div :style="{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem',
                    }">
                        <h2 :style="{ margin: 0, fontSize: '1rem', fontWeight: 600 }">
                            <!-- Login -->
                        </h2>
                        <button type="button" @click="closePopup()" :style="{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '1.25rem',
                            lineHeight: 1,
                            padding: '0.25rem',
                            marginLeft: '0.5rem',
                        }">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor" style="width:1.8rem; height:1.8rem">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div>

                        <MonoLogin :host="host" :tokenName="String(tokenName)"
                            :refreshTokenName="refreshTokenName">
                        </MonoLogin>

                    </div>
                </div>
            </div>



        </Teleport>
    </div>
</template>
