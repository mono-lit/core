<script setup lang="ts">
/**
 * Drop-in notification renderer for a template's `App.vue` — replaces the
 * hand-wired `<Notivue v-slot>…</Notivue>` block that every app repeated. Action
 * notifications (`props.isAction`) render the custom card with buttons; everything
 * else uses notivue's default `<Notifications>` with the pastel theme.
 *
 *   <template><main><MonoNotivue /><RouterView /></main></template>
 *
 * The `createNotivue(...)` plugin registration and `notivue/*.css` imports still
 * live once in the app's `main.ts`.
 */
import { Notivue, Notifications, pastelTheme } from 'notivue'
import { MonoNotifAction } from '../core'
</script>

<template>
  <Notivue v-slot="item">
    <MonoNotifAction v-if="item.props.isAction" :item="item" />
    <Notifications v-else :item="item" :theme="pastelTheme" />
  </Notivue>
</template>
