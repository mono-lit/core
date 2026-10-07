import { LitElement, TemplateResult } from 'lit';
import { MonoTableControllerCoreInterface } from './table-controller-core.js';
import { Constructor } from '../../composables/hybird-prop';
export type TablePagingType = 'standard' | 'infinity-scroll' | 'virtual-scroll';
/** Public surface added by the paging core mixin. */
export declare class MonoTablePagingCoreInterface extends MonoTableControllerCoreInterface {
    type: TablePagingType;
    siblings: number;
    simple: boolean;
    size?: number;
    rowHeight: number;
    scrollTarget?: string;
    threshold: number;
    overscan: number;
    prevIcon: string;
    nextIcon: string;
    protected _renderIcon(direction: 'prev' | 'next'): TemplateResult;
}
/** Defaults the shadow build tests against before swapping in its inline SVG. */
export declare const DEFAULT_PREV_ICON = "i-mdi-chevron-left";
export declare const DEFAULT_NEXT_ICON = "i-mdi-chevron-right";
export declare const MonoTablePagingCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoTablePagingCoreInterface> & T;
