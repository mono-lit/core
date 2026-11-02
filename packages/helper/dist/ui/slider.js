import { f as toCssSize, g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { a as defineHybridPropAliases, i as defineHybridPropAlias, r as booleanStringConverter, t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "../mono-event-BPku9HpS.js";
import { s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { t as MonoFormControlCore } from "../form-control-core-CRZPZ1ru.js";
import { a as parseFormat, t as applyFormat } from "../input-format-GrRCJBqV.js";
import { n as cssPart } from "../css-class-B6Tc_MAx.js";
import { t as FieldTooltipController } from "../field-tooltip-Csk4s2ve.js";
import { LitElement, html, isServer, nothing } from "lit";
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
//#region src/components/slider/mono-slider.ts
let MonoSlider = class MonoSlider extends MonoSliderCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotLabel = [];
		this._slotHelper = [];
	}
	createRenderRoot() {
		return this;
	}
	/** Capture `slot="label|helper"` children. Safe to re-run: captured nodes lose `slot` and leave the host. */
	_captureSlots() {
		this._slotObserver?.disconnect();
		const captured = /* @__PURE__ */ new Set();
		for (const node of monoHostChildNodes(this)) {
			if (!(node instanceof Element)) continue;
			const name = node.getAttribute("slot");
			if (name === "label") this._slotLabel.push(node);
			else if (name === "helper") this._slotHelper.push(node);
			else continue;
			node.removeAttribute("slot");
			captured.add(node);
		}
		if (captured.size) {
			this._hasLabelSlotState = this._slotLabel.length > 0;
			this._hasHelperSlotState = this._slotHelper.length > 0;
			for (const node of captured) if (node.parentNode === this) this.removeChild(node);
		}
		if (this._slotObserver && this.isConnected) this._slotObserver.observe(this, { childList: true });
	}
	connectedCallback() {
		super.connectedCallback();
		if (!isServer && !this._slotObserver && typeof MutationObserver !== "undefined") this._slotObserver = new MutationObserver(() => this._captureSlots());
		this._captureSlots();
		if (this.isConnected) this.performUpdate();
	}
	disconnectedCallback() {
		this._slotObserver?.disconnect();
		super.disconnectedCallback();
	}
	updated(changed) {
		super.updated(changed);
		this._placeSlot("label", this._slotLabel);
		this._placeSlot("helper", this._slotHelper);
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const target = this.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
MonoSlider = __decorate([customElement("mono-slider")], MonoSlider);

//#endregion
export { MonoSlider, coerceNumbers, fromRatio, markPoints, moveRun, moveThumb, nearestThumb, normalise, resolveScale, snap, stepFrom, thumbBounds, toPercent, trackPieces };