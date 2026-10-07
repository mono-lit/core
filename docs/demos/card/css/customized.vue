<template>
    <div style="width: 100%;">
        <!-- The Vue twin hands these class lists to the element as `cssClass`
             (root / header / headerContent / title / subtitle / body); here they
             sit on the same parts of the hand-written markup, so both tabs paint
             the same card. -->
        <div
            mono-card
            mono-variant="flat"
            mono-color="success"
            mono-hoverable
            class="relative overflow-hidden rounded-8 border border-emerald-200/70 bg-gradient-to-br from-white via-emerald-50/70 to-teal-50 shadow-[0_20px_60px_rgba(16,185,129,0.16)] hover:shadow-[0_28px_85px_rgba(16,185,129,0.23)] hover:-translate-y-1.5 transition-all duration-300 before:content-[''] before:absolute before:-top-20 before:-left-20 before:w-48 before:h-48 before:bg-emerald-300/24 before:rounded-full before:blur-3xl before:pointer-events-none after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-32 after:h-32 after:bg-teal-300/20 after:rounded-tl-full after:pointer-events-none"
        >
            <div mono-header class="relative z-1 px-6 pt-6 pb-3 border-b border-emerald-100/80">
                <div mono-header-content class="min-w-0">
                    <div mono-title class="text-base font-800 text-emerald-950 tracking-tight">
                        <h3>Revenue Growth</h3>
                    </div>
                    <div mono-subtitle class="mt-1 text-xs font-600 uppercase tracking-wide text-emerald-600/75">
                        <p>Monthly performance</p>
                    </div>
                </div>
            </div>

            <div mono-body class="relative z-1 px-6 py-5 text-slate-600 text-sm leading-relaxed">
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
                        class="w-14 h-14 rounded-5
                            bg-emerald-500/12
                            text-emerald-700
                            flex items-center justify-center
                            text-2xl"
                    >
                        ↗
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
