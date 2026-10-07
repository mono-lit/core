// MUST be first: installs Node-safe DOM globals before any module that imports
// the `@mono-lit/helper` barrel (e.g. ThemeSwitcher) is evaluated during SSR/build.
import './ssr-dom-shim'

import DefaultTheme from 'vitepress/theme'
import type { EnhanceAppContext } from 'vitepress'
import '@mono-lit/helper/ui/index.css'
import { createMonoTooltip } from '@mono-lit/helper/tooltip'
// Flavor stylesheets (structure) — loaded so the switcher can toggle them via
// the `.theme-<name>` class at runtime. Opt-in for consumers.
import '@mono-lit/helper/ui/theme/vega.css'
import '@mono-lit/helper/ui/theme/nova.css'
import '@mono-lit/helper/ui/theme/maia.css'
import '@mono-lit/helper/ui/theme/lyra.css'
import '@mono-lit/helper/ui/theme/mira.css'
import '@mono-lit/helper/ui/theme/luma.css'
import '@mono-lit/helper/ui/theme/sera.css'
import '@mono-lit/helper/ui/theme/rhea.css'
import 'virtual:uno.css'
import './custom.css'

import Layout from './Layout.vue'
import ComponentDocs from '../../components/ComponentDocs.vue'
import MonoHome from '../../components/MonoHome.vue'
import DemoPreview from '../../components/DemoPreview.vue'
import DemoSingle from '../../components/DemoSingle.vue'
import DemoTypes from '../../components/DemoTypes.vue'
import ThemeSwitcher from '../../components/ThemeSwitcher.vue'
import ExampleLayout from '../../components/Example/Layout.vue'
import LayoutRuleExample from '../../components/Example/LayoutRule.vue'
import OddoExample from '../../components/Example/Odoo.vue'
import LinkedInExample from '../../components/Example/LinkedIn.vue'
import OdataExpressionDemo from '../../components/OdataExpressionDemo.vue'
import RepoTemplates from '../../components/RepoTemplates.vue'
import SetupWiring from '../../components/SetupWiring.vue'
// Demo chrome — the non-mono controls a demo puts around its subject (pickers,
// event logs, readouts), on the page tokens so they read in dark mode and every
// flavour. Registered globally so a demo file needs no import.
import DemoControls from '../../components/Demo/DemoControls.vue'
import DemoSelect from '../../components/Demo/DemoSelect.vue'
import DemoCheck from '../../components/Demo/DemoCheck.vue'
import DemoLog from '../../components/Demo/DemoLog.vue'
import DemoReadout from '../../components/Demo/DemoReadout.vue'

export default {
  extends: DefaultTheme,
  Layout,
  async enhanceApp({ app }: EnhanceAppContext) {
    app.component('ComponentDocs', ComponentDocs)
    app.component('MonoHome', MonoHome)
    app.component('DemoPreview', DemoPreview)
    app.component('DemoSingle', DemoSingle)
    app.component('DemoTypes', DemoTypes)
    app.component('ThemeSwitcher', ThemeSwitcher)
    app.component('ExampleLayout', ExampleLayout)
    app.component('ExampleLayoutRule', LayoutRuleExample)
    app.component('ExampleOdoo', OddoExample)
    app.component('ExampleLinkedIn', LinkedInExample)
    app.component('OdataExpressionDemo', OdataExpressionDemo)
    app.component('RepoTemplates', RepoTemplates)
    app.component('SetupWiring', SetupWiring)
    app.component('DemoControls', DemoControls)
    app.component('DemoSelect', DemoSelect)
    app.component('DemoCheck', DemoCheck)
    app.component('DemoLog', DemoLog)
    app.component('DemoReadout', DemoReadout)
    // Turns on the `mono-tooltip-content` attributes site-wide — what an app's
    // main.ts does. No options: the tooltip demos show per-call/attribute ones.
    // SSR-safe (no document → it only stores the options).
    app.use(createMonoTooltip())
  },
}
