import { t as getFieldValue } from "./field-path-C92eGLg3.js";
//#region src/search/filter-eval.ts
/**
* Compile a devextreme filter expression (the array form `monoFilterBuilder`
* emits via `changed({ type: 'array' })`) into a client-side row predicate, so a
* built filter can narrow an array-backed grid the same way a remote store would
* narrow from a `$filter`. Remote devextreme stores read the array directly; this
* is the client-side mirror for sources that only accept a `(row) => boolean`.
*
* The grammar handled is exactly the subset `treeToArray` produces: `[field, op,
* value]` triples, `'and'` / `'or'` joined groups, `['!', expr]` negation, with
* `between` / `in` / blank checks already expanded to those primitives.
*/
function compileFilterPredicate(expr) {
	if (!Array.isArray(expr) || expr.length === 0) return null;
	const fn = build(expr);
	return (row) => !!fn(row);
}
/** AND-combine two optional devextreme filter expressions (either may be null). */
function andFilters(a, b) {
	if (a == null && b == null) return null;
	if (a == null) return b;
	if (b == null) return a;
	return [
		a,
		"and",
		b
	];
}
/**
* AND-combine optional row predicates — the array-source twin of `andFilters`.
*
* Returns the lone member UNWRAPPED when only one is present, so a caller that
* compares the result by reference (the grid's compose memo) sees the same
* function back and does not treat "nothing changed" as a change.
*/
function andPredicates(...fns) {
	const kept = fns.filter((f) => typeof f === "function");
	if (!kept.length) return null;
	if (kept.length === 1) return kept[0];
	return (row, index) => kept.every((f) => f(row, index));
}
/**
* Join expressions with `and` / `or`, dropping nulls and returning a lone member
* unwrapped — devextreme's filter arrays interleave the join token between
* members (`[a, 'or', b, 'or', c]`) rather than nesting pairs.
*/
function joinFilters(parts, join) {
	const kept = parts.filter((p) => p != null);
	if (!kept.length) return null;
	if (kept.length === 1) return kept[0];
	const out = [];
	kept.forEach((p, i) => {
		if (i) out.push(join);
		out.push(p);
	});
	return out;
}
var CMP = new Set([
	"=",
	"<>",
	">",
	">=",
	"<",
	"<=",
	"==",
	"!=",
	"eq",
	"ne",
	"gt",
	"ge",
	"lt",
	"le"
]);
var STR = new Set([
	"contains",
	"notcontains",
	"startswith",
	"endswith"
]);
/** A triple is `[field, op, value]`; a group starts with an array member. */
function isTriple(node) {
	return Array.isArray(node) && node.length === 3 && typeof node[0] === "string" && typeof node[1] === "string" && (CMP.has(node[1]) || STR.has(String(node[1]).toLowerCase()));
}
function build(expr) {
	if (!Array.isArray(expr) || expr.length === 0) return () => true;
	if (expr.length === 2 && (expr[0] === "!" || expr[0] === "not")) {
		const inner = build(expr[1]);
		return (row) => !inner(row);
	}
	if (isTriple(expr)) {
		const [field, op, value] = expr;
		return (row) => match(getFieldValue(row, field), op, value);
	}
	const members = [];
	const joins = [];
	for (const part of expr) {
		const t = typeof part === "string" ? part.toLowerCase() : "";
		if (t === "and" || t === "&" || t === "or" || t === "|") {
			joins.push(t === "or" || t === "|" ? "or" : "and");
			continue;
		}
		members.push(part);
	}
	const fns = members.map((m) => build(m));
	if (!fns.length) return () => true;
	return (row) => {
		let acc = fns[0](row);
		for (let i = 0; i < joins.length; i += 1) {
			const next = fns[i + 1](row);
			acc = joins[i] === "or" ? acc || next : acc && next;
		}
		return acc;
	};
}
/** Coerce two values for ordered comparison: numbers when both parse, else strings. */
function pair(a, b) {
	const na = Number(a);
	const nb = Number(b);
	if (a !== "" && b !== "" && !Number.isNaN(na) && !Number.isNaN(nb)) return [na, nb];
	return [String(a ?? ""), String(b ?? "")];
}
/** OData keyword → the symbol token the switch below is written against. */
var OP_ALIAS = {
	eq: "=",
	ne: "<>",
	gt: ">",
	ge: ">=",
	lt: "<",
	le: "<="
};
function match(raw, op, value) {
	const lower = op.toLowerCase();
	const token = OP_ALIAS[lower] ?? lower;
	if (value === null || value === void 0) {
		const blank = raw === null || raw === void 0 || raw === "";
		return token === "=" || token === "==" ? blank : !blank;
	}
	const raws = String(raw ?? "");
	const vals = String(value ?? "");
	switch (token) {
		case "=":
		case "==": {
			const [a, b] = pair(raw, value);
			return a === b;
		}
		case "<>":
		case "!=": {
			const [a, b] = pair(raw, value);
			return a !== b;
		}
		case ">":
		case ">=":
		case "<":
		case "<=": {
			const [a, b] = pair(raw, value);
			if (typeof a === "string" && typeof b === "string") {}
			switch (token) {
				case ">": return a > b;
				case ">=": return a >= b;
				case "<": return a < b;
				default: return a <= b;
			}
		}
		case "contains": return raws.toLowerCase().includes(vals.toLowerCase());
		case "notcontains": return !raws.toLowerCase().includes(vals.toLowerCase());
		case "startswith": return raws.toLowerCase().startsWith(vals.toLowerCase());
		case "endswith": return raws.toLowerCase().endsWith(vals.toLowerCase());
		default: return false;
	}
}
//#endregion
export { joinFilters as i, andPredicates as n, compileFilterPredicate as r, andFilters as t };
