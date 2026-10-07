import { ColHTMLAttributes } from "vue"
import type { DxColumn, DxDataGridTypes } from "devextreme-vue/data-grid";

// primitives / built-ins we don't want to recurse into
type BuiltIn = Date | Function | RegExp | Error;

// treat only plain objects (not arrays, not built-ins) as nestable
type IsPlainObject<T> =
    T extends object
    ? T extends BuiltIn ? false
    : T extends readonly any[] ? false
    : true
    : false;

/** "a" | "a.b" | "a.b.c" ... including top-level keys */
type DotKeys<T> =
    T extends object
    ? {
        [K in Extract<keyof T, string>]:
        IsPlainObject<T[K]> extends true
        ? K | `${K}.${DotKeys<T[K]>}`
        : K
    }[Extract<keyof T, string>]
    : never;

/** Optional: value type at a given dot-path */
export type PathValue<T, P extends string> =
    P extends `${infer K}.${infer R}`
    ? K extends keyof T ? PathValue<T[K], R> : never
    : P extends keyof T ? T[P] : never;

// --- Your Col type using DotKeys<T> and allowing extra keys I[number] ---

export type Col<T = any, I extends readonly string[] = []> =
    InstanceType<typeof DxColumn>["$props"] & {
        dataField:
        [keyof T] extends [never]
        ? I[number] | string                       // when T is unknown/empty
        : I[number] | DotKeys<T>;                  // typed dot-paths + extras
        cellTemplate?: [keyof T] extends [never]
        ? string
        : `${Extract<DotKeys<T>, string>}Template` | (string & {}) | ((container: HTMLElement, options: DxDataGridTypes.ColumnCellTemplateData) => void);
        groupCellTemplate?: [keyof T] extends [never]
        ? string
        : `${Extract<DotKeys<T>, string>}GroupTemplate`;
        headerCellTemplate?: [keyof T] extends [never]
        ? string
        : `${Extract<DotKeys<T>, string>}HeaderTemplate`;
        editCellTemplate?: [keyof T] extends [never]
        ? string
        : `${Extract<DotKeys<T>, string>}EditCellTemplate`;
        columns?: Col<T, I>[];
    }

export interface LoopTemplate<T = {}> extends Col {
    items: keyof T extends never ? string[] : (keyof T)[]
}

export interface GroupTemplate {
    name: string,
    code: string
}