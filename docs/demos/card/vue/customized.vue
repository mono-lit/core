<script setup lang="ts">
import '@mono-lit/helper/ui/card'

const revenueGrowthCardClass = {
  root: `
    relative overflow-hidden
    border border-emerald-200/70
    bg-gradient-to-br from-white via-emerald-50/70 to-teal-50
    shadow-[0_20px_60px_rgba(16,185,129,0.16)]
    rounded-8
    hover:shadow-[0_28px_85px_rgba(16,185,129,0.23)]
    hover:-translate-y-1.5
    transition-all duration-300
    before:content-['']
    before:absolute before:-top-20 before:-left-20
    before:w-48 before:h-48
    before:bg-emerald-300/24
    before:rounded-full before:blur-3xl
    before:pointer-events-none
    after:content-['']
    after:absolute after:bottom-0 after:right-0
    after:w-32 after:h-32
    after:bg-teal-300/20
    after:rounded-tl-full
    after:pointer-events-none
  `,
  header: `
    relative z-1
    px-6 pt-6 pb-3
    border-b border-emerald-100/80
  `,
  headerContent: `
    min-w-0
  `,
  title: `
    text-base font-800
    text-emerald-950
    tracking-tight
  `,
  subtitle: `
    mt-1
    text-xs font-600 uppercase tracking-wide
    text-emerald-600/75
  `,
  body: `
    relative z-1
    px-6 py-5
    text-slate-600 text-sm leading-relaxed
  `,
}
</script>

<template>
  <div style="width: 100%;">


    <mono-card
      variant="flat"
      color="success"
      hoverable
      :css-class="revenueGrowthCardClass"
    >
      <h3 slot="title">Revenue Growth</h3>
      <p slot="subtitle">Monthly performance</p>
  
      <div class="flex items-end justify-between gap-4">
        <div>
          <div class="text-4xl font-900 text-emerald-950 tracking-tight">
            82%
          </div>
  
          <div class="mt-2 text-sm text-emerald-700 font-600">
            +12.4% from last month
          </div>
        </div>
  
        <div
          class="
            w-14 h-14 rounded-5
            bg-emerald-500/12
            text-emerald-700
            flex items-center justify-center
            text-2xl
          "
        >
          ↗
        </div>
      </div>
    </mono-card>
  </div>
</template>