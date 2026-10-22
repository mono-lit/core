import { a as __decorate, c as defineHybridPropAlias, f as customElement, i as withShadowUtilityStyles, l as defineHybridPropAliases, r as toShadowCss, s as booleanStringConverter, t as flushSsrHydration, v as toCssSize } from "../../hydration-flush-W_DI9kRo.js";
import { t as dispatchMonoEvent } from "../../mono-event-BPku9HpS.js";
import { n as cssPart } from "../../css-class-B6Tc_MAx.js";
import { a as parseFormat, t as applyFormat } from "../../input-format-GrRCJBqV.js";
import { t as MonoFormControlCore } from "../../form-control-core-C6XxkYTb.js";
import { n as FieldTooltipController, t as field_tooltip_css_raw_default } from "../../field-tooltip.css_raw-DEctHXKm.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";

//#region src/components/slider/slider-math.ts
/** Past this many grid ticks, `marks` = true draws only the ends: denser than this reads as a texture. */
const MAX_AUTO_MARKS = 26;
/** Strip float noise (0.1 + 0.2) without losing a fractional step. */
function stripNoise(n) {
	return Number(n.toFixed(10));
}
function toNumber(value) {
	if (value === null || value === void 0 || value === "") return void 0;
	const n = typeof value === "number" ? value : Number(value);
	return Number.isFinite(n) ? n : void 0;
}
/**
* Anything a consumer (or a framework) might hand over as a value — a number, an array, a JSON
* string (`"[20,80]"`, what an SSR attribute carries), a comma list (`"20,80"`), a numeric string —
* as a list of finite numbers. Non-numbers are dropped. `null` when nothing usable is left.
*/
function coerceNumbers(value) {
	if (value === null || value === void 0 || value === "") return null;
	if (typeof value === "number") return Number.isFinite(value) ? [value] : null;
	if (Array.isArray(value)) {
		const out = value.map(toNumber).filter((n) => n !== void 0);
		return out.length ? out : null;
	}
	if (typeof value === "string") {
		const text = value.trim();
		if (text.startsWith("[")) try {
			return coerceNumbers(JSON.parse(text));
		} catch {
			return null;
		}
		if (text.includes(",")) return coerceNumbers(text.split(","));
		const n = toNumber(text);
		return n === void 0 ? null : [n];
	}
	return null;
}
/** The scale from raw props: defaults 0 / 100 / 1, `max` never below `min`, stops cleaned. */
function resolveScale(input) {
	const min = toNumber(input.min) ?? 0;
	const rawMax = toNumber(input.max) ?? 100;
	const max = rawMax < min ? min : rawMax;
	const rawStep = toNumber(input.step);
	const step = rawStep === void 0 ? 1 : rawStep > 0 ? rawStep : 0;
	const minGap = Math.max(0, toNumber(input.minGap) ?? 0);
	const list = coerceNumbers(input.stops);
	const stops = list ? [...new Set(list.filter((n) => n >= min && n <= max).map(stripNoise))].sort((a, b) => a - b) : null;
	return {
		min,
		max,
		step,
		stops: stops && stops.length ? stops : null,
		minGap
	};
}
function clamp(v, lo, hi) {
	return Math.min(hi, Math.max(lo, v));
}
/** The allowed value nearest to `v` (a stop, a grid point, or `v` itself when continuous). */
function snap(v, scale) {
	const x = clamp(v, scale.min, scale.max);
	if (scale.stops) {
		let best = scale.stops[0];
		for (const s of scale.stops) if (Math.abs(s - x) < Math.abs(best - x)) best = s;
		return best;
	}
	if (!scale.step) return stripNoise(x);
	const snapped = scale.min + Math.round((x - scale.min) / scale.step) * scale.step;
	return stripNoise(snapped > scale.max ? snapped - scale.step : snapped);
}
/** The smallest allowed value ≥ x (or `max` when none is). */
function ceilTo(x, scale) {
	if (x <= scale.min) return scale.min;
	if (scale.stops) return scale.stops.find((s) => s >= x - 1e-9) ?? scale.max;
	if (!scale.step) return Math.min(x, scale.max);
	const v = scale.min + Math.ceil(stripNoise((x - scale.min) / scale.step)) * scale.step;
	return stripNoise(v > scale.max ? scale.max : v);
}
/** The largest allowed value ≤ x (or `min` when none is). */
function floorTo(x, scale) {
	if (x >= scale.max) return scale.stops ? scale.stops[scale.stops.length - 1] : snapFloorMax(scale);
	if (scale.stops) {
		for (let i = scale.stops.length - 1; i >= 0; i--) if (scale.stops[i] <= x + 1e-9) return scale.stops[i];
		return scale.min;
	}
	if (!scale.step) return Math.max(x, scale.min);
	const v = scale.min + Math.floor(stripNoise((x - scale.min) / scale.step)) * scale.step;
	return stripNoise(v < scale.min ? scale.min : v);
}
/** The highest grid point (equals `max` only when the step divides the span). */
function snapFloorMax(scale) {
	if (!scale.step) return scale.max;
	return stripNoise(scale.min + Math.floor(stripNoise((scale.max - scale.min) / scale.step)) * scale.step);
}
/**
* The values, made valid: each clamped and snapped, sorted, then spread so neighbours are at least
* `minGap` apart. Thumbs are never dropped — when the gap cannot fit every thumb, they pack
* against the ends (the forward pass pushes right, the backward pass pulls back under `max`).
*/
function normalise(values, scale) {
	const out = values.map((v) => snap(v, scale)).sort((a, b) => a - b);
	if (!scale.minGap || out.length < 2) return out;
	for (let i = 1; i < out.length; i++) if (out[i] - out[i - 1] < scale.minGap - 1e-9) out[i] = ceilTo(out[i - 1] + scale.minGap, scale);
	for (let i = out.length - 2; i >= 0; i--) if (out[i + 1] - out[i] < scale.minGap - 1e-9) out[i] = floorTo(out[i + 1] - scale.minGap, scale);
	return out.map((v) => clamp(v, scale.min, scale.max));
}
/** The range thumb `i` may move in: its neighbours ± `minGap` (the BLOCK rule). */
function thumbBounds(values, i, scale) {
	const lo = i > 0 ? ceilTo(values[i - 1] + scale.minGap, scale) : scale.min;
	const hi = i < values.length - 1 ? floorTo(values[i + 1] - scale.minGap, scale) : snapFloorMaxOrStop(scale);
	return {
		lo,
		hi: Math.max(lo, hi)
	};
}
function snapFloorMaxOrStop(scale) {
	return scale.stops ? scale.stops[scale.stops.length - 1] : snapFloorMax(scale);
}
function snapFloorMinOrStop(scale) {
	return scale.stops ? scale.stops[0] : scale.min;
}
/**
* Move thumb `i` toward `v`: snap, then stop at the neighbours (± gap). Returns a NEW array when
* the thumb actually moved, the SAME array otherwise — callers use identity to skip no-op events.
*/
function moveThumb(values, i, v, scale) {
	const { lo, hi } = thumbBounds(values, i, scale);
	const next = clamp(snap(v, scale), lo, hi);
	if (next === values[i]) return values;
	const out = values.slice();
	out[i] = next;
	return out;
}
/**
* Shift a whole run of thumbs `[from..to]` by `delta`, keeping their spacing — the drag of a filled
* segment between two thumbs. The run stops at the track ends and at the thumbs outside it.
*/
function moveRun(values, from, to, delta, scale) {
	const lo = from > 0 ? values[from - 1] + scale.minGap : snapFloorMinOrStop(scale);
	const hi = to < values.length - 1 ? values[to + 1] - scale.minGap : snapFloorMaxOrStop(scale);
	const d = clamp(delta, lo - values[from], hi - values[to]);
	if (!d) return values;
	const applied = clamp(snap(values[from] + d, scale) - values[from], lo - values[from], hi - values[to]);
	if (!applied) return values;
	const out = values.slice();
	for (let k = from; k <= to; k++) out[k] = stripNoise(values[k] + applied);
	return out;
}
/**
* The thumb a press at `v` should grab: the nearest one. Thumbs sitting on the same spot (`[2, 2,
* 3]`) tie — then the press picks by SIDE: a press above the stack takes its LAST thumb, below it
* the FIRST, so stacked thumbs can always be pulled apart. `dir` (+1 / -1) breaks an exact hit,
* once the drag has shown which way it is heading.
*/
function nearestThumb(values, v, dir = 0) {
	let best = 0;
	let bestDist = Infinity;
	for (let i = 0; i < values.length; i++) {
		const d = Math.abs(values[i] - v);
		if (d < bestDist - 1e-9) {
			best = i;
			bestDist = d;
		}
	}
	let first = best;
	let last = best;
	while (first > 0 && Math.abs(values[first - 1] - values[best]) < 1e-9) first--;
	while (last < values.length - 1 && Math.abs(values[last + 1] - values[best]) < 1e-9) last++;
	if (first === last) return best;
	return (v > values[best] + 1e-9 ? 1 : v < values[best] - 1e-9 ? -1 : dir) > 0 ? last : first;
}
/** True when several thumbs share position `values[i]` (a stack the next drag must split). */
function isStacked(values, i) {
	return i > 0 && Math.abs(values[i - 1] - values[i]) < 1e-9 || i < values.length - 1 && Math.abs(values[i + 1] - values[i]) < 1e-9;
}
/** `v` as a 0–100 position along the track. */
function toPercent(v, scale) {
	const span = scale.max - scale.min;
	if (span <= 0) return 0;
	return clamp((v - scale.min) / span * 100, 0, 100);
}
/** A 0–1 position along the track as a raw (unsnapped) value. */
function fromRatio(ratio, scale) {
	return scale.min + clamp(ratio, 0, 1) * (scale.max - scale.min);
}
/**
* The track as pieces between its boundaries (the two ends and every thumb), each flagged filled
* or not by the `fill` mode. Rendering every stretch as its own piece is what lets `track-gap` cut
* the track back around each thumb, and lets a consumer colour segments one by one.
*/
function trackPieces(values, scale, fill) {
	const bounds = [
		0,
		...values.map((v) => toPercent(v, scale)),
		100
	];
	const n = values.length;
	const pieces = [];
	for (let k = 0; k < bounds.length - 1; k++) {
		let filled = false;
		if (fill === "start") filled = k === 0;
		else if (fill === "end") filled = k === n;
		else if (fill === "auto") filled = n === 1 ? k === 0 : k >= 1 && k <= n - 1;
		pieces.push({
			from: bounds[k],
			to: bounds[k + 1],
			cutStart: k > 0,
			cutEnd: k < n,
			filled
		});
	}
	return pieces;
}
/** The marks to draw. `true` = one per stop, or per step (only the two ends past ~26 — denser is a texture, not ticks). */
function markPoints(marks, scale) {
	if (marks === false || marks === null || marks === void 0 || marks === "" || marks === "false") return [];
	let list = marks;
	if (typeof marks === "string") {
		const text = marks.trim();
		if (text === "true") list = true;
		else try {
			list = JSON.parse(text);
		} catch {
			list = coerceNumbers(text) ?? [];
		}
	}
	if (list === true) return (scale.stops ?? autoGrid(scale)).map((value) => ({
		value,
		pct: toPercent(value, scale),
		labelled: false
	}));
	if (!Array.isArray(list)) return [];
	const out = [];
	for (const item of list) if (typeof item === "number" || typeof item === "string") {
		const value = toNumber(item);
		if (value !== void 0 && value >= scale.min && value <= scale.max) out.push({
			value,
			pct: toPercent(value, scale),
			labelled: false
		});
	} else if (item && typeof item === "object") {
		const value = toNumber(item.value);
		if (value !== void 0 && value >= scale.min && value <= scale.max) {
			const label = item.label;
			out.push({
				value,
				pct: toPercent(value, scale),
				label: label == null ? void 0 : String(label),
				labelled: true
			});
		}
	}
	return out.sort((a, b) => a.value - b.value);
}
function autoGrid(scale) {
	if (!scale.step) return [scale.min, scale.max];
	const count = Math.floor(stripNoise((scale.max - scale.min) / scale.step)) + 1;
	if (count > MAX_AUTO_MARKS) return [scale.min, scale.max];
	return Array.from({ length: count }, (_, i) => stripNoise(scale.min + i * scale.step));
}
/**
* One keyboard step from `v`: `dir` ±1, `big` for PageUp/PageDown. With stops it walks the list
* (big = a tenth of it, at least one); with a grid it moves a step (big = ten); continuous moves
* 1% (big = 10%).
*/
function stepFrom(v, dir, big, scale) {
	if (scale.stops) {
		const stops = scale.stops;
		let idx = stops.findIndex((s) => Math.abs(s - v) < 1e-9);
		if (idx < 0) idx = stops.findIndex((s) => s > v) - (dir > 0 ? 1 : 0);
		const jump = big ? Math.max(1, Math.round(stops.length / 10)) : 1;
		return stops[clamp(idx + dir * jump, 0, stops.length - 1)];
	}
	return stripNoise(v + dir * (scale.step || (scale.max - scale.min) / 100) * (big ? 10 : 1));
}

