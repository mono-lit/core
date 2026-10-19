import { SliderFill } from "./slider-types.js";
//#region src/components/slider/slider-math.d.ts
export interface SliderScale {
  min: number;
  max: number;
  /** Snap interval; 0 = continuous. Ignored when `stops` is set. */
  step: number;
  /** Sorted, de-duplicated, inside [min, max]; null when the slider snaps to `step`. */
  stops: number[] | null;
  minGap: number;
}
export interface SliderScaleInput {
  min?: unknown;
  max?: unknown;
  step?: unknown;
  stops?: unknown;
  minGap?: unknown;
}
/** One stretch of track between two boundaries (the ends, or a thumb). */
export interface SliderPiece {
  /** Start / end along the track, 0–100. */
  from: number;
  to: number;
  /** True when that end is a THUMB (so a `track-gap` cuts it back), false at the track's ends. */
  cutStart: boolean;
  cutEnd: boolean;
  filled: boolean;
}
export interface SliderMarkPoint {
  value: number;
  /** 0–100 along the track. */
  pct: number;
  /** The mark's own label; undefined means "format the value" (when labels are shown at all). */
  label?: string;
  /** True when the mark carried a label (or was given as an object). */
  labelled: boolean;
}
/** Strip float noise (0.1 + 0.2) without losing a fractional step. */
export declare function stripNoise(n: number): number;
/**
 * Anything a consumer (or a framework) might hand over as a value — a number, an array, a JSON
 * string (`"[20,80]"`, what an SSR attribute carries), a comma list (`"20,80"`), a numeric string —
 * as a list of finite numbers. Non-numbers are dropped. `null` when nothing usable is left.
 */
export declare function coerceNumbers(value: unknown): number[] | null;
/** The scale from raw props: defaults 0 / 100 / 1, `max` never below `min`, stops cleaned. */
export declare function resolveScale(input: SliderScaleInput): SliderScale;
/** The allowed value nearest to `v` (a stop, a grid point, or `v` itself when continuous). */
export declare function snap(v: number, scale: SliderScale): number;
/** The smallest allowed value ≥ x (or `max` when none is). */
export declare function ceilTo(x: number, scale: SliderScale): number;
/** The largest allowed value ≤ x (or `min` when none is). */
export declare function floorTo(x: number, scale: SliderScale): number;
/**
 * The values, made valid: each clamped and snapped, sorted, then spread so neighbours are at least
 * `minGap` apart. Thumbs are never dropped — when the gap cannot fit every thumb, they pack
 * against the ends (the forward pass pushes right, the backward pass pulls back under `max`).
 */
export declare function normalise(values: number[], scale: SliderScale): number[];
/** The range thumb `i` may move in: its neighbours ± `minGap` (the BLOCK rule). */
export declare function thumbBounds(values: number[], i: number, scale: SliderScale): {
  lo: number;
  hi: number;
};
/**
 * Move thumb `i` toward `v`: snap, then stop at the neighbours (± gap). Returns a NEW array when
 * the thumb actually moved, the SAME array otherwise — callers use identity to skip no-op events.
 */
export declare function moveThumb(values: number[], i: number, v: number, scale: SliderScale): number[];
/**
 * Shift a whole run of thumbs `[from..to]` by `delta`, keeping their spacing — the drag of a filled
 * segment between two thumbs. The run stops at the track ends and at the thumbs outside it.
 */
export declare function moveRun(values: number[], from: number, to: number, delta: number, scale: SliderScale): number[];
/**
 * The thumb a press at `v` should grab: the nearest one. Thumbs sitting on the same spot (`[2, 2,
 * 3]`) tie — then the press picks by SIDE: a press above the stack takes its LAST thumb, below it
 * the FIRST, so stacked thumbs can always be pulled apart. `dir` (+1 / -1) breaks an exact hit,
 * once the drag has shown which way it is heading.
 */
export declare function nearestThumb(values: number[], v: number, dir?: number): number;
/** True when several thumbs share position `values[i]` (a stack the next drag must split). */
export declare function isStacked(values: number[], i: number): boolean;
/** `v` as a 0–100 position along the track. */
export declare function toPercent(v: number, scale: SliderScale): number;
/** A 0–1 position along the track as a raw (unsnapped) value. */
export declare function fromRatio(ratio: number, scale: SliderScale): number;
/**
 * The track as pieces between its boundaries (the two ends and every thumb), each flagged filled
 * or not by the `fill` mode. Rendering every stretch as its own piece is what lets `track-gap` cut
 * the track back around each thumb, and lets a consumer colour segments one by one.
 */
export declare function trackPieces(values: number[], scale: SliderScale, fill: SliderFill): SliderPiece[];
/** The marks to draw. `true` = one per stop, or per step (only the two ends past ~26 — denser is a texture, not ticks). */
export declare function markPoints(marks: unknown, scale: SliderScale): SliderMarkPoint[];
/**
 * One keyboard step from `v`: `dir` ±1, `big` for PageUp/PageDown. With stops it walks the list
 * (big = a tenth of it, at least one); with a grid it moves a step (big = ten); continuous moves
 * 1% (big = 10%).
 */
export declare function stepFrom(v: number, dir: 1 | -1, big: boolean, scale: SliderScale): number;
//#endregion