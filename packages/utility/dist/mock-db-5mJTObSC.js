import { i as matchMockRoute, n as generateSeed, s as parseMockSchema } from "./generate-CJ7MtcDd.js";

//#region pkg/mock-db/split.ts
/**
* Split `input` on `separator`, but only at nesting depth 0 and outside quotes.
*
* @example
* splitTopLevel("A($select=x,y),B", ',')  ->  ["A($select=x,y)", "B"]
*/
function splitTopLevel(input, separator = ",") {
	const parts = [];
	let depth = 0;
	let current = "";
	let quote = null;
	for (const char of String(input ?? "")) {
		if (quote) {
			current += char;
			if (char === quote) quote = null;
			continue;
		}
		if (char === "'" || char === "\"") {
			quote = char;
			current += char;
			continue;
		}
		if (char === "(") depth++;
		if (char === ")") depth--;
		if (char === separator && depth === 0) {
			parts.push(current.trim());
			current = "";
			continue;
		}
		current += char;
	}
	if (current.trim()) parts.push(current.trim());
	return parts;
}
/** The body between the outermost parens of `name(...)`, or null if it isn't one. */
function readCall(segment, name) {
	const trimmed = segment.trim();
	if (!trimmed.toLowerCase().startsWith(`${name.toLowerCase()}(`)) return null;
	if (!trimmed.endsWith(")")) throw new Error(`unbalanced parentheses in "${segment}"`);
	return trimmed.slice(name.length + 1, -1);
}

//#endregion
//#region pkg/mock-db/apply.ts
/** Split the pipeline on `/`, but only at depth 0 so `groupby((A),aggregate(...))` stays whole. */
function splitSegments(input) {
	return splitTopLevel(input, "/");
}
const METHODS = [
	"sum",
	"average",
	"min",
	"max",
	"count",
	"countdistinct"
];
/** `Price with sum as Total` | `$count as Rows`. */
function parseAggregateSpec(input) {
	const text = input.trim();
	const countMatch = /^\$count\s+as\s+([A-Za-z0-9_$]+)$/i.exec(text);
	if (countMatch) return {
		method: "count",
		alias: countMatch[1]
	};
	const match = /^([A-Za-z0-9_$/]+)\s+with\s+([A-Za-z]+)\s+as\s+([A-Za-z0-9_$]+)$/i.exec(text);
	if (!match) throw new Error(`$apply: cannot parse aggregate "${text}" — expected "Field with sum as Alias" or "$count as Alias"`);
	const method = match[2].toLowerCase();
	if (!METHODS.includes(method)) throw new Error(`$apply: unsupported aggregate method "${match[2]}" (expected ${METHODS.join(" | ")})`);
	return {
		field: match[1],
		method,
		alias: match[3]
	};
}
function parseApply(input) {
	return splitSegments(input).map((segment) => {
		if (/^identity$/i.test(segment)) return { kind: "identity" };
		const filterBody = readCall(segment, "filter");
		if (filterBody != null) return {
			kind: "filter",
			expression: filterBody
		};
		const aggregateBody = readCall(segment, "aggregate");
		if (aggregateBody != null) return {
			kind: "aggregate",
			aggregates: splitTopLevel(aggregateBody).map(parseAggregateSpec)
		};
		const groupBody = readCall(segment, "groupby");
		if (groupBody != null) {
			const args = splitTopLevel(groupBody);
			const fieldList = (args[0] ?? "").trim();
			if (!fieldList.startsWith("(") || !fieldList.endsWith(")")) throw new Error(`$apply: groupby needs a parenthesised property list, e.g. groupby((Category))`);
			const fields = splitTopLevel(fieldList.slice(1, -1)).map((field) => field.trim()).filter(Boolean);
			if (!fields.length) throw new Error("$apply: groupby needs at least one property");
			let aggregates = [];
			const rest = args.slice(1).join(",").trim();
			if (rest) {
				const inner = readCall(rest, "aggregate");
				if (inner == null) throw new Error(`$apply: only aggregate(...) is supported inside groupby, got "${rest}"`);
				aggregates = splitTopLevel(inner).map(parseAggregateSpec);
			}
			return {
				kind: "groupby",
				fields,
				aggregates
			};
		}
		throw new Error(`$apply: unsupported transformation "${segment}" (supported: filter, groupby, aggregate, identity)`);
	});
}
/** Case-insensitive flat read — the fallback when no path-aware reader is injected. */
function readField$1(row, name) {
	if (name in row) return row[name];
	const lower = name.toLowerCase();
	const hit = Object.keys(row).find((key) => key.toLowerCase() === lower);
	return hit ? row[hit] : void 0;
}
function computeAggregate(rows, spec, read) {
	if (spec.method === "count") return rows.length;
	const values = rows.map((row) => read(row, spec.field)).filter((value) => value !== void 0 && value !== null);
	if (spec.method === "countdistinct") return new Set(values.map((value) => JSON.stringify(value))).size;
	const numbers = values.map(Number).filter((value) => !Number.isNaN(value));
	if (!numbers.length) return spec.method === "sum" ? 0 : null;
	switch (spec.method) {
		case "sum": return numbers.reduce((total, value) => total + value, 0);
		case "average": return numbers.reduce((total, value) => total + value, 0) / numbers.length;
		case "min": return Math.min(...numbers);
		case "max": return Math.max(...numbers);
		default: return null;
	}
}
/** Stable group key for a set of fields (each may be a navigation path). */
function groupKeyOf(row, fields, read) {
	return JSON.stringify(fields.map((field) => read(row, field) ?? null));
}
/** Run the pipeline. Each transform's output feeds the next. */
function applyTransforms(rows, transforms, compileFilter, readValue = readField$1) {
	const read = readValue;
	let current = [...rows];
	for (const transform of transforms) switch (transform.kind) {
		case "identity": break;
		case "filter": {
			const predicate = compileFilter(transform.expression);
			current = current.filter(predicate);
			break;
		}
		case "aggregate": {
			const single = {};
			for (const spec of transform.aggregates) single[spec.alias] = computeAggregate(current, spec, read);
			current = [single];
			break;
		}
		case "groupby": {
			const groups = /* @__PURE__ */ new Map();
			for (const row of current) {
				const key = groupKeyOf(row, transform.fields, read);
				const bucket = groups.get(key);
				if (bucket) bucket.push(row);
				else groups.set(key, [row]);
			}
			current = [...groups.values()].map((bucket) => {
				const out = {};
				for (const field of transform.fields) out[field] = read(bucket[0], field) ?? null;
				for (const spec of transform.aggregates) out[spec.alias] = computeAggregate(bucket, spec, read);
				return out;
			});
			break;
		}
	}
	return current;
}

