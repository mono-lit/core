<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useRoute } from 'vitepress'
import { computed } from 'vue'
import ThemeSwitcher from '../../components/ThemeSwitcher.vue'

const { Layout } = DefaultTheme
const route = useRoute()

/*
 * The theme / colour picker is a docs tool: it exists so a reader can preview a
 * component under each palette. The landing page is a pitch, not a playground,
 * so it is hidden there.
 *
 * Both spellings are checked because the landing page is reachable as `/` and,
 * on a static host without clean URLs, as `/index.html`.
 */
const isHome = computed(
  () => route.path === '/' || route.path === '/index.html',
)
</script>

<template>
    <Layout>
        <template #nav-bar-content-after>
            <ThemeSwitcher v-if="!isHome" />
        </template>
    </Layout>
</template>
