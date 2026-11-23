//#region pkg/mock-db/schema.ts
const FIELD_TYPES = [
	"number",
	"string",
	"boolean",
	"date",
	"object",
	"array"
];
/** `object|userId->users:id` -> the relation half, or null when it isn't one. */
function parseRelationModifier(modifier, kind) {
	const match = /^([A-Za-z0-9_$]+)\s*->\s*([A-Za-z0-9_$]+)\s*:\s*([A-Za-z0-9_$]+)$/.exec(modifier);
	if (!match) return null;
	if (kind !== "object" && kind !== "array") return null;
	return {
		localField: match[1],
		targetEntity: match[2],
		targetKey: match[3],
		kind
	};
}
/** Parse one `'<type>|<modifier>'` declaration. Throws with the field name attached. */
function parseField(name, declaration) {
	const raw = String(declaration ?? "").trim();
	if (!raw) throw new Error(`field "${name}": empty declaration`);
	const [typePart, ...modifierParts] = raw.split("|");
	const type = String(typePart ?? "").trim();
	if (!FIELD_TYPES.includes(type)) throw new Error(`field "${name}": unknown type "${type}" (expected ${FIELD_TYPES.join(" | ")})`);
	const field = {
		name,
		type,
		primary: false,
		foreign: false
	};
	for (const part of modifierParts) {
		const modifier = part.trim();
		if (!modifier) continue;
		if (modifier === "primary") {
			field.primary = true;
			continue;
		}
		if (modifier === "foreign") {
			field.foreign = true;
			continue;
		}
		const relation = parseRelationModifier(modifier, type);
		if (!relation) throw new Error(`field "${name}": bad modifier "${modifier}" — expected primary, foreign, or a relation like "object|userId->users:id" (relations need type object or array)`);
		field.relation = relation;
	}
	if (field.relation && field.primary) throw new Error(`field "${name}": a relation cannot also be the primary key`);
	return field;
}
function parseEntity(name, entity) {
	const declarations = entity?.fields ?? {};
	const fields = Object.entries(declarations).map(([fieldName, declaration]) => parseField(fieldName, declaration));
	const primaries = fields.filter((f) => f.primary);
	if (primaries.length === 0) throw new Error(`entity "${name}": no primary key (mark one field "…|primary")`);
	if (primaries.length > 1) throw new Error(`entity "${name}": ${primaries.length} primary keys (${primaries.map((f) => f.name).join(", ")}) — exactly one is required`);
	const relations = fields.filter((f) => f.relation);
	return {
		name,
		fields,
		columns: fields.filter((f) => !f.relation),
		relations,
		primaryKey: primaries[0].name,
		seed: entity?.seed
	};
}
/**
* Parse every base-url group. Collects errors instead of throwing on the first
* one, so `mono db validate` can report them all in a single pass.
*/
function parseMockSchema(config) {
	const schemas = [];
	const errors = [];
	for (const [baseUrl, entityMap] of Object.entries(config?.schema ?? {})) {
		const entities = {};
		for (const [entityName, entity] of Object.entries(entityMap ?? {})) try {
			entities[entityName] = parseEntity(entityName, entity);
		} catch (error) {
			errors.push({
				baseUrl,
				entity: entityName,
				message: error?.message ?? String(error)
			});
		}
		for (const entity of Object.values(entities)) for (const field of entity.relations) {
			const relation = field.relation;
			const target = entities[relation.targetEntity];
			if (!target) {
				errors.push({
					baseUrl,
					entity: entity.name,
					field: field.name,
					message: `relation points at unknown entity "${relation.targetEntity}"`
				});
				continue;
			}
			if (!entity.fields.some((f) => f.name === relation.localField)) errors.push({
				baseUrl,
				entity: entity.name,
				field: field.name,
				message: `relation reads local field "${relation.localField}", which this entity does not declare`
			});
			if (!target.fields.some((f) => f.name === relation.targetKey)) errors.push({
				baseUrl,
				entity: entity.name,
				field: field.name,
				message: `relation reads "${relation.targetEntity}.${relation.targetKey}", which that entity does not declare`
			});
		}
		schemas.push({
			baseUrl,
			entities
		});
	}
	return {
		schemas,
		errors
	};
}
/** Strip leading/trailing slashes so `/a/` and `a` compare equal. */
function normalizeSegment(value) {
	return String(value ?? "").replace(/^\/+|\/+$/g, "");
}
/**
* Find the schema whose base-url this request url belongs to, and the entity
* within it. Matches on path segments (never a bare substring), so a base-url of
* `flow` cannot swallow `/flowers/1`.
*
* Accepts absolute urls, and urls where the base-url is only part of the path
* (e.g. `https://host/api/my-mock/users`).
*/
function matchMockRoute(schemas, url) {
	let path = String(url ?? "");
	path = path.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]+/i, "");
	path = path.split("?")[0].split("#")[0];
	const segments = normalizeSegment(path).split("/").filter(Boolean);
	if (!segments.length) return null;
	for (const schema of schemas) {
		const baseSegments = normalizeSegment(schema.baseUrl).split("/").filter(Boolean);
		if (!baseSegments.length) continue;
		const at = indexOfSequence(segments, baseSegments);
		if (at < 0) continue;
		const after = segments.slice(at + baseSegments.length);
		if (!after.length) continue;
		const entityName = after[0].replace(/\(.*\)$/, "");
		const entity = schema.entities[entityName];
		if (!entity) continue;
		return {
			schema,
			entity,
			rest: after.join("/")
		};
	}
	return null;
}
/** Index of `needle` inside `haystack`, comparing whole segments. */
function indexOfSequence(haystack, needle) {
	outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
		for (let j = 0; j < needle.length; j++) if (haystack[i + j] !== needle[j]) continue outer;
		return i;
	}
	return -1;
}

