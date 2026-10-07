

// use-odata-static.ts
// import {DataSource, CustomStore} from '@mono-lit/devextreme';
import type DataSource from 'devextreme/data/data_source';
import type CustomStore from 'devextreme/data/custom_store';
import { markRaw } from 'vue';

type AnyObj = Record<string, any>;
type DxFilter =
    | [string, '=' | '<>' | '>' | '>=' | '<' | '<=' | 'contains' | 'notcontains' | 'startswith' | 'endswith', any]
    | ['!', DxFilter]
    | [DxFilter, 'and' | 'or', DxFilter]
    | any[]; // (allow nested)

type OdataParams = {
    $filter?: string | DxFilter;
    $orderby?: string;
    $select?: string | string[];
    $skip?: number;
    $top?: number;
    $search?: string;
};

export type UseOdataStaticOpts<T extends AnyObj> = {
    data: T[] | (() => T[]);    // your static array OR a getter function
    key?: keyof T | string;     // default: 'Id'
    params?: OdataParams;       // OData-like params (stringy)
    searchFields?: (keyof T | string)[]; // fields for $search; default: all string fields
    caseInsensitive?: boolean;  // default true (for string compare/search)
    keepKeyOnSelect?: boolean;  // default true (always keep key in $select projection),
    source: {
        DataSource: typeof DataSource,
        CustomStore: typeof CustomStore,
    }
};

type Result<T> = {
    dataSource: DataSource<T>;
    data: T[] | null;
    statusCode: number;
    error: null | { message: string; stack: string; response: any };
};

// ---------- tiny utils ----------
const toArray = <T>(v: T | T[] | undefined): T[] =>
    v == null ? [] : Array.isArray(v) ? v : [v];

const norm = (v: unknown, ci: boolean) =>
    (ci && typeof v === 'string') ? v.toLocaleLowerCase() : v;

const get = (obj: AnyObj, path: string) => {
    if (!obj) return undefined;
    const segs = path.split(/[./]/g).filter(Boolean);
    let cur: any = obj;
    for (const s of segs) {
        if (cur == null) return undefined;
        cur = cur[s];
    }
    return cur;
};

const pick = <T extends AnyObj>(o: T, keys: string[]) => {
    const r: AnyObj = {};
    for (const k of keys) r[k] = o[k as keyof T];
    return r as T;
};

const splitCsv = (s: string) =>
    s.split(',').map(x => x.trim()).filter(Boolean);

const isLogicOp = (v: any): v is 'and' | 'or' =>
    typeof v === 'string' && (v.toLocaleLowerCase() === 'and' || v.toLocaleLowerCase() === 'or');