//#endregion
//#region src/components/slider/slider-core.ts
/** Pixels a press must travel before a press between two thumbs becomes a segment drag. */
const SEGMENT_DRAG_THRESHOLD = 3;
/**
* `true` unless the attribute says `"false"` — for props that are ON by default (`show-value`),
* where an ABSENT attribute must not read as off.
*/
const defaultOnConverter = { fromAttribute: (v) => v === null ? true : booleanStringConverter.fromAttribute(v) };
/** A model that holds the same numbers in the same shape is not a change (Vue re-sends arrays). */
function sliderValueHasChanged(value, old) {
	if (value === old) return false;
	const a = coerceNumbers(value);
	const b = coerceNumbers(old);
	if (!a || !b) return a !== b;
	if (Array.isArray(value) !== Array.isArray(old)) return true;
	return a.length !== b.length || a.some((n, i) => n !== b[i]);
}
/**
* `MonoSliderCore` — everything `mono-slider` does that does not depend on light vs shadow DOM:
* props + hybrid aliases, the value maths (slider-math.ts), pointer + keyboard interaction,
* events, form binding, and the shared `render()`. The label / message regions are hooks the
* shadow build overrides with native `<slot>`s (the light build captures `slot="label|helper"`
* children and drops them into `[data-mono-slot]` placeholders, like mono-input).
*
* Thumbs are `role="slider"` elements, not native range inputs: N thumbs on one track, blocking,
* stops, gaps and segment drags are all beyond `<input type="range">`.
*/
const MonoSliderCore = (superClass) => {
	class MonoSliderCoreClass extends MonoFormControlCore(superClass) {
		constructor(...args) {
			super(...args);
			this.modelValue = 0;
			this.min = 0;
			this.max = 100;
			this.step = 1;
			this.minGap = 0;
			this.type = "horizontal";
			this.marks = false;
			this.fill = "auto";
			this.trackGap = 0;
			this.valueTooltip = "auto";
			this.showValue = true;
			this.valueSeparator = " – ";
			this.size = "md";
			this.color = "primary";
			this.label = "";
			this.helperText = "";
			this.tooltip = null;
			this._tooltip = new FieldTooltipController(this, () => this.tooltip);
			this.validationState = "default";
			this.validationMessage = "";
			this.error = false;
			this.errorMessage = "";
			this.success = false;
			this.successMessage = "";
			this.disabled = false;
			this.readonly = false;
			this.required = false;
			this.name = "";
			this.cssClass = {};
			this.cssClassName = "";
			this._values = [0];
			this._active = 0;
			this._dragging = -1;
			this._hasLabelSlotState = false;
			this._hasHelperSlotState = false;
			this._scale = resolveScale({});
			this._sliderId = `mono-slider-${Math.random().toString(36).slice(2)}`;
			this._messageId = `${this._sliderId}-message`;
			this._gesture = null;
			defineHybridPropAliases(this, [
				"modelValue",
				"minGap",
				"trackGap",
				"valueTooltip",
				"showValue",
				"valueSeparator",
				"formatDisplay",
				"formatLocale",
				"helperText",
				"validationState",
				"validationMessage",
				"errorMessage",
				"successMessage",
				"ariaLabelText",
				"cssClass"
			]);
			defineHybridPropAlias(this, "value", "modelValue");
			for (const alias of [
				"ariaLabel",
				"aria-label",
				"arialabel"
			]) Object.defineProperty(this, alias, {
				get: () => this.ariaLabelText,
				set: (v) => {
					this.ariaLabelText = v == null ? void 0 : String(v);
				},
				configurable: true,
				enumerable: false
			});
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"value",
				"modelvalue",
				"mingap",
				"trackgap",
				"valuetooltip",
				"showvalue",
				"valueseparator",
				"formatdisplay",
				"format-display",
				"formatlocale",
				"helpertext",
				"validationstate",
				"validationmessage",
				"errormessage",
				"successmessage",
				"arialabel",
				"arialabeltext",
				"css-class",
				"cssclass"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			switch (name) {
				case "value":
				case "modelvalue":
					this.modelValue = newValue ?? "";
					return;
				case "mingap":
					this.minGap = newValue ?? 0;
					return;
				case "trackgap":
					this.trackGap = newValue ?? 0;
					return;
				case "valuetooltip":
					this.valueTooltip = newValue ?? "auto";
					return;
				case "showvalue":
					this.showValue = defaultOnConverter.fromAttribute(newValue);
					return;
				case "valueseparator":
					this.valueSeparator = newValue ?? " – ";
					return;
				case "formatdisplay":
				case "format-display":
					if (typeof this.formatDisplay === "function") return;
					if (newValue && /^(?:async\s+)?(?:function|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/.test(newValue.trim())) return;
					this.formatDisplay = newValue ?? void 0;
					return;
				case "formatlocale":
					this.formatLocale = newValue ?? void 0;
					return;
				case "helpertext":
					this.helperText = newValue ?? "";
					return;
				case "validationstate":
					this.validationState = newValue ?? "default";
					return;
				case "validationmessage":
					this.validationMessage = newValue ?? "";
					return;
				case "errormessage":
					this.errorMessage = newValue ?? "";
					return;
				case "successmessage":
					this.successMessage = newValue ?? "";
					return;
				case "arialabel":
				case "arialabeltext":
					this.ariaLabelText = newValue ?? void 0;
					return;
				case "css-class":
				case "cssclass":
					this.cssClassName = newValue ?? "";
					return;
			}
		}
		/** The thumb positions, always as a sorted array. */
		get values() {
			return this._values.slice();
		}
		willUpdate(changed) {
			const scaleKeys = [
				"min",
				"max",
				"step",
				"stops",
				"minGap"
			];
			if (scaleKeys.some((k) => changed.has(k))) this._scale = resolveScale({
				min: this.min,
				max: this.max,
				step: this.step,
				stops: this.stops,
				minGap: this.minGap
			});
			if (changed.has("modelValue") || scaleKeys.some((k) => changed.has(k))) {
				const raw = coerceNumbers(this.modelValue) ?? [this._scale.min];
				const next = normalise(raw, this._scale);
				if (next.length !== this._values.length || next.some((n, i) => n !== this._values[i])) {
					this._values = next;
					if (this._active >= next.length) this._active = next.length - 1;
				}
			}
			super.willUpdate?.(changed);
		}
		/** True when the model is (or was handed over as) a list — the shape we hand back. */
		get _isArrayModel() {
			const v = this.modelValue;
			return Array.isArray(v) || typeof v === "string" && (v.trim().startsWith("[") || v.includes(","));
		}
		_out(values) {
			return this._isArrayModel || values.length > 1 ? values.slice() : values[0];
		}
		/** A value as text, through `format-display` (pattern or function), padded like a commit. */
		_format(v) {
			const raw = String(stripNoise(v));
			const fmt = this.formatDisplay;
			if (!fmt) return raw;
			if (typeof fmt === "function") return String(fmt({
				value: raw,
				type: "slider",
				locale: this.formatLocale
			}) ?? "");
			const descriptor = parseFormat(fmt);
			return descriptor ? applyFormat(raw, descriptor, this.formatLocale, { pad: true }) : raw;
		}
		get _readoutText() {
			return this._values.map((v) => this._format(v)).join(this.valueSeparator);
		}
		get _vertical() {
			return this.type === "vertical";
		}
		get _trackEl() {
			return this.renderRoot.querySelector("[mono-slider-track]");
		}
		_thumbEl(i) {
			return this.renderRoot.querySelector(`[mono-slider-thumb][data-index="${i}"]`);
		}
		/** True when the slider is laid out right-to-left (horizontal only flips). */
		_isRtl() {
			if (this._vertical || typeof getComputedStyle === "undefined") return false;
			return getComputedStyle(this).direction === "rtl";
		}
		/**
		* The unsnapped value under a pointer. A thumb's CENTRE travels from half a thumb in to half a
		* thumb short of the end (where a native range thumb sits), so the usable length is the track
		* minus one thumb.
		*/
		_rawAt(event) {
			const rect = this._trackEl?.getBoundingClientRect();
			if (!rect) return this._scale.min;
			const thumb = this._thumbEl(0);
			let ratio;
			if (this._vertical) {
				const along = thumb?.offsetHeight ?? 0;
				const usable = rect.height - along;
				ratio = usable > 0 ? (rect.bottom - along / 2 - event.clientY) / usable : 0;
			} else {
				const along = thumb?.offsetWidth ?? 0;
				const usable = rect.width - along;
				ratio = usable > 0 ? (event.clientX - rect.left - along / 2) / usable : 0;
				if (this._isRtl()) ratio = 1 - ratio;
			}
			return fromRatio(ratio, this._scale);
		}
		/**
		* Take `next` as the new value and announce it. `next === this._values` (identity — the maths
		* returns the same array when nothing moved) is a no-op for `input`.
		*/
		_commit(next, index, kind, sourceEvent, oldValues) {
			if (kind === "input" && next === this._values) return;
			const old = oldValues ?? this._values;
			this._values = next;
			const out = this._out(next);
			const oldOut = this._out(old);
			this.modelValue = out;
			const detail = {
				modelValue: out,
				currentValue: out,
				oldValue: oldOut,
				value: out,
				values: next.slice(),
				index,
				name: this.name || void 0,
				sourceEvent
			};
			dispatchMonoEvent(this, kind, detail);
		}
		get _interactive() {
			return !this.disabled && !this.readonly;
		}
		_onPointerDown(event) {
			if (event.button !== 0 || this.disabled) return;
			const control = event.currentTarget;
			const thumb = event.composedPath().find((n) => n instanceof Element && n.hasAttribute?.("mono-slider-thumb"));
			if (this.readonly) {
				if (thumb) thumb.focus({ preventScroll: true });
				return;
			}
			event.preventDefault();
			const raw = this._rawAt(event);
			const values = this._values;
			let index = thumb ? Number(thumb.dataset.index) : nearestThumb(values, raw);
			let mode = "thumb";
			let stack;
			let run;
			if (thumb && isStacked(values, index)) {
				let first = index;
				let last = index;
				while (first > 0 && values[first - 1] === values[index]) first--;
				while (last < values.length - 1 && values[last + 1] === values[index]) last++;
				stack = [first, last];
				mode = "stack";
			} else if (!thumb && values.length > 1) {
				const k = values.findIndex((v) => v > raw);
				if (k > 0) {
					if (trackPieces(values, this._scale, this.fill)[k]?.filled) {
						run = [k - 1, k];
						mode = "segment-pending";
					}
				}
			}
			this._gesture = {
				pointerId: event.pointerId,
				mode,
				index,
				run,
				stack,
				startX: event.clientX,
				startY: event.clientY,
				startRaw: raw,
				startValues: values
			};
			control.setPointerCapture?.(event.pointerId);
			if (mode === "thumb") {
				this._active = index;
				this._dragging = index;
				this._focusThumb(index);
				if (!thumb) this._commit(moveThumb(values, index, raw, this._scale), index, "input", event);
			}
		}
		_onPointerMove(event) {
			const g = this._gesture;
			if (!g || g.pointerId !== event.pointerId) return;
			const raw = this._rawAt(event);
			if (g.mode === "stack" && g.stack) {
				if (raw === g.startRaw) return;
				g.index = raw > g.startRaw ? g.stack[1] : g.stack[0];
				g.mode = "thumb";
				this._active = g.index;
				this._dragging = g.index;
				this._focusThumb(g.index);
			}
			if (g.mode === "segment-pending") {
				if (Math.hypot(event.clientX - g.startX, event.clientY - g.startY) < SEGMENT_DRAG_THRESHOLD) return;
				g.mode = "segment";
				this._dragging = g.run[0];
			}
			if (g.mode === "segment" && g.run) {
				const next = moveRun(g.startValues, g.run[0], g.run[1], raw - g.startRaw, this._scale);
				if (!(next.length === this._values.length && next.every((n, i) => n === this._values[i]))) this._commit(next, -1, "input", event);
				return;
			}
			if (g.mode === "thumb") this._commit(moveThumb(this._values, g.index, raw, this._scale), g.index, "input", event);
		}
		_onPointerUp(event) {
			const g = this._gesture;
			if (!g || g.pointerId !== event.pointerId) return;
			this._gesture = null;
			event.currentTarget.releasePointerCapture?.(event.pointerId);
			if (g.mode === "segment-pending") {
				const raw = this._rawAt(event);
				const index = nearestThumb(this._values, raw);
				this._active = index;
				this._focusThumb(index);
				this._commit(moveThumb(this._values, index, raw, this._scale), index, "input", event);
			}
			this._dragging = -1;
			if (g.startValues.length !== this._values.length || g.startValues.some((n, i) => n !== this._values[i])) this._commit(this._values, g.mode === "segment" ? -1 : g.index, "change", event, g.startValues);
		}
		_onPointerCancel(event) {
			const g = this._gesture;
			if (!g || g.pointerId !== event.pointerId) return;
			this._onPointerUp(event);
		}
		_focusThumb(i) {
			this.updateComplete.then(() => this._thumbEl(i)?.focus({ preventScroll: true }));
		}
		_onThumbKeydown(event) {
			if (!this._interactive) return;
			let i = Number(event.currentTarget.dataset.index);
			const values = this._values;
			const rtl = this._isRtl();
			let dir = 0;
			let big = false;
			let edge = null;
			switch (event.key) {
				case "ArrowUp":
					dir = 1;
					break;
				case "ArrowDown":
					dir = -1;
					break;
				case "ArrowRight":
					dir = rtl ? -1 : 1;
					break;
				case "ArrowLeft":
					dir = rtl ? 1 : -1;
					break;
				case "PageUp":
					dir = 1;
					big = true;
					break;
				case "PageDown":
					dir = -1;
					big = true;
					break;
				case "Home":
					edge = "lo";
					break;
				case "End":
					edge = "hi";
					break;
				default: return;
			}
			event.preventDefault();
			if (dir && isStacked(values, i)) {
				let j = i;
				if (dir > 0) while (j < values.length - 1 && values[j + 1] === values[i]) j++;
				else while (j > 0 && values[j - 1] === values[i]) j--;
				if (j !== i) {
					i = j;
					this._focusThumb(i);
				}
			}
			const { lo, hi } = thumbBounds(values, i, this._scale);
			const target = edge === "lo" ? lo : edge === "hi" ? hi : stepFrom(values[i], dir, big, this._scale);
			const next = moveThumb(values, i, target, this._scale);
			this._active = i;
			if (next === values) return;
			this._commit(next, i, "input", event);
			this._commit(next, i, "change", event, values);
		}
		get _resolvedValidationState() {
			if (this.validationState && this.validationState !== "default") return this.validationState;
			if (this.error || this.errorMessage) return "invalid";
			if (this.success || this.successMessage) return "valid";
			return "default";
		}
		_cls(base, key) {
			return cssPart(this.cssClass, base, key);
		}
		get _hasLabel() {
			return !!(this.label || this._hasLabelSlotState);
		}
		get _describedBy() {
			return this.validationMessage || this.errorMessage || this.successMessage || this.helperText || this._hasHelperSlotState ? this._messageId : void 0;
		}
		_thumbLabel(i) {
			const base = this.ariaLabelText || this.label || void 0;
			const n = this._values.length;
			if (n === 1) return base;
			const which = n === 2 ? i === 0 ? "minimum" : "maximum" : `${i + 1} of ${n}`;
			return base ? `${base} (${which})` : which;
		}
		focus(options) {
			this._thumbEl(this._active)?.focus(options);
		}
		blur() {
			this._thumbEl(this._active)?.blur();
		}
		/** Label text region — light: placeholder for the captured slot; shadow overrides with `<slot>`. */
		_renderLabelText() {
			return this._hasLabelSlotState ? html`<span data-mono-slot="label"></span>` : this.label;
		}
		_renderReadout() {
			return html`<span class=${this._cls("mono-slider-value", "value")} mono-slider-value aria-hidden="true">${this._readoutText}</span>`;
		}
		/** The label row: text, required mark, ⓘ, and the value at its end. */
		_renderLabel() {
			if (!this._hasLabel) return nothing;
			return html`
        <div mono-label-row>
          <label class=${this._cls("mono-slider-label", "label")} mono-label id=${`${this._sliderId}-label`}>
            ${this._renderLabelText()}
            ${this.required ? html`<span class=${this._cls("mono-slider-required", "required")} mono-required-mark>*</span>` : nothing}
            ${this._tooltip.render()}
          </label>
          ${this.showValue ? this._renderReadout() : nothing}
        </div>
      `;
		}
		_renderMessage() {
			const base = this._cls("mono-slider-message", "message");
			if (this.validationMessage) {
				const s = this._resolvedValidationState;
				return html`<div class=${`${base} ${s}`} mono-message=${s} role=${s === "invalid" ? "alert" : nothing}>${this.validationMessage}</div>`;
			}
			if (this.errorMessage) return html`<div class=${`${base} invalid`} mono-message="invalid" role="alert">${this.errorMessage}</div>`;
			if (this.successMessage) return html`<div class=${`${base} valid`} mono-message="valid">${this.successMessage}</div>`;
			if (this.helperText || this._hasHelperSlotState) return html`<div class=${`${base} helper`} mono-message="helper">${this._hasHelperSlotState ? html`<span data-mono-slot="helper"></span>` : this.helperText}</div>`;
			return nothing;
		}
		_renderPieces(pieces) {
			return html`${pieces.map((p, k) => html`<span
          class=${this._cls("mono-slider-fill", "fill")}
          mono-slider-piece
          ?mono-filled=${p.filled}
          ?mono-cut-start=${p.cutStart}
          ?mono-cut-end=${p.cutEnd}
          data-k=${k}
          style=${`--a: ${p.from / 100}; --b: ${p.to / 100}`}
        ></span>`)}`;
		}
		_renderMarks(marks, pieces) {
			if (!marks.length) return nothing;
			const filled = pieces.filter((p) => p.filled);
			const active = (pct) => filled.some((p) => pct >= p.from - 1e-9 && pct <= p.to + 1e-9);
			const labelled = Array.isArray(this.marks) || typeof this.marks === "string" && this.marks.trim().startsWith("[");
			return html`
        <div class=${this._cls("mono-slider-marks", "marks")} mono-slider-marks aria-hidden="true">
          ${marks.map((m) => html`<span
              class=${this._cls("mono-slider-mark", "mark")}
              mono-slider-mark
              ?mono-active=${active(m.pct)}
              style=${`--p: ${m.pct / 100}`}
            >${labelled ? html`<span class=${this._cls("mono-slider-mark-label", "markLabel")} mono-slider-mark-label>${m.label ?? this._format(m.value)}</span>` : nothing}</span>`)}
        </div>
      `;
		}
		_renderThumb(v, i) {
			const { lo, hi } = thumbBounds(this._values, i, this._scale);
			const text = this._format(v);
			const raw = String(stripNoise(v));
			return html`<div
        class=${this._cls("mono-slider-thumb", "thumb")}
        mono-slider-thumb
        role="slider"
        data-index=${i}
        tabindex=${this.disabled ? -1 : 0}
        style=${`--p: ${toPercent(v, this._scale) / 100}`}
        ?mono-active=${i === this._active}
        ?mono-dragging=${i === this._dragging}
        aria-valuemin=${lo}
        aria-valuemax=${hi}
        aria-valuenow=${raw}
        aria-valuetext=${ifDefined(text !== raw ? text : void 0)}
        aria-orientation=${this._vertical ? "vertical" : "horizontal"}
        aria-label=${ifDefined(this._thumbLabel(i))}
        aria-labelledby=${ifDefined(!this.ariaLabelText && this._hasLabel && this._values.length === 1 ? `${this._sliderId}-label` : void 0)}
        aria-disabled=${ifDefined(this.disabled ? "true" : void 0)}
        aria-readonly=${ifDefined(this.readonly ? "true" : void 0)}
        aria-required=${ifDefined(this.required ? "true" : void 0)}
        aria-invalid=${ifDefined(this._resolvedValidationState === "invalid" ? "true" : void 0)}
        aria-describedby=${ifDefined(this._describedBy)}
        @keydown=${this._onThumbKeydown}
        @focus=${() => {
				this._active = i;
			}}
      >${this.valueTooltip === "never" ? nothing : html`<span class=${this._cls("mono-slider-tooltip", "tooltip")} mono-slider-tooltip aria-hidden="true">${text}</span>`}</div>`;
		}
		_renderHidden() {
			if (!this.name) return nothing;
			const name = (this._values.length > 1 || this._isArrayModel) && !this.name.endsWith("[]") ? `${this.name}[]` : this.name;
			return html`${this._values.map((v) => html`<input type="hidden" mono-slider-hidden name=${name} .value=${String(v)} ?disabled=${this.disabled} />`)}`;
		}
		render() {
			const pieces = trackPieces(this._values, this._scale, this.fill);
			const marks = markPoints(this.marks === "" ? true : this.marks, this._scale);
			const state = this._resolvedValidationState;
			const gap = Number(this.trackGap) || 0;
			const labelledMarks = marks.length > 0 && (Array.isArray(this.marks) || typeof this.marks === "string" && this.marks.trim().startsWith("["));
			const style = {};
			const width = toCssSize(this.width);
			if (width) style.width = width;
			const length = toCssSize(this.height);
			if (length) style["--_mono-slider-length"] = length;
			if (gap > 0) style["--_mono-slider-track-gap"] = `${gap}px`;
			return html`<div
        class=${[
				"mono-slider",
				this.size,
				this.color,
				this._vertical ? "vertical" : "",
				this.disabled ? "disabled" : "",
				this.cssClassName,
				this.cssClass?.root
			].filter(Boolean).join(" ")}
        style=${styleMap(style)}
        mono-slider
        mono-size=${this.size === "md" ? nothing : this.size}
        mono-color=${this.color === "primary" ? nothing : this.color}
        mono-type=${this._vertical ? "vertical" : nothing}
        mono-validation-state=${state === "default" ? nothing : state}
        mono-value-tooltip=${this.valueTooltip === "auto" ? nothing : this.valueTooltip}
        ?mono-track-gap=${gap > 0}
        ?mono-marks-labelled=${labelledMarks}
        ?mono-disabled=${this.disabled}
        ?mono-readonly=${this.readonly}
        ?mono-required=${this.required}
        ?mono-dragging=${this._dragging >= 0}
      >
        ${this._renderLabel()}
        <div mono-slider-field>
          <div
            class=${this._cls("mono-slider-control", "control")}
            mono-slider-control
            @pointerdown=${this._onPointerDown}
            @pointermove=${this._onPointerMove}
            @pointerup=${this._onPointerUp}
            @pointercancel=${this._onPointerCancel}
          >
            <div class=${this._cls("mono-slider-track", "track")} mono-slider-track>${this._renderPieces(pieces)}</div>
            ${this._renderMarks(marks, pieces)}
            ${this._values.map((v, i) => this._renderThumb(v, i))}
          </div>
          ${!this._hasLabel && this.showValue ? this._renderReadout() : nothing}
        </div>
        ${this._renderHidden()}
        <div id=${this._messageId} class=${this.cssClass?.messageWrap ?? ""} mono-message-wrap>${this._renderMessage()}</div>
      </div>`;
		}
	}
	__decorate([property({
		attribute: "model-value",
		hasChanged: sliderValueHasChanged
	})], MonoSliderCoreClass.prototype, "modelValue", void 0);
	__decorate([property()], MonoSliderCoreClass.prototype, "min", void 0);
	__decorate([property()], MonoSliderCoreClass.prototype, "max", void 0);
	__decorate([property()], MonoSliderCoreClass.prototype, "step", void 0);
	__decorate([property({ hasChanged: sliderValueHasChanged })], MonoSliderCoreClass.prototype, "stops", void 0);
	__decorate([property({ attribute: "min-gap" })], MonoSliderCoreClass.prototype, "minGap", void 0);
	__decorate([property({ type: String })], MonoSliderCoreClass.prototype, "type", void 0);
	__decorate([property()], MonoSliderCoreClass.prototype, "marks", void 0);
	__decorate([property({ type: String })], MonoSliderCoreClass.prototype, "fill", void 0);
	__decorate([property({ attribute: "track-gap" })], MonoSliderCoreClass.prototype, "trackGap", void 0);
	__decorate([property({
		type: String,
		attribute: "value-tooltip"
	})], MonoSliderCoreClass.prototype, "valueTooltip", void 0);
	__decorate([property({
		attribute: "show-value",
		converter: defaultOnConverter
	})], MonoSliderCoreClass.prototype, "showValue", void 0);
	__decorate([property({
		type: String,
		attribute: "value-separator"
	})], MonoSliderCoreClass.prototype, "valueSeparator", void 0);
	__decorate([property({ attribute: false })], MonoSliderCoreClass.prototype, "formatDisplay", void 0);
	__decorate([property({
		type: String,
		attribute: "format-locale"
	})], MonoSliderCoreClass.prototype, "formatLocale", void 0);
	__decorate([property({ type: String })], MonoSliderCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoSliderCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoSliderCoreClass.prototype, "label", void 0);
	__decorate([property({
		type: String,
		attribute: "helper-text"
	})], MonoSliderCoreClass.prototype, "helperText", void 0);
	__decorate([property()], MonoSliderCoreClass.prototype, "tooltip", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-state"
	})], MonoSliderCoreClass.prototype, "validationState", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-message"
	})], MonoSliderCoreClass.prototype, "validationMessage", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoSliderCoreClass.prototype, "error", void 0);
	__decorate([property({
		type: String,
		attribute: "error-message"
	})], MonoSliderCoreClass.prototype, "errorMessage", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoSliderCoreClass.prototype, "success", void 0);
	__decorate([property({
		type: String,
		attribute: "success-message"
	})], MonoSliderCoreClass.prototype, "successMessage", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoSliderCoreClass.prototype, "disabled", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoSliderCoreClass.prototype, "readonly", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoSliderCoreClass.prototype, "required", void 0);
	__decorate([property({ type: String })], MonoSliderCoreClass.prototype, "name", void 0);
	__decorate([property({
		type: String,
		attribute: "aria-label"
	})], MonoSliderCoreClass.prototype, "ariaLabelText", void 0);
	__decorate([property({ type: String })], MonoSliderCoreClass.prototype, "width", void 0);
	__decorate([property({ type: String })], MonoSliderCoreClass.prototype, "height", void 0);
	__decorate([property({ attribute: false })], MonoSliderCoreClass.prototype, "cssClass", void 0);
	__decorate([property({
		type: String,
		attribute: "css-class"
	})], MonoSliderCoreClass.prototype, "cssClassName", void 0);
	__decorate([state()], MonoSliderCoreClass.prototype, "_values", void 0);
	__decorate([state()], MonoSliderCoreClass.prototype, "_active", void 0);
	__decorate([state()], MonoSliderCoreClass.prototype, "_dragging", void 0);
	__decorate([state()], MonoSliderCoreClass.prototype, "_hasLabelSlotState", void 0);
	__decorate([state()], MonoSliderCoreClass.prototype, "_hasHelperSlotState", void 0);
	return MonoSliderCoreClass;
};

