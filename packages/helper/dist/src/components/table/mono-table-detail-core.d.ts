import { LitElement, TemplateResult } from 'lit';
import { MonoTableControllerCoreInterface } from './table-controller-core.js';
import { Constructor } from '../../composables/hybird-prop';
/** `detail` of the `toggle` / `open` / `close` events `<mono-table-detail>` emits (and of `mno-click`, the kept alias). */
export interface TableDetailClickEventDetail {
    /** The state the detail moved TO. */
    open: boolean;
    /** `data-row-key` of the row the toggle sits in, when the consumer set one. */
    rowKey: string | null;
    /** The chevron click that caused it; absent for `toggle()` / `expandAll()`. */
    sourceEvent?: Event;
}
export type TableDetailClickEvent = CustomEvent<TableDetailClickEventDetail>;
/** Events emitted by `<mono-table-detail>` (feeds the generated Vue types). */
export interface TableDetailEvents {
    toggle: TableDetailClickEvent;
    open: TableDetailClickEvent;
    close: TableDetailClickEvent;
    'mno-click': TableDetailClickEvent;
    mnoClick: TableDetailClickEvent;
    'mno-open': TableDetailClickEvent;
    mnoOpen: TableDetailClickEvent;
    'mno-close': TableDetailClickEvent;
    mnoClose: TableDetailClickEvent;
}
/** Public surface added by the detail core mixin. */
export declare class MonoTableDetailCoreInterface extends MonoTableControllerCoreInterface {
    icon: string;
    iconExpanded: string;
    open: boolean;
    stayOpen: boolean;
    disabled: boolean;
    label?: string;
    toggle(force?: boolean): void;
    /** The chevron — overridden by the shadow build, which can't use icon classes. */
    protected _renderIcon(): TemplateResult;
}
/**
 * `MonoTableDetailCore` — render-mode-agnostic logic for `mono-table-detail`, the
 * expand/collapse chevron for a table row.
 *
 * **Shape.** The element itself is *only the toggle*: put it in a `<td>` of the
 * row you want expandable and keep authoring the `<tr>` yourself. Everything
 * slotted into it becomes the **panel** — a `<tr class="mono-table-detail-row" mono-detail-row>`
 * with one `<td colspan="…">` that the element inserts into the `<tbody>`
 * immediately after its own row while open, and pulls back out when closed. The
 * `colspan` is recomputed from the parent row's cells on every attach, so it
 * always spans the whole grid.
 *
 * ```html
 * <tr :data-row-key="row.Id">
 *   <td>
 *     <mono-table-detail :control-table.prop="table">
 *       <p>Notes: {{ row.Note }}</p>
 *     </mono-table-detail>
 *   </td>
 *   <td>{{ row.Name }}</td>
 * </tr>
 * ```
 *
 * **Why the panel row is built imperatively.** Lit renders through a `<template>`,
 * and a bare `<tr>` in a non-table parsing context is dropped by the HTML parser —
 * so the row could never come out of `render()`. It is created with
 * `document.createElement` instead, which also means the SAME code path serves the
 * light and the shadow build: in both, the consumer's children are captured off
 * the host and re-parented into the panel cell (a shadow `<slot>` could not
 * project content to a row *outside* the host).
 *
 * **Content is real DOM the consumer owns**, captured through
 * `composables/light-slots`, so Vue interpolation (`{{ row.Note }}`), `v-if`
 * anchors, a whole nested `<table class="mono-table" mono-table>` with its own
 * `controlMonoTable`, and further nested `<mono-table-detail>` elements all work.
 * While closed, the captured nodes stay parked inside the (detached) panel cell
 * rather than orphaned — a captured node with a `null` parent is what crashes
 * Vue's next patch.
 *
 * **Accordion by default.** Opening a row closes the row that was open, scoped to
 * the bound controller — so a nested grid runs its own accordion without
 * disturbing the outer one. **`stay-open` is the exemption**: such a row is
 * skipped by the accordion *and* by `table.detail().collapseAll()`. It is not a
 * lock — its own chevron still closes it. Mark every row `stay-open` to get
 * independent panels back.
 *
 * SSR-safe: every DOM touch is behind `isServer`, so the server renders just the
 * collapsed toggle.
 */
export declare const MonoTableDetailCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoTableDetailCoreInterface> & T;