// ---------- DevExtreme filter evaluator ----------
function evalDxFilter(item: AnyObj, f: DxFilter, ci: boolean): boolean {
    // A predicate, not an expression. DevExtreme passes one for `hideSelectedItems`
    // with `valueExpr: 'this'` (TagBox._dataSourceFilterFunction); without this it
    // falls through the Array guard below and silently matches every row.
    if (typeof f === 'function') return !!(f as any)(item);

    if (!Array.isArray(f) || f.length === 0) return true;

    if (f[0] === '!' && Array.isArray(f[1])) return !evalDxFilter(item, f[1] as DxFilter, ci);

    // GROUP. DevExtreme emits these FLAT and n-ary — SelectionFilterCreator.getExpr()
    // builds `[c1,'or',c2,'or',c3]` — and lets the operator be omitted between operands
    // (implicit 'and'). Reading only `f[0] <op> f[2]` silently drops every term from the
    // 4th element on, which is how a multi-select TagBox over a static datasource loses
    // its 3rd-and-later selected value: the key comes back unresolved (List selection ->
    // _loadSelectedItemsCore -> _loadFilteredData -> store.load) and the widget reverts
    // the checkbox. Walk the whole group instead.
    if (Array.isArray(f[0]) || typeof f[0] === 'function') {
        // 'and' binds tighter than 'or': fold each AND run, then OR the runs together.
        let orAcc = false;
        let andAcc = true;
        let pending: 'and' | 'or' = 'and';
        let seen = false;

        for (const part of f as any[]) {
            if (isLogicOp(part)) { pending = part.toLocaleLowerCase() as 'and' | 'or'; continue; }
            const val = evalDxFilter(item, part as DxFilter, ci);
            if (!seen) { andAcc = val; seen = true; }
            else if (pending === 'and') { andAcc = andAcc && val; }
            else { orAcc = orAcc || andAcc; andAcc = val; }
            pending = 'and';   // an omitted operator means 'and'
        }

        return seen ? (orAcc || andAcc) : true;
    }

    // BINARY. `[field, value]` is DevExtreme shorthand for `[field, '=', value]`; read
    // literally it yields op=<value>, val=undefined and falls to `default: true` below.
    // The `'!'` guard keeps a malformed `['!', x]` on its previous path.
    const [field, op, val] = (f.length === 2 && f[0] !== '!' ? [f[0], '=', f[1]] : f) as any[];
    const raw = get(item, String(field));
    const a = raw;
    const b = val;

    const isNumericLike = (v: any) =>
        typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v)));

    const eq = (x: any, y: any) => {
        if (x == null || y == null) return x === y; // both null/undefined -> equal
        if (isNumericLike(x) || isNumericLike(y)) return Number(x) === Number(y);
        const xs = ci ? String(x).toLocaleLowerCase() : String(x);
        const ys = ci ? String(y).toLocaleLowerCase() : String(y);
        return xs === ys;
    };

    const cmp = (x: any, y: any, rel: '>' | '>=' | '<' | '<='): boolean => {
        const op = {
            '>': (a: any, b: any) => a > b,
            '>=': (a: any, b: any) => a >= b,
            '<': (a: any, b: any) => a < b,
            '<=': (a: any, b: any) => a <= b,
        }[rel];

        if (isNumericLike(x) || isNumericLike(y)) {
            return op(Number(x), Number(y));
        }

        const xs = ci ? String(x).toLocaleLowerCase() : String(x);
        const ys = ci ? String(y).toLocaleLowerCase() : String(y);
        return op(xs, ys);
    };


    switch (op) {
        case '=': return eq(a, b);
        case '<>': return !eq(a, b);
        case '>': return cmp(a, b, '>');
        case '>=': return cmp(a, b, '>=');
        case '<': return cmp(a, b, '<');
        case '<=': return cmp(a, b, '<=');
        case 'contains': {
            const xs = (a ?? '').toString(); const ys = (b ?? '').toString();
            return ci ? xs.toLocaleLowerCase().includes(ys.toLocaleLowerCase())
                : xs.includes(ys);
        }
        case 'notcontains': {
            const xs = (a ?? '').toString(); const ys = (b ?? '').toString();
            return ci ? !xs.toLocaleLowerCase().includes(ys.toLocaleLowerCase())
                : !xs.includes(ys);
        }
        case 'startswith': {
            const xs = (a ?? '').toString(); const ys = (b ?? '').toString();
            return ci ? xs.toLocaleLowerCase().startsWith(ys.toLocaleLowerCase())
                : xs.startsWith(ys);
        }
        case 'endswith': {
            const xs = (a ?? '').toString(); const ys = (b ?? '').toString();
            return ci ? xs.toLocaleLowerCase().endsWith(ys.toLocaleLowerCase())
                : xs.endsWith(ys);
        }
        default: return true;
    }
}


