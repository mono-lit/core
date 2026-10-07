import { LitElement, TemplateResult } from 'lit';
declare const MonoAccordionShadow_base: import('../../composables/hybird-prop').Constructor<import('./accordion-core.js').MonoAccordionCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-accordion` (the opt-in SSR build,
 * `@mono-lit/helper/ui/shadow/accordion`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`mono-accordion`→`:host`).
 * Slotting uses native `<slot>`. During SSR the element has no light children, so
 * the slot-presence flags default `false` (hydration-matching) and the decorative
 * regions render `mono-empty` (hidden by accordion.css itself); real presence is
 * corrected in `firstUpdated()` (DSD assigns slotted content at parse time →
 * `slotchange` doesn't fire after upgrade → scan `assignedNodes()`; `slotchange` is
 * kept for later dynamic changes). `<slot name="label">${label}</slot>` carries the
 * prop text as native fallback so it shows with no JS. The body region is always
 * visible so main content never flashes. Shares all logic with the light build via
 * `MonoAccordionCore`. Both register `mono-accordion`, so a document loads one.
 */
export declare class MonoAccordionShadow extends MonoAccordionShadow_base {
    static styles: import('lit').CSSResult[];
    connectedCallback(): void;
    firstUpdated(changed: Map<string, unknown>): void;
    /**
     * Presence of a region that may also answer to an old name (`label` →
     * `title`, `description` → `subtitle`): the union of both slots.
     */
    private _regionHasContent;
    /**
     * `<slot name="title"><slot name="label">fallback</slot></slot>` — a slot's
     * children are its fallback, shown only when nothing is assigned to it, so the
     * canonical name wins and the old name is reached exactly when it is empty.
     * Both slots recompute presence from BOTH names (an empty outer `slotchange`
     * must not clear a filled inner one).
     */
    private _renderAliasedSlot;
    private _slotFor;
    /**
     * Whether something is ASSIGNED to this slot. Not `assignedNodes({ flatten:
     * true })`: for a slot with nothing assigned, flatten returns its FALLBACK
     * content — and `<slot name="header">`'s fallback is the title/subtitle
     * markup, so every accordion looked like it had a header slot and hid its
     * icon. The old alias names (`label` / `description`) are nested slots of
     * their own and are checked separately by the caller.
     */
    private _slotHasContent;
    private _setSlotState;
    private _onSlotChange;
    private _renderIcon;
    private _renderText;
    private _renderActions;
    private _renderBody;
    /** Body presence: the named `body` slot or the default slot. */
    private _bodyHasContent;
    protected render(): TemplateResult;
}
export {};
