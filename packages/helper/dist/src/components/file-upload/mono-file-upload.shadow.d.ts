import { LitElement, TemplateResult } from 'lit';
import { FileUploadItem } from './file-upload-types.js';
declare const MonoFileUploadShadow_base: import('../../composables/hybird-prop').Constructor<import('./file-upload-core.js').MonoFileUploadCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-file-upload` (the opt-in SSR build,
 * `@mono-lit/helper/ui/shadow/file-upload`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`mono-file-upload`→`:host`). The
 * dropzone (label / title / subtitle / icon / `<input type=file>`) renders
 * server-side; the file LIST is inherently client-only (`File`/blob previews).
 * Icons are inline SVG (the `i-mdi-*` UnoCSS classes can't paint inside a shadow
 * root): default dropzone glyph, the remove ✕, and a generic file-type thumb glyph
 * (image files still show their `previewUrl`). A native `<slot name="icon">`
 * overrides the dropzone icon; `<slot name="title">` / `<slot name="subtitle">`
 * override the two text lines (the props are their fallback content). Custom iconify `icon`/`removeIcon` PROP values
 * degrade to invisible in shadow (use the slot). Interactivity (picker click /
 * drag-drop / remove) needs the first client update to flush — hence the
 * defer-hydration poll. Shares all logic with the light build via
 * `MonoFileUploadCore`; both register `mono-file-upload`, so a document loads one.
 */
export declare class MonoFileUploadShadow extends MonoFileUploadShadow_base {
    static styles: import('lit').CSSResult[];
    connectedCallback(): void;
    firstUpdated(changed: Map<string, unknown>): void;
    protected updated(changed: Map<string, unknown>): void;
    /**
     * Slot presence from `assignedNodes()` (DSD assigns slotted content at parse
     * time, so `slotchange` may never fire after upgrade). Only ASSIGNED nodes
     * count — `flatten` would return the prop fallback for an empty slot.
     */
    private _slotHas;
    private _scanSlots;
    protected _useIconSlots(): boolean;
    /** Native slot; the `title` prop is its fallback content (paints with no JS). */
    protected _renderTitle(): TemplateResult;
    /** Native slot; the `subtitle` prop is its fallback content. */
    protected _renderSubtitle(): TemplateResult;
    protected _renderDropzoneIcon(): TemplateResult;
    protected _renderDefaultGlyph(): TemplateResult;
    protected _renderRemoveIcon(): TemplateResult;
    protected _renderThumbGlyph(item: FileUploadItem): TemplateResult;
    /**
     * An `i-mdi-*` class as inline SVG, or `undefined` when that glyph is not
     * bundled (`scripts/mdi-glyphs.mjs` lists what is). The light build masks the
     * class through the page's UnoCSS, which cannot cross the shadow boundary.
     */
    private _renderIconifyGlyph;
}
export {};