//#endregion
//#region \0raw:C:\Users\VCT-DEV\Desktop\libs\packages\helper\src\components\slider\slider.css?raw.js
var slider_css_raw_default = "/* =========================================================================\n   mono-slider — a multi-thumb slider drawn in the look of Basecoat's range\n   (basecoat-css@1.0.2 components/range.css + each style's `input[type='range']`),\n   the same look `<mono-input type=\"range\">` has.\n\n   Styled by ATTRIBUTE, like mono-input:\n\n     <div mono-slider mono-size mono-color mono-type=\"vertical\"\n          mono-validation-state mono-value-tooltip=\"always|never\"\n          mono-track-gap mono-marks-labelled mono-disabled mono-readonly mono-dragging>\n       <div mono-label-row><label mono-label>…</label><span mono-slider-value>20 – 80</span></div>\n       <div mono-slider-field>\n         <div mono-slider-control>                 the pointer target\n           <div mono-slider-track>                 the rail; it holds the pieces\n             <span mono-slider-piece mono-filled? mono-cut-start? mono-cut-end? style=\"--a;--b\">\n           <div mono-slider-marks><span mono-slider-mark mono-active? style=\"--p\">\n             <span mono-slider-mark-label>\n           <div mono-slider-thumb role=\"slider\" mono-active? mono-dragging? style=\"--p\">\n             <span mono-slider-tooltip>\n       <div mono-message-wrap><div mono-message=\"helper|valid|invalid|warning\">\n\n   GEOMETRY. `--p` / `--a` / `--b` are 0–1 positions (unitless). A thumb's CENTRE travels\n   from half a thumb in to half a thumb short of the end — exactly where a native range\n   thumb sits — so the slider lines up with `<mono-input type=\"range\">` under every flavor.\n   The track is cut into pieces at every thumb: that is what lets a piece be filled or not\n   (`fill`), and what lets `track-gap` cut the track back around each thumb (M3 style).\n\n   KNOBS. Every look value resolves `--mono-slider-x` → `--mono-input-range-x` → vega,\n   so the eight Basecoat styles and ONE (which write the input-range knobs in\n   flavors/*.css) restyle the slider with no slider entries of their own — the\n   \"flavor via public knobs\" pattern (filter.css). Slider-only knobs: --mono-slider-\n   {length, track-gap, accent, mark-size, mark-color, mark-active-color, mark-label-*,\n   tooltip-bg, tooltip-color, tooltip-radius, tooltip-font-*}.\n\n   The track/thumb rules cite Basecoat; marks, tooltips, track gaps, multiple\n   thumbs and the vertical type are EXTENSIONs.\n   ========================================================================= */\n\nmono-slider {\n  display: block;\n}\n\n[mono-slider] {\n  /* ── palette ─────────────────────────────────────────────────────────── */\n  --_mono-slider-text: var(--mono-slider-color, var(--foreground));\n  --_mono-slider-muted: var(--mono-slider-muted, var(--muted-foreground));\n  /* the fill + thumb colour: the `color` prop, a validation state outranks it */\n  --_mono-slider-accent: var(--mono-slider-accent, var(--_mono-slider-accent-preset, var(--primary)));\n  /* the hover / focus halo: Basecoat's ring-ring/50 (the role colour for a non-primary `color`) */\n  --_mono-slider-ring-color: var(--mono-slider-ring-color, var(--_mono-slider-ring-preset, var(--ring)));\n  --_mono-slider-ring-c: color-mix(in oklab, var(--_mono-slider-ring-color) var(--mono-slider-ring-alpha, var(--mono-ring-alpha, 50%)), transparent);\n\n  /* ── geometry: md here, `size` multiplies ────────────────────────────── */\n  --_mono-slider-scale: 1;\n  --_mono-slider-track-h: round(nearest, calc(var(--mono-slider-track-height, var(--mono-input-range-track-height, 0.375rem)) * var(--_mono-slider-scale)), 1px);\n  /* along = the thumb's size in the direction of travel, across = the other one */\n  --_mono-slider-across: round(nearest, calc(var(--mono-slider-thumb-size, var(--mono-input-range-thumb-size, 1rem)) * var(--_mono-slider-scale)), 1px);\n  --_mono-slider-along: round(nearest, calc(var(--mono-slider-thumb-width, var(--mono-input-range-thumb-width, var(--mono-slider-thumb-size, var(--mono-input-range-thumb-size, 1rem)))) * var(--_mono-slider-scale)), 1px);\n  --_mono-slider-box: max(round(nearest, calc(var(--mono-slider-height, var(--mono-input-range-height, 1.25rem)) * var(--_mono-slider-scale)), 1px), var(--_mono-slider-across));\n  --_mono-slider-track-radius: var(--mono-slider-track-radius, var(--mono-input-range-track-radius, 9999px));\n  --_mono-slider-track-bg: var(--mono-slider-track-bg, var(--mono-input-range-track-bg, var(--muted)));\n  --_mono-slider-fill: var(--mono-slider-fill, var(--mono-input-range-fill, currentColor));\n  --_mono-slider-cut: calc(var(--_mono-slider-track-gap, 0px) + var(--_mono-slider-along) / 2);\n\n  /* basecoat@1.0.2 styles/vega.css .field — flex w-full flex-col gap-3 (the input range's gap) */\n  display: flex;\n  flex-direction: column;\n  gap: var(--mono-slider-gap, var(--mono-input-range-gap, var(--mono-input-gap, calc(var(--mono-spacing) * 3))));\n  width: 100%;\n  font-family: inherit;\n  color: var(--_mono-slider-text);\n}\n\n[mono-slider],\n:where([mono-slider]) *,\n:where([mono-slider]) *::before,\n:where([mono-slider]) *::after {\n  box-sizing: border-box;\n}\n\n/* the shadow build renders every region and marks an empty one */\n[mono-slider] [mono-empty] {\n  display: none;\n}\n\n[mono-slider][mono-size=\"xs\"] { --_mono-slider-scale: 0.75; }\n[mono-slider][mono-size=\"sm\"] { --_mono-slider-scale: 0.875; }\n[mono-slider][mono-size=\"lg\"] { --_mono-slider-scale: 1.125; }\n[mono-slider][mono-size=\"xl\"] { --_mono-slider-scale: 1.25; }\n[mono-slider][mono-size=\"xxl\"] { --_mono-slider-scale: 1.375; }\n\n/* ── colours: the accent + halo per role (primary is Basecoat's --primary / --ring) ── */\n[mono-slider][mono-color=\"secondary\"] { --_mono-slider-accent-preset: var(--muted-foreground); --_mono-slider-ring-preset: var(--muted-foreground); }\n[mono-slider][mono-color=\"success\"] { --_mono-slider-accent-preset: var(--success); --_mono-slider-ring-preset: var(--success); }\n[mono-slider][mono-color=\"danger\"] { --_mono-slider-accent-preset: var(--destructive); --_mono-slider-ring-preset: var(--destructive); }\n[mono-slider][mono-color=\"warning\"] { --_mono-slider-accent-preset: var(--warning); --_mono-slider-ring-preset: var(--warning); }\n[mono-slider][mono-color=\"info\"] { --_mono-slider-accent-preset: var(--info); --_mono-slider-ring-preset: var(--info); }\n[mono-slider][mono-color=\"teal\"] { --_mono-slider-accent-preset: var(--teal); --_mono-slider-ring-preset: var(--teal); }\n[mono-slider][mono-color=\"purple\"] { --_mono-slider-accent-preset: var(--purple); --_mono-slider-ring-preset: var(--purple); }\n[mono-slider][mono-color=\"neutral\"] { --_mono-slider-accent-preset: var(--neutral); --_mono-slider-ring-preset: var(--neutral); }\n[mono-slider][mono-color=\"dark\"] { --_mono-slider-accent-preset: var(--dark); --_mono-slider-ring-preset: var(--dark); }\n\n/* a validation state recolours the fill + thumb (after the colours, so it wins) */\n[mono-slider][mono-validation-state=\"invalid\"] { --_mono-slider-accent-preset: var(--destructive); --_mono-slider-ring-preset: var(--destructive); }\n[mono-slider][mono-validation-state=\"valid\"] { --_mono-slider-accent-preset: var(--success); --_mono-slider-ring-preset: var(--success); }\n[mono-slider][mono-validation-state=\"warning\"] { --_mono-slider-accent-preset: var(--warning); --_mono-slider-ring-preset: var(--warning); }\n\n/* =========================================\n   Label row — the label, and the value at its end (EJI ONE `.eji-range__row`)\n   ========================================= */\n\n/* basecoat@1.0.2 styles/vega.css .field > label, .label — flex items-center gap-2 text-sm\n   leading-none font-medium select-none; the row spans so the value can end it */\n:where([mono-slider]) > [mono-label-row] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: calc(var(--mono-spacing) * 4);\n  min-width: 0;\n}\n\n:where([mono-slider]) [mono-label] {\n  display: flex;\n  align-items: center;\n  min-width: 0;\n  gap: var(--mono-input-label-gap, calc(var(--mono-spacing) * 2));\n  font-size: var(--mono-slider-label-font-size, var(--mono-input-range-label-font-size, var(--mono-input-label-font-size, var(--mono-text-sm))));\n  line-height: var(--mono-slider-label-line-height, var(--mono-input-range-label-line-height, var(--mono-input-label-line-height, 1)));\n  font-weight: var(--mono-slider-label-font-weight, var(--mono-input-range-label-font-weight, var(--mono-input-label-font-weight, var(--mono-label-font-weight, var(--mono-font-weight-medium)))));\n  color: var(--mono-slider-label-color, var(--mono-input-range-label-color, var(--_mono-slider-text)));\n  user-select: none;\n}\n\n:where([mono-slider]) [mono-required-mark] {\n  color: var(--destructive);\n}\n\n/* the label ⓘ (`tooltip` prop) — same as mono-input's */\n:where([mono-slider]) [mono-label] > [mono-label-tooltip] {\n  display: inline-flex;\n  flex: none;\n  align-items: center;\n  justify-content: center;\n  font-size: var(--mono-input-label-tooltip-size, 1.1em);\n  color: var(--mono-input-label-tooltip-color, currentColor);\n  opacity: var(--mono-input-label-tooltip-opacity, 0.6);\n  border-radius: 9999px;\n  cursor: help;\n  pointer-events: auto;\n  outline: none;\n  transition: opacity 150ms ease;\n\n  &:is(:hover, :focus-visible) {\n    opacity: 1;\n  }\n  &:focus-visible {\n    outline: 2px solid currentColor;\n    outline-offset: 2px;\n  }\n  & > [mono-icon] {\n    width: 1em;\n    height: 1em;\n  }\n}\n\n/* EXTENSION — the value readout (EJI ONE `.eji-range__val`); tabular so it does not shimmer */\n:where([mono-slider]) [mono-slider-value] {\n  flex: none;\n  font-family: var(--mono-slider-value-font-family, var(--mono-input-range-value-font-family, inherit));\n  font-size: var(--mono-slider-value-font-size, var(--mono-input-range-value-font-size, var(--mono-slider-label-font-size, var(--mono-input-range-label-font-size, var(--mono-input-label-font-size, var(--mono-text-sm))))));\n  font-weight: var(--mono-slider-value-font-weight, var(--mono-input-range-value-font-weight, var(--mono-font-weight-medium)));\n  line-height: var(--mono-slider-label-line-height, var(--mono-input-range-label-line-height, var(--mono-input-label-line-height, 1)));\n  font-variant-numeric: tabular-nums;\n  color: var(--mono-slider-value-color, var(--mono-input-range-value-color, var(--_mono-slider-muted)));\n  white-space: nowrap;\n  user-select: none;\n}\n\n/* no label: the readout follows the control, in reserved room */\n:where([mono-slider]) > [mono-slider-field] > [mono-slider-value] {\n  min-width: var(--mono-slider-value-min-width, var(--mono-input-range-value-min-width, 3ch));\n  text-align: end;\n}\n\n/* =========================================\n   Field + control\n   ========================================= */\n\n:where([mono-slider]) > [mono-slider-field] {\n  display: flex;\n  align-items: center;\n  gap: calc(var(--mono-spacing) * 3);\n  min-width: 0;\n}\n\n/* basecoat@1.0.2 components/range.css .field > input[type='range'], .input[type='range'] — flex appearance-none\n   items-center p-0 outline-none disabled:pointer-events-none disabled:opacity-50 */\n/* basecoat@1.0.2 styles/vega.css .field > input[type='range'], .input[type='range'] — h-5 (the box), --slider-track-height,\n   --slider-thumb-size; mono: the box also grows to fit a taller thumb */\n:where([mono-slider]) [mono-slider-control] {\n  position: relative;\n  flex: 1 1 auto;\n  min-width: 0;\n  height: var(--_mono-slider-box);\n  color: var(--_mono-slider-accent);\n  cursor: pointer;\n  touch-action: none;\n  user-select: none;\n  -webkit-tap-highlight-color: transparent;\n}\n\n/* room for mark labels under the track */\n[mono-slider][mono-marks-labelled] [mono-slider-control] {\n  margin-block-end: calc(var(--mono-slider-mark-label-gap, calc(var(--mono-spacing) * 1.5)) + var(--mono-slider-mark-label-line-height, 1rem));\n}\n\n/* =========================================\n   Track — the rail, cut into pieces at every thumb\n   ========================================= */\n\n/* basecoat@1.0.2 styles/vega.css :is(.field > input[type='range'], .input[type='range'])::-webkit-slider-runnable-track — bg-muted h-1.5\n   rounded-full (+ components/range.css: the --primary / --muted gradient stop, here one piece each) */\n:where([mono-slider]) [mono-slider-track] {\n  position: absolute;\n  inset-inline: 0;\n  top: 50%;\n  height: var(--_mono-slider-track-h);\n  margin-top: calc(var(--_mono-slider-track-h) / -2);\n}\n\n:where([mono-slider]) [mono-slider-piece] {\n  /* piece ends: a thumb centre, or the very end of the rail */\n  --_x0: calc(var(--_mono-slider-along) / 2 + (100% - var(--_mono-slider-along)) * var(--a));\n  --_x1: calc(var(--_mono-slider-along) / 2 + (100% - var(--_mono-slider-along)) * var(--b));\n  --_cs: 0px;\n  --_ce: 0px;\n  position: absolute;\n  inset-block: 0;\n  inset-inline-start: calc(var(--_x0) + var(--_cs));\n  inline-size: max(0px, calc(var(--_x1) - var(--_x0) - var(--_cs) - var(--_ce)));\n  border-radius: var(--_mono-slider-track-radius);\n  background: var(--_mono-slider-track-bg);\n}\n:where([mono-slider]) [mono-slider-piece]:not([mono-cut-start]) { --_x0: 0%; }\n:where([mono-slider]) [mono-slider-piece]:not([mono-cut-end]) { --_x1: 100%; }\n:where([mono-slider]) [mono-slider-piece][mono-filled] {\n  background: var(--_mono-slider-fill);\n}\n\n/* joins at a thumb are square unless `track-gap` opens them (then each piece is a\n   whole rounded bar, Material 3's look) */\n[mono-slider]:not([mono-track-gap]) [mono-slider-piece][mono-cut-start] {\n  border-start-start-radius: 0;\n  border-end-start-radius: 0;\n}\n[mono-slider]:not([mono-track-gap]) [mono-slider-piece][mono-cut-end] {\n  border-start-end-radius: 0;\n  border-end-end-radius: 0;\n}\n[mono-slider][mono-track-gap] [mono-slider-piece][mono-cut-start] { --_cs: var(--_mono-slider-cut); }\n[mono-slider][mono-track-gap] [mono-slider-piece][mono-cut-end] { --_ce: var(--_mono-slider-cut); }\n\n/* =========================================\n   Thumb\n   ========================================= */\n\n/* basecoat@1.0.2 styles/vega.css :is(.field > input[type='range'], .input[type='range'])::-webkit-slider-thumb — border-primary ring-ring/50\n   size-4 rounded-full border bg-white shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4;\n   mono: the three box-shadow slots of mono-input's range — a resting ring, the halo, the shadow */\n:where([mono-slider]) [mono-slider-thumb] {\n  --_halo: 0 0 #0000;\n  position: absolute;\n  z-index: 1;\n  top: 50%;\n  inset-inline-start: calc(var(--_mono-slider-along) / 2 + (100% - var(--_mono-slider-along)) * var(--p));\n  width: var(--_mono-slider-along);\n  height: var(--_mono-slider-across);\n  margin-top: calc(var(--_mono-slider-across) / -2);\n  margin-inline-start: calc(var(--_mono-slider-along) / -2);\n  border: var(--mono-slider-thumb-border-width, var(--mono-input-range-thumb-border-width, 1px)) solid\n    var(--mono-slider-thumb-border-color, var(--mono-input-range-thumb-border-color, currentColor));\n  border-radius: var(--mono-slider-thumb-radius, var(--mono-input-range-thumb-radius, 9999px));\n  background: var(--mono-slider-thumb-bg, var(--mono-input-range-thumb-bg, #fff));\n  box-shadow:\n    0 0 0 var(--mono-slider-thumb-ring-width, var(--mono-input-range-thumb-ring-width, 0px))\n      var(--mono-slider-thumb-ring-color, var(--mono-input-range-thumb-ring-color, transparent)),\n    var(--_halo),\n    var(--mono-slider-thumb-shadow, var(--mono-input-range-thumb-shadow, var(--mono-shadow-sm)));\n  outline: none;\n  transition-property: color, box-shadow, background-color, border-color;\n  transition-timing-function: var(--mono-ease);\n  transition-duration: var(--mono-duration);\n}\n\n/* the last-touched thumb rides on top, so a stack lifts the one being moved */\n:where([mono-slider]) [mono-slider-thumb][mono-active] {\n  z-index: 2;\n}\n\n/* focus-visible:ring-4 focus-visible:outline-hidden; a drag keeps the halo on */\n:where([mono-slider]) [mono-slider-thumb]:is(:focus-visible, [mono-dragging]) {\n  --_halo: 0 0 0 var(--mono-slider-ring-width, var(--mono-input-range-ring-width, 4px)) var(--_mono-slider-ring-c);\n}\n\n/* hover:ring-4 */\n@media (hover: hover) {\n  [mono-slider]:not([mono-disabled], [mono-readonly]) [mono-slider-thumb]:hover:not(:focus-visible, [mono-dragging]) {\n    --_halo: 0 0 0 var(--mono-slider-hover-ring-width, var(--mono-input-range-hover-ring-width, var(--mono-slider-ring-width, var(--mono-input-range-ring-width, 4px)))) var(--_mono-slider-ring-c);\n  }\n}\n\n/* =========================================\n   EXTENSION — marks\n   ========================================= */\n\n:where([mono-slider]) [mono-slider-marks] {\n  position: absolute;\n  inset: 0;\n  pointer-events: none;\n}\n\n:where([mono-slider]) [mono-slider-mark] {\n  --_size: var(--mono-slider-mark-size, max(4px, calc(var(--_mono-slider-track-h) * 0.5)));\n  position: absolute;\n  top: 50%;\n  inset-inline-start: calc(var(--_mono-slider-along) / 2 + (100% - var(--_mono-slider-along)) * var(--p));\n  width: var(--_size);\n  height: var(--_size);\n  margin-top: calc(var(--_size) / -2);\n  margin-inline-start: calc(var(--_size) / -2);\n  border-radius: 9999px;\n  background: var(--mono-slider-mark-color, color-mix(in oklab, var(--_mono-slider-muted) 55%, transparent));\n}\n\n:where([mono-slider]) [mono-slider-mark][mono-active] {\n  background: var(--mono-slider-mark-active-color, color-mix(in oklab, var(--primary-foreground) 85%, transparent));\n}\n\n:where([mono-slider]) [mono-slider-mark-label] {\n  position: absolute;\n  top: calc(var(--_mono-slider-box) / 2 + var(--mono-slider-mark-label-gap, calc(var(--mono-spacing) * 1.5)));\n  left: 50%;\n  translate: -50% 0;\n  font-size: var(--mono-slider-mark-label-font-size, var(--mono-text-xs));\n  line-height: var(--mono-slider-mark-label-line-height, 1rem);\n  font-weight: var(--mono-slider-mark-label-font-weight, var(--mono-font-weight-normal));\n  color: var(--mono-slider-mark-label-color, var(--_mono-slider-muted));\n  white-space: nowrap;\n}\n\n/* =========================================\n   EXTENSION — the value bubble on each thumb (shadcn's tooltip: bg-foreground text-background)\n   ========================================= */\n\n:where([mono-slider]) [mono-slider-tooltip] {\n  position: absolute;\n  left: 50%;\n  bottom: calc(100% + var(--mono-slider-tooltip-offset, calc(var(--mono-spacing) * 2)));\n  translate: -50% 0;\n  padding: calc(var(--mono-spacing) * 0.5) calc(var(--mono-spacing) * 2);\n  border-radius: var(--mono-slider-tooltip-radius, var(--mono-radius-md));\n  background: var(--mono-slider-tooltip-bg, var(--foreground));\n  color: var(--mono-slider-tooltip-color, var(--background));\n  font-family: var(--mono-slider-tooltip-font-family, inherit);\n  font-size: var(--mono-slider-tooltip-font-size, var(--mono-text-xs));\n  line-height: var(--mono-slider-tooltip-line-height, 1rem);\n  font-weight: var(--mono-slider-tooltip-font-weight, var(--mono-font-weight-medium));\n  font-variant-numeric: tabular-nums;\n  white-space: nowrap;\n  pointer-events: none;\n  opacity: 0;\n  visibility: hidden;\n  transition: opacity var(--mono-duration) var(--mono-ease), visibility var(--mono-duration);\n\n  /* the arrow */\n  &::after {\n    content: '';\n    position: absolute;\n    top: 100%;\n    left: 50%;\n    width: 0.5rem;\n    height: 0.25rem;\n    translate: -50% 0;\n    background: inherit;\n    clip-path: polygon(0 0, 100% 0, 50% 100%);\n  }\n}\n\n/* `value-tooltip=\"always\"`: the bubbles are permanent, so the label row must not sit under them */\n[mono-slider][mono-value-tooltip=\"always\"]:not([mono-type=\"vertical\"]) [mono-slider-control] {\n  margin-block-start: max(0px, calc(var(--mono-slider-tooltip-line-height, 1rem) + var(--mono-spacing) * 3 + var(--mono-slider-tooltip-offset, calc(var(--mono-spacing) * 2)) - (var(--_mono-slider-box) - var(--_mono-slider-across)) / 2));\n}\n\n/* `value-tooltip=\"auto\"`: on focus, while dragging, and on hover */\n:where([mono-slider]) [mono-slider-thumb]:is(:focus-visible, [mono-dragging]) > [mono-slider-tooltip],\n[mono-slider][mono-value-tooltip=\"always\"] [mono-slider-tooltip] {\n  opacity: 1;\n  visibility: visible;\n}\n@media (hover: hover) {\n  [mono-slider]:not([mono-disabled]) [mono-slider-thumb]:hover > [mono-slider-tooltip] {\n    opacity: 1;\n    visibility: visible;\n  }\n}\n\n/* =========================================\n   EXTENSION — type=\"vertical\": the same parts with the axes swapped, min at the bottom\n   ========================================= */\n\n[mono-slider][mono-type=\"vertical\"] {\n  width: auto;\n}\n\n[mono-slider][mono-type=\"vertical\"] > [mono-slider-field] {\n  flex-direction: column;\n  align-items: flex-start;\n}\n\n[mono-slider][mono-type=\"vertical\"] [mono-slider-control] {\n  flex: none;\n  width: var(--_mono-slider-box);\n  height: var(--_mono-slider-length, var(--mono-slider-length, 200px));\n}\n\n[mono-slider][mono-type=\"vertical\"][mono-marks-labelled] [mono-slider-control] {\n  margin-block-end: 0;\n}\n\n[mono-slider][mono-type=\"vertical\"] [mono-slider-track] {\n  inset-inline: auto;\n  inset-block: 0;\n  left: 50%;\n  top: 0;\n  width: var(--_mono-slider-track-h);\n  height: auto;\n  margin-top: 0;\n  margin-left: calc(var(--_mono-slider-track-h) / -2);\n}\n\n[mono-slider][mono-type=\"vertical\"] [mono-slider-piece] {\n  --_x0: calc(var(--_mono-slider-along) / 2 + (100% - var(--_mono-slider-along)) * var(--a));\n  --_x1: calc(var(--_mono-slider-along) / 2 + (100% - var(--_mono-slider-along)) * var(--b));\n  inset-block: auto;\n  inset-inline: 0;\n  bottom: calc(var(--_x0) + var(--_cs));\n  inline-size: auto;\n  block-size: max(0px, calc(var(--_x1) - var(--_x0) - var(--_cs) - var(--_ce)));\n}\n[mono-slider][mono-type=\"vertical\"] [mono-slider-piece]:not([mono-cut-start]) { --_x0: 0%; }\n[mono-slider][mono-type=\"vertical\"] [mono-slider-piece]:not([mono-cut-end]) { --_x1: 100%; }\n/* vertical joins: the piece's START is its bottom, its END its top */\n[mono-slider][mono-type=\"vertical\"]:not([mono-track-gap]) [mono-slider-piece][mono-cut-start] {\n  border-radius: var(--_mono-slider-track-radius);\n  border-bottom-left-radius: 0;\n  border-bottom-right-radius: 0;\n}\n[mono-slider][mono-type=\"vertical\"]:not([mono-track-gap]) [mono-slider-piece][mono-cut-end] {\n  border-top-left-radius: 0;\n  border-top-right-radius: 0;\n}\n[mono-slider][mono-type=\"vertical\"]:not([mono-track-gap]) [mono-slider-piece][mono-cut-start][mono-cut-end] {\n  border-radius: 0;\n}\n\n[mono-slider][mono-type=\"vertical\"] [mono-slider-thumb],\n[mono-slider][mono-type=\"vertical\"] [mono-slider-mark] {\n  /* the logical reset goes FIRST: written after `left` it would reset it too */\n  inset-inline-start: auto;\n  top: auto;\n  left: 50%;\n  bottom: calc(var(--_mono-slider-along) / 2 + (100% - var(--_mono-slider-along)) * var(--p));\n  margin: 0;\n}\n[mono-slider][mono-type=\"vertical\"] [mono-slider-thumb] {\n  width: var(--_mono-slider-across);\n  height: var(--_mono-slider-along);\n  margin-left: calc(var(--_mono-slider-across) / -2);\n  margin-bottom: calc(var(--_mono-slider-along) / -2);\n}\n[mono-slider][mono-type=\"vertical\"] [mono-slider-mark] {\n  margin-left: calc(var(--_size) / -2);\n  margin-bottom: calc(var(--_size) / -2);\n}\n[mono-slider][mono-type=\"vertical\"] [mono-slider-mark-label] {\n  top: 50%;\n  left: calc(var(--_mono-slider-box) / 2 + var(--mono-slider-mark-label-gap, calc(var(--mono-spacing) * 2)));\n  translate: 0 -50%;\n}\n[mono-slider][mono-type=\"vertical\"] [mono-slider-tooltip] {\n  left: auto;\n  right: calc(100% + var(--mono-slider-tooltip-offset, calc(var(--mono-spacing) * 2)));\n  bottom: 50%;\n  translate: 0 50%;\n\n  &::after {\n    top: 50%;\n    left: 100%;\n    width: 0.25rem;\n    height: 0.5rem;\n    translate: 0 -50%;\n    clip-path: polygon(0 0, 100% 50%, 0 100%);\n  }\n}\n\n/* =========================================\n   States\n   ========================================= */\n\n/* in-data-[disabled=true]:opacity-50 */\n[mono-slider][mono-disabled] > :is([mono-label-row], [mono-slider-field]) {\n  opacity: 0.5;\n}\n[mono-slider][mono-disabled] [mono-slider-control] {\n  pointer-events: none;\n  cursor: not-allowed;\n}\n\n[mono-slider][mono-readonly] [mono-slider-control] {\n  cursor: default;\n}\n\n[mono-slider][mono-dragging] [mono-slider-control] {\n  cursor: grabbing;\n}\n\n/* =========================================\n   Message — helper / validation text (mono-input's)\n   ========================================= */\n\n:where([mono-slider]) > [mono-message-wrap]:not(:has([mono-message]:not([mono-empty]))) {\n  display: none;\n}\n\n:where([mono-slider]) [mono-message] {\n  font-size: var(--mono-input-message-font-size, var(--mono-text-sm));\n  line-height: var(--mono-input-message-line-height, var(--mono-leading-normal));\n  color: var(--_mono-slider-muted);\n}\n:where([mono-slider]) [mono-message=\"invalid\"] { color: var(--destructive); }\n:where([mono-slider]) [mono-message=\"valid\"] { color: var(--success); }\n:where([mono-slider]) [mono-message=\"warning\"] { color: var(--warning); }\n\n[mono-slider][mono-validation-state=\"invalid\"] [mono-label] {\n  color: var(--destructive);\n}\n\n@media (prefers-reduced-motion: reduce) {\n  :where([mono-slider]) :is([mono-slider-thumb], [mono-slider-tooltip]) {\n    transition: none;\n  }\n}\n";

