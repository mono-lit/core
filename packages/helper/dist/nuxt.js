import { t as monoSsr } from "./vite-C5iUK7so.js";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { addPluginTemplate, addVitePlugin, defineNuxtModule, extendViteConfig, hasNuxtModule, installModule, tryResolveModule, useLogger } from "@nuxt/kit";
//#region src/nuxt/index.ts
/** The optional peer the automatic skeleton (`pending`) renders with. */
var PHANTOM_UI = "@aejkatappaja/phantom-ui";
/** One lit instance, shared with the shadow build and @lit-labs/ssr. */
var LIT_DEDUPE = [
	"lit",
	"lit-html",
	"lit-element",
	"@lit/reactive-element"
];
/** Reached only from federated routes, so Vite won't find it in its entry scan. */
var DEFAULT_OPTIMIZE_INCLUDE = ["@mono-lit/devextreme"];
var monoHelperModule = defineNuxtModule({
	meta: {
		name: "@mono-lit/helper",
		configKey: "mono"
	},
	async setup(options, nuxt) {
		const helper = options.helper ?? {};
		const prefix = helper.prefix ?? "mono-";
		const logger = useLogger("@mono-lit/helper");
		const ssrApp = nuxt.options.ssr !== false;
		const clientOnlyWrap = helper.clientOnly ?? ssrApp;
		const appAnchor = pathToFileURL(join(nuxt.options.rootDir, "index.js")).href;
		const phantom = helper.skeleton === false ? null : await tryResolveModule(PHANTOM_UI, appAnchor);
		if (!phantom && helper.skeleton !== false) logger.debug(`skeleton: "${PHANTOM_UI}" is not installed in the app — \`pending\` stays a no-op. Install it to turn the automatic skeleton on.`);
		let litWrapper = false;
		if (helper.ssr !== false && !ssrApp) logger.debug("ssr:false — skipping nuxt-ssr-lit; shadow builds render client-side as plain custom elements.");
		else if (helper.ssr !== false) if (hasNuxtModule("nuxt-ssr-lit")) logger.info("nuxt-ssr-lit is configured by the host — using legacy manual SSR wiring (litElementPrefix). Remove that module entry to enable @mono-lit/helper auto-wrap, or set mono.helper.ssr:false to silence.");
		else try {
			await installModule(await tryResolveModule("nuxt-ssr-lit", import.meta.url) ?? "nuxt-ssr-lit", { litElementPrefix: [] });
			litWrapper = true;
		} catch {
			logger.info("nuxt-ssr-lit could not be loaded — mono shadow components fall back to client-only. It ships as a @mono-lit/helper dependency, so this usually means a broken or deduped install; try reinstalling, or set mono.helper.ssr:false to silence.");
		}
		if (ssrApp || clientOnlyWrap) {
			for (const plugin of monoSsr({
				prefix,
				wrapper: helper.wrapper,
				ssrStubPrefix: helper.ssrStubPrefix,
				exclude: helper.exclude,
				lightWrap: clientOnlyWrap,
				litWrapper,
				shadowOverride: helper.shadow
			})) addVitePlugin(plugin);
			if (!clientOnlyWrap) logger.debug("mono.helper.clientOnly:false — light <mono-*> are not wrapped in <ClientOnly>; the server stub and the shadow <LitWrapper> wrap stay on.");
		} else logger.debug("ssr:false — <mono-*> are not wrapped in <ClientOnly> (nothing renders on the server). Set mono.helper.clientOnly:true to force it.");
		if (helper.css !== false) {
			nuxt.options.css ||= [];
			if (!nuxt.options.css.includes("@mono-lit/helper/ui/index.css")) nuxt.options.css.push("@mono-lit/helper/ui/index.css");
		}
		if (helper.customElement !== false) {
			const vue = nuxt.options.vue ||= {};
			vue.compilerOptions ||= {};
			const prev = vue.compilerOptions.isCustomElement;
			vue.compilerOptions.isCustomElement = (tag) => typeof prev === "function" && prev(tag) || tag.startsWith(prefix);
		}
		const uiConfig = { ...helper.ui && typeof helper.ui === "object" ? helper.ui : {} };
		if (phantom) uiConfig.skeleton = {
			ssr: ssrApp,
			...typeof helper.skeleton === "object" ? helper.skeleton : {}
		};
		if (Object.keys(uiConfig).length) addPluginTemplate({
			filename: "mono-ui.mjs",
			order: -50,
			getContents: () => [
				"import { createMonoUI } from '@mono-lit/helper'",
				"export default defineNuxtPlugin({",
				"  name: '@mono-lit/helper:ui',",
				"  enforce: 'pre',",
				"  setup() {",
				`    createMonoUI(${JSON.stringify(uiConfig)})`,
				"  },",
				"})"
			].join("\n")
		});
		if (phantom) addPluginTemplate({
			filename: "mono-skeleton.client.mjs",
			mode: "client",
			getContents: () => [
				"export default defineNuxtPlugin({",
				"  name: '@mono-lit/helper:skeleton',",
				"  async setup() {",
				`    await import('${PHANTOM_UI}')`,
				"  },",
				"})"
			].join("\n")
		});
		const tooltip = helper.tooltip === true ? {} : helper.tooltip;
		if (tooltip && typeof tooltip === "object") addPluginTemplate({
			filename: "mono-tooltip.client.mjs",
			mode: "client",
			getContents: () => [
				"import { createMonoTooltip } from '@mono-lit/helper/tooltip'",
				"export default defineNuxtPlugin({",
				"  name: '@mono-lit/helper:tooltip',",
				"  setup() {",
				`    createMonoTooltip(${JSON.stringify(tooltip)})`,
				"  },",
				"})"
			].join("\n")
		});
		const dedupe = helper.dedupe === false ? [] : helper.dedupe ?? LIT_DEDUPE;
		const wanted = [...helper.optimizeInclude === false ? [] : helper.optimizeInclude ?? DEFAULT_OPTIMIZE_INCLUDE, ...tooltip ? ["@floating-ui/dom"] : []];
		const exclude = phantom ? [PHANTOM_UI] : [];
		const include = [];
		for (const id of wanted) if (await tryResolveModule(id, appAnchor)) include.push(id);
		else logger.debug(`optimizeDeps: skipping "${id}" — not resolvable from the app.`);
		if (dedupe.length || include.length || exclude.length) extendViteConfig((config) => {
			if (dedupe.length) {
				config.resolve ||= {};
				config.resolve.dedupe = [...new Set([...config.resolve.dedupe ?? [], ...dedupe])];
			}
			if (include.length) {
				config.optimizeDeps ||= {};
				config.optimizeDeps.include = [...new Set([...config.optimizeDeps.include ?? [], ...include])];
			}
			if (exclude.length) {
				config.optimizeDeps ||= {};
				config.optimizeDeps.exclude = [...new Set([...config.optimizeDeps.exclude ?? [], ...exclude])];
			}
		});
	}
});
//#endregion
export { monoHelperModule as default };
