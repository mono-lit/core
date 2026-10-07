import fs from "node:fs";

//#region src/vite/remote-matcher.ts
/** `C:\a\B` -> `c:/a/b` — ids arrive slashed either way, and Windows is case-insensitive. */
function normalizeId(value) {
	const slashed = value.replace(/\\/g, "/");
	return process.platform === "win32" ? slashed.toLowerCase() : slashed;
}
/** Strip the query so `foo.vue?vue&type=script` matches `foo.vue`. */
function idPath(id) {
	return id?.split("?")[0] ?? "";
}
/**
* Build the "is this a remote's file?" predicate.
*
* Matches the marker substring OR containment in any root. Roots are compared
* as directory prefixes, so a root of `…/host` never swallows `…/host-extra`.
*/
function createRemoteMatcher(options = {}) {
	const marker = options.marker ?? "/.mono/apps/";
	const roots = (options.roots ?? []).filter(Boolean).map((root) => `${normalizeId(root).replace(/\/+$/, "")}/`);
	return (id) => {
		const file = idPath(id);
		if (!file) return false;
		const normalized = normalizeId(file);
		if (marker && normalized.includes(normalizeId(marker))) return true;
		return roots.some((root) => normalized.startsWith(root));
	};
}
/** `createRemoteMatcher` from the shared option names. */
function remoteGate(options = {}) {
	return createRemoteMatcher({
		...options.appsMarker !== void 0 ? { marker: options.appsMarker } : {},
		...options.appsRoots ? { roots: options.appsRoots } : {}
	});
}

//#endregion
//#region src/composables/parse-page-meta.ts
/**
* Extract `{ layout, title }` from a page's `<script setup>` source, supporting
* BOTH macro forms:
*  - Nuxt:    `definePageMeta({ layout: 'home', title: 'Home' })`
*  - vue-router (unplugin-vue-router): `definePage({ meta: { layout, title } })`
*
* String-literal values only (layout/title are always literals in these apps).
* Used by the Nuxt host module (to seed remote route meta) and by the Vite
* host's `extendRoute` (since unplugin-vue-router reads page files from disk and
* never sees the `definePageMeta -> definePage` Vite transform).
*/
function parsePageMeta(code) {
	const meta = {};
	const block = code.match(/definePageMeta\s*\(\s*\{([\s\S]*?)\}\s*\)/)?.[1] ?? code.match(/definePage\s*\(\s*\{\s*meta\s*:\s*\{([\s\S]*?)\}\s*,?\s*\}\s*\)/)?.[1];
	if (!block) return meta;
	const layout = block.match(/layout\s*:\s*['"]([^'"]+)['"]/)?.[1];
	const title = block.match(/title\s*:\s*['"]([^'"]+)['"]/)?.[1];
	if (layout) meta.layout = layout;
	else if (/layout\s*:\s*false\b/.test(block)) meta.layout = false;
	if (title) meta.title = title;
	return meta;
}
/** {@link parsePageMeta} for a file path (build-time, Node). Returns `{}` on read error. */
function parsePageMetaFromFile(file) {
	try {
		return parsePageMeta(fs.readFileSync(file, "utf-8"));
	} catch {
		return {};
	}
}

