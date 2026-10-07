//#region src/search/field-path.ts
/** Whether `field` is a path expression (contains `.` or `[`) vs a plain key. */
function isPath(field) {
	return typeof field === "string" && /[.[]/.test(field);
}
var parseCache = /* @__PURE__ */ new Map();
/** Parse a path field into ordered segments (cached). Plain keys → one `key` segment. */
function parseFieldPath(field) {
	const cached = parseCache.get(field);
	if (cached) return cached;
	const segments = [];
	let hasWildcard = false;
	for (const token of field.split(".")) {
		if (token === "") continue;
		if (token === "[*]") {
			segments.push({ kind: "wildcard" });
			hasWildcard = true;
		} else {
			const m = /^\[(\d+)\]$/.exec(token);
			if (m) segments.push({
				kind: "index",
				index: Number(m[1])
			});
			else segments.push({
				kind: "key",
				name: token
			});
		}
	}
	const parsed = {
		segments,
		hasWildcard,
		raw: field
	};
	parseCache.set(field, parsed);
	return parsed;
}
/**
* Resolve a path field against a row. Returns a **scalar** when the path has no
* wildcard, or a flattened **array** of matches when it does (`User.[*].Name` →
* `string[]`). Missing links yield `undefined` (scalar) / are skipped (wildcard).
*/
function getFieldValue(row, field) {
	const { segments, hasWildcard } = parseFieldPath(field);
	let current = [row];
	for (const seg of segments) {
		const next = [];
		for (const v of current) {
			if (v == null) continue;
			if (seg.kind === "key") next.push(v[seg.name]);
			else if (seg.kind === "index") {
				if (Array.isArray(v)) next.push(v[seg.index]);
			} else if (Array.isArray(v)) for (const el of v) next.push(el);
		}
		current = next;
	}
	if (hasWildcard) return current.filter((v) => v !== void 0);
	return current[0];
}
/**
* Write `value` into `obj` at a dot/index path, creating intermediate `{}`/`[]`
* as needed. Wildcard paths are ambiguous to write — a `console.warn` + no-op.
*/
function setFieldValue(obj, field, value) {
	const { segments, hasWildcard } = parseFieldPath(field);
	if (hasWildcard) {
		console.warn(`[@mono-lit/helper] setFieldValue: cannot write a wildcard path "${field}" — skipped.`);
		return;
	}
	if (!segments.length) return;
	let cursor = obj;
	for (let i = 0; i < segments.length - 1; i++) {
		const seg = segments[i];
		const wantArray = segments[i + 1].kind === "index";
		const at = seg.kind === "index" ? seg.index : seg.name;
		let child = cursor[at];
		if (child == null || typeof child !== "object") {
			child = wantArray ? [] : {};
			cursor[at] = child;
		}
		cursor = child;
	}
	const last = segments[segments.length - 1];
	const at = last.kind === "index" ? last.index : last.name;
	cursor[at] = value;
}
/**
* Project a row down to the given key paths, **rebuilding the nested shape**.
*
* This is what `<mono-table-checkbox>`'s `key-value` produces, so a selection can
* be handed to an API in the shape the API expects rather than as flat values:
*
* ```ts
* projectFields(row, ['Id'])                            // { Id: 8 }
* projectFields(row, ['Company.Name'])                  // { Company: { Name: 'Hey' } }
* projectFields(row, ['Transaction.[*].Id'])            // { Transaction: [{ Id: 4 }] }
* projectFields(row, ['Company.Name', 'Transaction.[*].Id'])
* //                → { Company: { Name: 'Hey' }, Transaction: [{ Id: 4 }] }
* ```
*
* Separate from {@link setFieldValue}, which deliberately refuses wildcard paths
* (there is no single place to write to). Here a wildcard is not ambiguous at all:
* it MAPS over the source array, emitting one projected element per entry — so the
* result mirrors the source's own cardinality. Several paths merge into one object,
* and an empty key list means "the row itself".
*/
function projectFields(row, keys) {
	if (!keys.length) return row;
	const out = {};
	for (const key of keys) {
		const { segments } = parseFieldPath(key);
		if (segments.length) assign(out, row, segments);
	}
	return out;
}
/**
* Copy the value `source` holds at `segments` into `target`, creating only the
* containers the path needs. Recursive rather than iterative because a wildcard
* forks into N independent sub-writes.
*/
function assign(target, source, segments) {
	const [seg, ...rest] = segments;
	if (source == null || seg.kind !== "key") return;
	const name = seg.name;
	const value = source[name];
	if (!rest.length) {
		target[name] = value;
		return;
	}
	if (rest[0].kind === "wildcard" || rest[0].kind === "index") {
		if (!Array.isArray(value)) return;
		const tail = rest.slice(1);
		const list = Array.isArray(target[name]) ? target[name] : [];
		target[name] = list;
		const indices = rest[0].kind === "index" ? [rest[0].index] : value.map((_, i) => i);
		for (const i of indices) {
			if (i < 0 || i >= value.length) continue;
			list[i] ??= {};
			if (tail.length) assign(list[i], value[i], tail);
		}
		return;
	}
	const child = target[name] ?? {};
	target[name] = child;
	assign(child, value, rest);
}
/**
* Merge a staged `patch` (keys may be path fields) into a **clone** of `row`.
* Path keys nest via {@link setFieldValue}; plain keys are set directly. The
* original row is never mutated. Used by the client (array/optimistic) save path.
*/
function mergePatch(row, patch) {
	const clone = typeof structuredClone === "function" ? structuredClone(row) : JSON.parse(JSON.stringify(row));
	for (const [field, value] of Object.entries(patch)) if (isPath(field)) setFieldValue(clone, field, value);
	else clone[field] = value;
	return clone;
}
/**
* OData selector for `$orderby` / `$select` / nav column filters — dotted path
* with `.` → `/` (`Job.Name` → `Job/Name`). Returns `null` when the path has any
* index/wildcard segment (not expressible as a plain selector); the caller warns
* and skips.
*/
function toODataSelector(field) {
	const { segments } = parseFieldPath(field);
	const parts = [];
	for (const seg of segments) {
		if (seg.kind !== "key") return null;
		parts.push(seg.name);
	}
	return parts.join("/");
}
/**
* Quote/serialize a value as an OData literal (numbers/bools bare, strings quoted
* with `''` escaping). Exported so `mono-filter-builder` shares one set of quoting
* rules instead of restating them.
*/
function odataLiteral(value) {
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	return `'${String(value ?? "").replace(/'/g, "''")}'`;
}
/** Map a devextreme operator token to its OData comparison keyword. */
function odataComparison(op) {
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
/**
* Build a devextreme filter clause for a (possibly path) field.
*
* - plain / dotted-nav → a `[selector, op, value]` triple (`['Job/Name','contains','x']`),
*   which devextreme serializes to a nav filter.
* - wildcard → a single wrapped raw lambda clause
*   (`["User/any(d: contains(d/Name,'x'))"]`) — the raw-string passthrough devextreme
*   filter arrays honor. Slots into OR/AND groups as one group member.
*
* Returns `null` when the field can't be expressed (a second wildcard, or an
* index segment mixed into a remote path); the caller warns + skips.
*/
function toODataClause(field, op, value) {
	if (!isPath(field)) return [
		field,
		op,
		value
	];
	const { segments, hasWildcard } = parseFieldPath(field);
	if (!hasWildcard) {
		const selector = toODataSelector(field);
		return selector ? [
			selector,
			op,
			value
		] : null;
	}
	const wildAt = segments.findIndex((s) => s.kind === "wildcard");
	const before = segments.slice(0, wildAt);
	const after = segments.slice(wildAt + 1);
	if (before.some((s) => s.kind !== "key") || after.some((s) => s.kind !== "key")) {
		console.warn(`[@mono-lit/helper] toODataClause: unsupported path "${field}" (index or 2nd wildcard).`);
		return null;
	}
	const coll = before.map((s) => s.name).join("/");
	const inner = "d/" + after.map((s) => s.name).join("/");
	const lit = odataLiteral(value);
	let body;
	if (op === "contains" || op === "startswith" || op === "endswith") body = `${op}(${inner},${lit})`;
	else {
		const cmp = odataComparison(op);
		if (!cmp) {
			console.warn(`[@mono-lit/helper] toODataClause: unsupported operator "${op}" for wildcard "${field}".`);
			return null;
		}
		body = `${inner} ${cmp} ${lit}`;
	}
	return [`${coll}/any(d: ${body})`];
}
//#endregion
export { parseFieldPath as a, toODataClause as c, odataLiteral as i, toODataSelector as l, isPath as n, projectFields as o, mergePatch as r, setFieldValue as s, getFieldValue as t };