//#endregion
//#region src/components/slider/mono-slider.shadow.ts
let MonoSliderShadow = class MonoSliderShadow extends withShadowUtilityStyles(MonoSliderCore(LitElement)) {
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [unsafeCSS(toShadowCss(slider_css_raw_default + field_tooltip_css_raw_default, { host: "mono-slider" }))];
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
	firstUpdated(changed) {
		super.firstUpdated?.(changed);
		for (const name of ["label", "helper"]) {
			const slot = this.renderRoot.querySelector(`slot[name="${name}"]`);
			this._setSlotState(name, this._slotHasContent(slot));
		}
	}
	_slotHasContent(slot) {
		return !!slot && slot.assignedNodes({ flatten: true }).some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? "").trim());
	}
	_setSlotState(name, has) {
		if (name === "label" && this._hasLabelSlotState !== has) this._hasLabelSlotState = has;
		else if (name === "helper" && this._hasHelperSlotState !== has) this._hasHelperSlotState = has;
	}
	_onSlotChange(name, event) {
		this._setSlotState(name, this._slotHasContent(event.target));
	}
	_renderLabelText() {
		return html`<slot name="label" @slotchange=${(e) => this._onSlotChange("label", e)}>${this.label}</slot>`;
	}
	/** Always rendered (the slot must exist to be scanned); hidden with `mono-empty` when empty. */
	_renderLabel() {
		return html`
      <div mono-label-row ?mono-empty=${!this._hasLabel}>
        <label class=${this._cls("mono-slider-label", "label")} mono-label id=${`${this._sliderId}-label`}>
          ${this._renderLabelText()}
          ${this.required ? html`<span class=${this._cls("mono-slider-required", "required")} mono-required-mark>*</span>` : nothing}
          ${this._tooltip.render()}
        </label>
        ${this.showValue && this._hasLabel ? this._renderReadout() : nothing}
      </div>
    `;
	}
	_renderMessage() {
		const base = this._cls("mono-slider-message", "message");
		if (this.validationMessage) {
			const s = this._resolvedValidationState;
			return html`<div class=${`${base} ${s}`} mono-message=${s} role=${s === "invalid" ? "alert" : nothing}>${this.validationMessage}</div>`;
		}
		if (this.errorMessage) return html`<div class=${`${base} invalid`} mono-message="invalid" role="alert">${this.errorMessage}</div>`;
		if (this.successMessage) return html`<div class=${`${base} valid`} mono-message="valid">${this.successMessage}</div>`;
		return html`
      <div class=${`${base} helper`} mono-message="helper" ?mono-empty=${!this.helperText && !this._hasHelperSlotState}>
        <slot name="helper" @slotchange=${(e) => this._onSlotChange("helper", e)}>${this.helperText}</slot>
      </div>
    `;
	}
};
MonoSliderShadow = __decorate([customElement("mono-shadow-slider")], MonoSliderShadow);

//#endregion
export { MonoSliderCore, MonoSliderShadow, coerceNumbers, fromRatio, markPoints, moveRun, moveThumb, nearestThumb, normalise, resolveScale, snap, stepFrom, thumbBounds, toPercent, trackPieces };