//#region src/composables/layout-var.ts
/** The elements a `'content'` variable applies to — the layout content markers. */
const LAYOUT_CONTENT_SELECTOR = ".mono-layout-content, [mono-layout-content], [mono-sidebar-push]";
/** Per target + property: which owners hold it, and the value each last published. */
const owners = /* @__PURE__ */ new Map();
const key = (name, target) => `${target}:${name}`;
/**
* Publish `value` for `name` on behalf of `owner`.
*
* Re-claiming with the same owner just updates that owner's value, so this is safe
* to call on every render.
*/
function claimLayoutVar(name, owner, value, target = "root") {
	if (typeof document === "undefined") return;
	let held = owners.get(key(name, target));
	if (!held) {
		held = /* @__PURE__ */ new Map();
		owners.set(key(name, target), held);
	}
	held.set(owner, value);
	write(name, target, value);
}
/**
* Drop `owner`'s claim on `name`.
*
* The property is only removed once nobody holds it; while another owner remains,
* that owner's last published value is restored instead.
*/
function releaseLayoutVar(name, owner, target = "root") {
	if (typeof document === "undefined") return;
	const held = owners.get(key(name, target));
	if (!held) return;
	held.delete(owner);
	if (held.size === 0) {
		owners.delete(key(name, target));
		write(name, target, null);
		return;
	}
	const remaining = [...held.values()];
	write(name, target, remaining[remaining.length - 1]);
}
function write(name, target, value) {
	const style = target === "root" ? documentRoot()?.style : contentRule(name)?.style;
	if (!style) return;
	if (value === null) style.removeProperty(name);
	else if (style.getPropertyValue(name) !== value) style.setProperty(name, value);
}
/**
* `document.documentElement`, or null when there is no document to write to.
*
* `releaseLayoutVar` is called from `disconnectedCallback`, and a component can be
* disconnected by the document itself going away — a full-document replacement, or a
* page teardown. The root is already null by then, so the unguarded write threw
* "Cannot read properties of null (reading 'style')" out of an unmount nothing could
* catch. The bookkeeping above still runs; only the DOM write is skipped, and there is
* no document left for the property to be stranded on.
*/
function documentRoot() {
	return typeof document === "undefined" ? null : document.documentElement;
}
let contentStyleEl = null;
const registered = /* @__PURE__ */ new Set();
/**
* The one rule `'content'` variables are written into — created on first use, and again if
* the document dropped the `<style>` (a full-document replacement). Also registers `name`
* as non-inheriting, which is what keeps a change from reaching the content's subtree.
*/
function contentRule(name) {
	if (typeof document === "undefined" || !document.head) return null;
	if (!registered.has(name)) {
		registered.add(name);
		try {
			CSS.registerProperty({
				name,
				syntax: "*",
				inherits: false
			});
		} catch {}
	}
	if (!contentStyleEl || !contentStyleEl.isConnected) {
		contentStyleEl = document.createElement("style");
		contentStyleEl.setAttribute("data-mono-layout-content", "");
		contentStyleEl.textContent = `${LAYOUT_CONTENT_SELECTOR} {}`;
		document.head.appendChild(contentStyleEl);
		const rule = contentStyleEl.sheet?.cssRules[0];
		for (const [k, held] of owners) {
			if (!k.startsWith("content:") || !held.size) continue;
			const values = [...held.values()];
			rule?.style.setProperty(k.slice(8), values[values.length - 1]);
		}
	}
	return contentStyleEl.sheet?.cssRules[0] ?? null;
}

//#endregion
export { releaseLayoutVar as n, claimLayoutVar as t };