import { g as monoHostChildren, h as monoHostChildNodes } from "./hydration-flush-RB5Tz5nl.js";
//#region src/composables/light-slots.ts
/**
* Take ownership of the host's current children. Run **once**, from
* `connectedCallback`, before the first render.
*
* Only nodes that were bucketed are detached from the host — anything left
* unclaimed stays exactly where the consumer put it.
*/
function captureLightSlots(host, options) {
	const { names, fallback = "default" } = options;
	const buckets = /* @__PURE__ */ new Map();
	const claimed = [];
	const push = (name, node) => {
		const list = buckets.get(name);
		if (list) list.push(node);
		else buckets.set(name, [node]);
	};
	for (const node of monoHostChildNodes(host)) {
		let name = fallback;
		if (node.nodeType === Node.ELEMENT_NODE) {
			const element = node;
			const explicit = element.getAttribute("slot");
			if (explicit && names.includes(explicit)) {
				name = explicit;
				element.removeAttribute("slot");
			}
		} else if (node.nodeType === Node.TEXT_NODE) {
			const text = node.textContent ?? "";
			if (text !== "" && !text.trim()) continue;
			if (text.trim()) node.textContent = text.trim();
		} else if (node.nodeType !== Node.COMMENT_NODE) continue;
		push(name, node);
		claimed.push(node);
	}
	for (const node of claimed) if (node.parentNode === host) host.removeChild(node);
	if (options.guardTextContent !== false) guardHostTextContent(host, buckets, {
		fallback,
		onWrite: () => host.requestUpdate?.()
	});
	return buckets;
}
/** Hosts already carrying the accessor — the guard must never stack on itself. */
var guardedHosts = /* @__PURE__ */ new WeakSet();
/**
* Redirect `host.textContent = …` into the captured default region.
*
* A light-DOM component renders into its own host, so the host's children are the
* component. Vue compiles a lone interpolation to a `TEXT`-flagged vnode and
* patches it with `el.textContent = next` (`runtime-dom`'s `setElementText`) —
* on the HOST. That single assignment removes every rendered node, Lit's
* `<!--lit-part-->` markers included, and replaces them with one bare text node:
* the component visually disappears and no later render repairs it, because
* Lit's parts now point at detached nodes. `patchChildren` does the same when
* children go array→text or are cleared, and so does `v-text`.
*
* Static text never hit this (Vue skips the write when the string is unchanged),
* which is why it only showed up on dynamic captions. Shadow builds are immune —
* there the host's children really are slotted content.
*
* So the write is intercepted and applied to the text node the consumer already
* owns inside `[data-mono-slot="<fallback>"]`, which is what the framework meant
* by it anyway. Framework anchors (zero-length text nodes, comments) and element
* children are left alone — repurposing an anchor would break the consumer's next
* patch just as badly as dropping one.
*
* `innerHTML` is deliberately not guarded: only `v-html` on the host reaches it,
* and that is a consumer asking to own the element outright.
*/
function guardHostTextContent(host, buckets, options = {}) {
	if (guardedHosts.has(host)) return;
	guardedHosts.add(host);
	const { fallback = "default", onWrite } = options;
	const nativeTextContent = Object.getOwnPropertyDescriptor(Node.prototype, "textContent");
	/** The text node this guard writes to, kept across writes so it stays stable. */
	let owned = null;
	let holder;
	const isText = (node) => node.nodeType === Node.TEXT_NODE;
	const fallbackBucket = () => {
		const existing = buckets.get(fallback);
		if (existing) return existing;
		const created = [];
		buckets.set(fallback, created);
		return created;
	};
	/**
	* Read back the *consumer's* content, not the rendered element. Component chrome
	* (a badge, a separator) is excluded, so Vue's hydration comparison against the
	* vnode's text still matches after capture has moved things into a region.
	*/
	const read = () => {
		let text = "";
		let captured = false;
		for (const nodes of buckets.values()) for (const node of nodes) {
			captured = true;
			if (isText(node)) text += node.data;
			else if (node.nodeType === Node.ELEMENT_NODE) text += node.textContent ?? "";
		}
		if (captured) return text;
		return nativeTextContent?.get?.call(host) ?? "";
	};
	/**
	* The node to write into: the one we already own, else the first text node
	* carrying actual text — never a zero-length one, that's a Fragment anchor —
	* else a fresh node placed in the region (or parked until the region renders).
	*/
	const resolveTarget = () => {
		const nodes = fallbackBucket();
		if (owned && nodes.includes(owned)) return owned;
		for (const node of nodes) if (isText(node) && node.data !== "") {
			owned = node;
			return node;
		}
		const created = document.createTextNode("");
		nodes.push(created);
		const region = host.querySelector(`[data-mono-slot="${fallback}"]`);
		if (region) region.appendChild(created);
		else holder = parkDetachedNodes(holder, [created]);
		owned = created;
		return created;
	};
	const write = (value) => {
		const node = resolveTarget();
		node.data = value == null ? "" : String(value);
		for (const other of fallbackBucket()) if (other !== node && isText(other) && other.data !== "") other.data = "";
		onWrite?.();
	};
	Object.defineProperty(host, "textContent", {
		configurable: true,
		enumerable: false,
		get: read,
		set: write
	});
}
/** Nodes that have been placed into a region at least once. */
var placedNodes = /* @__PURE__ */ new WeakSet();
/** One of our own `[data-mono-slot]` regions (possibly a detached, superseded one). */
function isSlotRegion(node) {
	return node instanceof Element && node.hasAttribute("data-mono-slot");
}
/**
* Move one captured node into its region — unless the consumer has taken it back.
*
* The obvious form of this, `if (node.parentNode !== target) target.appendChild(node)`,
* cannot tell "not placed yet" from "the framework DELETED this". A child behind a
* `v-if` that flips false ends up with `parentNode === null`, looks unplaced, and the
* very next render puts it straight back: the element **resurrects** and no amount of
* consumer state removes it. That was reproduced in `mono-accordion` and `mono-input`
* and the same loop was copied into every light-DOM component.
*
* So: place freely until a node has been placed once. After that, only re-home it
* while it is still inside one of OUR regions — which is what happens when a
* re-render swaps the region element, the case the original guard existed for. A
* null parent means deleted and any other parent means the consumer moved it; both
* are left alone.
*/
function placeSlotNode(target, node) {
	if (node.parentNode === target) {
		placedNodes.add(node);
		return;
	}
	if (placedNodes.has(node) && !isSlotRegion(node.parentNode)) return;
	target.appendChild(node);
	placedNodes.add(node);
}
/**
* Move captured nodes into their `[data-mono-slot]` regions. Run from `updated()`,
* after Lit has rendered them.
*
* Nodes already sitting in the right region are left untouched — that guard is
* what stops a re-render from re-ordering content the consumer's framework
* inserted after capture. See {@link placeSlotNode} for why "not in the target"
* is not enough on its own.
*/
function placeLightSlots(host, buckets) {
	for (const [name, nodes] of buckets) {
		if (!nodes.length) continue;
		const target = host.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) continue;
		for (const node of nodes) placeSlotNode(target, node);
	}
}
/**
* Park captured nodes that couldn't be placed — because their `[data-mono-slot]`
* target isn't rendered (a slot naming an item that doesn't exist *yet*, e.g. one
* bound to async-loaded data) — in a detached holder so they always keep a live
* parent. A captured node left with `parentNode === null` crashes the consumer
* framework's next patch (`Cannot read properties of null`); any parent avoids that
* while keeping the node invisible until its real target appears and placement moves
* it out. Returns the holder (created lazily on first orphan) so the caller can cache
* it. Pass the previously-returned holder back in on later calls.
*/
function parkDetachedNodes(holder, nodes) {
	for (const node of nodes) if (node.parentNode === null) {
		if (!holder) {
			holder = document.createElement("div");
			holder.hidden = true;
		}
		holder.appendChild(node);
	}
	return holder;
}
/**
* Watches a host for a named slot child that arrives AFTER `connectedCallback`.
*
* The one-shot capture the light builds do at connect is right for the common case — a framework
* mounts an element's children before inserting it — but it is not the only case. A `<ClientOnly>`
* boundary, a hydration pass, or a `v-if` flipping later all append the child to an element that
* is already connected, and a capture that has already run will never see it. In the light build
* that leaves the node sitting in the host's own flow, visible OUTSIDE the region it was meant
* for; in the shadow build the flag that renders the `<slot>` never turns on, so nothing projects.
*
* Deliberately not a Lit controller: it has to work from inside a mixin whose host may be either
* build, and all it needs is connect/disconnect.
*/
var LateSlotWatcher = class {
	constructor(host, name, onFound) {
		this.host = host;
		this.name = name;
		this.onFound = onFound;
	}
	/**
	* The host's own child carrying `slot="<name>"`, or `null`.
	*
	* Walks `children` rather than running a `:scope >` selector — only a DIRECT child is
	* assignable to a slot, and this way the check is one cheap loop over a handful of nodes with
	* no selector engine involved.
	*/
	find() {
		for (const child of monoHostChildren(this.host)) if (child.getAttribute("slot") === this.name) return child;
		return null;
	}
	start() {
		if (this._observer || typeof MutationObserver === "undefined") return;
		this._observer = new MutationObserver(() => this.onFound());
		this._observer.observe(this.host, { childList: true });
	}
	stop() {
		this._observer?.disconnect();
		this._observer = void 0;
	}
};
//#endregion
export { captureLightSlots as n, placeLightSlots as r, LateSlotWatcher as t };