//#endregion
//#region src/composables/expose.ts
/**
* Is `v` a plain object (proto is `Object.prototype` or `null`) — not a class
* instance, Date, Map, etc. Used by {@link sanitizeForExpose} to decide whether
* to recurse into an object or drop it.
*/
function isPlainObject(v) {
	if (v === null || typeof v !== "object") return false;
	const proto = Object.getPrototypeOf(v);
	return proto === Object.prototype || proto === null;
}
/**
* Deep-clone `value` keeping ONLY JSON-safe leaves: strings, numbers, booleans,
* null, plain objects and arrays. Everything else is thrown away automatically —
* functions & class constructors (e.g. `oDataService: DefaultService`, DevExtreme
* `DataSource`/`ODataStore`/`CustomStore`), class instances, symbols, `undefined`,
* `bigint`, `Date`, `Map`, `Set`. Cycles and runaway depth are guarded, so it
* never throws and never leaks non-serialisable values into a client bundle.
*
* The single source of truth for the `__MONO_CONFIG_EXPOSE__` global shared by
* the Vite host (`monoRepo`) and the Nuxt host (`@mono-lit/utility/nuxt`).
*
* Exported so a custom `expose` can opt into the same sanitisation:
*   expose: (c) => sanitizeForExpose({ ...c, extra: customInstance })
*/
function sanitizeForExpose(value, depth = 0, seen = /* @__PURE__ */ new WeakSet()) {
	if (depth > 10) return void 0;
	if (value === null) return null;
	const t = typeof value;
	if (t === "string" || t === "number" || t === "boolean") return value;
	if (t === "function" || t === "symbol" || t === "bigint" || t === "undefined") return void 0;
	if (typeof value !== "object") return void 0;
	if (seen.has(value)) return void 0;
	seen.add(value);
	if (Array.isArray(value)) return value.map((v) => sanitizeForExpose(v, depth + 1, seen)).filter((v) => v !== void 0);
	if (isPlainObject(value)) {
		const out = {};
		for (const [k, v] of Object.entries(value)) {
			const s = sanitizeForExpose(v, depth + 1, seen);
			if (s !== void 0) out[k] = s;
		}
		return out;
	}
}
/**
* Default `__MONO_CONFIG_EXPOSE__` builder: expose EVERYTHING that's JSON-safe.
*
* Deep-sanitises the full config so values like `fetching.api.myRest.type`/`url`
* ship to the client, while non-serialisable values are thrown away automatically
* — e.g. `fetching.api.myOdata.oDataService` (a class), `fetching.source`'s
* DevExtreme constructors, and the `extends` thunks. `extends`/`renderFn` are
* config-time-only, so they're stripped before sanitising to avoid recursing
* into layers / leaking the render fn.
*/
function defaultMonoExpose(config) {
	const { extends: _extends, renderFn: _renderFn, ...rest } = config;
	return sanitizeForExpose(rest) ?? {};
}

