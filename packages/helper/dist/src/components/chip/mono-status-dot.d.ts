import { LitElement, TemplateResult } from 'lit';
import { StatusDotState } from './chip-types.js';
/**
 * `mono-status-dot` — a small status indicator. Already a real shadow-DOM
 * LitElement (default render root + `static styles`, native `<slot>`), so it is
 * SSR-compatible as-is and shared verbatim by BOTH the light (`@mono-lit/helper/ui/chip`)
 * and shadow (`@mono-lit/helper/ui/shadow/chip`) chip builds. It lives in its own
 * module so the shadow chip build can register it WITHOUT importing the light
 * `mono-chip` (which would collide with the shadow `mono-chip` class).
 *
 * It keeps the SAME `mono-status-dot` tag in both builds (it has no light/shadow
 * variant — it is always a shadow-DOM element), so its registration is guarded
 * (see bottom of file): whichever chip build loads first wins, and a page that
 * loads both light + shadow chip won't throw a "already defined" registry error.
 */
export declare class MonoStatusDot extends LitElement {
    static styles: import('lit').CSSResult[];
    constructor();
    state: StatusDotState;
    pulse: boolean;
    label?: string;
    color?: string;
    private _statusElement?;
    private get _statusClasses();
    private get _statusStyle();
    protected render(): TemplateResult;
    focus(): void;
    blur(): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-status-dot': MonoStatusDot;
    }
}
