import type { ValidateSchema, ValidateError, } from '../types'
import { validateAll, validateField, clearAll, everyValid, unwrapError } from './schema-validate'
import { push } from 'notivue'
import type DataSource from 'devextreme/data/data_source';
import { NotifProps } from '../types/notif';

export const useHelper = () => {


    let notif = async (options: NotifProps) => {
        const { props, ...other } = options
        const data = { ...other, props: { ...props, isNewMessageRequest: true } } as NotifProps

        if (options.type === "success") return push.success({ duration: 3000, ...data })
        if (options.type === "info") return push.info({ duration: 3000, ...data })
        if (options.type === "warning") return push.warning({ duration: 3000, ...data })
        if (options.type === "error") return push.error({ duration: 0, ...data })

        if (options.type === "promise") {
            let cancelled = false
            let timer: any

            const notification = push.promise({
                ...data,
                // ✅ ini kepakai kalau notif di-dismiss manual (termasuk tombol "Tidak" kalau kamu clear)
                onManualClear: () => {
                    cancelled = true
                    if (timer) clearTimeout(timer)
                },
            })

            await new Promise<void>((resolve) => {
                timer = setTimeout(resolve, (options).duration ?? 4000)
            })

            if (cancelled) return

            const isDone = options.props?.buttons?.find((e) => e.to === options.route?.path)

            if (!isDone && options.router && options.props?.redirect) {
                notification.resolve("Dialihkan ke halaman daftar data!")
                await options.router.push(options.props.redirect)
            }

            // kalau selesai dan nggak cancel, tutup notif pending
            notification.clear()
        }
    }




    /**
     * `true` when ANY `{ valid, message }` slot in the error object (nested
     * objects/arrays included) is invalid.
     * @param error the error object (or a Ref of it)
     */
    let validateAllSchemaCheck = (error: ValidateError<any> | any): boolean => !everyValid(unwrapError(error))

    /**
     * Validate the whole form against a yup schema or any Standard Schema
     * (Valibot, Zod, …). Keys absent from `input` are skipped. Every slot is
     * reset first, so a field that now passes is cleared.
     * @param schema yup object schema or Standard Schema
     * @param input the form values
     * @param error `{ valid, message }` slots mirroring `input` (object or Ref)
     * @param callback awaited only when everything is valid
     * @returns `true` when the form is valid
     */
    async function validateAllSchema<T extends object = any>(
        { schema, input, error }: ValidateSchema<T>,
        callback?: () => unknown
    ): Promise<boolean> {
        const valid = await validateAll(schema, input, error)
        if (valid) await callback?.()
        return valid
    }

    /**
     * Validate ONE field (dotted / indexed paths allowed: `'address.city'`,
     * `'items[0].name'`) against a yup schema or any Standard Schema.
     * Without `field` it validates the whole form.
     * @param callback awaited only when the field is valid
     * @returns `true` when the field is valid
     */
    let validateSchema = async <T = any>({
        schema,
        field,
        input,
        error
    }: ValidateSchema<T>, callback?: () => unknown): Promise<boolean> => {
        if (field === undefined || field === null) return validateAllSchema({ schema, input: input as any, error }, callback)
        const valid = await validateField(schema, field as string, input, error)
        if (valid) await callback?.()
        return valid
    }

    /** Reset every `{ valid, message }` slot. Accepts a Ref or the object itself. */
    function clearSchemaValidation({ error }: { error: any }) {
        clearAll(error)
    }


    type Fn = "replace" | "push" | "remove";
    type ReplacerParams<ComT> =
        | {
            fn: Fn;
            type: "data";
            item: ComT;
            key?: keyof ComT & (string | number);
            items: MaybeRef<ComT[]> | {
                key: string,
                var: any
            }
        }
        | {
            fn: Fn;
            type: "datasource";
            item: ComT;
            key?: keyof ComT & (string | number);
            items: MaybeRef<DataSource<ComT, any> | null> | {
                key: string,
                var: any
            }
        };


    function replacerData<ComT>({ fn, type, item, key, items }: ReplacerParams<ComT>) {

        // --- normal array ---
        if (type === "data") {
            //@ts-ignore
            const arr = items.var ? items.var[items.key] : items.value as ComT[]
            //@ts-ignore
            const idx = arr.findIndex((e) => e?.[key] == item?.[key]); // loose compare

            if (fn === "push") {
                arr.unshift(item);
                return;
            }

            if (fn === "replace") {
                if (idx >= 0) arr.splice(idx, 1, item);
                else arr.push(item);
                return;
            }

            if (fn === "remove") {
                if (idx >= 0) arr.splice(idx, 1);
                return;
            }
        }

        // --- datasource ---
        if (type === "datasource") {
            //@ts-ignore
            if ('@odata.context' in item) delete item['@odata.context'];
            //@ts-ignore
            if ('@odata.url' in item) delete item['@odata.url'];
            //@ts-ignore
            const ds = items.var ? items.var[items.key] : items.value as DataSource<ComT, any>
            const coll = ds.items() as ComT[];
            //@ts-ignore
            const idx = coll.findIndex((e) => e?.[String(key)] == item?.[String(key)]); // loose compare
            const store = ds.store();
            //@ts-ignore
            const k = item?.[String(key)] as any;

            if (fn === "push") {
                coll.unshift(item);
                store.push([{ type: "insert", data: item as any, key: k }]);
                return;
            }

            if (fn === "replace") {
                if (idx >= 0) {
                    const target = coll[idx];

                    // If target is an object, mutate it. If not, replace via splice.
                    if (target && typeof target === "object") {
                        // fast path: in-place mutation keeps the same reference
                        Object.assign(target as any, item);
                    } else {
                        // fallback: ensure array slot holds an object
                        coll.splice(idx, 1, { ...(item as any) });
                    }

                    //   store.push([{ type: "update", key: k, data: item as any }]);
                }
                return;
            }

            if (fn === "remove") {


                if (idx >= 0) coll.splice(idx, 1);
                store.push([{ type: "remove", key: k }]);
                return;
            }
        }
    }



    const filterOrIn = (field: string, values: any[], combine = false) => {
        const vs = (values ?? []).filter(v => v !== undefined && v !== null);

        if (!vs.length) return null;

        if (combine) {
            // ✅ compact: Field in (..)
            return [field, 'in', vs] as any;
        }

        // ✅ fallback: (Field = a) or (Field = b) ...
        return vs
            .map(v => [field, '=', v] as any)
            .reduce((a, c) => (a ? [a, 'or', c] : c), null as any);
    };



    type DxFilter =
        | null
        | undefined
        | string
        | number
        | boolean
        | Date
        | DxFilter[]
        | [string, string, any];

    type DxToODataValueOptions = {
        /** encode only the filter value (URL-safe), default false */
        encode?: boolean;
        filter: DxFilter;
    };


    function isLikelyFieldPath(s: string): boolean {
        // allows: Field, Parent/Child, abc_123
        // disallows: spaces, parentheses, quotes, operators
        return /^[A-Za-z_][A-Za-z0-9_]*(\/[A-Za-z_][A-Za-z0-9_]*)*$/.test(s.trim());
    }

    function isSimpleCondition(arr: any[]): arr is [string, string, any] {
        return (
            Array.isArray(arr) &&
            arr.length === 3 &&
            typeof arr[0] === "string" &&
            typeof arr[1] === "string" &&
            isLikelyFieldPath(arr[0]) // <-- important
        );
    }


    // ---------------- internals ----------------

    function unwrapRedundant(f: DxFilter): DxFilter {
        // unwrap excessive single-item nesting: [[[[cond]]]] -> cond
        let cur: any = f;
        while (Array.isArray(cur) && cur.length === 1 && Array.isArray(cur[0])) cur = cur[0];
        return cur;
    }

    function toExpr(node: DxFilter): string {
        if (node == null) return "";

        // DevExtreme sometimes passes raw string (already OData) — allow it
        if (typeof node === "string") {
            const s = node.trim().toLowerCase();
            if (s === "and" || s === "or" || s === "!" || s === "=") return "";
            return node;
        }

        // primitives alone aren't valid expressions
        if (!Array.isArray(node)) return "";

        // unary NOT: ["!", <expr>]
        if (node.length === 2 && node[0] === "!" && Array.isArray(node[1])) {
            const inner = toExpr(unwrapRedundant(node[1] as any));
            return inner ? `not (${inner})` : "";
        }

        // simple condition: ["Field", "=", 49]
        if (isSimpleCondition(node)) {
            const [field, op, value] = node;
            return simpleConditionToOData(field, op, value);
        }

        // group/binary: [left, "and", right, ...]
        const parts: any[] = node;

        if (parts.length === 1 && Array.isArray(parts[0])) return toExpr(parts[0]);

        let out = "";
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            // and/or
            if (typeof part === "string") {
                const s = part.toLowerCase();
                if (s === "and" || s === "or") {
                    out += ` ${s} `;
                    continue;
                }
            }

            const sub = toExpr(unwrapRedundant(part));
            if (!sub) continue;

            // wrap each subgroup/condition
            out += `(${sub})`;
        }

        // cleanup double parens
        return out.trim();
    }




    function literal(v: any): string {
        if (v === null) return "null";
        if (v === undefined) return "null";

        if (v instanceof Date) {
            // OData v4: 2026-01-15T00:00:00.000Z (no quotes)
            return v.toISOString();
        }

        const t = typeof v;
        if (t === "number" || t === "bigint") return String(v);
        if (t === "boolean") return v ? "true" : "false";

        // string (escape single quotes by doubling)
        const s = String(v).replace(/'/g, "''");
        return `'${s}'`;
    }

    function simpleConditionToOData(field: string, op: string, value: any): string {
        const o = op.trim().toLowerCase();

        // ---------- set/list ops ----------
        // DevExtreme: 'in' or header-filter: 'anyof'/'noneof'
        if (o === "in" || o === "anyof" || o === "noneof") {
            const vs = Array.isArray(value) ? value : [value];
            const list = vs
                .filter(v => v !== undefined && v !== null)
                .map(literal)
                .join(",");

            if (!list) return o === "noneof" ? "true" : "false"; // empty in-list behavior

            const expr = `${field} in (${list})`;
            return o === "noneof" ? `not (${expr})` : expr;
        }

        // ---------- string function ops ----------
        if (o === "contains" || o === "notcontains") {
            // OData v4 contains(field,'x')
            const fn = `contains(${field},${literal(value)})`;
            return o === "notcontains" ? `not (${fn})` : fn;
        }
        if (o === "startswith") return `startswith(${field},${literal(value)})`;
        if (o === "endswith") return `endswith(${field},${literal(value)})`;

        // ---------- comparisons ----------
        const map: Record<string, string> = {
            "=": "eq",
            "==": "eq",
            "<>": "ne",
            "!=": "ne",
            ">": "gt",
            ">=": "ge",
            "<": "lt",
            "<=": "le",
        };

        const odataOp = map[o];
        if (!odataOp) throw new Error(`Unsupported operator: ${op}`);

        return `${field} ${odataOp} ${literal(value)}`;
    }



    function dxFilterToString({ filter, encode = false }: DxToODataValueOptions) {
        const expr = toExpr(unwrapRedundant(filter));
        return encode ? encodeURIComponent(expr) : expr;
    }


    type Root = "any" | "object" | "array" | "primitive";


    function isJSONString({ input, strict = false, root = ['array', 'object'] }: {
        input: unknown,
        strict?: boolean,
        root?: Root | ReadonlyArray<Root>;
    }): boolean {

        function getRootKind(v: unknown): Root {
            if (v === null || typeof v !== "object") return "primitive";
            return Array.isArray(v) ? "array" : "object";
        }

        /** Heuristically convert JSON5/JS-literal-ish text to strict JSON */
        function toStrictJSON(input: string): string {
            let out = input;

            // 1) Strip // and /* */ comments
            out = out.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "");

            // 2) Single-quoted strings -> double-quoted
            out = out.replace(/'(?:\\.|[^'\\])*'/g, (m) => {
                const inner = m.slice(1, -1).replace(/\\'/g, "'").replace(/"/g, '\\"');
                return `"${inner}"`;
            });

            // 3) Quote unquoted object keys: {a:1} -> {"a":1}
            out = out.replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, `$1"$2"$3`);

            // 4) Remove trailing commas in objects/arrays
            out = out.replace(/,(\s*[}\]])/g, "$1");

            // 5) Replace NaN/Infinity with null (JSON disallows them)
            out = out.replace(/\b-?Infinity\b|\bNaN\b/g, "null");

            return out;
        }

        if (typeof input !== "string") return false;

        const s = input.trim();
        let value: unknown;

        // Strict first
        try {
            value = JSON.parse(s);
        } catch {
            if (strict) return false;
            try {
                value = JSON.parse(toStrictJSON(s)); // normalize common JSON5-ish patterns
            } catch {
                return false;
            }
        }

        const allowed = Array.isArray(root) ? root : [root];
        if (allowed.includes("any")) return true;

        const kind = getRootKind(value);
        return allowed.includes(kind);
    }



    function safeJSONParse(str: string): any {
        if (typeof str !== 'string') {
            return null
        }

        try {
            // First layer parse (unwrap JSON string)
            const firstParse = JSON.parse(str);
            if (typeof firstParse === 'string') {
                str = firstParse;
            } else {
                return firstParse
            }
        } catch (e) {
            // string might not be quoted json string, continue below
        }

        // Now we have raw string like: [System.Exception: {...}]
        // Remove [ ] if exist
        if (str.startsWith('[') && str.endsWith(']')) {
            str = str.substring(1, str.length - 1);
        }

        // Try to locate JSON block inside
        const start = str.indexOf('{');
        const end = str.lastIndexOf('}');
        if (start >= 0 && end > start) {
            const innerJson = str.substring(start, end + 1);
            try {
                const finalParse = JSON.parse(innerJson);

                return finalParse
            } catch (innerErr) {
                return null
            }
        }

        return null
    }


    function isDate(value: unknown): value is Date {
        if (value instanceof Date) {
            return !isNaN(value.getTime());
        }

        if (typeof value === "string" || typeof value === "number") {
            const parsed = new Date(value);
            return !isNaN(parsed.getTime());
        }

        return false;
    }

    return {

        isDate,
        isJSONString,
        safeJSONParse,
        replacerData,
        filterOrIn,
        validateAllSchema,
        validateSchema,
        validateAllSchemaCheck,
        clearSchemaValidation,
        notif,
        dxFilterToString

    }

}