// ---------- very small OData $filter -> DxFilter converter (80/20) ----------
// Supports: eq ne gt ge lt le, and/or, contains(field,'x'), startswith, endswith
// No parentheses precedence; evaluates left-to-right with 'and'/'or' (simple cases).
function parseOdataFilterToDx(str: string): DxFilter | null {
    if (!str?.trim()) return null;

    // tokenization
    const tokens: string[] = [];
    let i = 0;
    while (i < str.length) {
        const ch = str[i];
        if (/\s/.test(ch)) { i++; continue; }
        if (ch === '\'') { // quoted string
            let j = i + 1, out = '';
            while (j < str.length) {
                const c = str[j];
                if (c === '\'' && str[j + 1] === '\'') { out += '\''; j += 2; continue; } // escaped ''
                if (c === '\'') { break; }
                out += c; j++;
            }
            tokens.push(`'${out}'`);
            i = j + 1;
            continue;
        }
        if (/[(),]/.test(ch)) { tokens.push(ch); i++; continue; }

        // identifiers / numbers / words
        let j = i;
        while (j < str.length && !/[\s(),]/.test(str[j])) j++;
        tokens.push(str.slice(i, j));
        i = j;
    }

    const peek = () => tokens[0];
    const pop = () => tokens.shift();

    const readValue = (): any => {
        const t = pop();
        if (!t) return null;
        if (t.startsWith('\'')) return t.slice(1, -1);        // string
        if (/^\d+(\.\d+)?$/.test(t)) return Number(t);         // number
        if (/^true|false$/i.test(t)) return t.toLowerCase() === 'true';
        if (/^null$/i.test(t)) return null;
        return { ident: t };                                   // identifier (field)
    };

    const readCmp = (): DxFilter | null => {
        const left = readValue();
        const op = (pop() || '').toLowerCase();

        // function call: contains(field,'x')
        if (typeof left === 'object' && left.ident && peek() === '(') {
            const fn = left.ident.toLowerCase();
            pop(); // (
            const arg1 = readValue();
            if (peek() === ',') pop();
            const arg2 = readValue();
            if (peek() === ')') pop();
            if (fn === 'contains') return [String((arg1 as any).ident ?? arg1), 'contains', arg2 as any];
            if (fn === 'startswith') return [String((arg1 as any).ident ?? arg1), 'startswith', arg2 as any];
            if (fn === 'endswith') return [String((arg1 as any).ident ?? arg1), 'endswith', arg2 as any];
            return null;
        }

        const right = readValue();
        const field = String((left as any).ident ?? left);
        const val = right && (right as any).ident ? (right as any).ident : right;

        switch (op) {
            case 'eq': return [field, '=', val] as DxFilter;
            case 'ne': return [field, '<>', val] as DxFilter;
            case 'gt': return [field, '>', val] as DxFilter;
            case 'ge': return [field, '>=', val] as DxFilter;
            case 'lt': return [field, '<', val] as DxFilter;
            case 'le': return [field, '<=', val] as DxFilter;
            default: return null;
        }
    };

    // left-to-right chain with and/or (no parentheses nesting)
    let expr = readCmp();
    while (tokens.length >= 2) {
        const logic = (pop() || '').toLowerCase();
        if (logic !== 'and' && logic !== 'or') break;
        const right = readCmp();
        if (!right) break;
        expr = [expr as DxFilter, logic, right] as DxFilter;
    }
    return expr ?? null;
}

// ---------- sort parser ----------
function parseOrderBy(s?: string): Array<{ selector: string; desc: boolean }> {
    if (!s) return [];
    return splitCsv(s).map(p => {
        const [field, dir] = p.split(/\s+/);
        return { selector: field, desc: String(dir ?? '').toLowerCase() === 'desc' };
    });
}

// ---------- search ----------
function applySearch<T extends AnyObj>(rows: T[], needle: string, fields: string[], ci: boolean): T[] {
    if (!needle) return rows;
    const n = ci ? needle.toLocaleLowerCase() : needle;
    return rows.filter(r => fields.some(f => {
        const v = get(r, f);
        if (v == null) return false;
        const s = ci ? String(v).toLocaleLowerCase() : String(v);
        return s.includes(n);
    }));
}


// ---------- DevExtreme Promise shims ----------
type DXPromise<T> = {
    then: Promise<T>['then']; catch: Promise<T>['catch']; finally: Promise<T>['finally'];
    done(cb: (v: T) => any): DXPromise<T>; fail(cb: (e: any) => any): DXPromise<T>; always(cb: (a: any) => any): DXPromise<T>;
    _resolve(v: T): void; _reject(e: any): void;
};
function makeDxPromise<T>(): DXPromise<T> {
    let resolve!: (v: T) => void, reject!: (e: any) => void;
    const p = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
    const api: any = {};
    api.then = p.then.bind(p); api.catch = p.catch.bind(p); api.finally = p.finally.bind(p);
    api.done = (cb: (v: T) => any) => { p.then(cb); return api; };
    api.fail = (cb: (e: any) => any) => { p.catch(cb); return api; };
    api.always = (cb: (a: any) => any) => { p.then(cb, cb); return api; };
    api._resolve = (v: T) => resolve(v); api._reject = (e: any) => reject(e);
    return api as DXPromise<T>;
}
const dxResolve = <T>(val: T) => { const d = makeDxPromise<T>(); d._resolve(val); return d; };