//#endregion
//#region pkg/mock-db/odata.ts
const OPERATORS = new Set([
	"eq",
	"ne",
	"gt",
	"ge",
	"lt",
	"le",
	"and",
	"or",
	"not",
	"in"
]);
function tokenize(input) {
	const tokens = [];
	const source = String(input ?? "");
	let i = 0;
	while (i < source.length) {
		const char = source[i];
		if (/\s/.test(char)) {
			i++;
			continue;
		}
		if (char === "(" || char === ")") {
			tokens.push({
				type: "paren",
				value: char
			});
			i++;
			continue;
		}
		if (char === "/") {
			tokens.push({
				type: "path",
				value: char
			});
			i++;
			continue;
		}
		if (char === ":") {
			tokens.push({
				type: "colon",
				value: char
			});
			i++;
			continue;
		}
		if (char === ",") {
			tokens.push({
				type: "comma",
				value: char
			});
			i++;
			continue;
		}
		if (char === "'" || char === "\"") {
			const quote = char;
			let value = "";
			i++;
			while (i < source.length) {
				if (source[i] === quote) {
					if (source[i + 1] === quote) {
						value += quote;
						i += 2;
						continue;
					}
					break;
				}
				value += source[i];
				i++;
			}
			if (source[i] !== quote) throw new Error(`$filter: unterminated string near "${value}"`);
			i++;
			tokens.push({
				type: "string",
				value
			});
			continue;
		}
		if (/[0-9]/.test(char) || char === "-" && /[0-9]/.test(source[i + 1] ?? "")) {
			const iso = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?/.exec(source.slice(i));
			if (iso) {
				tokens.push({
					type: "date",
					value: iso[0]
				});
				i += iso[0].length;
				continue;
			}
			let value = "";
			if (char === "-") {
				value += "-";
				i++;
			}
			while (i < source.length && /[0-9.]/.test(source[i])) {
				value += source[i];
				i++;
			}
			tokens.push({
				type: "number",
				value
			});
			continue;
		}
		if (/[A-Za-z_$]/.test(char)) {
			let value = "";
			while (i < source.length && /[A-Za-z0-9_$.]/.test(source[i])) {
				value += source[i];
				i++;
			}
			const lower = value.toLowerCase();
			tokens.push({
				type: OPERATORS.has(lower) ? "op" : "ident",
				value: OPERATORS.has(lower) ? lower : value
			});
			continue;
		}
		throw new Error(`$filter: unexpected character "${char}" at ${i}`);
	}
	tokens.push({
		type: "eof",
		value: ""
	});
	return tokens;
}
/**
* Recursive descent, lowest precedence first:
*   or  ->  and  ->  not  ->  comparison  ->  primary
* so `a eq 1 and b eq 2 or c eq 3` parses as `((a eq 1 and b eq 2) or c eq 3)`.
*/
function parseFilter(input) {
	const tokens = tokenize(input);
	let pos = 0;
	const peek = () => tokens[pos];
	const next = () => tokens[pos++];
	function expect(type, value) {
		const token = next();
		if (token.type !== type || value !== void 0 && token.value !== value) throw new Error(`$filter: expected ${value ?? type} but found "${token.value || "end of input"}"`);
		return token;
	}
	function parseOr() {
		let left = parseAnd();
		while (peek().type === "op" && peek().value === "or") {
			next();
			left = {
				kind: "logical",
				op: "or",
				left,
				right: parseAnd()
			};
		}
		return left;
	}
	function parseAnd() {
		let left = parseNot();
		while (peek().type === "op" && peek().value === "and") {
			next();
			left = {
				kind: "logical",
				op: "and",
				left,
				right: parseNot()
			};
		}
		return left;
	}
	function parseNot() {
		if (peek().type === "op" && peek().value === "not") {
			next();
			return {
				kind: "not",
				operand: parseNot()
			};
		}
		return parseComparison();
	}
	function parseComparison() {
		const left = parsePrimary();
		const token = peek();
		if (token.type === "op" && [
			"eq",
			"ne",
			"gt",
			"ge",
			"lt",
			"le"
		].includes(token.value)) {
			next();
			const right = parsePrimary();
			return {
				kind: "compare",
				op: token.value,
				left,
				right
			};
		}
		if (token.type === "op" && token.value === "in") {
			next();
			expect("paren", "(");
			const values = [];
			if (!(peek().type === "paren" && peek().value === ")")) {
				values.push(parsePrimary());
				while (peek().type === "comma") {
					next();
					values.push(parsePrimary());
				}
			}
			expect("paren", ")");
			return {
				kind: "in",
				left,
				values
			};
		}
		return left;
	}
	function parsePrimary() {
		const token = peek();
		if (token.type === "paren" && token.value === "(") {
			next();
			const inner = parseOr();
			if (peek().type === "comma") throw new Error("$filter: a value list \"(a,b,c)\" cannot be the left operand. The OData v4 form is \"Field in (1,2,3)\", not \"(1,2,3) in 'Field'\".");
			expect("paren", ")");
			return inner;
		}
		if (token.type === "string") {
			next();
			return {
				kind: "literal",
				value: token.value
			};
		}
		if (token.type === "number") {
			next();
			return {
				kind: "literal",
				value: Number(token.value)
			};
		}
		if (token.type === "date") {
			next();
			return {
				kind: "literal",
				value: token.value
			};
		}
		if (token.type === "ident") {
			next();
			if (peek().type === "paren" && peek().value === "(") {
				next();
				const args = [];
				if (!(peek().type === "paren" && peek().value === ")")) {
					args.push(parseOr());
					while (peek().type === "comma") {
						next();
						args.push(parseOr());
					}
				}
				expect("paren", ")");
				return {
					kind: "call",
					name: token.value.toLowerCase(),
					args
				};
			}
			if (peek().type === "path") {
				const segments = [token.value];
				while (peek().type === "path") {
					next();
					const segment = next();
					if (segment.type !== "ident") throw new Error(`$filter: expected a property after "/" but found "${segment.value}"`);
					segments.push(segment.value);
				}
				const last = segments[segments.length - 1].toLowerCase();
				if ((last === "any" || last === "all") && peek().type === "paren" && peek().value === "(") {
					next();
					if (peek().type === "paren" && peek().value === ")") {
						next();
						return {
							kind: "lambda",
							op: last,
							nav: segments.slice(0, -1),
							variable: "",
							predicate: {
								kind: "literal",
								value: true
							}
						};
					}
					const variable = next();
					if (variable.type !== "ident" || peek().type !== "colon") throw new Error(`$filter: ${last}() needs a range variable — the form is "${segments.slice(0, -1).join("/") || "Nav"}/${last}(d: d/Field eq 1)". Found "${variable.value}${peek().value}".`);
					expect("colon");
					const predicate = parseOr();
					expect("paren", ")");
					return {
						kind: "lambda",
						op: last,
						nav: segments.slice(0, -1),
						variable: variable.value,
						predicate
					};
				}
				return {
					kind: "path",
					segments
				};
			}
			const lower = token.value.toLowerCase();
			if (lower === "true") return {
				kind: "literal",
				value: true
			};
			if (lower === "false") return {
				kind: "literal",
				value: false
			};
			if (lower === "null") return {
				kind: "literal",
				value: null
			};
			return {
				kind: "field",
				name: token.value
			};
		}
		throw new Error(`$filter: unexpected "${token.value || "end of input"}"`);
	}
	const ast = parseOr();
	if (peek().type !== "eof") throw new Error(`$filter: unexpected trailing "${peek().value}"`);
	return ast;
}
/** Case-insensitive field lookup, so `name` matches a `Name` column. */
function readField(row, name) {
	if (name in row) return row[name];
	const lower = name.toLowerCase();
	const hit = Object.keys(row).find((key) => key.toLowerCase() === lower);
	return hit ? row[hit] : void 0;
}
/** An ISO-ish date string, or a Date. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}|$)/;
function asTimestamp(value) {
	if (value instanceof Date) return value.getTime();
	if (typeof value === "string" && ISO_DATE.test(value)) {
		const time = Date.parse(value);
		return Number.isNaN(time) ? null : time;
	}
	return null;
}
function compareValues(op, left, right) {
	if (left == null || right == null) {
		if (op === "eq") return left == null && right == null;
		if (op === "ne") return !(left == null && right == null);
		return false;
	}
	const leftTime = asTimestamp(left);
	const rightTime = asTimestamp(right);
	if (leftTime != null && rightTime != null) switch (op) {
		case "eq": return leftTime === rightTime;
		case "ne": return leftTime !== rightTime;
		case "gt": return leftTime > rightTime;
		case "ge": return leftTime >= rightTime;
		case "lt": return leftTime < rightTime;
		case "le": return leftTime <= rightTime;
		default: return false;
	}
	const numeric = typeof left === "number" || typeof right === "number";
	const a = numeric ? Number(left) : String(left);
	const b = numeric ? Number(right) : String(right);
	switch (op) {
		case "eq": return a === b;
		case "ne": return a !== b;
		case "gt": return a > b;
		case "ge": return a >= b;
		case "lt": return a < b;
		case "le": return a <= b;
		default: return false;
	}
}
/**
* Resolve `A/B` against a row: a materialised value if the row already carries one
* (an `$expand`ed relation), otherwise the declared relation, joined on demand.
*/
function resolvePath(segments, row, context) {
	const head = segments[0];
	const bound = context.scope?.[head];
	let current = bound !== void 0 ? bound : void 0;
	let rest = bound !== void 0 ? segments.slice(1) : segments;
	let entity = bound !== void 0 ? void 0 : context.entity;
	if (current === void 0) current = row;
	for (const segment of rest) {
		if (current == null) return void 0;
		if (segment === "$count") return Array.isArray(current) ? current.length : current == null ? 0 : 1;
		const direct = Array.isArray(current) ? void 0 : readField(current, segment);
		if (direct !== void 0) {
			current = direct;
			entity = void 0;
			continue;
		}
		const field = entity?.relations.find((candidate) => candidate.name.toLowerCase() === segment.toLowerCase());
		if (!field?.relation || !context.readEntity) return void 0;
		const relation = field.relation;
		const localValue = readField(current, relation.localField);
		const matches = context.readEntity(relation.targetEntity).filter((target) => keyEquals(readField(target, relation.targetKey), localValue));
		current = relation.kind === "array" ? matches : matches[0] ?? null;
		entity = void 0;
	}
	return current;
}
function evaluateNode(node, row, context) {
	switch (node.kind) {
		case "literal": return node.value;
		case "field": {
			const bound = context.scope?.[node.name];
			if (bound !== void 0) return bound;
			return readField(row, node.name);
		}
		case "path": return resolvePath(node.segments, row, context);
		case "lambda": {
			const collection = node.nav.length ? resolvePath(node.nav, row, context) : row;
			const items = Array.isArray(collection) ? collection : collection == null ? [] : [collection];
			const test = (item) => Boolean(evaluateNode(node.predicate, row, {
				...context,
				scope: {
					...context.scope ?? {},
					[node.variable]: item
				}
			}));
			return node.op === "any" ? items.some(test) : items.every(test);
		}
		case "in": {
			const left = evaluateNode(node.left, row, context);
			return node.values.some((value) => compareValues("eq", left, evaluateNode(value, row, context)));
		}
		case "not": return !evaluateNode(node.operand, row, context);
		case "logical": {
			const left = Boolean(evaluateNode(node.left, row, context));
			if (node.op === "and") return left && Boolean(evaluateNode(node.right, row, context));
			return left || Boolean(evaluateNode(node.right, row, context));
		}
		case "compare": return compareValues(node.op, evaluateNode(node.left, row, context), evaluateNode(node.right, row, context));
		case "call": {
			const args = node.args.map((arg) => evaluateNode(arg, row, context));
			const text = (value) => String(value ?? "");
			switch (node.name) {
				case "contains": return text(args[0]).toLowerCase().includes(text(args[1]).toLowerCase());
				case "startswith": return text(args[0]).toLowerCase().startsWith(text(args[1]).toLowerCase());
				case "endswith": return text(args[0]).toLowerCase().endsWith(text(args[1]).toLowerCase());
				case "tolower": return text(args[0]).toLowerCase();
				case "toupper": return text(args[0]).toUpperCase();
				case "trim": return text(args[0]).trim();
				case "length": return text(args[0]).length;
				case "concat": return args.map(text).join("");
				case "indexof": return text(args[0]).indexOf(text(args[1]));
				case "year":
				case "month":
				case "day":
				case "hour":
				case "minute":
				case "second": {
					const time = asTimestamp(args[0]);
					if (time == null) return null;
					const date = new Date(time);
					switch (node.name) {
						case "year": return date.getUTCFullYear();
						case "month": return date.getUTCMonth() + 1;
						case "day": return date.getUTCDate();
						case "hour": return date.getUTCHours();
						case "minute": return date.getUTCMinutes();
						default: return date.getUTCSeconds();
					}
				}
				case "now": return (/* @__PURE__ */ new Date()).toISOString();
				case "substring": return args.length > 2 ? text(args[0]).substr(Number(args[1]), Number(args[2])) : text(args[0]).substring(Number(args[1]));
				case "substringof": return text(args[1]).toLowerCase().includes(text(args[0]).toLowerCase());
				default: throw new Error(`$filter: unsupported function "${node.name}()"`);
			}
		}
	}
}
function evaluateFilter(node, row, context = {}) {
	return Boolean(evaluateNode(node, row, context));
}
/** A bare name, an already-parsed item, or a string carrying nested options. */
function normalizeExpand(input) {
	return input.flatMap((item) => typeof item === "string" ? parseExpand(item) : [item]);
}
/** `Field desc, Other` -> orderby rules. */
function parseOrderBy(input) {
	return splitTopLevel(input, ",").map((part) => part.trim()).filter(Boolean).map((part) => {
		const [field, direction] = part.split(/\s+/);
		return {
			field,
			desc: String(direction ?? "").toLowerCase() === "desc"
		};
	});
}
/**
* Parse an `$expand` value into a tree.
*
* Tolerates everything the real app emits: embedded newlines/tabs, spaces after
* commas (`Feature($select=Id, Nama)`), a stray trailing `;`
* (`BudgetAlokasi($select=…;)`), and a single string holding several comma-separated
* expands.
*/
function parseExpand(input) {
	return splitTopLevel(Array.isArray(input) ? input.join(",") : String(input ?? ""), ",").map((part) => part.trim()).filter(Boolean).map((part) => {
		const open = part.indexOf("(");
		if (open < 0) return { name: part.trim() };
		const name = part.slice(0, open).trim();
		const body = part.slice(open + 1, part.lastIndexOf(")"));
		const item = { name };
		for (const option of splitTopLevel(body, ";")) {
			const at = option.indexOf("=");
			if (at < 0) continue;
			const key = option.slice(0, at).trim().toLowerCase();
			const value = option.slice(at + 1).trim();
			if (!value) continue;
			switch (key) {
				case "$select":
					item.select = splitTopLevel(value, ",").map((s) => s.trim()).filter(Boolean);
					break;
				case "$filter":
					item.filter = value;
					break;
				case "$orderby":
					item.orderby = parseOrderBy(value);
					break;
				case "$top":
					item.top = Number(value);
					break;
				case "$skip":
					item.skip = Number(value);
					break;
				case "$expand":
					item.expand = parseExpand(value);
					break;
				default: break;
			}
		}
		return item;
	});
}
/** Read OData options off a query string or a param object (DevExtreme sends both shapes). */
function parseQuery(input) {
	const params = /* @__PURE__ */ new Map();
	if (typeof input === "string") {
		const search = input.includes("?") ? input.slice(input.indexOf("?") + 1) : input;
		for (const [key, value] of new URLSearchParams(search)) params.set(key.toLowerCase(), value);
	} else for (const [key, value] of Object.entries(input ?? {})) if (value !== void 0 && value !== null) params.set(key.toLowerCase(), String(value));
	const query = {};
	const apply = params.get("$apply");
	if (apply) query.apply = apply;
	const filter = params.get("$filter");
	if (filter) query.filter = filter;
	const select = params.get("$select");
	if (select) query.select = select.split(",").map((s) => s.trim()).filter(Boolean);
	const expand = params.get("$expand");
	if (expand) query.expand = parseExpand(expand);
	const orderby = params.get("$orderby");
	if (orderby) query.orderby = parseOrderBy(orderby);
	const top = params.get("$top");
	if (top != null && top !== "") query.top = Number(top);
	const skip = params.get("$skip");
	if (skip != null && skip !== "") query.skip = Number(skip);
	if (String(params.get("$count") ?? "").toLowerCase() === "true") query.count = true;
	return query;
}
/**
* Run a query over an entity's rows.
*
* Order matters and is the usual source of off-by-one bugs: filter first, take
* the count from the FILTERED set, then page, then expand, then select. Counting
* before filtering (or after paging) is the classic way to break a grid's pager.
*/
function executeQuery(rows, query, context) {
	let out = [...rows];
	const filterContext = context ? {
		entity: context.entity,
		readEntity: context.readEntity
	} : {};
	if (query.apply) out = applyTransforms(out, parseApply(query.apply), (expression) => {
		const ast = parseFilter(expression);
		return (row) => evaluateFilter(ast, row, filterContext);
	}, (row, field) => field.includes("/") ? resolvePath(field.split("/"), row, filterContext) : readField(row, field));
	if (query.filter) {
		const ast = parseFilter(query.filter);
		out = out.filter((row) => evaluateFilter(ast, row, filterContext));
	}
	const total = out.length;
	if (query.orderby?.length) {
		const rules = query.orderby;
		out.sort((a, b) => {
			for (const rule of rules) {
				const left = readField(a, rule.field);
				const right = readField(b, rule.field);
				if (left === right) continue;
				if (left == null) return rule.desc ? 1 : -1;
				if (right == null) return rule.desc ? -1 : 1;
				const cmp = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right));
				if (cmp !== 0) return rule.desc ? -cmp : cmp;
			}
			return 0;
		});
	}
	const skip = Number(query.skip ?? 0);
	if (skip > 0) out = out.slice(skip);
	if (query.top != null && !Number.isNaN(query.top)) out = out.slice(0, query.top);
	if (query.expand?.length && context) {
		const items = normalizeExpand(query.expand);
		out = out.map((row) => expandRow(row, items, context));
	}
	if (query.select?.length) {
		const fields = query.select;
		out = out.map((row) => {
			const picked = {};
			for (const field of fields) {
				const value = readField(row, field);
				if (value !== void 0) picked[field] = value;
			}
			return picked;
		});
	}
	return {
		rows: out,
		total
	};
}
/**
* Are two relation keys the same row?
*
* Strictly equal, or equal as strings — so a `"1"` foreign key still joins a `1`
* primary key. That mismatch is the common case, not an exotic one: JSON seed
* files, url path segments and select-box values all hand back string keys while
* the primary key is numeric. A strict `===` join returned `null`/`[]` for those
* with no error at all, which is the worst way to be wrong.
*
* Compared as STRINGS, never coerced to numbers: `Number('007') === Number('7')`
* would join two genuinely different keys.
*
* A null/undefined key joins NOTHING — otherwise `undefined === undefined` makes a
* row with a missing FK match every target row with a missing key.
*/
function keyEquals(a, b) {
	if (a == null || b == null) return false;
	return a === b || String(a) === String(b);
}
/** Materialise the requested relations for one row, honouring each item's nested options. */
function expandRow(row, expand, context) {
	const out = { ...row };
	for (const item of expand) {
		const field = context.entity.relations.find((candidate) => candidate.name.toLowerCase() === item.name.toLowerCase());
		if (!field?.relation) continue;
		const relation = field.relation;
		const targetRows = context.readEntity(relation.targetEntity);
		const localValue = readField(row, relation.localField);
		let matches = targetRows.filter((target) => keyEquals(readField(target, relation.targetKey), localValue));
		if (item.filter || item.orderby?.length || item.top != null || item.skip != null || item.select?.length || item.expand?.length) {
			const targetEntity = context.entityOf?.(relation.targetEntity);
			matches = executeQuery(matches, {
				filter: item.filter,
				orderby: item.orderby,
				top: item.top,
				skip: item.skip,
				select: item.select,
				expand: item.expand
			}, targetEntity ? {
				entity: targetEntity,
				readEntity: context.readEntity,
				entityOf: context.entityOf
			} : void 0).rows;
		}
		out[field.name] = relation.kind === "array" ? matches : matches[0] ?? null;
	}
	return out;
}
/** `Entity(1)` / `Entity('abc')` -> the key, or null for a collection request. */
function parseKeySegment(segment) {
	const match = /\(([^)]*)\)\s*$/.exec(String(segment ?? ""));
	if (!match) return null;
	let key = match[1].trim();
	if (!key) return null;
	const quoted = /^'(.*)'$/.exec(key) ?? /^"(.*)"$/.exec(key);
	if (quoted) return decodeURIComponent(quoted[1]);
	const asNumber = Number(key);
	return Number.isNaN(asNumber) ? decodeURIComponent(key) : asNumber;
}
/** The `{ value, @odata.count }` envelope DevExtreme's ODataStore expects. */
function toODataEnvelope(result, count) {
	return {
		...count ? { "@odata.count": result.total } : {},
		value: result.rows
	};
}