//#endregion
//#region pkg/mock-db/generate.ts
/** mulberry32 — small, fast, seedable. We need repeatability, not cryptography. */
function createRandom(seed) {
	let state = seed >>> 0 || 1;
	return function random() {
		state |= 0;
		state = state + 1831565813 | 0;
		let t = Math.imul(state ^ state >>> 15, 1 | state);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
const WORDS = [
	"alpha",
	"bravo",
	"charlie",
	"delta",
	"echo",
	"foxtrot",
	"golf",
	"hotel",
	"india",
	"juliet",
	"kilo",
	"lima",
	"mike",
	"november",
	"oscar",
	"papa"
];
function titleCase(value) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}
/**
* A value for one column. Name-aware: a field called `email` should look like an
* email, otherwise generated data is useless for eyeballing a UI.
*/
function generateValue(field, index, random) {
	const name = field.name.toLowerCase();
	const word = WORDS[Math.floor(random() * WORDS.length)] ?? "alpha";
	switch (field.type) {
		case "number": return field.foreign ? 0 : Math.floor(random() * 1e3);
		case "boolean": return random() > .5;
		case "date": return new Date(Date.UTC(2025, 0, 1) + index * 864e5).toISOString();
		case "string":
			if (name.includes("email")) return `${word}${index + 1}@example.com`;
			if (name.includes("name") || name.includes("title")) return `${titleCase(word)} ${index + 1}`;
			if (name.includes("phone")) return `08${Math.floor(random() * 1e10).toString().padStart(10, "0")}`;
			if (name.includes("url") || name.includes("link")) return `https://example.com/${word}/${index + 1}`;
			if (name.includes("icon")) return `i-mdi-${word}`;
			return `${titleCase(word)} ${index + 1}`;
		case "object": return {};
		case "array": return [];
		default: return null;
	}
}
/**
* Topologically order entities so every parent is generated before the children
* that point at it — otherwise a foreign key would reference rows that don't
* exist yet. Cycles fall back to declaration order (a self-referencing FK just
* gets a key from an already-generated row of the same entity).
*/
function orderEntitiesByDependency(entities) {
	const byName = new Map(entities.map((entity) => [entity.name, entity]));
	const ordered = [];
	const done = /* @__PURE__ */ new Set();
	const visiting = /* @__PURE__ */ new Set();
	const visit = (entity) => {
		if (done.has(entity.name) || visiting.has(entity.name)) return;
		visiting.add(entity.name);
		for (const field of entity.relations) {
			const relation = field.relation;
			if (relation.kind !== "object") continue;
			const parent = byName.get(relation.targetEntity);
			if (parent && parent.name !== entity.name) visit(parent);
		}
		visiting.delete(entity.name);
		done.add(entity.name);
		ordered.push(entity);
	};
	for (const entity of entities) visit(entity);
	return ordered;
}
/**
* Build the seed for one base-url group.
*
* An entity's explicit `seed` wins outright: a generator cannot invent
* enum-like columns or a serialized graph, so anything an app parses must be
* supplied as fixtures.
*/
function generateSeed(schema, options = {}) {
	const count = Math.max(0, options.count ?? 10);
	const random = createRandom(options.random ?? 1);
	const tables = {};
	const ordered = orderEntitiesByDependency(Object.values(schema.entities));
	for (const entity of ordered) {
		if (entity.seed) {
			tables[entity.name] = entity.seed.map((row) => ({ ...row }));
			continue;
		}
		const rows = [];
		for (let index = 0; index < count; index++) {
			const row = {};
			for (const field of entity.columns) row[field.name] = field.primary ? index + 1 : generateValue(field, index, random);
			rows.push(row);
		}
		for (const field of entity.relations) {
			const relation = field.relation;
			if (relation.kind !== "object") continue;
			const parentRows = tables[relation.targetEntity];
			if (!parentRows?.length) continue;
			if (!entity.columns.find((column) => column.name === relation.localField)) continue;
			rows.forEach((row, index) => {
				const parent = parentRows[index % parentRows.length];
				row[relation.localField] = parent[relation.targetKey];
			});
		}
		tables[entity.name] = rows;
	}
	return tables;
}

//#endregion
export { normalizeSegment as a, matchMockRoute as i, generateSeed as n, parseField as o, orderEntitiesByDependency as r, parseMockSchema as s, createRandom as t };