// ---------- main factory ----------
export async function createStaticDatasource<T extends AnyObj>(opts: UseOdataStaticOpts<T>): Promise<Result<T>> {
    try {
        const key = String(opts.key ?? '_Id');
        // keep a mutable working copy
        const local: T[] = toArray(
            typeof opts.data === 'function' ? (opts.data as any)() : opts.data
        ).map(x => ({ ...x })); // shallow clone to avoid mutating caller's array

        // temp key generator for new rows without a key
        let nextTemp = -1;
        const ensureKey = (row: any) => {
            if (row[key] == null) row[key] = nextTemp--;
            return row;
        };

        let currentParams: OdataParams = { ...(opts.params ?? {}) };

        const andFilters = (a: DxFilter | null, b: DxFilter | null): DxFilter | null =>
            a && b ? [a, 'and', b] as DxFilter : (a || b);


        function runOdataOnArray<T extends AnyObj>(rows: T[], loadOptions?: any) {
            const ci = opts.caseInsensitive ?? true;

            // --- build filter: params.$filter AND DataSource.filter() ---
            const base =
                typeof currentParams.$filter === 'string'
                    ? (parseOdataFilterToDx(currentParams.$filter) as DxFilter | null)
                    : (Array.isArray(currentParams.$filter) ? currentParams.$filter as DxFilter : null);

            const extra = Array.isArray(loadOptions?.filter) ? loadOptions.filter as DxFilter : null;
            const filterDx = andFilters(base, extra);

            let items = rows.slice();
            if (filterDx) items = items.filter(r => evalDxFilter(r, filterDx, ci));

            // --- search: combine params.$search + loadOptions.searchValue ---
            const needles = [currentParams.$search, loadOptions?.searchValue].filter(Boolean).map(String);
            if (needles.length) {
                const fields =
                    (opts.searchFields?.length ? opts.searchFields.map(String) : Object.keys(items[0] ?? []))
                        .filter(k => typeof (items[0] as any)?.[k] === 'string');
                for (const n of needles) items = applySearch(items, n, fields, ci);
            }

            // --- sort: prefer params.$orderby; else DX sort ---
            const order =
                parseOrderBy(currentParams.$orderby) ||
                (Array.isArray(loadOptions?.sort)
                    ? (loadOptions.sort as any[]).map(s => ({ selector: String(s.selector), desc: !!s.desc }))
                    : []);

            if (order.length) {
                items.sort((a, b) => {
                    for (const { selector, desc } of order) {
                        const aa = norm(get(a, selector), ci) as any;
                        const bb = norm(get(b, selector), ci) as any;
                        if (aa < bb) return desc ? 1 : -1;
                        if (aa > bb) return desc ? -1 : 1;
                    }
                    return 0;
                });
            }

            const total = items.length;

            // paging: params first, fallback to DX
            const skip = currentParams.$skip ?? loadOptions?.skip ?? 0;
            const take = currentParams.$top ?? loadOptions?.take ?? items.length;
            if (skip || take != null) items = items.slice(skip, skip + (take ?? items.length));

            // select (keep key if requested)
            const selectList = Array.isArray(currentParams.$select)
                ? currentParams.$select
                : (typeof currentParams.$select === 'string' ? splitCsv(currentParams.$select) : []);
            if (selectList.length) {
                const keepKey = opts.keepKeyOnSelect ?? true;
                const finalKeys = keepKey && !selectList.includes(key) ? [...selectList, key] : selectList;
                items = items.map(x => pick(x, finalKeys));
            }

            return { data: items, total };
        }


        const store = new opts.source.CustomStore({
            key,
            load: (loadOptions: any) => {
                const { data, total } = runOdataOnArray<T>(local, loadOptions);
                return loadOptions?.requireTotalCount
                    ? dxResolve({ data, totalCount: total })
                    : dxResolve(data);
            },
            byKey: (k: any) => {
                const toKeyStr = (v: any) => v == null ? '' : String(v);
                const r = local.find(x => toKeyStr((x as any)[key]) === toKeyStr(k)) ?? null;
                return dxResolve(r);
            },
            insert: (values: any) => {
                const row = ensureKey({ ...values });
                local.push(row);
                return dxResolve(row); // return the created row
            },
            update: (k: any, values: any) => {
                const i = local.findIndex(x => (x as any)[key] === k);
                if (i !== -1) {
                    Object.assign(local[i], values);
                    return dxResolve(local[i]); // return updated row
                }
                return dxResolve(null as any);
            },
            remove: (k: any) => {
                const i = local.findIndex(x => (x as any)[key] === k);
                if (i !== -1) local.splice(i, 1);
                return dxResolve(k); // return removed key
            },

        });

        const dataSource = new  opts.source.DataSource({ store, reshapeOnPush: true, paginate: false });
        // Out of Vue's reactivity graph — see useFetchOData in use-fetch-helper.ts for why.
        markRaw(store as object)
        markRaw(dataSource as object)

        // expose a tiny controller so you can change params later
        // const setParams = (patch: OdataParams) => { currentParams = { ...currentParams, ...patch }; };
        // const getParams = () => ({ ...currentParams });

        return { dataSource, data: null, statusCode: 200, error: null };
    } catch (e: any) {
        return {
            dataSource: new opts.source.DataSource({ store: [] as any }),
            data: null,
            statusCode: 500,
            error: { message: e?.message ?? 'Unexpected error', stack: String(e?.stack ?? ''), response: e },
        };
    }
}