//#endregion
//#region pkg/mock-db/store.ts
/** Storage keys are namespaced by base-url so two apps can't collide. */
function storeName(baseUrl, entity) {
	return `${baseUrl}::${entity}`;
}
function isIndexedDbAvailable() {
	return typeof indexedDB !== "undefined";
}
function promisify(request) {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}
/**
* Make a value safe for IndexedDB.
*
* IndexedDB persists with the STRUCTURED CLONE algorithm, which throws
* `DataCloneError` on Proxies — and a Vue `reactive()`/`ref()` object IS a Proxy.
* Apps hand store state straight to a POST all the time, so without this the very
* first realistic write blows up with an error that says nothing about Vue.
*
* structuredClone() is tried first (keeps Date, Map, Set); the JSON round-trip is
* the fallback that flattens a proxy — its `get` traps make stringify work fine.
*/
function toPlain(value) {
	try {
		return structuredClone(value);
	} catch {
		return JSON.parse(JSON.stringify(value));
	}
}
/**
* Open (and upgrade) the database. Every entity across every base-url becomes an
* object store keyed on its declared primary key, with an index per foreign key.
*
* `version` comes from the config: bumping it triggers `onupgradeneeded`, which
* drops and recreates the stores — i.e. a schema change WIPES the user's data.
* That's correct for a mock, but it is destructive and therefore logged.
*/
async function openMockDb(dbName, version, schemas) {
	if (!isIndexedDbAvailable()) throw new Error("[@mono-lit/utility/mock-db] IndexedDB is unavailable. The mock backend is browser-only — it cannot run during SSR/prerender. Mark the page client-only (Nuxt: `routeRules: { '/your-page': { ssr: false } }`).");
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName, version);
		request.onupgradeneeded = () => {
			const db = request.result;
			for (const schema of schemas) for (const entity of Object.values(schema.entities)) {
				const name = storeName(schema.baseUrl, entity.name);
				if (db.objectStoreNames.contains(name)) db.deleteObjectStore(name);
				const store = db.createObjectStore(name, { keyPath: entity.primaryKey });
				for (const field of entity.columns) if (field.foreign) store.createIndex(field.name, field.name, { unique: false });
			}
			console.warn(`[@mono-lit/utility/mock-db] "${dbName}" upgraded to v${version} — stores were recreated and existing mock data discarded.`);
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
		request.onblocked = () => reject(/* @__PURE__ */ new Error(`[@mono-lit/utility/mock-db] "${dbName}" upgrade blocked — close other tabs and reload.`));
	});
}
function createMockStore(db) {
	function transaction(name, mode) {
		return db.transaction(name, mode).objectStore(name);
	}
	return {
		async read(baseUrl, entity) {
			const name = storeName(baseUrl, entity);
			if (!db.objectStoreNames.contains(name)) return [];
			return await promisify(transaction(name, "readonly").getAll()) ?? [];
		},
		async write(baseUrl, entity, rows) {
			const name = storeName(baseUrl, entity);
			if (!db.objectStoreNames.contains(name)) return;
			const tx = db.transaction(name, "readwrite");
			const store = tx.objectStore(name);
			store.clear();
			for (const row of rows) store.put(toPlain(row));
			await new Promise((resolve, reject) => {
				tx.oncomplete = () => resolve();
				tx.onerror = () => reject(tx.error);
				tx.onabort = () => reject(tx.error);
			});
		},
		async insert(baseUrl, entity, row) {
			const name = storeName(baseUrl, entity);
			const store = transaction(name, "readwrite");
			const keyPath = String(store.keyPath);
			const record = toPlain({ ...row });
			if (record[keyPath] == null) record[keyPath] = (await promisify(transaction(name, "readonly").getAll()) ?? []).reduce((highest, current) => {
				const value = Number(current?.[keyPath]);
				return Number.isFinite(value) && value > highest ? value : highest;
			}, 0) + 1;
			await promisify(transaction(name, "readwrite").put(record));
			return record;
		},
		async update(baseUrl, entity, key, changes, options) {
			const name = storeName(baseUrl, entity);
			const existing = await promisify(transaction(name, "readonly").get(key));
			if (!existing) return null;
			const store = transaction(name, "readwrite");
			const keyPath = String(store.keyPath);
			const next = toPlain({
				...options?.merge ?? true ? existing : {},
				...changes,
				[keyPath]: existing[keyPath]
			});
			await promisify(store.put(next));
			return next;
		},
		async remove(baseUrl, entity, key) {
			const name = storeName(baseUrl, entity);
			if (!await promisify(transaction(name, "readonly").get(key))) return false;
			await promisify(transaction(name, "readwrite").delete(key));
			return true;
		},
		async clear() {
			for (const name of Array.from(db.objectStoreNames)) await promisify(transaction(name, "readwrite").clear());
		},
		close() {
			db.close();
		}
	};
}

