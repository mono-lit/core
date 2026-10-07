import { NodeTypes, parse } from "@vue/compiler-dom";
import { parse as parse$1 } from "@vue/compiler-sfc";
import MagicString from "magic-string";
//#region src/vite/shadow-manifest.ts
var SHADOW_ENTRY_TO_TAGS = {
	accordion: ["mono-shadow-accordion"],
	button: ["mono-shadow-button"],
	"button-dropdown": ["mono-shadow-button-dropdown"],
	alert: ["mono-shadow-alert"],
	card: ["mono-shadow-card"],
	chart: [
		"mono-shadow-chart",
		"mono-shadow-chart-bar",
		"mono-shadow-chart-line",
		"mono-shadow-chart-pie",
		"mono-shadow-chart-doughnut"
	],
	checkbox: ["mono-shadow-checkbox"],
	chip: ["mono-shadow-chip"],
	date: ["mono-shadow-date"],
	drawer: ["mono-shadow-drawer"],
	dropdown: ["mono-shadow-dropdown"],
	"file-upload": ["mono-shadow-file-upload"],
	input: ["mono-shadow-input"],
	menu: ["mono-shadow-menu"],
	modal: ["mono-shadow-modal"],
	nav: ["mono-shadow-nav"],
	radio: ["mono-shadow-radio"],
	select: ["mono-shadow-select"],
	sidebar: ["mono-shadow-sidebar"],
	switch: ["mono-shadow-switch"],
	"tag-input": ["mono-shadow-tag-input"],
	tabs: ["mono-shadow-tabs"],
	textarea: ["mono-shadow-textarea"],
	"rich-text-editor": ["mono-shadow-rich-text-editor"],
	breadcrumb: ["mono-shadow-breadcrumb", "mono-shadow-breadcrumb-list"],
	filter: ["mono-shadow-filter-builder"],
	table: [
		"mono-shadow-table-info",
		"mono-shadow-table-page-size",
		"mono-shadow-table-paging",
		"mono-shadow-table-paging-group",
		"mono-shadow-table-search",
		"mono-shadow-table-sort",
		"mono-shadow-table-th",
		"mono-shadow-table-loading",
		"mono-shadow-table-detail",
		"mono-shadow-table-checkbox"
	],
	"dropdown-table": ["mono-shadow-dropdown-table"]
};
Object.values(SHADOW_ENTRY_TO_TAGS).flat();
var SHADOW_IMPORT_RE = /@mono-lit\/helper\/ui\/shadow\/([a-z][\w-]*)/gi;
/**
* Extract the set of shadow tags a script block opts into, by scanning its
* `@mono-lit/helper/ui/shadow/<entry>` imports and mapping each entry to its tag(s).
*/
function shadowTagsFromScript(script) {
	const tags = /* @__PURE__ */ new Set();
	if (!script) return tags;
	SHADOW_IMPORT_RE.lastIndex = 0;
	let match;
	while ((match = SHADOW_IMPORT_RE.exec(script)) !== null) {
		const entryTags = SHADOW_ENTRY_TO_TAGS[match[1].toLowerCase()];
		if (entryTags) for (const tag of entryTags) tags.add(tag);
	}
	return tags;
}
//#endregion
//#region src/vite/mono-client-only.ts
var LIT_DIRECTIVES_TO_MOVE = [
	"v-for",
	":key",
	"v-if",
	"v-else-if",
	"v-else"
];
var litDirectivesRegex = new RegExp(LIT_DIRECTIVES_TO_MOVE.map((attr) => `(\\s${attr}(="[^"]*")?)`).join("|"), "gi");
function cleanId(id) {
	return id.split("?", 1)[0];
}
function isElement(node) {
	return node.type === NodeTypes.ELEMENT;
}
function isWhitespaceNode(node) {
	return node.type === NodeTypes.TEXT && node.content.trim() === "";
}
function getStaticAttribute(node, name) {
	return node.props.find((prop) => prop.type === NodeTypes.ATTRIBUTE && prop.name === name);
}
function escapeHtmlAttribute(value) {
	return value.replaceAll("&", "&amp;").replaceAll("\"", "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function getDirective(node, name) {
	return node.props.find((prop) => prop.type === NodeTypes.DIRECTIVE && prop.name === name);
}
function hasDirective(node, name) {
	return Boolean(getDirective(node, name));
}
function monoClientOnlyPlugin(options = {}) {
	const prefix = options.prefix ?? "mono-";
	const wrapper = options.wrapper ?? "ClientOnly";
	const litWrapper = options.litWrapper === true;
	const litWrapperComponent = options.litWrapperComponent ?? "LitWrapper";
	const lightWrap = options.lightWrap !== false;
	const normalizedPrefix = prefix.toLowerCase();
	const normalizedWrapper = wrapper.toLowerCase();
	const excluded = new Set((options.exclude ?? []).map((tag) => tag.toLowerCase()));
	const shadowOverride = new Set((options.shadowOverride ?? []).map((tag) => tag.toLowerCase()));
	return {
		name: "@mono-lit/helper:mono-client-only",
		enforce: "pre",
		transform(source, id) {
			const filename = cleanId(id);
			if (!filename.endsWith(".vue")) return null;
			if (filename.includes("/node_modules/") || filename.includes("\\node_modules\\")) return null;
			if (!source.toLowerCase().includes(`<${normalizedPrefix}`)) return null;
			const { descriptor, errors } = parse$1(source, { filename });
			if (errors.length > 0 || !descriptor.template) return null;
			const fileShadowTags = /* @__PURE__ */ new Set();
			if (litWrapper) {
				for (const tag of shadowOverride) fileShadowTags.add(tag);
				const script = `${descriptor.scriptSetup?.content ?? ""}\n${descriptor.script?.content ?? ""}`;
				for (const tag of shadowTagsFromScript(script)) fileShadowTags.add(tag);
			}
			const template = descriptor.template;
			const ast = parse(template.content, { comments: true });
			const magicString = new MagicString(source);
			const templateOffset = template.loc.start.offset;
			let changed = false;
			/** A `mono-*` element whose shadow build this file imports → SSR-wrapped. */
			function isShadowElement(node) {
				return fileShadowTags.has(node.tag.toLowerCase());
			}
			/** A `mono-*` element that should be `<ClientOnly>`-wrapped. */
			function isMonoElement(node) {
				if (!lightWrap) return false;
				const tag = node.tag.toLowerCase();
				if (excluded.has(tag) || fileShadowTags.has(tag)) return false;
				return tag.startsWith(normalizedPrefix);
			}
			function isClientOnly(node) {
				return node.tag.toLowerCase() === normalizedWrapper;
			}
			/**
			* Wrap a single shadow element in `<LitWrapper>`, moving v-for/:key/v-if/
			* v-else-if/v-else onto the wrapper (so they don't run on the shadow host).
			* No skeleton fallback — the element is server-rendered to DSD.
			*/
			function wrapLit(node) {
				const start = templateOffset + node.loc.start.offset;
				const end = templateOffset + node.loc.end.offset;
				const moved = node.props.filter((prop) => prop.type === NodeTypes.DIRECTIVE && !!prop.rawName && LIT_DIRECTIVES_TO_MOVE.includes(prop.rawName));
				const startTag = `<${litWrapperComponent}${moved.length ? ` ${moved.map((prop) => prop.loc.source).join(" ")}` : ""}>`;
				const endTag = `</${litWrapperComponent}>`;
				if (node.isSelfClosing) {
					const stripped = source.slice(start, end).replace(litDirectivesRegex, "").trim();
					magicString.overwrite(start, end, `${startTag}${stripped}${endTag}`);
				} else {
					const lastProp = node.props.length ? node.props[node.props.length - 1] : void 0;
					const contentStart = lastProp ? templateOffset + lastProp.loc.end.offset : start + node.tag.length + 2;
					const stripped = source.slice(start, contentStart).replace(litDirectivesRegex, "").trim();
					magicString.overwrite(start, contentStart, stripped);
					magicString.prependLeft(start, startTag);
					magicString.appendRight(end, endTag);
				}
				changed = true;
			}
			function wrapRange(firstNode, lastNode) {
				const start = templateOffset + firstNode.loc.start.offset;
				const end = templateOffset + lastNode.loc.end.offset;
				function extractAndRemoveStaticAttr(name) {
					const attribute = getStaticAttribute(firstNode, name);
					if (!attribute) return "";
					const attributeStart = templateOffset + attribute.loc.start.offset;
					const attributeEnd = templateOffset + attribute.loc.end.offset;
					let removalStart = attributeStart;
					while (removalStart > start && /\s/.test(source[removalStart - 1] ?? "")) removalStart--;
					magicString.remove(removalStart, attributeEnd);
					return attribute.value?.content.trim() ?? "";
				}
				const skeletonClass = extractAndRemoveStaticAttr("client-skeleton-class");
				const skeletonType = extractAndRemoveStaticAttr("client-skeleton-type") || "col";
				const skeletonBar = extractAndRemoveStaticAttr("client-skeleton-bar");
				const skeletonCountRaw = extractAndRemoveStaticAttr("client-skeleton-count");
				const parsedCount = Number.parseInt(skeletonCountRaw, 10);
				const skeletonCount = Number.isFinite(parsedCount) && parsedCount > 0 ? Math.min(parsedCount, 100) : 1;
				const containerClasses = [
					"mono-client-skeleton",
					`mono-client-skeleton--${skeletonType}`,
					skeletonClass
				].filter(Boolean).join(" ");
				const barClasses = ["mono-client-skeleton-bar", skeletonBar].filter(Boolean).join(" ");
				const bars = Array.from({ length: skeletonCount }, () => `    <div class="${escapeHtmlAttribute(barClasses)}"></div>`).join("\n");
				magicString.prependLeft(start, `<${wrapper}>`);
				magicString.appendRight(end, [
					"",
					"<template #fallback>",
					`  <div class="${escapeHtmlAttribute(containerClasses)}" aria-hidden="true">`,
					bars,
					"  </div>",
					"</template>",
					`</${wrapper}>`
				].join("\n"));
				changed = true;
			}
			function visitChildren(children, insideClientOnly, insideMonoElement) {
				let index = 0;
				while (index < children.length) {
					const node = children[index];
					if (!isElement(node)) {
						index++;
						continue;
					}
					const nodeIsClientOnly = isClientOnly(node);
					const nodeIsMono = isMonoElement(node);
					if (isShadowElement(node)) {
						if (!insideClientOnly && !insideMonoElement) wrapLit(node);
						visitChildren(node.children, insideClientOnly, insideMonoElement);
						index++;
						continue;
					}
					if (hasDirective(node, "if")) {
						const conditionalElements = [node];
						let cursor = index + 1;
						while (cursor < children.length) {
							const nextNode = children[cursor];
							if (isWhitespaceNode(nextNode) || nextNode.type === NodeTypes.COMMENT) {
								cursor++;
								continue;
							}
							if (isElement(nextNode) && (hasDirective(nextNode, "else-if") || hasDirective(nextNode, "else"))) {
								conditionalElements.push(nextNode);
								cursor++;
								if (hasDirective(nextNode, "else")) break;
								continue;
							}
							break;
						}
						const shouldWrapChain = conditionalElements.some(isMonoElement) && !insideClientOnly && !insideMonoElement;
						if (shouldWrapChain) wrapRange(conditionalElements[0], conditionalElements[conditionalElements.length - 1]);
						for (const conditionalNode of conditionalElements) {
							const conditionalIsMono = isMonoElement(conditionalNode);
							const conditionalIsClientOnly = isClientOnly(conditionalNode);
							visitChildren(conditionalNode.children, insideClientOnly || conditionalIsClientOnly || shouldWrapChain, insideMonoElement || conditionalIsMono);
						}
						index = cursor;
						continue;
					}
					if (hasDirective(node, "else-if") || hasDirective(node, "else")) {
						visitChildren(node.children, insideClientOnly || nodeIsClientOnly, insideMonoElement || nodeIsMono);
						index++;
						continue;
					}
					const shouldWrap = nodeIsMono && !insideClientOnly && !insideMonoElement;
					if (shouldWrap) wrapRange(node, node);
					visitChildren(node.children, insideClientOnly || nodeIsClientOnly || shouldWrap, insideMonoElement || nodeIsMono);
					index++;
				}
			}
			visitChildren(ast.children, false, false);
			if (!changed) return null;
			return {
				code: magicString.toString(),
				map: magicString.generateMap({
					source: filename,
					includeContent: true,
					hires: true
				})
			};
		}
	};
}
//#endregion
//#region src/vite/mono-ssr-stub.ts
var VIRTUAL_ID = "\0mono-helper-ssr-stub";
/**
* `@mono-lit/helper/ui/*` entries register Lit custom elements at module load
* (`class extends HTMLElement` + `customElements.define(...)`), which throws
* `HTMLElement is not defined` when evaluated in the Node SSR context.
*
* Every `<mono-*>` tag is already wrapped in `<ClientOnly>` and declared via
* `isCustomElement`, so nothing on the server needs these elements registered.
* This plugin resolves those side-effect imports to an empty module in the
* server build only — the client build keeps the real modules, so the elements
* still register and render after hydration.
*/
function monoSsrStubPlugin(options = {}) {
	const packagePrefix = options.packagePrefix ?? "@mono-lit/helper/ui/";
	return {
		name: "@mono-lit/helper:mono-ssr-stub",
		enforce: "pre",
		resolveId(source, _importer, resolveOptions) {
			if (!(resolveOptions?.ssr === true || this?.environment?.name === "ssr")) return null;
			if (source.startsWith(packagePrefix) && !source.startsWith(`${packagePrefix}shadow/`) && !source.endsWith(".css")) return VIRTUAL_ID;
			return null;
		},
		load(id) {
			if (id === VIRTUAL_ID) return "export {}";
			return null;
		}
	};
}
//#endregion
//#region src/vite/index.ts
/**
* One import, one props object — wires both halves of SSR support for the
* mono web components:
*   - the SSR import-stub (so `@mono-lit/helper/ui/*` never evaluates on the server)
*   - the `<ClientOnly>` template wrapper (so `<mono-*>` only renders client-side)
*
* Usage:
*   import { monoSsr } from '@mono-lit/helper/vite'
*   plugins: [monoSsr()]
*/
function monoSsr(options = {}) {
	const { prefix = "mono-", wrapper = "ClientOnly", ssrStubPrefix = "@mono-lit/helper/ui/", exclude = [], lightWrap = true, litWrapper = false, litWrapperComponent, shadowOverride = [] } = options;
	return [monoSsrStubPlugin({ packagePrefix: ssrStubPrefix }), monoClientOnlyPlugin({
		prefix,
		wrapper,
		exclude,
		lightWrap,
		litWrapper,
		litWrapperComponent,
		shadowOverride
	})];
}
//#endregion
export { monoSsrStubPlugin as n, monoClientOnlyPlugin as r, monoSsr as t };
