import { t as createNotifier } from "./notifier-CE4yxMUQ.js";
//#region src/components/form/form-rules.ts
/** Empty for validation purposes: null/undefined, blank string, empty array. */
function isBlank(value) {
	if (value == null) return true;
	if (typeof value === "string") return value.trim() === "";
	if (Array.isArray(value)) return value.length === 0;
	return false;
}
var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/**
* Length for `min`/`max`: a number compares by magnitude, everything else by
* length — so `min: 3` reads naturally for both "at least 3 characters" and
* "at least 3 selected tags".
*/
function sizeOf(value) {
	if (typeof value === "number") return value;
	if (Array.isArray(value)) return value.length;
	if (value == null) return 0;
	return String(value).length;
}
/**
* Run one schema-shaped rule. Duck-typed so yup works without @mono-lit/helper
* depending on it: prefer `validateSync`, fall back to `validate` (which may be
* a promise). The schema's OWN message wins over the rule's `message`.
*/
async function runSchema(schema, value) {
	try {
		if (typeof schema.validateSync === "function") {
			schema.validateSync(value);
			return true;
		}
		if (typeof schema.validate === "function") {
			await schema.validate(value);
			return true;
		}
		return true;
	} catch (err) {
		const e = err;
		return e?.errors?.[0] ?? e?.message ?? "Invalid";
	}
}
/**
* Run a single rule. Returns `true` when it passes, or the failure message.
*
* A `schema` on the rule takes precedence over its `type`/`validate` — that's
* the documented override, so a rule can be declared as a built-in and later
* swapped to a schema without moving it.
*/
async function runRule(rule, ctx) {
	if (rule.schema) return runSchema(rule.schema, ctx.value);
	const { value } = ctx;
	const fail = (fallback) => rule.message ?? fallback;
	switch (rule.type) {
		case "required": return isBlank(value) ? fail("This field is required") : true;
		case "min":
			if (isBlank(value)) return true;
			return sizeOf(value) < rule.value ? fail(`Minimum ${rule.value}`) : true;
		case "max":
			if (isBlank(value)) return true;
			return sizeOf(value) > rule.value ? fail(`Maximum ${rule.value}`) : true;
		case "pattern":
			if (isBlank(value)) return true;
			return (typeof rule.value === "string" ? new RegExp(rule.value) : rule.value).test(String(value)) ? true : fail("Invalid format");
		case "email":
			if (isBlank(value)) return true;
			return EMAIL.test(String(value)) ? true : fail("Invalid email");
		case "custom": {
			const out = rule.validate(ctx);
			if (out === true) return true;
			return typeof out === "string" ? out : fail("Invalid");
		}
		default: return true;
	}
}
/**
* Run a field's rules and return the FIRST failure (so one message shows at a
* time, matching how the components render a single `validation-message`).
*
* `timing` filters which rules apply: `undefined` runs them all (that's
* `form.validate()`), otherwise only rules whose effective timing matches.
*/
async function runRules(rules, ctx, opts) {
	if (!rules?.length) return {
		success: true,
		message: ""
	};
	for (const rule of rules) {
		if (opts.timing) {
			const effective = rule.timing ?? opts.defaultTiming;
			if (!(effective === opts.timing || effective === "live" && opts.timing === "change")) continue;
		}
		const out = await runRule(rule, ctx);
		if (out !== true) return {
			success: false,
			message: out
		};
	}
	return {
		success: true,
		message: ""
	};
}
//#endregion
//#region src/components/form/mono-form-controller.ts
/** Unwrap a ref-like (`{ value }`) or pass a plain value straight through. */
function unref(v) {
	return v && typeof v === "object" && "value" in v ? v.value : v;
}
/**
* Depth cap for the watcher fan-out. A watcher may legitimately `setValue`
* another field (which fans out again); this stops a pair of watchers that write
* to each other from spinning forever, and surfaces it instead of hanging.
*/
var MAX_DEPTH = 10;
function monoForm(options) {
	const defaultTiming = options.validation?.type ?? "change";
	const inputs = options.inputs ?? {};
	const keys = Object.keys(inputs);
	const refs = /* @__PURE__ */ new Set();
	function flush() {
		for (const k of keys) propsFor(k);
		if (refs.size) {
			if (!lastSnap || snapshotMoved(lastSnap)) {
				const snap = {};
				for (const k of keys) snap[k] = {
					...state[k],
					validate: { ...state[k].validate },
					props: { ...state[k].props }
				};
				lastSnap = snap;
			}
			const snap = lastSnap;
			refs.forEach((r) => {
				r.value = snap;
			});
		}
	}
	/** The snapshot last handed to the bound refs — see `flush`. */
	let lastSnap;
	/** Does the live state differ from `prev` in anything a snapshot reader can see? */
	function snapshotMoved(prev) {
		for (const k of keys) {
			const a = prev[k];
			const b = state[k];
			if (!a || !b) return true;
			if (!Object.is(a.currentValue, b.currentValue) || !Object.is(a.oldValue, b.oldValue) || a.touched !== b.touched || a.list !== b.list || a.validate.success !== b.validate.success || a.validate.message !== b.validate.message) return true;
			const ap = a.props;
			const bp = b.props;
			const aKeys = Object.keys(ap);
			if (aKeys.length !== Object.keys(bp).length) return true;
			for (const p of aKeys) if (!(p in bp) || !Object.is(ap[p], bp[p])) return true;
		}
		return false;
	}
	const notifier = createNotifier({
		onFlush: flush,
		name: "controlMonoForm",
		detail: () => `Fields: ${keys.join(", ")}.`
	});
	const notify = notifier.notify;
	const state = {};
	/** Props pushed at runtime by the `setProp()` METHOD (watchers / outside code). */
	const dynamicProps = {};
	const elements = {};
	for (const key of keys) {
		const initial = inputs[key].value;
		state[key] = {
			key,
			currentValue: initial,
			oldValue: initial,
			validate: {
				success: true,
				message: ""
			},
			touched: false,
			props: {},
			list: []
		};
		dynamicProps[key] = {};
		elements[key] = /* @__PURE__ */ new Set();
	}
	function values() {
		const out = {};
		for (const k of keys) out[k] = state[k].currentValue;
		return out;
	}
	function externals() {
		const out = {};
		for (const [k, v] of Object.entries(options.external ?? {})) out[k] = unref(v);
		return out;
	}
	/**
	* The STATIC `inputs[key].props` is the declared override and always wins, so
	* it is merged LAST over whatever the `setProp()` method has accumulated.
	*/
	function propsFor(key) {
		const merged = {
			...dynamicProps[key] ?? {},
			...inputs[key]?.props ?? {}
		};
		state[key] && (state[key].props = merged);
		return merged;
	}
	/**
	* Bumped by `setValidation`. A rule run captures it first and refuses to
	* write if it changed meanwhile — otherwise the async rule pass lands AFTER
	* the synchronous watcher fan-out and silently overwrites a watcher's verdict.
	*/
	const manualSeq = {};
	async function validateKey(key, timing) {
		const input = inputs[key];
		if (!input) return true;
		if (!input.validates?.length) return state[key].validate.success;
		const seq = manualSeq[key] ?? 0;
		const result = await runRules(input.validates, {
			value: state[key].currentValue,
			values: values(),
			key
		}, {
			timing,
			defaultTiming
		});
		if ((manualSeq[key] ?? 0) !== seq) return result.success;
		const prev = state[key].validate;
		if (prev.success !== result.success || prev.message !== result.message) {
			state[key].validate = result;
			notify();
		}
		return result.success;
	}
	let depth = 0;
	/**
	* The `mno-input` / `mno-change` CustomEvent that last touched each field, so
	* a watcher can reach the real DOM event (`event.target`, `detail`, keys…).
	* Cleared on a programmatic write — `setValue` has no originating event, and
	* handing back a stale one would be worse than `undefined`.
	*/
	const lastEvent = {};
	function watcherCtx(selfKey, peerKey) {
		return {
			selfKey,
			peerKey,
			currentValue: state[selfKey].currentValue,
			oldValue: state[selfKey].oldValue,
			peerCurrentValue: state[peerKey]?.currentValue,
			peerOldValue: state[peerKey]?.oldValue,
			event: lastEvent[selfKey],
			peerEvent: lastEvent[peerKey],
			values: values(),
			external: externals(),
			setProp,
			setValidation,
			setValue
		};
	}
	/**
	* Run EVERY field's watcher for one change: the changed field's own watcher
	* (`peerKey === selfKey`) plus every other field's watcher with `peerKey` set
	* to the changed key. That fan-out is what lets `Name`'s watcher say
	* `if (peerKey === 'Age')` without any separate peer registry.
	*/
	function fanOut(changedKey) {
		if (depth >= MAX_DEPTH) {
			console.warn(`[monoForm] watcher depth limit (${MAX_DEPTH}) reached while processing "${changedKey}" — a watcher is probably writing to a field whose watcher writes back.`);
			return;
		}
		depth++;
		try {
			for (const selfKey of keys) inputs[selfKey]?.watcher?.(watcherCtx(selfKey, changedKey));
		} finally {
			depth--;
		}
	}
	function setValue(key, value) {
		const item = state[key];
		if (!item) return;
		if (Object.is(item.currentValue, value)) return;
		item.oldValue = item.currentValue;
		item.currentValue = value;
		lastEvent[key] = void 0;
		notify();
		fanOut(key);
		validateKey(key);
	}
	function setValues(next) {
		for (const [k, v] of Object.entries(next)) {
			const item = state[k];
			if (!item || Object.is(item.currentValue, v)) continue;
			item.oldValue = item.currentValue;
			item.currentValue = v;
			lastEvent[k] = void 0;
		}
		notify();
		for (const k of Object.keys(next)) if (state[k]) fanOut(k);
	}
	function setProp(arg) {
		if (!arg?.key || !dynamicProps[arg.key]) return;
		const bag = dynamicProps[arg.key];
		let changed = false;
		for (const [p, v] of Object.entries(arg.props ?? {})) {
			if (p in bag && Object.is(bag[p], v)) continue;
			bag[p] = v;
			changed = true;
		}
		if (changed) notify();
	}
	function setValidation(arg) {
		const item = state[arg?.key];
		if (!item) return;
		manualSeq[arg.key] = (manualSeq[arg.key] ?? 0) + 1;
		item.validate = {
			success: arg.validation?.success ?? item.validate.success,
			message: arg.validation?.message ?? ""
		};
		notify();
	}
	async function validateAll() {
		const outcomes = await Promise.all(keys.map((k) => validateKey(k)));
		for (const k of keys) state[k].touched = true;
		notify();
		return outcomes.every(Boolean);
	}
	function isValid() {
		return keys.every((k) => state[k].validate.success);
	}
	function reset() {
		for (const key of keys) {
			const initial = inputs[key].value;
			state[key].currentValue = initial;
			state[key].oldValue = initial;
			state[key].validate = {
				success: true,
				message: ""
			};
			state[key].touched = false;
			dynamicProps[key] = {};
		}
		notify();
	}
	function refresh() {
		for (const key of keys) fanOut(key);
		notify();
	}
	function bindRef(ref) {
		refs.add(ref);
		notify();
		return () => refs.delete(ref);
	}
	if (options.state) bindRef(options.state);
	function _register(key, el) {
		if (!elements[key]) elements[key] = /* @__PURE__ */ new Set();
		elements[key].add(el);
		return () => elements[key]?.delete(el);
	}
	/**
	* A list control publishing its resolved options.
	*
	* Called from the control's own render path, so it lands on EVERY render — hence the identity
	* guard. Without it a notify here would re-render the control, which would report again: a loop
	* that never settles. The control hands over a fresh array only when the rows actually moved.
	*/
	function _reportList(key, entries) {
		const item = state[key];
		if (!item || item.list === entries) return;
		item.list = entries;
		notify();
	}
	function _report(key, value, timing, event) {
		const item = state[key];
		if (!item) return;
		lastEvent[key] = event;
		if (timing === "change") item.touched = true;
		if (Object.is(item.currentValue, value)) {
			if (timing === "change") validateKey(key, timing);
			return;
		}
		item.oldValue = item.currentValue;
		item.currentValue = value;
		notify();
		fanOut(key);
		validateKey(key, timing);
	}
	return {
		items: () => state,
		values,
		setValue,
		setValues,
		validate: validateAll,
		isValid,
		reset,
		setProp,
		setValidation,
		refresh,
		bindRef,
		subscribe: notifier.subscribe,
		dispose() {
			notifier.clear();
			refs.clear();
			for (const k of keys) elements[k]?.clear();
		},
		_register,
		_report,
		_reportList,
		_propsFor: propsFor
	};
}
//#endregion
export { runRules as i, isBlank as n, runRule as r, monoForm as t };