//#endregion
//#region pkg/mock-db/index.ts
const DEFAULTS = {
	dbName: "mono-mock",
	version: 1,
	seedCount: 10,
	seedRandom: 1
};
let instance = null;
/**
* Build the runtime for a config. Idempotent per page — `monoMockDb()` caches it,
* so the schema is parsed and IndexedDB opened once.
*/
function createMockDb(config) {
	const dbName = config.dbName ?? DEFAULTS.dbName;
	const version = config.version ?? DEFAULTS.version;
	const seedCount = config.seedCount ?? DEFAULTS.seedCount;
	const seedRandom = config.seedRandom ?? DEFAULTS.seedRandom;
	const { schemas, errors } = parseMockSchema(config);
	if (errors.length) for (const error of errors) console.error(`[@mono-lit/utility/mock-db] schema error in "${error.baseUrl}" -> ${error.entity}${error.field ? `.${error.field}` : ""}: ${error.message}`);
	let store = null;
	/**
	* Split a write payload into the row's own columns and any nested child
	* collections (an OData **deep insert**).
	*
	* The app POSTs a header with its details inline:
	*   { Nama, CompanyId, BudgetAlokasi: [ {...}, {...} ] }
	* A real OData service creates those children as rows in their OWN entity set.
	* Storing the array as a blob column instead means a later
	* `GET /DTO_BudgetAlokasi` returns nothing while production returns the children —
	* so the mock would quietly disagree with the backend.
	*/
	function splitDeepInsert(entity, payload) {
		const own = {};
		const children = [];
		for (const [key, value] of Object.entries(payload)) {
			const field = entity.relations.find((candidate) => candidate.name.toLowerCase() === key.toLowerCase());
			if (field?.relation?.kind === "array" && Array.isArray(value)) {
				children.push({
					relation: field.relation,
					rows: value
				});
				continue;
			}
			own[key] = value;
		}
		return {
			own,
			children
		};
	}
	/** Insert the nested rows into their own entity set, pointing them at the parent. */
	async function writeChildren(schema, entity, parent, children) {
		if (!store || !children.length) return;
		for (const { relation, rows } of children) {
			const target = schema.entities[relation.targetEntity];
			if (!target) continue;
			const parentValue = parent[relation.localField];
			for (const child of rows) await store.insert(schema.baseUrl, target.name, {
				...child,
				[relation.targetKey]: parentValue
			});
		}
	}
	async function hydrate(force = false) {
		if (!isIndexedDbAvailable()) return;
		store = createMockStore(await openMockDb(dbName, version, schemas));
		for (const schema of schemas) {
			const seed = generateSeed(schema, {
				count: seedCount,
				random: seedRandom
			});
			for (const [entityName, rows] of Object.entries(seed)) {
				if ((force ? [] : await store.read(schema.baseUrl, entityName)).length) continue;
				await store.write(schema.baseUrl, entityName, rows);
			}
		}
	}
	const ready = hydrate().catch((error) => {
		console.error("[@mono-lit/utility/mock-db] failed to open IndexedDB:", error);
	});
	async function readEntityRows(baseUrl, entity) {
		if (!store) return [];
		return store.read(baseUrl, entity);
	}
	async function request(input) {
		await ready;
		const fail = (statusCode, message) => ({
			data: null,
			statusCode,
			error: {
				message,
				stack: "",
				response: null
			}
		});
		if (!store) return fail(503, "[@mono-lit/utility/mock-db] IndexedDB is not available");
		const route = matchMockRoute(schemas, input.url);
		if (!route) return fail(404, `[@mono-lit/utility/mock-db] no mock entity for "${input.url}"`);
		const { schema, entity, rest } = route;
		const method = String(input.method ?? "GET").toUpperCase();
		const segments = rest.split("/");
		const inlineKey = parseKeySegment(segments[0] ?? "");
		const pathKey = segments[1] != null && segments[1] !== "" ? decodeURIComponent(segments[1]) : null;
		const urlKey = inlineKey ?? (pathKey != null ? coerceKey(pathKey) : null);
		const body = normalizePayload(input.payload);
		const row = body.ok ? body.row : {};
		const rawKey = urlKey ?? (input.key != null ? coerceKey(String(input.key)) : null) ?? row[entity.primaryKey] ?? null;
		try {
			if (method === "GET") {
				const query = input.query ?? parseQuery(input.params ?? extractQuery(input.url));
				const rows = await readEntityRows(schema.baseUrl, entity.name);
				if (rawKey != null) {
					const match = rows.find((row) => row[entity.primaryKey] === rawKey);
					if (!match) return fail(404, `[@mono-lit/utility/mock-db] ${entity.name}(${rawKey}) not found`);
					return {
						data: match,
						statusCode: 200,
						error: null
					};
				}
				const needsRelations = Boolean(query.expand?.length) || Boolean(query.filter);
				const related = {};
				if (needsRelations) {
					const seen = /* @__PURE__ */ new Set();
					const queue = [entity.name];
					while (queue.length) {
						const current = queue.shift();
						if (seen.has(current)) continue;
						seen.add(current);
						const currentEntity = schema.entities[current];
						if (!currentEntity) continue;
						for (const field of currentEntity.relations) {
							const target = field.relation.targetEntity;
							if (!related[target]) related[target] = await readEntityRows(schema.baseUrl, target);
							queue.push(target);
						}
					}
				}
				return {
					data: toODataEnvelope(executeQuery(rows, query, {
						entity,
						readEntity: (name) => related[name] ?? [],
						entityOf: (name) => schema.entities[name]
					}), Boolean(query.count)),
					statusCode: 200,
					error: null
				};
			}
			if (!body.ok && method !== "GET" && method !== "DELETE") return fail(400, `[@mono-lit/utility/mock-db] ${method} ${body.message}`);
			if (method === "POST") {
				const { own, children } = splitDeepInsert(entity, row);
				const created = await store.insert(schema.baseUrl, entity.name, own);
				await writeChildren(schema, entity, created, children);
				return {
					data: created,
					statusCode: 201,
					error: null
				};
			}
			if (method === "PUT" || method === "PATCH") {
				if (rawKey == null) return fail(400, `[@mono-lit/utility/mock-db] ${method} needs a key — put it in the url ("${entity.name}(1)") or send it as payload.keyValue.`);
				const { own, children } = splitDeepInsert(entity, row);
				const updated = await store.update(schema.baseUrl, entity.name, rawKey, own, { merge: method === "PATCH" });
				if (!updated) return fail(404, `[@mono-lit/utility/mock-db] ${entity.name}(${rawKey}) not found`);
				await writeChildren(schema, entity, updated, children);
				return {
					data: updated,
					statusCode: 200,
					error: null
				};
			}
			if (method === "DELETE") {
				if (rawKey == null) return fail(400, `[@mono-lit/utility/mock-db] DELETE needs a key — put it in the url ("${entity.name}(1)") or send it as payload.keyValue.`);
				if (!await store.remove(schema.baseUrl, entity.name, rawKey)) return fail(404, `[@mono-lit/utility/mock-db] ${entity.name}(${rawKey}) not found`);
				return {
					data: null,
					statusCode: 200,
					error: null
				};
			}
			return fail(405, `[@mono-lit/utility/mock-db] ${method} is not supported`);
		} catch (error) {
			return fail(500, error?.message ?? String(error));
		}
	}
	return {
		ready,
		schemas,
		matches(url) {
			return Boolean(matchMockRoute(schemas, url));
		},
		request,
		async reset() {
			await ready;
			if (!store) return;
			await store.clear();
			await hydrate(true);
		},
		async export() {
			await ready;
			const out = {};
			if (!store) return out;
			for (const schema of schemas) {
				out[schema.baseUrl] = {};
				for (const entity of Object.values(schema.entities)) out[schema.baseUrl][entity.name] = await store.read(schema.baseUrl, entity.name);
			}
			return out;
		},
		async import(data) {
			await ready;
			if (!store) return;
			for (const [baseUrl, tables] of Object.entries(data ?? {})) for (const [entityName, rows] of Object.entries(tables ?? {})) await store.write(baseUrl, entityName, rows);
		}
	};
}
/**
* Coerce a request body into a storable row, or explain why it isn't one.
*
* REST callers reach us through `monoFetch`, whose options are `RequestInit` — so
* `body` is normally `JSON.stringify(obj)`, a STRING. Handing that to the store
* spreads it character-by-character into `{"0":"{","1":"\"",…}` and writes that
* garbage row with a 201. Normalising here (rather than only in the wrapper) means
* no caller can corrupt the store, whichever entry point it came through.
*/
function normalizePayload(payload) {
	let value = payload;
	if (typeof value === "string") {
		const text = value.trim();
		if (!text) return {
			ok: true,
			row: {}
		};
		try {
			value = JSON.parse(text);
		} catch {
			return {
				ok: false,
				message: "body is a string but not valid JSON"
			};
		}
	}
	if (value == null) return {
		ok: true,
		row: {}
	};
	if (typeof value !== "object" || Array.isArray(value)) return {
		ok: false,
		message: `body must be an object, received ${Array.isArray(value) ? "an array" : typeof value}`
	};
	const tag = Object.prototype.toString.call(value);
	if (tag !== "[object Object]") return {
		ok: false,
		message: `body must be a plain object, received ${tag.slice(8, -1)}`
	};
	return {
		ok: true,
		row: value
	};
}
/** `?a=1` off a url, so a caller can pass the whole url instead of params. */
function extractQuery(url) {
	const at = String(url ?? "").indexOf("?");
	return at >= 0 ? url.slice(at + 1) : "";
}
/** Path keys arrive as strings; primary keys are usually numbers. */
function coerceKey(value) {
	const asNumber = Number(value);
	return Number.isNaN(asNumber) || value.trim() === "" ? value : asNumber;
}
/**
* The page-wide mock backend, built from `mono.config.ts` `mockIndexedDB`.
* Returns null when the app declares no mock — every caller must treat that as
* "go to the network".
*/
function monoMockDb(config) {
	if (instance) return instance;
	if (!config?.schema || !Object.keys(config.schema).length) return null;
	instance = createMockDb(config);
	return instance;
}
/** Test seam — drops the cached instance. */
function resetMonoMockDb() {
	instance = null;
}

//#endregion
export { isIndexedDbAvailable as a, executeQuery as c, parseKeySegment as d, parseQuery as f, parseApply as g, applyTransforms as h, createMockStore as i, parseExpand as l, tokenize as m, monoMockDb as n, openMockDb as o, toODataEnvelope as p, resetMonoMockDb as r, evaluateFilter as s, createMockDb as t, parseFilter as u };