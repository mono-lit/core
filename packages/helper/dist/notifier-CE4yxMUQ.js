/**
* The coalesced notifier every mono controller uses.
*
* Notifications are queued on a microtask and de-duplicated, so several state
* changes in one tick produce a single callback. That coalescing is not a
* nicety: a synchronous subscriber that re-renders the consumer's Vue tree would
* reenter an in-flight patch and corrupt the DOM. When `queueMicrotask` is
* unavailable (older SSR runtimes) it degrades to a synchronous flush.
*
* This was copy-pasted into `monoDataGrid`, `monoDataDropdown`, `monoForm` and
* `monoChart` — identical logic and, in two of them, identical comments. One
* implementation means one place to fix if the scheduling ever needs to change.
*/
function createNotifier(options = {}) {
	const subscribers = /* @__PURE__ */ new Set();
	let queued = false;
	let chain = 0;
	let probe;
	let tripped = false;
	let pending = false;
	/** Reported once per notifier: a loop that keeps going re-trips every task, and one line says it. */
	let reported = false;
	function armProbe() {
		if (probe !== void 0 || typeof setTimeout !== "function") return;
		probe = setTimeout(() => {
			probe = void 0;
			chain = 0;
			if (tripped) {
				tripped = false;
				if (pending) {
					pending = false;
					flush();
				}
			}
		}, 0);
	}
	function trip() {
		tripped = true;
		pending = true;
		if (reported) return;
		reported = true;
		const extra = options.detail ? options.detail() : "";
		console.error(`[mono] ${options.name ?? "controller"} notified ${chain} times without yielding to the event loop — a feedback loop (something writing back into it on every change, e.g. a watch() on its state ref that calls setProp / setValue). Notifications are paused until the next task.` + (extra ? ` ${extra}` : ""));
	}
	function flush() {
		if (typeof setTimeout === "function") {
			chain++;
			armProbe();
		}
		if (chain > 200) {
			if (!tripped) trip();
			pending = true;
			return;
		}
		options.onFlush?.();
		subscribers.forEach((cb) => cb());
	}
	return {
		subscribe(cb) {
			subscribers.add(cb);
			return () => subscribers.delete(cb);
		},
		notify() {
			if (typeof queueMicrotask !== "function") {
				flush();
				return;
			}
			if (tripped) {
				pending = true;
				return;
			}
			if (queued) return;
			queued = true;
			queueMicrotask(() => {
				queued = false;
				flush();
			});
		},
		clear() {
			subscribers.clear();
		},
		get size() {
			return subscribers.size;
		}
	};
}
//#endregion
export { createNotifier as t };
