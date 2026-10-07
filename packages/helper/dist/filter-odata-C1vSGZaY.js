import { i as odataLiteral, l as toODataSelector, n as isPath } from "./field-path-C92eGLg3.js";
//#region src/components/filter/filter-operators.ts
/** Value inputs required per operator — drives the value cell. */
var OPERATOR_ARITY = {
	eq: 1,
	ne: 1,
	gt: 1,
	ge: 1,
	lt: 1,
	le: 1,
	contains: 1,
	notcontains: 1,
	startswith: 1,
	endswith: 1,
	in: "many",
	between: 2,
	isblank: 0,
	isnotblank: 0
};
/**
* Operators offered per data type. Only OData-expressible ones: string functions
* for text, comparisons for ordered types, equality for booleans. Every type keeps
* the null checks, which serialise to `eq null` / `ne null`.
*/
var BY_TYPE = {
	string: [
		"contains",
		"notcontains",
		"startswith",
		"endswith",
		"eq",
		"ne",
		"in",
		"isblank",
		"isnotblank"
	],
	number: [
		"eq",
		"ne",
		"gt",
		"ge",
		"lt",
		"le",
		"between",
		"in",
		"isblank",
		"isnotblank"
	],
	date: [
		"eq",
		"ne",
		"gt",
		"ge",
		"lt",
		"le",
		"between",
		"isblank",
		"isnotblank"
	],
	datetime: [
		"eq",
		"ne",
		"gt",
		"ge",
		"lt",
		"le",
		"between",
		"isblank",
		"isnotblank"
	],
	boolean: ["eq", "ne"]
};
function operatorsFor(dataType = "string") {
	return BY_TYPE[dataType] ?? BY_TYPE.string;
}
/** The operator a field falls back to when its type has no current one. */
function defaultOperator(dataType = "string") {
	return operatorsFor(dataType)[0] ?? "eq";
}
/** English defaults for every label. `texts` overrides any of these. */
var DEFAULT_TEXTS = {
	matchPrefix: "Match",
	matchSuffix: "of the following rules:",
	addRule: "Add rule",
	addGroup: "Add group",
	addNested: "Add nested rule",
	remove: "Remove",
	apply: "Apply",
	clear: "Clear",
	valuePlaceholder: "Enter a value",
	multiValuePlaceholder: "Enter one or more values (comma separated)",
	emptyHint: "No rules yet — add one to start filtering.",
	and: "all",
	or: "any",
	notAnd: "not all",
	notOr: "none",
	eq: "is equal to",
	ne: "is not equal to",
	gt: "is greater than",
	ge: "is greater than or equal to",
	lt: "is less than",
	le: "is less than or equal to",
	contains: "contains",
	notcontains: "does not contain",
	startswith: "starts with",
	endswith: "ends with",
	in: "is one of",
	between: "is between",
	isblank: "is blank",
	isnotblank: "is not blank"
};
function resolveTexts(texts) {
	return {
		...DEFAULT_TEXTS,
		...texts ?? {}
	};
}
/** Coerce a raw input string to the field's data type for the emitted filter. */
function coerceValue(raw, dataType = "string") {
	if (raw === null || raw === void 0 || raw === "") return raw;
	if (dataType === "number") {
		const n = Number(raw);
		return Number.isNaN(n) ? raw : n;
	}
	if (dataType === "boolean") {
		if (typeof raw === "boolean") return raw;
		const s = String(raw).toLowerCase();
		return s === "true" || s === "1";
	}
	return raw;
}
//#endregion
//#region src/components/filter/filter-odata.ts
var _id = 0;
function nextId(prefix = "n") {
	_id += 1;
	return `${prefix}${_id}`;
}
function emptyGroup(operator = "and") {
	return {
		kind: "group",
		id: nextId("g"),
		operator,
		children: []
	};
}
/** devextreme's operator token for a builder operator (used in the array form). */
function dxOperator(op) {
	switch (op) {
		case "eq": return "=";
		case "ne": return "<>";
		case "gt": return ">";
		case "ge": return ">=";
		case "lt": return "<";
		case "le": return "<=";
		case "notcontains": return "notcontains";
		default: return op;
	}
}
/** Inverse of {@link dxOperator}, tolerating both spellings of each token. */
function fromDxOperator(op) {
	switch (String(op).toLowerCase()) {
		case "=":
		case "==":
		case "eq": return "eq";
		case "<>":
		case "!=":
		case "ne": return "ne";
		case ">":
		case "gt": return "gt";
		case ">=":
		case "ge": return "ge";
		case "<":
		case "lt": return "lt";
		case "<=":
		case "le": return "le";
		case "contains": return "contains";
		case "notcontains": return "notcontains";
		case "startswith": return "startswith";
		case "endswith": return "endswith";
		case "between": return "between";
		case "in": return "in";
		default: return null;
	}
}
/** Is this array a `[field, op, value]` triple rather than a nested group? */
function isTriple(node) {
	return Array.isArray(node) && node.length === 3 && typeof node[0] === "string" && typeof node[1] === "string" && fromDxOperator(node[1]) !== null;
}
/** One rule as a devextreme expression; `null` when it can't be expressed yet. */
function ruleToArray(rule) {
	if (!rule.field) return null;
	const arity = OPERATOR_ARITY[rule.operator];
	if (rule.operator === "isblank") return [
		rule.field,
		"=",
		null
	];
	if (rule.operator === "isnotblank") return [
		rule.field,
		"<>",
		null
	];
	if (arity === "many") {
		const values = Array.isArray(rule.value) ? rule.value : splitMulti(rule.value);
		if (!values.length) return null;
		const parts = [];
		values.forEach((v, i) => {
			if (i) parts.push("or");
			parts.push([
				rule.field,
				"=",
				v
			]);
		});
		return values.length === 1 ? parts[0] : parts;
	}
	if (arity === 2) {
		const [a, b] = Array.isArray(rule.value) ? rule.value : [void 0, void 0];
		if (a === void 0 || a === "" || b === void 0 || b === "") return null;
		return [
			[
				rule.field,
				">=",
				a
			],
			"and",
			[
				rule.field,
				"<=",
				b
			]
		];
	}
	if (rule.value === void 0 || rule.value === "") return null;
	return [
		rule.field,
		dxOperator(rule.operator),
		rule.value
	];
}
/** Split a comma-separated multi-value entry, trimming and dropping blanks. */
function splitMulti(value) {
	if (Array.isArray(value)) return value.filter((v) => v !== "" && v !== null && v !== void 0);
	if (value === null || value === void 0 || value === "") return [];
	return String(value).split(",").map((s) => s.trim()).filter(Boolean);
}
/** The node tree as a devextreme filter expression, or `null` when empty. */
function treeToArray(node) {
	if (node.kind === "rule") return ruleToArray(node);
	const parts = node.children.map((c) => treeToArray(c)).filter((p) => Array.isArray(p) && p.length > 0);
	if (!parts.length) return null;
	const join = node.operator === "or" || node.operator === "notOr" ? "or" : "and";
	let out;
	if (parts.length === 1) out = parts[0];
	else {
		out = [];
		parts.forEach((p, i) => {
			if (i) out.push(join);
			out.push(p);
		});
	}
	return node.operator === "notAnd" || node.operator === "notOr" ? ["!", out] : out;
}
/** Wrap a parsed node so the root is always a group the UI can add rules to. */
function asRootGroup(node) {
	if (!node) return emptyGroup();
	if (node.kind === "group") return node;
	const g = emptyGroup();
	g.children.push(node);
	return g;
}
/** devextreme expression → node tree. Returns `null` for an empty/unusable input. */
function arrayToTree(filter) {
	if (!Array.isArray(filter) || filter.length === 0) return null;
	if (filter.length === 2 && (filter[0] === "!" || filter[0] === "not")) {
		const inner = arrayToTree(filter[1]);
		if (!inner) return null;
		const g = inner.kind === "group" ? inner : asRootGroup(inner);
		g.operator = g.operator === "or" ? "notOr" : "notAnd";
		return g;
	}
	if (isTriple(filter)) {
		const [field, rawOp, value] = filter;
		const op = fromDxOperator(rawOp);
		if (value === null) return {
			kind: "rule",
			id: nextId("r"),
			field,
			operator: op === "ne" ? "isnotblank" : "isblank",
			value: null
		};
		return {
			kind: "rule",
			id: nextId("r"),
			field,
			operator: op,
			value
		};
	}
	const members = [];
	let join = "and";
	for (const part of filter) {
		if (typeof part === "string" && (part === "and" || part === "or" || part === "&" || part === "|")) {
			join = part === "or" || part === "|" ? "or" : "and";
			continue;
		}
		members.push(part);
	}
	const children = members.map((m) => arrayToTree(m)).filter((n) => n !== null);
	if (!children.length) return null;
	if (children.length === 1) return children[0];
	const g = emptyGroup(join);
	g.children = children;
	return g;
}
/** OData keyword for a comparison token. */
function odataKeyword(op) {
	switch (op) {
		case "=":
		case "eq": return "eq";
		case "<>":
		case "!=":
		case "ne": return "ne";
		case ">":
		case "gt": return "gt";
		case ">=":
		case "ge": return "ge";
		case "<":
		case "lt": return "lt";
		case "<=":
		case "le": return "le";
		default: return null;
	}
}
/** `Job.Name` → `Job/Name`; a plain field passes through. */
function selector(field) {
	if (!isPath(field)) return field;
	return toODataSelector(field) ?? field;
}
/** Serialize a value, treating an explicit `null` as the OData `null` keyword. */
function literal(value) {
	if (value === null || value === void 0) return "null";
	if (value instanceof Date) return value.toISOString();
	return odataLiteral(value);
}
/**
* A devextreme filter expression → an OData `$filter` string. Nested groups get
* parentheses; `contains`/`startswith`/`endswith` become function calls.
*/
function arrayToODataString(filter) {
	if (!Array.isArray(filter) || filter.length === 0) return "";
	if (filter.length === 1 && typeof filter[0] === "string") {
		const raw = filter[0].trim();
		return raw ? `(${raw})` : "";
	}
	if (filter.length === 2 && (filter[0] === "!" || filter[0] === "not")) {
		const inner = arrayToODataString(filter[1]);
		return inner ? `not (${inner})` : "";
	}
	if (isTriple(filter)) {
		const [field, rawOp, value] = filter;
		const sel = selector(field);
		const kw = odataKeyword(rawOp);
		if (kw) return `${sel} ${kw} ${literal(value)}`;
		switch (String(rawOp).toLowerCase()) {
			case "contains": return `contains(${sel},${literal(value)})`;
			case "notcontains": return `not contains(${sel},${literal(value)})`;
			case "startswith": return `startswith(${sel},${literal(value)})`;
			case "endswith": return `endswith(${sel},${literal(value)})`;
			default: return "";
		}
	}
	const out = [];
	for (const part of filter) {
		if (typeof part === "string") {
			const t = part.toLowerCase();
			if (t === "and" || t === "&") out.push("and");
			else if (t === "or" || t === "|") out.push("or");
			continue;
		}
		const s = arrayToODataString(part);
		if (!s) continue;
		const rawClause = Array.isArray(part) && part.length === 1 && typeof part[0] === "string";
		const nested = Array.isArray(part) && !isTriple(part) && !rawClause;
		out.push(nested && !/^not \(/.test(s) ? `(${s})` : s);
	}
	while (out.length && (out[0] === "and" || out[0] === "or")) out.shift();
	while (out.length && (out[out.length - 1] === "and" || out[out.length - 1] === "or")) out.pop();
	return out.join(" ");
}
/**
* Parse the subset of OData `$filter` the builder itself emits: parentheses,
* `and` / `or` / `not`, the six comparisons, `contains` / `startswith` /
* `endswith`, `in (…)`, `null`, and quoted / numeric / boolean literals.
*
* Anything outside that subset throws, and the caller (`monoFilterBuilder`) warns
* once and falls back to an empty tree — a wrong filter is worse than none.
*/
function odataStringToArray(input) {
	const src = String(input ?? "").trim();
	if (!src) return null;
	let i = 0;
	const ws = () => {
		while (i < src.length && /\s/.test(src[i])) i += 1;
	};
	const eof = () => {
		ws();
		return i >= src.length;
	};
	const peekWord = () => {
		ws();
		const m = /^[A-Za-z_][A-Za-z0-9_.\/]*/.exec(src.slice(i));
		return m ? m[0] : "";
	};
	const takeWord = () => {
		const w = peekWord();
		i += w.length;
		return w;
	};
	const expect = (ch) => {
		ws();
		if (src[i] !== ch) throw new Error(`expected "${ch}" at ${i}`);
		i += 1;
	};
	const parseLiteral = () => {
		ws();
		if (src[i] === "'") {
			i += 1;
			let out = "";
			while (i < src.length) {
				if (src[i] === "'") {
					if (src[i + 1] === "'") {
						out += "'";
						i += 2;
						continue;
					}
					i += 1;
					return out;
				}
				out += src[i];
				i += 1;
			}
			throw new Error("unterminated string");
		}
		const m = /^-?\d+(\.\d+)?/.exec(src.slice(i));
		if (m) {
			i += m[0].length;
			return Number(m[0]);
		}
		const w = takeWord();
		if (w === "null") return null;
		if (w === "true") return true;
		if (w === "false") return false;
		if (w) return w;
		throw new Error(`expected a literal at ${i}`);
	};
	const parseComparison = () => {
		ws();
		const w = peekWord().toLowerCase();
		if (w === "contains" || w === "startswith" || w === "endswith") {
			const fn = takeWord().toLowerCase();
			expect("(");
			const field = takeWord();
			expect(",");
			const value = parseLiteral();
			expect(")");
			return [
				field.replace(/\//g, "."),
				fn,
				value
			];
		}
		const field = takeWord();
		if (!field) throw new Error(`expected a field at ${i}`);
		const op = takeWord().toLowerCase();
		if (op === "in") {
			expect("(");
			const values = [];
			for (;;) {
				values.push(parseLiteral());
				ws();
				if (src[i] === ",") {
					i += 1;
					continue;
				}
				break;
			}
			expect(")");
			if (!values.length) throw new Error("empty in()");
			const parts = [];
			values.forEach((v, n) => {
				if (n) parts.push("or");
				parts.push([
					field.replace(/\//g, "."),
					"=",
					v
				]);
			});
			return values.length === 1 ? parts[0] : parts;
		}
		const kw = odataKeyword(op);
		if (!kw) throw new Error(`unsupported operator "${op}" at ${i}`);
		const value = parseLiteral();
		return [
			field.replace(/\//g, "."),
			kw,
			value
		];
	};
	const parseOr = () => {
		let left = parseAnd();
		for (;;) {
			ws();
			if (peekWord().toLowerCase() !== "or") break;
			takeWord();
			const right = parseAnd();
			left = [
				left,
				"or",
				right
			];
		}
		return left;
	};
	const parseAnd = () => {
		let left = parseUnary();
		for (;;) {
			ws();
			if (peekWord().toLowerCase() !== "and") break;
			takeWord();
			const right = parseUnary();
			left = [
				left,
				"and",
				right
			];
		}
		return left;
	};
	const parseUnary = () => {
		ws();
		if (peekWord().toLowerCase() === "not") {
			const save = i;
			takeWord();
			ws();
			if (peekWord().toLowerCase() === "contains") {
				const c = parseComparison();
				return [
					c[0],
					"notcontains",
					c[2]
				];
			}
			if (src[i] === "(") {
				expect("(");
				const inner = parseOr();
				expect(")");
				return ["!", inner];
			}
			i = save;
		}
		ws();
		if (src[i] === "(") {
			expect("(");
			const inner = parseOr();
			expect(")");
			return inner;
		}
		return parseComparison();
	};
	const result = parseOr();
	if (!eof()) throw new Error(`unexpected input at ${i}: "${src.slice(i, i + 24)}"`);
	return result;
}
/** Flatten same-operator nesting so `[[a,'and',b],'and',c]` reads as one group. */
function flattenTree(node) {
	if (node.kind === "rule") return node;
	const children = [];
	for (const raw of node.children) {
		const child = flattenTree(raw);
		if (child.kind === "group" && child.operator === node.operator && child.children.length) children.push(...child.children);
		else children.push(child);
	}
	return {
		...node,
		children
	};
}
//#endregion
export { flattenTree as a, splitMulti as c, OPERATOR_ARITY as d, coerceValue as f, resolveTexts as h, emptyGroup as i, treeToArray as l, operatorsFor as m, arrayToTree as n, nextId as o, defaultOperator as p, asRootGroup as r, odataStringToArray as s, arrayToODataString as t, DEFAULT_TEXTS as u };
