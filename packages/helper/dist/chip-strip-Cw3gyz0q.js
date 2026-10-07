//#region src/composables/chip-limits.ts
var KEBAB = {
	max: "max",
	min: "min",
	maxVisible: "max-visible",
	minVisible: "min-visible"
};
/** A non-negative integer, or undefined for anything that is not one (`''`, null, NaN, -1). */
function limitNumber(value) {
	if (value == null || value === "") return void 0;
	const n = Math.floor(Number(value));
	return Number.isFinite(n) && n >= 0 ? n : void 0;
}
/**
* Resolve one limit: the `chip` object's key (camel, then kebab) pins, the
* element's own prop is the fallback. Sanitised through {@link limitNumber}.
*/
function resolveChipLimit(chip, key, elementValue) {
	return limitNumber(chip ? chip[key] ?? chip[KEBAB[key]] : void 0) ?? limitNumber(elementValue);
}
/**
* How many chips to draw before the rest collapse into "+N more" — `Infinity`
* when there is no cap, when the cap is `0` (uncapped, like before), or while
* the total sits at or under the collapse floor.
*/
function visibleChipCap(total, maxVisible, minVisible) {
	if (maxVisible === void 0 || maxVisible <= 0) return Infinity;
	if (minVisible !== void 0 && total <= minVisible) return Infinity;
	return maxVisible;
}
//#endregion
//#region src/composables/chip-strip.ts
/** Slack (px) absorbing sub-pixel layout noise in the overflow comparisons. */
var EPSILON = 1;
var ChipStripController = class {
	constructor(host, opts) {
		this._canScrollStart = false;
		this._canScrollEnd = false;
		this._observer = null;
		this._observed = null;
		this.host = host;
		this.opts = opts;
		host.addController(this);
	}
	/** True once the strip is scrolled away from its start — render `‹`. */
	get canScrollStart() {
		return this._canScrollStart;
	}
	/** True while content remains past the right edge — render `›`. */
	get canScrollEnd() {
		return this._canScrollEnd;
	}
	/** True when either button should show — i.e. the chips overflow the strip. */
	get overflowing() {
		return this._canScrollStart || this._canScrollEnd;
	}
	hostConnected() {
		if (this.opts.enabled()) this._attach();
	}
	hostDisconnected() {
		this._teardown();
	}
	/**
	* Only re-target the observer — deliberately does NOT measure. Measuring here
	* would force a layout on every render of every host, and its `requestUpdate`
	* would schedule an update from inside `updated()`. `invalidate()` and the
	* ResizeObserver cover the cases that can actually change the answer.
	*/
	hostUpdated() {
		if (!this.opts.enabled()) {
			if (this._observed) {
				this._teardown();
				this._publish(false, false);
			}
			return;
		}
		this._attach();
	}
	/**
	* Re-measure because the CONTENT changed — a chip added, removed or relabelled.
	* The host calls this from `updated()` when such state actually changed, which
	* is far rarer than "every update".
	*/
	invalidate() {
		this.sync();
	}
	/**
	* Recompute both flags from the live geometry and re-render only when one
	* actually flipped.
	*/
	sync() {
		if (!this.opts.enabled()) return;
		const strip = this.opts.strip();
		let start = false;
		let end = false;
		if (strip) {
			const max = strip.scrollWidth - strip.clientWidth;
			if (max > EPSILON) {
				start = strip.scrollLeft > EPSILON;
				end = strip.scrollLeft < max - EPSILON;
			}
		}
		this._publish(start, end);
	}
	/**
	* Scroll one "page" toward `dir`, aligned to a chip boundary so a chip is
	* never left half-cut at the leading edge.
	*
	* Forward: the first chip whose right edge passes the visible right edge
	* becomes the new leftmost chip. Backward: the chip that would end at the
	* current left edge becomes the new leftmost chip. If no chip qualifies
	* (one chip wider than the strip), fall back to a plain viewport-width step
	* so the button is never a no-op.
	*/
	page(dir) {
		const strip = this.opts.strip();
		if (!strip) return;
		const max = strip.scrollWidth - strip.clientWidth;
		if (max <= EPSILON) return;
		const viewLeft = strip.scrollLeft;
		const viewRight = viewLeft + strip.clientWidth;
		const stripLeft = strip.getBoundingClientRect().left;
		const chips = Array.from(strip.children).map((chip) => {
			const rect = chip.getBoundingClientRect();
			const left = rect.left - stripLeft + viewLeft;
			return {
				left,
				right: left + rect.width
			};
		});
		let target = null;
		if (dir === 1) {
			for (const chip of chips) if (chip.right > viewRight + EPSILON) {
				target = chip.left;
				break;
			}
		} else for (let i = chips.length - 1; i >= 0; i--) if (chips[i].left < viewLeft - EPSILON) {
			target = chips[i].right - strip.clientWidth;
			break;
		}
		if (target === null) target = viewLeft + dir * strip.clientWidth;
		this._scrollTo(strip, target, max);
	}
	/** Pin the strip to its end — used after a chip is added, to reveal it. */
	scrollToEnd() {
		const strip = this.opts.strip();
		if (!strip) return;
		const max = strip.scrollWidth - strip.clientWidth;
		this._scrollTo(strip, max, max);
	}
	/**
	* Move the strip and republish from the CLAMPED TARGET rather than by reading
	* `scrollLeft` back.
	*
	* Scrolling is instant (no `scroll-behavior: smooth`), so the read would agree
	* — but not reading avoids a second forced layout, and more importantly the
	* strip's scroll events are expensive well beyond this controller: the shared
	* popup controller listens for `scroll` on `window` in the CAPTURE phase, so
	* every scroll event the strip emits repositions any open dropdown, forcing a
	* layout and a `getComputedStyle` ancestor walk. One event per click is the
	* budget; a smooth animation's ~30 was what made the page crawl.
	*/
	_scrollTo(strip, target, max) {
		const clamped = Math.max(0, Math.min(max, target));
		strip.scrollLeft = clamped;
		if (max <= EPSILON) {
			this._publish(false, false);
			return;
		}
		this._publish(clamped > EPSILON, clamped < max - EPSILON);
	}
	/**
	* Store the flags and re-render only on a real change.
	*
	* The request is deferred a microtask: `invalidate()` / `scrollToEnd()` are
	* called from the host's `updated()` (a chip landed, a preset value arrived),
	* and a synchronous `requestUpdate()` there is Lit's change-in-update warning
	* on every such edge. The flags are already stored, so the deferred render
	* reads the same answer — it just doesn't get scheduled from inside the
	* render that asked for it.
	*/
	_publish(start, end) {
		if (start === this._canScrollStart && end === this._canScrollEnd) return;
		this._canScrollStart = start;
		this._canScrollEnd = end;
		if (typeof queueMicrotask === "function") queueMicrotask(() => this.host.requestUpdate());
		else this.host.requestUpdate();
	}
	/**
	* Observe the strip so the buttons re-evaluate when the FIELD is resized —
	* a window resize changes `clientWidth` without any render or scroll event.
	*
	* Only the strip is observed, not the chips: a chip add/remove always comes
	* with a host render, and the host calls `invalidate()` for those.
	*/
	_attach() {
		const strip = this.opts.strip();
		if (strip === this._observed) return;
		this._observer?.disconnect();
		this._observed = strip;
		if (!strip) return;
		if (typeof ResizeObserver === "undefined") return;
		this._observer ??= new ResizeObserver(() => this.sync());
		this._observer.observe(strip);
	}
	_teardown() {
		this._observer?.disconnect();
		this._observer = null;
		this._observed = null;
	}
};
//#endregion
export { resolveChipLimit as n, visibleChipCap as r, ChipStripController as t };
