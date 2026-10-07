/**
 * Shared `visible` / `visibleType` support for the controls `monoForm` drives.
 *
 * Lives here rather than in `form/form-types.ts` because that module already
 * imports all ten component `*-types.ts` files — declaring the shared props
 * there and importing them back would be circular.
 */
/**
 * How a hidden control disappears.
 *
 * - `'none'` — `display: none`. The control is removed from layout, so it leaves
 *   no gap in a grid/flex form.
 * - `'invisible'` — `visibility: hidden`. The control keeps its space, so
 *   toggling it doesn't shift everything around it.
 */
export type MonoVisibleType = 'invisible' | 'none';
/** The two visibility props shared by every form-driven control. */
export interface VisibilityProps {
    /** Whether the control is shown. Defaults to `true`. */
    visible?: boolean;
    /** How it hides when `visible` is `false`. Defaults to `'none'`. */
    visibleType?: MonoVisibleType;
}
/**
 * Write (or clear) the hide style on a HOST element.
 *
 * Applied to the host, not to the rendered root: light builds render into `this`,
 * so hiding the inner root would leave the `<mono-*>` host itself as a flex/grid
 * item still occupying its cell. Targeting the host also means one code path
 * covers the light build, the shadow build and whatever layout wraps them.
 *
 * Only ever touches the single property it owns, and only via `removeProperty` —
 * never a blanket `cssText` reset — so an inline style the consumer put on the
 * host survives a hide/show round trip.
 */
export declare function applyVisibility(host: HTMLElement, visible: boolean, type: MonoVisibleType): void;