//#endregion
//#region src/vite/mono-link.ts
/** `<Tag` / `</Tag` for the tags we rewrite — the lookahead keeps `<NuxtLinkFoo` out. */
const tagRe = (names) => new RegExp(`<(/?)(${names.join("|")})(?=[\\s/>])`, "g");
/** One attribute: `name`, `name="v"`, `:name="v"`, `@click.prevent="v"`, `v-if="v"`. */
const ATTR_RE = /([^\s"'=<>/]+)(\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;
/** `https:` / `mailto:` / `tel:` / `//cdn…` — anything vue-router would mangle into a path. */
const ABSOLUTE_RE = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
/** Nuxt-only props: meaningless on `<RouterLink>`, and worse on a plain `<a>` (they'd render as DOM attributes). */
const NUXT_ONLY = [
	"external",
	"prefetch",
	"noprefetch",
	"prefetchon",
	"prefetchedclass",
	"norel",
	"trailingslash"
];
/** Router props on top of those — a plain `<a>` understands none of them. */
const ROUTER_ONLY = [
	"replace",
	"activeclass",
	"exactactiveclass",
	"ariacurrentvalue",
	"custom",
	"viewtransition"
];
/**
* Vite plugin: `<NuxtLink>` -> `<RouterLink>` (or `<a>`) for a Vue/Vite host.
*
* A synced Nuxt remote links with `<NuxtLink to="/x">`, which Nuxt auto-imports.
* The Vue host has no such component, so Vue logs `Failed to resolve component:
* NuxtLink` and renders nothing. This rewrites the tag in remote templates:
*
*  - `<NuxtLink to="/x">`          -> `<RouterLink to="/x">`
*  - `<NuxtLink external to="/x">` -> `<RouterLink to="/x" target="_blank" rel="noopener noreferrer">`
*  - `<NuxtLink to="https://…">`   -> `<a href="https://…" rel="noopener noreferrer">`
*
* `external` stays a RouterLink because vue-router's `guardEvent` won't intercept
* a click on a targeted anchor — the browser navigates for real, which is what
* `external` means, and `to` still resolves as a route. An ABSOLUTE `to` is the
* one case that can't: `router.resolve('https://x.dev')` treats it as a path and
* renders `href="/https://x.dev"`, so those become a real `<a>` (with
* `target="_blank"` too when the tag also said `external`).
*
* Nuxt-only props (`prefetch`, `no-rel`, `trailing-slash`, …) are dropped rather
* than passed through, or they'd land on the DOM as literal attributes. `href` is
* renamed to `to` (NuxtLink accepts both), and for the `<a>` form `to` becomes
* `href`. Everything else — `class`, `target`, `@click`, `v-if`, slots — is left
* exactly as written, and `</NuxtLink>` follows whatever its opening tag became.
*
* Case is preserved: `<nuxt-link>` -> `<router-link>`. `RouterLink` is registered
* globally by `app.use(router)`, so nothing needs importing.
*
* LIMITS (both warn at build time rather than mis-compiling): a computed
* `:external="cond"` can't be resolved here, so the link stays in-app (no
* `target`); and a `custom` NuxtLink gets neither treatment, since it renders no
* element of its own — only the `v-slot="{ href, navigate }"` content.
*
* `enforce: 'pre'` — the SFC must still be raw source, so register before
* `@vitejs/plugin-vue` (`monoVue()` / `monoRepo().nuxt().hostResolver()` do).
*/
function monoNuxtLinkToRouterLink(options = {}) {
	const isRemote = remoteGate(options);
	const externalRel = options.externalRel !== false;
	return {
		name: "mono-nuxt-link-to-router-link",
		enforce: "pre",
		transform(code, id) {
			const file = id?.split("?")[0]?.replace(/\\/g, "/");
			if (!file || !file.endsWith(".vue") || !isRemote(file)) return;
			if (!/<\/?(?:NuxtLink|nuxt-link)[\s/>]/.test(code)) return;
			const warn = (message) => this.warn(`[mono-link] ${file}: ${message}`);
			const out = rewriteTags(code, ["NuxtLink", "nuxt-link"], (name, attrsSrc) => renderNuxtLink(name, attrsSrc, externalRel, warn));
			return out === code ? void 0 : {
				code: out,
				map: null
			};
		}
	};
}
/**
* Vite plugin (Nuxt host): `<RouterLink>` -> `<NuxtLink>` for synced **Vue**
* remotes — the mirror of {@link monoNuxtLinkToRouterLink}, registered by
* `@mono-lit/utility/nuxt`.
*
* `<RouterLink>` does resolve under Nuxt (vue-router registers it), so this isn't
* a fix for a broken render — it's so remote links behave like the host's own:
* route prefetching, external/absolute-URL handling, and `trailingSlash`
* normalisation, none of which RouterLink does. Every RouterLink prop (`to`,
* `replace`, `active-class`, `exact-active-class`, `custom`, `aria-current-value`)
* is a NuxtLink prop too, so this is a pure tag rename — attributes, slots and
* `v-slot` bindings pass through untouched. Case is preserved:
* `<router-link>` -> `<nuxt-link>`.
*/
function monoRouterLinkToNuxtLink(options = {}) {
	const isRemote = remoteGate(options);
	return {
		name: "mono-router-link-to-nuxt-link",
		enforce: "pre",
		transform(code, id) {
			const file = id?.split("?")[0]?.replace(/\\/g, "/");
			if (!file || !file.endsWith(".vue") || !isRemote(file)) return;
			if (!/<\/?(?:RouterLink|router-link)[\s/>]/.test(code)) return;
			const out = rewriteTags(code, ["RouterLink", "router-link"], (name, attrsSrc) => ({
				tag: name === "router-link" ? "nuxt-link" : "NuxtLink",
				attrs: attrsSrc
			}));
			return out === code ? void 0 : {
				code: out,
				map: null
			};
		}
	};
}
/** Clearer aliases. */
const monoNuxtLink = monoNuxtLinkToRouterLink;
const monoRouterLink = monoRouterLinkToNuxtLink;
/**
* Replace every `<name …>`/`</name>` pair using `render`, which returns the new
* tag name and attribute text for an opening tag. A stack carries each opening
* tag's replacement to its `</…>`, so a tag that became `<a>` closes as `</a>`
* while its sibling closes as `</RouterLink>`. Returns the input untouched if the
* markup is malformed (unterminated tag) rather than emitting half a rewrite.
*/
function rewriteTags(code, names, render) {
	const re = tagRe(names);
	const stack = [];
	let out = "";
	let last = 0;
	let match;
	while (match = re.exec(code)) {
		const closing = match[1] === "/";
		const name = match[2];
		out += code.slice(last, match.index);
		if (closing) {
			const gt = code.indexOf(">", match.index);
			if (gt === -1) return code;
			out += `</${stack.pop() ?? render(name, "").tag}>`;
			last = gt + 1;
			re.lastIndex = last;
			continue;
		}
		const gt = findTagEnd(code, match.index + match[0].length);
		if (gt === -1) return code;
		const selfClosing = code[gt - 1] === "/";
		const { tag, attrs } = render(name, code.slice(match.index + match[0].length, selfClosing ? gt - 1 : gt));
		const text = attrs.trim() || attrs.includes("\n") ? attrs : selfClosing ? " " : "";
		out += `<${tag}${text}${selfClosing ? "/>" : ">"}`;
		if (!selfClosing) stack.push(tag);
		last = gt + 1;
		re.lastIndex = last;
	}
	out += code.slice(last);
	return out;
}
/** Index of the `>` ending a tag, skipping quoted attribute values. */
function findTagEnd(code, from) {
	let quote = "";
	for (let i = from; i < code.length; i++) {
		const c = code[i];
		if (quote) {
			if (c === quote) quote = "";
			continue;
		}
		if (c === "\"" || c === "'" || c === "`") quote = c;
		else if (c === ">") return i;
	}
	return -1;
}
/** The `<NuxtLink>` -> `<RouterLink>` / `<a>` decision for one opening tag. */
function renderNuxtLink(name, attrsSrc, externalRel, warn) {
	const routerTag = name === "nuxt-link" ? "router-link" : "RouterLink";
	const attrs = parseAttrs(attrsSrc);
	const find = (key) => attrs.find((a) => a.key === key);
	const custom = find("custom");
	const external = staticFlag(find("external"));
	const absolute = isAbsoluteTarget(find("to") ?? find("href"));
	if (find("external") && external === void 0 && !custom) warn(`<${name} :external="…"> can't be resolved at build time, so no target="_blank" was added — it stays an in-app <${routerTag}>. Use a literal \`external\`, or an absolute URL in \`to\`.`);
	if (custom) {
		if (external || absolute) warn(`<${name} custom external> stays an in-app link — it renders no element to target. Handle the external href yourself.`);
		return {
			tag: routerTag,
			attrs: buildRouterLink(attrsSrc, attrs, false, externalRel)
		};
	}
	if (absolute) return {
		tag: "a",
		attrs: buildAnchor(attrsSrc, attrs, externalRel, external === true)
	};
	return {
		tag: routerTag,
		attrs: buildRouterLink(attrsSrc, attrs, external === true, externalRel)
	};
}
/**
* Keep the router props, drop the Nuxt-only ones, fold `href` into `to`.
*
* An `external` link gets `target="_blank"` instead of becoming an `<a>`:
* vue-router's `guardEvent` refuses to intercept a click on an anchor with a
* `target`, so the browser navigates for real — a full page load out of the SPA,
* which is what `external` means — while `to` keeps working as a route.
*/
function buildRouterLink(src, attrs, external, externalRel) {
	const hasTo = attrs.some((a) => a.key === "to");
	return edit(src, attrs, (a) => {
		if (NUXT_ONLY.includes(a.key)) return "";
		if (a.key === "href" && !hasTo) return rename(a, "to");
	}, external ? externalAttrs(attrs, externalRel) : "");
}
/**
* `target="_blank"` + `rel="noopener noreferrer"` for an external link — each
* skipped if the author wrote their own (or opted out via `no-rel` /
* `externalRel: false`). Both fall through to the anchor RouterLink renders.
*/
function externalAttrs(attrs, externalRel) {
	const has = (key) => attrs.some((a) => a.key === key);
	return `${has("target") ? "" : " target=\"_blank\""}${externalRel && !has("norel") && !has("rel") ? " rel=\"noopener noreferrer\"" : ""}`;
}
/**
* Keep the DOM/Vue attrs, drop every link-component prop, fold `to` into `href`.
* `blank` adds `target="_blank"` — for a link that said `external` outright, not
* for one we only inferred from an absolute URL.
*/
function buildAnchor(src, attrs, externalRel, blank) {
	const hasHref = attrs.some((a) => a.key === "href");
	const noRel = attrs.some((a) => a.key === "norel");
	const hasRel = attrs.some((a) => a.key === "rel");
	const rel = externalRel && !noRel && !hasRel ? " rel=\"noopener noreferrer\"" : "";
	return edit(src, attrs, (a) => {
		if (NUXT_ONLY.includes(a.key) || ROUTER_ONLY.includes(a.key)) return "";
		if (a.key === "to") return hasHref ? "" : rename(a, "href");
	}, `${blank && !attrs.some((a) => a.key === "target") ? " target=\"_blank\"" : ""}${rel}`);
}
/**
* Rewrite an attribute source in place: `patch` returns the replacement text for
* an attribute (`''` deletes it) or `undefined` to leave it exactly as written;
* `append` is inserted after the LAST attribute (not at the very end, so a
* multi-line tag doesn't strand it past the closing indentation).
*
* Everything between attributes — spaces, newlines, indentation — is untouched, so
* the tag keeps its shape and the file keeps its line numbering (these plugins
* emit no sourcemap, so a shifted line would misplace every later Vue error).
*/
function edit(src, attrs, patch, append = "") {
	let out = "";
	let last = 0;
	for (const attr of attrs) {
		const replacement = patch(attr);
		if (replacement === void 0) continue;
		const [start, end] = replacement === "" ? dropRange(src, attr) : [attr.start, attr.end];
		out += src.slice(last, start) + replacement;
		last = end;
	}
	if (!append) return out + src.slice(last);
	const at = attrs.length ? attrs[attrs.length - 1].end : src.length;
	return out + src.slice(last, at) + append + src.slice(at);
}
/**
* A dropped attribute takes one side's spacing with it, so `<NuxtLink external
* to="…">` doesn't come out as `<a  href="…">`. Spaces and tabs only — eating a
* newline would pull the next attribute onto the previous line and shift every
* line after it. Trailing spacing goes first (keeping the tag-name separator);
* leading spacing only when nothing follows on the tag.
*/
function dropRange(src, attr) {
	const space = (i) => src[i] === " " || src[i] === "	";
	let { start, end } = attr;
	while (end < src.length && space(end)) end++;
	if (!src.slice(end).trim()) while (start > 1 && space(start - 1)) start--;
	return [start, end];
}
/** Same binding style and value, different prop name (`:to="x"` -> `:href="x"`). */
function rename(attr, prop) {
	return `${attr.prefix}${prop}${attr.suffix}${attr.valuePart}`;
}
function parseAttrs(src) {
	const out = [];
	for (const match of src.matchAll(ATTR_RE)) {
		const name = match[1];
		const valuePart = match[2] ?? "";
		const { prefix, prop, suffix, directive } = splitName(name);
		out.push({
			raw: match[0],
			start: match.index,
			end: match.index + match[0].length,
			prefix,
			prop,
			suffix,
			valuePart,
			key: directive ? "" : prop.replace(/-/g, "").toLowerCase(),
			bound: prefix !== ""
		});
	}
	return out;
}
/**
* Split an attribute name into `prefix + prop + modifiers`. Directives, events and
* slots (`v-if`, `@click`, `#default`) get `directive: true` — they're never
* matched, renamed or dropped, just carried through verbatim.
*/
function splitName(name) {
	let prefix = "";
	let rest = name;
	if (rest.startsWith("v-bind:")) {
		prefix = "v-bind:";
		rest = rest.slice(7);
	} else if (rest.startsWith(":") || rest.startsWith(".")) {
		prefix = rest[0];
		rest = rest.slice(1);
	} else if (/^(?:@|#|v-)/.test(rest)) return {
		prefix: "",
		prop: rest,
		suffix: "",
		directive: true
	};
	if (rest.startsWith("[")) return {
		prefix,
		prop: rest,
		suffix: "",
		directive: true
	};
	const dot = rest.indexOf(".");
	return {
		prefix,
		prop: dot === -1 ? rest : rest.slice(0, dot),
		suffix: dot === -1 ? "" : rest.slice(dot),
		directive: false
	};
}
/**
* Is a boolean-ish prop statically on? `true`/`false` for a decidable literal,
* `undefined` for a runtime expression (which no build-time rewrite can settle).
*/
function staticFlag(attr) {
	if (!attr) return false;
	const value = unquote(attr.valuePart);
	if (!attr.bound) return value === "" || value === "true";
	if (value === "true") return true;
	if (value === "false") return false;
}
/** A `to`/`href` whose literal value is an absolute URL vue-router can't route. */
function isAbsoluteTarget(attr) {
	if (!attr) return false;
	const value = unquote(attr.valuePart);
	if (!attr.bound) return ABSOLUTE_RE.test(value);
	const literal = /^\s*(['"])([^'"]*)\1\s*$/.exec(value);
	return literal ? ABSOLUTE_RE.test(literal[2]) : false;
}
/** `="foo"` -> `foo`; `''` (valueless attribute) -> `''`. */
function unquote(valuePart) {
	const value = valuePart.replace(/^\s*=\s*/, "");
	const quoted = /^(['"])([\s\S]*)\1$/.exec(value);
	return (quoted ? quoted[2] : value).trim();
}

//#endregion
export { defaultMonoExpose as a, parsePageMetaFromFile as c, monoRouterLinkToNuxtLink as i, remoteGate as l, monoNuxtLinkToRouterLink as n, sanitizeForExpose as o, monoRouterLink as r, parsePageMeta as s, monoNuxtLink as t };