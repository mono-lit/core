//#region src/import/coerce.ts
/**
* Normalise a header for lookup: NBSP → space, drop dots/underscores (`No. Dok`
* and `No_Dok` should both find `No Dok`), collapse whitespace, lowercase.
*/
function normalizeHeader(value) {
	return String(value ?? "").replace(/\u00A0/g, " ").replace(/[._]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}
/** Default normalisation for key comparison — forgiving about spacing and case. */
function normalizeKeyValue(value) {
	return String(value ?? "").replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}
/** Read a display string out of whatever ExcelJS put in a cell. */
function cellText(value) {
	if (value == null) return "";
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	if (value instanceof Date) return value.toISOString();
	const v = value;
	if (Array.isArray(v.richText)) return v.richText.map((r) => r.text).join("");
	if (v.text != null) return String(v.text);
	if (v.result != null) return String(v.result);
	if (v.hyperlink != null && v.text == null) return String(v.hyperlink);
	return String(value);
}
/**
* Parse a number written in an unknown locale.
*
* `'auto'` infers the separators: with both `.` and `,` present the **rightmost**
* is the decimal point; with only one, its position decides — exactly three
* trailing digits (or several occurrences) means thousands grouping, otherwise
* it's a decimal point. So `1.234` is one thousand two hundred, while `1.23` is
* one and a bit. Returns `null` when the text isn't a number at all.
*/
function parseNumber(raw, mode = "auto", allowNegative = true) {
	if (raw == null) return null;
	if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
	const original = String(raw).replace(/\u00A0/g, " ").trim();
	if (!original || !/[0-9]/.test(original)) return null;
	const parenthesised = /^\(.*\)$/.test(original);
	let s = original.replace(/[()]/g, "");
	const negative = parenthesised || /^-/.test(s);
	s = s.replace(/[^\d.,]/g, "");
	if (!s) return null;
	let groupSep = null;
	let decimalSep = null;
	if (mode === "us") {
		groupSep = ",";
		decimalSep = ".";
	} else if (mode === "eu") {
		groupSep = ".";
		decimalSep = ",";
	} else {
		const lastDot = s.lastIndexOf(".");
		const lastComma = s.lastIndexOf(",");
		if (lastDot === -1 && lastComma === -1) {} else if (lastDot !== -1 && lastComma !== -1) if (lastDot > lastComma) {
			decimalSep = ".";
			groupSep = ",";
		} else {
			decimalSep = ",";
			groupSep = ".";
		}
		else {
			const only = lastDot !== -1 ? "." : ",";
			const pos = only === "." ? lastDot : lastComma;
			const trailing = s.length - pos - 1;
			if (s.split(only).length - 1 > 1) groupSep = only;
			else if (trailing === 3) groupSep = only;
			else decimalSep = only;
		}
	}
	if (groupSep) s = s.split(groupSep).join("");
	if (decimalSep) s = s.replace(decimalSep, ".");
	if (!/^\d+(\.\d+)?$/.test(s)) return null;
	const n = Number(s);
	if (!Number.isFinite(n)) return null;
	if (negative) {
		if (!allowNegative) return null;
		return -n;
	}
	return n;
}
/** Parse a date from a Date, an ISO-ish string, or a spreadsheet serial number. */
function parseDate(raw) {
	if (raw == null || raw === "") return null;
	if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw;
	if (typeof raw === "number" && Number.isFinite(raw)) {
		const ms = Math.round((raw - 25569) * 86400 * 1e3);
		const d = new Date(ms);
		return Number.isNaN(d.getTime()) ? null : d;
	}
	const text = String(raw).trim();
	if (!text) return null;
	const dmy = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(text);
	if (dmy) {
		const [, d, m, y] = dmy;
		const date = new Date(Number(y), Number(m) - 1, Number(d));
		return Number.isNaN(date.getTime()) ? null : date;
	}
	const parsed = new Date(text);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}
var TRUE_WORDS = new Set([
	"true",
	"yes",
	"y",
	"1",
	"ya",
	"benar",
	"x",
	"✓"
]);
var FALSE_WORDS = new Set([
	"false",
	"no",
	"n",
	"0",
	"tidak",
	"salah",
	""
]);
/** Parse a boolean from the many things a human types into a yes/no column. */
function parseBoolean(raw) {
	if (typeof raw === "boolean") return raw;
	if (raw == null) return null;
	const text = String(raw).trim().toLowerCase();
	if (TRUE_WORDS.has(text)) return true;
	if (FALSE_WORDS.has(text)) return false;
	return null;
}
/**
* Coerce one cell for a declared column type. `undefined` means "unparseable —
* skip this cell" so a stray `-` in a number column can't stage `NaN`.
*/
function coerceValue(raw, type, opts = {}) {
	const text = cellText(raw);
	switch (type) {
		case "number": {
			const n = parseNumber(raw, opts.numberFormat ?? "auto", opts.allowNegative ?? true);
			return n === null ? void 0 : n;
		}
		case "date": {
			const d = parseDate(raw instanceof Date || typeof raw === "number" ? raw : text);
			return d === null ? void 0 : d;
		}
		case "boolean": {
			const b = parseBoolean(text);
			return b === null ? void 0 : b;
		}
		default: return text.trim();
	}
}
/**
* Whether a staged value would actually change the row. Numbers are compared
* numerically so a stored `5000` isn't "changed" by a sheet's `"5.000"`, and
* dates by timestamp so two equal instants don't churn.
*/
function isSameValue(current, next, type) {
	if (type === "number") {
		const a = parseNumber(current, "auto");
		const b = typeof next === "number" ? next : parseNumber(next, "auto");
		return a !== null && b !== null && a === b;
	}
	if (type === "date") {
		const a = parseDate(current);
		const b = parseDate(next);
		return !!a && !!b && a.getTime() === b.getTime();
	}
	if (type === "boolean") return Boolean(current) === Boolean(next);
	if (current == null && (next === "" || next == null)) return true;
	return String(current ?? "") === String(next ?? "");
}
//#endregion
//#region src/import/match.ts
/**
* Pairing a sheet row with a table row.
*
* Real spreadsheets are lossy: a column gets deleted, a code is blank on some
* rows, a name is spelled differently. So instead of demanding one exact
* composite key, every non-empty **subset** of the declared key fields is
* indexed, and a row is matched on the strongest subset that resolves to
* exactly one candidate. A weaker subset is only consulted when the stronger
* ones can't be built (a blank cell) or find nothing.
*
* When a subset resolves to *several* rows the match is reported **ambiguous**
* rather than guessed at — quietly picking the first would corrupt data in a
* way nobody notices until much later.
*
* Ported from `use-import-excel.ts` (`buildAllSubsets` / `buildIndexForScheme`).
*/
/**
* Every non-empty subset of `match` with at least `minFields` legs, ordered
* strongest (most legs) first.
*
* Bit-counting rather than recursion: with `n` legs there are `2^n - 1`
* subsets, and `n` is a handful of key columns in practice.
*/
function buildAllSubsets(match, minFields = 2) {
	const out = [];
	const n = match.length;
	const min = Math.max(1, Math.min(minFields, n));
	for (let mask = (1 << n) - 1; mask >= 1; mask -= 1) {
		const subset = [];
		for (let i = 0; i < n; i += 1) if (mask & 1 << i) subset.push(match[i]);
		if (subset.length >= min) out.push(subset);
	}
	out.sort((a, b) => b.length - a.length);
	return out;
}
/** Build the composite key for one side, or `null` when a leg is missing. */
function keyOf(scheme, read, side, normalize) {
	const parts = [];
	for (const leg of scheme) {
		let raw = read(leg);
		if (raw === void 0 || raw === null || String(raw).trim() === "") return null;
		if (leg.transform) raw = leg.transform(raw, side);
		parts.push(`${leg.field}=${normalize(raw)}`);
	}
	return parts.join("|");
}
/** Index the target rows by one scheme's key. Collisions are kept, not dropped. */
function buildSchemeIndex(scheme, target, opts = {}) {
	const normalize = opts.normalize ?? normalizeKeyValue;
	const index = /* @__PURE__ */ new Map();
	for (let i = 0; i < target.length; i += 1) {
		const row = target[i];
		if (opts.targetFilter && !opts.targetFilter(row)) continue;
		const key = keyOf(scheme, (leg) => row?.[leg.field], "table", normalize);
		if (key === null) continue;
		const bucket = index.get(key);
		if (bucket) bucket.push({
			row,
			index: i
		});
		else index.set(key, [{
			row,
			index: i
		}]);
	}
	return index;
}
function createMatcher(match, target, opts = {}) {
	const normalize = opts.normalize ?? normalizeKeyValue;
	const schemes = buildAllSubsets(match, opts.minKeyFields ?? 2);
	return {
		schemes,
		indexes: schemes.map((s) => buildSchemeIndex(s, target, {
			targetFilter: opts.targetFilter,
			normalize
		})),
		normalize
	};
}
/**
* Find the table row for one sheet row, strongest scheme first.
*
* An ambiguous hit is remembered but doesn't stop the search — a weaker scheme
* can't disambiguate, but a *different* subset of the same size might, and only
* if nothing unique is ever found is the ambiguity reported.
*/
function findMatch(matcher, readExcel) {
	let ambiguous = null;
	for (let i = 0; i < matcher.schemes.length; i += 1) {
		const scheme = matcher.schemes[i];
		const key = keyOf(scheme, readExcel, "excel", matcher.normalize);
		if (key === null) continue;
		const bucket = matcher.indexes[i].get(key);
		if (!bucket || !bucket.length) continue;
		if (bucket.length === 1) return {
			kind: "hit",
			entry: bucket[0],
			scheme
		};
		if (!ambiguous) ambiguous = {
			candidates: bucket.length,
			scheme
		};
	}
	if (ambiguous) return {
		kind: "ambiguous",
		...ambiguous
	};
	return { kind: "miss" };
}
//#endregion
//#region src/import/parse.ts
/**
* Getting a `string[][]` grid out of whatever the user handed over — a real
* `.xlsx` file or the text they copied out of one.
*/
/** Decide how to read `data` when the caller didn't say. */
function inferType(data) {
	return typeof data === "string" ? "copy-paste" : "excel";
}
/**
* Pick the delimiter from the text itself. Tab first: that's what a real
* copy out of Excel produces, and a pasted cell may legitimately contain
* commas or semicolons.
*/
function guessDelimiter(raw) {
	if (raw.includes("	")) return "	";
	const firstLine = raw.split(/\r?\n/, 1)[0] ?? "";
	if (firstLine.split(";").length > firstLine.split(",").length) return ";";
	return ",";
}
/**
* Split delimited text, honouring `"` quoting so a quoted cell can contain the
* delimiter or a newline — which CSV exports out of Excel routinely produce.
*/
function splitDelimited(raw, delimiter) {
	const out = [];
	let row = [];
	let cell = "";
	let quoted = false;
	for (let i = 0; i < raw.length; i += 1) {
		const ch = raw[i];
		if (quoted) {
			if (ch === "\"") if (raw[i + 1] === "\"") {
				cell += "\"";
				i += 1;
			} else quoted = false;
			else cell += ch;
			continue;
		}
		if (ch === "\"") {
			quoted = true;
			continue;
		}
		if (ch === delimiter) {
			row.push(cell);
			cell = "";
			continue;
		}
		if (ch === "\r") continue;
		if (ch === "\n") {
			row.push(cell);
			out.push(row);
			row = [];
			cell = "";
			continue;
		}
		cell += ch;
	}
	if (cell !== "" || row.length) {
		row.push(cell);
		out.push(row);
	}
	while (out.length && out[out.length - 1].every((c) => String(c).trim() === "")) out.pop();
	return out.map((r) => r.map((c) => c.trim()));
}
/** Load the optional `exceljs` peer, with an actionable error when it's absent. */
async function loadExcelJs() {
	try {
		const mod = await import("exceljs");
		return mod?.default ?? mod;
	} catch (err) {
		throw new Error("[mono-import] reading an .xlsx needs the optional peer dependency \"exceljs\". Install it in your app: pnpm add exceljs" + (err instanceof Error ? `\n  (resolution failed: ${err.message})` : ""));
	}
}
/** Normalise every accepted binary shape into an ArrayBuffer. */
async function toArrayBuffer(data) {
	if (data instanceof ArrayBuffer) return data;
	if (ArrayBuffer.isView(data)) return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
	if (typeof data.arrayBuffer === "function") return data.arrayBuffer();
	throw new Error("[mono-import] `data` must be a File, Blob, ArrayBuffer, Uint8Array or string.");
}
/** Read a worksheet into a dense matrix of raw cell values. */
async function readWorkbook(data, sheet) {
	const workbook = new (await (loadExcelJs())).Workbook();
	await workbook.xlsx.load(await toArrayBuffer(data));
	const worksheet = typeof sheet === "string" ? workbook.getWorksheet(sheet) : workbook.worksheets[typeof sheet === "number" ? sheet : 0];
	if (!worksheet) {
		const names = workbook.worksheets.map((w) => w.name).join(", ");
		throw new Error(`[mono-import] worksheet ${JSON.stringify(sheet)} not found. Available: ${names}`);
	}
	const matrix = [];
	worksheet.eachRow({ includeEmpty: true }, (row) => {
		const cells = [];
		const values = row.values;
		for (let c = 1; c < values.length; c += 1) cells.push(values[c]);
		matrix.push(cells);
	});
	return matrix;
}
/**
* Parse the caller's `data` into headers + rows.
*
* Rows above `headerRow` are dropped, which is what lets a sheet carry a title
* block above its table.
*/
async function parseSheet(options) {
	const type = options.type ?? inferType(options.data);
	let matrix;
	if (type === "copy-paste") {
		if (typeof options.data !== "string") throw new Error("[mono-import] type 'copy-paste' needs `data` to be a string.");
		const delimiter = options.delimiter ?? guessDelimiter(options.data);
		matrix = splitDelimited(options.data, delimiter);
	} else {
		if (typeof options.data === "string") throw new Error("[mono-import] type 'excel' needs `data` to be a File, Blob or ArrayBuffer.");
		matrix = await readWorkbook(options.data, options.sheet);
	}
	const headerIndex = Math.max(1, Math.floor(options.headerRow ?? 1)) - 1;
	return {
		headers: (matrix[headerIndex] ?? []).map((h) => cellText(h).trim()),
		rows: matrix.slice(headerIndex + 1).filter((r) => r.some((c) => cellText(c).trim() !== ""))
	};
}
//#endregion
//#region src/import/index.ts
/**
* `@mono-lit/helper` table import — read an edited spreadsheet back into the grid.
*
* The pipeline: parse the sheet (or the pasted text) into headers + rows, pair
* each sheet row with a table row by composite key, coerce the declared columns,
* and stage the differences. Nothing touches the underlying data — the result
* lands in the grid's pending-changes buffer, to be reviewed and then saved or
* discarded.
*
* @example
* const result = await table.import({
*   type: 'excel',
*   data: file,
*   match: [{ excel: 'Brand', field: 'BrandNama' }, { excel: 'CH.', field: 'Channel' }],
*   columns: [{ excel: 'JAN', field: 'Jan', type: 'number' }],
* })
* if (!result.ok) warn(`${result.unmatched} rows didn't match`)
*/
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** Build header → column-index, including any declared aliases. */
function buildHeaderIndex(headers, aliases) {
	const index = /* @__PURE__ */ new Map();
	headers.forEach((h, i) => {
		const key = normalizeHeader(h);
		if (key && !index.has(key)) index.set(key, i);
	});
	if (aliases) for (const [canonical, alts] of Object.entries(aliases)) {
		const target = normalizeHeader(canonical);
		if (index.has(target)) continue;
		for (const alt of alts) {
			const found = index.get(normalizeHeader(alt));
			if (found !== void 0) {
				index.set(target, found);
				break;
			}
		}
	}
	return index;
}
/** Read the sheet's raw grid into `{ header: value }` for the user callbacks. */
function toSheetRecord(headers, raw) {
	const out = {};
	headers.forEach((h, i) => {
		if (h) out[h] = raw[i] ?? "";
	});
	return out;
}
/** Run an import against a grid. The implementation behind `table.import()`. */
async function importTable(options, bridge) {
	if (!options?.match?.length) throw new Error("[mono-import] `match` is required — an import needs a key to pair rows on.");
	if (!options?.columns?.length) throw new Error("[mono-import] `columns` is required — nothing would be imported otherwise.");
	const { headers, rows } = await parseSheet(options);
	const headerIndex = buildHeaderIndex(headers, options.headerAliases);
	const missingHeaders = [...options.match, ...options.columns].map((m) => m.excel).filter((h) => !headerIndex.has(normalizeHeader(h)));
	const activeColumns = options.columns.filter((c) => headerIndex.has(normalizeHeader(c.excel)));
	const activeMatch = options.match.filter((m) => headerIndex.has(normalizeHeader(m.excel)));
	const target = options.target ?? await bridge.getData();
	const result = {
		ok: false,
		total: 0,
		matched: 0,
		unmatched: 0,
		ambiguous: 0,
		changed: 0,
		skipped: 0,
		headers,
		missingHeaders,
		changes: [],
		unmatchedRows: [],
		ambiguousRows: [],
		skippedRows: [],
		merged: target,
		apply: () => {}
	};
	if (!activeMatch.length || !activeColumns.length) {
		if (options.debug) console.warn("[mono-import] nothing to do — missing headers:", missingHeaders);
		return result;
	}
	const matcher = createMatcher(activeMatch, target, {
		minKeyFields: options.minKeyFields,
		targetFilter: options.targetFilter,
		normalize: options.normalizeKey
	});
	const patchesByIndex = /* @__PURE__ */ new Map();
	const numberFormat = options.numberFormat ?? "auto";
	const allowNegative = options.allowNegative ?? true;
	const chunkSize = Math.max(1, Math.floor(options.chunkSize ?? 300));
	const yieldMs = Math.max(0, options.yieldMs ?? 0);
	const cellOf = (raw, excel) => {
		const i = headerIndex.get(normalizeHeader(excel));
		return i === void 0 ? void 0 : raw[i];
	};
	for (let start = 0; start < rows.length; start += chunkSize) {
		const end = Math.min(start + chunkSize, rows.length);
		for (let ri = start; ri < end; ri += 1) {
			const raw = rows[ri];
			const record = toSheetRecord(headers, raw);
			if (options.rowFilter && !options.rowFilter(record, ri)) continue;
			result.total += 1;
			const outcome = findMatch(matcher, (leg) => cellOf(raw, leg.excel));
			if (outcome.kind === "miss") {
				result.unmatched += 1;
				result.unmatchedRows.push({
					index: ri,
					row: record
				});
				continue;
			}
			if (outcome.kind === "ambiguous") {
				result.ambiguous += 1;
				result.ambiguousRows.push({
					index: ri,
					row: record,
					candidates: outcome.candidates,
					reason: `matched ${outcome.candidates} rows on ${outcome.scheme.map((s) => s.field).join(" + ")}`
				});
				continue;
			}
			result.matched += 1;
			const { row, index } = outcome.entry;
			let touched = false;
			for (const column of activeColumns) {
				const veto = options.readOnly?.(row, column.field);
				if (veto) {
					result.skipped += 1;
					result.skippedRows.push({
						index: ri,
						row: record,
						reason: typeof veto === "string" ? veto : `${column.field} is read-only`
					});
					continue;
				}
				const rawCell = cellOf(raw, column.excel);
				let value = coerceValue(rawCell, column.type, {
					numberFormat,
					allowNegative
				});
				if (value === void 0) continue;
				if (column.transform) {
					value = column.transform(value, {
						row,
						field: column.field,
						raw: rawCell
					});
					if (value === void 0) continue;
				}
				const current = row[column.field];
				if (isSameValue(current, value, column.type)) continue;
				const entry = patchesByIndex.get(index) ?? {
					row,
					patch: {}
				};
				entry.patch[column.field] = value;
				patchesByIndex.set(index, entry);
				touched = true;
			}
			if (touched) result.changed += 1;
		}
		options.onProgress?.(end, rows.length);
		if (yieldMs >= 0 && end < rows.length) await sleep(yieldMs);
	}
	result.changes = [...patchesByIndex.entries()].map(([index, { row, patch }]) => ({
		rowKey: bridge.rowKeyOf(row, index),
		key: bridge.serverKeyOf(row),
		row,
		patch
	}));
	result.merged = target.map((row, i) => {
		const entry = patchesByIndex.get(i);
		return entry ? {
			...row,
			...entry.patch
		} : row;
	});
	result.ok = result.total > 0 && result.matched === result.total && result.unmatched === 0 && result.ambiguous === 0;
	if (options.debug) console.debug("[mono-import]", {
		headers,
		missingHeaders,
		schemes: matcher.schemes.map((s) => s.map((l) => l.field)),
		total: result.total,
		matched: result.matched,
		unmatched: result.unmatched,
		ambiguous: result.ambiguous,
		changed: result.changed,
		skipped: result.skipped
	});
	let applied = false;
	result.apply = () => {
		if (applied || !result.changes.length) return;
		applied = true;
		bridge.stageImported(result.changes);
	};
	if ((options.apply ?? "stage") === "stage") result.apply();
	return result;
}
//#endregion
export { importTable };
