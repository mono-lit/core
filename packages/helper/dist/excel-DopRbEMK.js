import { c as mergeStyles, l as toExcelStyle, s as combineStyles, t as flattenInline } from "./markdown-DfqrfOJN.js";
//#region src/export/sheet-name.ts
/**
* Worksheet names, which Excel is fussier about than anything else in a
* workbook — and every rule below is one it enforces by refusing to open the
* file, not by degrading.
*
*   · at most 31 characters
*   · none of `* ? : \ / [ ]`
*   · cannot be empty
*   · cannot start or end with an apostrophe
*   · unique within the workbook, case-insensitively
*
* A name derived from user data — a document number like `TU/2026/001` — breaks
* three of those at once, so nothing may reach `addWorksheet` unsanitised.
*/
/**
* The characters Excel refuses outright.
*
* Note what is NOT in here: the space and the hyphen are both perfectly legal,
* and stripping them would quietly rewrite a document number like `TP-001` into
* `TP 001`, so the sheet name would no longer match what the master sheet shows.
*/
var FORBIDDEN = /[*?:\\/[\]]/g;
/**
* One name, made legal. Does NOT make it unique — that is
* {@link SheetNames.take}'s job, because uniqueness needs the whole workbook.
*/
function sanitizeSheetName(raw, fallback = "Sheet") {
	return String(raw ?? "").replace(FORBIDDEN, " ").replace(/\s+/g, " ").trim().replace(/^'+|'+$/g, "").trim().slice(0, 31).replace(/'+$/, "").trim() || fallback;
}
/**
* Escape a name for use inside a reference like `#'Sheet'!A1`.
*
* The name is single-quoted there, so a literal apostrophe has to be doubled.
* {@link sanitizeSheetName} only strips apostrophes at the ends — one in the
* middle (`Bob's Data`) is legal and has to survive.
*/
function escapeSheetRef(name) {
	return name.replace(/'/g, "''");
}
/** A reference to `A1` of `name`, ready to use as a hyperlink target. */
function sheetRef(name, cell = "A1") {
	return `#'${escapeSheetRef(name)}'!${cell}`;
}
/**
* The workbook's name registry.
*
* Deliberately the ONLY place a name is claimed. The implementation this feature
* is modelled on reserves a name up front and then dedupes a second time inside
* its writer against the same set — so the second call always collides with the
* reservation it just made, and every sheet in that workbook ends up suffixed
* ` (2)`. One registry, one `take()`, no second opinion.
*/
var SheetNames = class {
	constructor(existing = []) {
		this.used = /* @__PURE__ */ new Set();
		for (const name of existing) this.used.add(name.toLowerCase());
	}
	/** Claim a legal, unique name derived from `raw`. */
	take(raw, fallback = "Sheet") {
		const base = sanitizeSheetName(raw, fallback);
		if (!this.used.has(base.toLowerCase())) {
			this.used.add(base.toLowerCase());
			return base;
		}
		for (let n = 2; n < 1e4; n += 1) {
			const suffix = ` (${n})`;
			const candidate = `${base.slice(0, 31 - suffix.length).trim()}${suffix}`;
			if (!this.used.has(candidate.toLowerCase())) {
				this.used.add(candidate.toLowerCase());
				return candidate;
			}
		}
		const last = `${base.slice(0, 20)} ${Date.now().toString(36)}`.slice(0, 31);
		this.used.add(last.toLowerCase());
		return last;
	}
};
//#endregion
//#region src/export/excel/nodes.ts
/** An ISO date string (`2026-07-21`, optionally with a time part). */
var ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
/** A plain number, allowing a leading sign and a decimal part. */
var NUMERIC_RE = /^[+-]?\d+(?:\.\d+)?$/;
/**
* Walks an mdast tree and plans a worksheet. Planning (rather than writing
* ExcelJS objects directly) keeps this file free of any ExcelJS import, so the
* mapping stays testable and a future renderer can reuse the same walk.
*/
var WorksheetWriter = class {
	constructor(ctx) {
		this.ctx = ctx;
		this.plan = {
			rows: [],
			images: [],
			spans: [],
			merges: [],
			width: 0,
			widths: []
		};
		this.tableColumns = [];
		this.tableFirstRow = 0;
		this.tableLastRow = 0;
	}
	/** Resolve a named style, or an empty style when the name is unknown. */
	named(name) {
		return name && this.ctx.styles[name] || {};
	}
	write(root) {
		this.writeBlocks(root.children);
		this.plan.width = this.plan.rows.reduce((max, row) => Math.max(max, row.cells.length), 0);
		return this.plan;
	}
	writeBlocks(nodes, indent = 0) {
		for (const node of nodes) this.writeBlock(node, indent);
	}
	writeBlock(node, indent) {
		switch (node.type) {
			case "heading": {
				const inline = flattenInline(node.children);
				const style = combineStyles(this.named(`h${node.depth}`), this.styleFrom(inline.directives));
				this.appendSpanningRow(inline, style);
				break;
			}
			case "paragraph": {
				const inline = flattenInline(node.children);
				const style = combineStyles(this.styleFrom(inline.directives), { indent });
				this.appendSpanningRow(inline, style);
				break;
			}
			case "table":
				this.writeTable(node.children);
				break;
			case "list":
				for (const item of node.children) this.writeBlocks(item.children, indent + 1);
				break;
			case "blockquote":
				this.writeBlockquote(node.children, indent);
				break;
			case "code":
				for (const line of node.value.split("\n")) this.pushRow([{
					value: line,
					style: {},
					width: line.length
				}], void 0, true);
				break;
			case "thematicBreak":
				this.pushRow([{
					value: null,
					style: {},
					width: 0
				}], void 0, true);
				break;
			default: if ("children" in node) this.writeBlocks(node.children, indent);
		}
	}
	writeBlockquote(children, indent) {
		const before = this.plan.rows.length;
		this.writeBlocks(children, indent);
		const note = toExcelStyle(this.named("note"));
		for (let i = before; i < this.plan.rows.length; i += 1) for (const cell of this.plan.rows[i].cells) cell.style = mergeExcelStyle(note, cell.style);
	}
	/** A one-cell row that will later be merged across the sheet's full width. */
	appendSpanningRow(inline, style) {
		const cell = this.toCell(inline, style);
		if (cell.value === null && !cell.formula && !inline.directives.length && !inline.images.length) return;
		const rowIndex = this.pushRow([cell], style.height, true);
		this.plan.spans.push({
			row: rowIndex,
			from: 1
		});
		this.placeImages(inline, rowIndex, 1);
		this.applyMerge(inline.directives, rowIndex, 1);
	}
	writeTable(rows) {
		if (!rows.length) return;
		const [headerRow, ...bodyRows] = rows;
		const headerInlines = headerRow.children.map((cell) => flattenInline(cell.children));
		this.tableColumns = headerInlines.map((inline) => inline.text.trim());
		const headerStyle = this.named("header");
		const headerRowIndex = this.pushRow(headerInlines.map((inline) => this.toCell(inline, combineStyles(headerStyle, this.styleFrom(inline.directives)))), headerStyle.height);
		headerInlines.forEach((inline, index) => {
			this.placeImages(inline, headerRowIndex, index + 1);
			this.applyMerge(inline.directives, headerRowIndex, index + 1);
		});
		this.tableFirstRow = this.plan.rows.length + 1;
		this.tableLastRow = this.tableFirstRow + bodyRows.length - 1;
		for (const bodyRow of bodyRows) {
			const inlines = bodyRow.children.map((cell) => flattenInline(cell.children));
			const rowDirectives = inlines.flatMap((inline) => inline.directives);
			const rowStyle = this.rowStyleFrom(rowDirectives);
			const cells = inlines.map((inline, index) => this.toCell(inline, combineStyles(rowStyle, this.columnStyle(index), this.styleFrom(inline.directives))));
			const rowIndex = this.pushRow(cells, rowStyle.height);
			inlines.forEach((inline, index) => {
				this.placeImages(inline, rowIndex, index + 1);
				this.applyMerge(inline.directives, rowIndex, index + 1);
			});
		}
		this.tableColumns = [];
	}
	/** Per-column `numFmt` override from `options.columns`. */
	columnStyle(index) {
		const numFmt = this.ctx.columns?.[index]?.numFmt;
		return numFmt ? { numFmt } : {};
	}
	/** Collect `{{style}}` directives into one style object. */
	styleFrom(directives) {
		return combineStyles(...directives.filter((d) => d.k === "style").map((d) => this.named(d.v)));
	}
	/** Collect `{{rowStyle}}` directives into one style object. */
	rowStyleFrom(directives) {
		return combineStyles(...directives.filter((d) => d.k === "rowStyle").map((d) => this.named(d.v)));
	}
	/** Build one planned cell from flattened inline content plus its style. */
	toCell(inline, style) {
		const value = inline.directives.find((d) => d.k === "val");
		const formula = inline.directives.find((d) => d.k === "formula");
		const excelStyle = toExcelStyle(combineStyles({
			...inline.bold ? { bold: true } : {},
			...inline.italic ? { italic: true } : {}
		}, style));
		const width = inline.text.trim().length;
		const link = inline.link ? { hyperlink: inline.link } : void 0;
		if (formula) return {
			value: null,
			formula: this.resolveFormula(formula.v),
			style: excelStyle,
			numFmt: value?.f ?? style.numFmt,
			width: Math.max(width, 10),
			...link
		};
		const isLoneValue = !!value && (value.t == null || value.t.trim() === inline.text.trim());
		if (value && isLoneValue) {
			if (typeof value.n === "number") return {
				value: value.n,
				style: excelStyle,
				numFmt: value.f,
				width,
				...link
			};
			if (value.d) {
				const date = new Date(value.d);
				if (!Number.isNaN(date.getTime())) return {
					value: date,
					style: excelStyle,
					numFmt: value.f,
					width,
					...link
				};
			}
		}
		return {
			value: coerceValue(inline.text),
			style: excelStyle,
			width,
			...link
		};
	}
	/**
	* Substitute the placeholders a template couldn't resolve on its own:
	* `{row}` (the row about to be written), `{prevRow}` (the one above it),
	* `{firstRow}` / `{lastRow}` (the current table's body range) and
	* `{col:Caption}` (that header's column letter).
	*
	* `{lastRow}` includes *every* body row — so a total row that lives inside
	* the same Markdown table must sum `{firstRow}:{prevRow}` to avoid a circular
	* reference to itself.
	*/
	resolveFormula(expr) {
		const row = this.plan.rows.length + 1;
		return expr.replace(/\{row\}/g, String(row)).replace(/\{prevRow\}/g, String(Math.max(1, row - 1))).replace(/\{firstRow\}/g, String(this.tableFirstRow || row)).replace(/\{lastRow\}/g, String(this.tableLastRow || row)).replace(/\{col:([^}]+)\}/g, (_match, caption) => {
			const index = this.tableColumns.findIndex((c) => c.toLowerCase() === caption.trim().toLowerCase());
			return index >= 0 ? columnLetter(index + 1) : caption;
		});
	}
	placeImages(inline, row, col) {
		const directives = inline.directives.filter((d) => d.k === "image");
		for (const d of directives) this.plan.images.push({
			src: d.v,
			row,
			col,
			width: d.width ?? 120,
			height: d.height ?? 40
		});
		for (const img of inline.images) this.plan.images.push({
			src: img.url,
			row,
			col,
			width: 120,
			height: 40
		});
	}
	applyMerge(directives, row, col) {
		const merge = directives.find((d) => d.k === "merge");
		if (!merge) return;
		const colEnd = col + Math.max(1, merge.cols ?? 1) - 1;
		const rowEnd = row + Math.max(1, merge.rows ?? 1) - 1;
		if (colEnd === col && rowEnd === row) return;
		this.plan.merges.push([
			row,
			col,
			rowEnd,
			colEnd
		]);
	}
	/**
	* Append a row and return its 1-based index. `spanning` rows (headings,
	* paragraphs) are excluded from auto-fit: they get merged across the whole
	* sheet, so letting a long title set column A's width would leave a 60-wide
	* first column next to four narrow ones.
	*/
	pushRow(cells, height, spanning = false) {
		this.plan.rows.push({
			cells,
			...height ? { height } : {}
		});
		if (!spanning) cells.forEach((cell, index) => {
			this.plan.widths[index] = Math.max(this.plan.widths[index] ?? 0, cell.width);
		});
		return this.plan.rows.length;
	}
};
/** Later style wins, but per sub-object so a font isn't wiped by a fill. */
function mergeExcelStyle(base, over) {
	return {
		...base,
		...over,
		font: {
			...base.font,
			...over.font
		},
		alignment: {
			...base.alignment,
			...over.alignment
		},
		border: {
			...base.border,
			...over.border
		}
	};
}
/**
* Give a plain cell string its most useful type. Text that merely *looks*
* numeric (`"00123"`, `"1,234"`) is left alone — coercing it would silently
* mangle invoice numbers and phone numbers.
*/
function coerceValue(text) {
	const trimmed = text.trim();
	if (!trimmed) return null;
	if (NUMERIC_RE.test(trimmed) && !/^0\d/.test(trimmed)) {
		const n = Number(trimmed);
		if (Number.isFinite(n)) return n;
	}
	if (ISO_DATE_RE.test(trimmed)) {
		const date = new Date(trimmed);
		if (!Number.isNaN(date.getTime())) return date;
	}
	return text;
}
/** 1-based column index → spreadsheet letter (1 → A, 27 → AA). */
function columnLetter(index) {
	let n = index;
	let out = "";
	while (n > 0) {
		const rem = (n - 1) % 26;
		out = String.fromCharCode(65 + rem) + out;
		n = Math.floor((n - 1) / 26);
	}
	return out;
}
/** Auto-fit bounds, in characters — narrow enough to read, wide enough to fit. */
var MIN_WIDTH = 8;
var MAX_WIDTH = 60;
/** Extra characters of padding added to the widest cell in a column. */
var WIDTH_PADDING = 2;
/** Load the optional `exceljs` peer, with an actionable error when it's absent. */
async function loadExcelJs() {
	try {
		const mod = await import("exceljs");
		return mod?.default ?? mod;
	} catch (err) {
		throw new Error("[mono-export] xlsx output needs the optional peer dependency \"exceljs\". Install it in your app: pnpm add exceljs" + (err instanceof Error ? `\n  (resolution failed: ${err.message})` : ""));
	}
}
/**
* `{{image}}` accepts a data URL, a bare base64 string, or an `http(s)` URL.
* ExcelJS wants raw base64 plus an extension, so normalise here — and fetch a
* remote URL, which is the only genuinely async part of image handling.
*/
async function toImagePayload(src) {
	const dataUrl = /^data:image\/(png|jpe?g|gif);base64,(.+)$/i.exec(src);
	if (dataUrl) {
		const ext = dataUrl[1].toLowerCase();
		return {
			base64: dataUrl[2],
			extension: ext === "gif" ? "gif" : ext === "png" ? "png" : "jpeg"
		};
	}
	if (/^https?:\/\//i.test(src)) try {
		const res = await fetch(src);
		if (!res.ok) return null;
		const buffer = await res.arrayBuffer();
		const type = res.headers.get("content-type") ?? "";
		const extension = type.includes("gif") ? "gif" : type.includes("png") ? "png" : "jpeg";
		return {
			base64: arrayBufferToBase64(buffer),
			extension
		};
	} catch {
		return null;
	}
	return /^[A-Za-z0-9+/=\s]+$/.test(src) ? {
		base64: src.trim(),
		extension: "png"
	} : null;
}
function arrayBufferToBase64(buffer) {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
	return typeof btoa === "function" ? btoa(binary) : globalThis.Buffer.from(bytes).toString("base64");
}
/** Build the ExcelJS workbook for a parsed report. */
async function renderExcel(ast, options = {}) {
	const styles = mergeStyles(options.styles);
	const plan = new WorksheetWriter({
		styles,
		columns: options.columns
	}).write(ast);
	const workbook = new (await (loadExcelJs())).Workbook();
	workbook.created = /* @__PURE__ */ new Date();
	const names = new SheetNames();
	const masterName = names.take(options.sheetName ?? "Sheet1", "Sheet1");
	const sheet = workbook.addWorksheet(masterName);
	const pending = [];
	writeRows(sheet, plan, pending);
	applyMerges(sheet, plan);
	applyWidths(sheet, plan, options.columns);
	if (options.freezeRows) sheet.views = [{
		state: "frozen",
		ySplit: options.freezeRows
	}];
	await placeImages(workbook, sheet, plan);
	const targets = /* @__PURE__ */ new Map();
	for (const spec of options.sheets ?? []) {
		const name = names.take(spec.name || spec.key, "Detail");
		targets.set(spec.key, name);
		const detailPlan = new WorksheetWriter({
			styles,
			columns: options.columns
		}).write(spec.ast);
		const detailSheet = workbook.addWorksheet(name);
		if (options.back !== false) {
			const back = detailSheet.addRow([]).getCell(1);
			back.value = {
				text: "← Back",
				hyperlink: sheetRef(masterName)
			};
			back.font = {
				...toExcelStyle(styles.link ?? {}).font ?? {},
				bold: true
			};
		}
		writeRows(detailSheet, detailPlan, pending);
		applyMerges(detailSheet, detailPlan);
		applyWidths(detailSheet, detailPlan, options.columns);
		await placeImages(workbook, detailSheet, detailPlan);
	}
	applySheetLinks(pending, targets, styles);
	return workbook;
}
/**
* Rewrite every `sheet:<key>` target into a real in-workbook reference.
*
* Done last, and only here, because a template cannot know the name it is
* linking to: names are sanitised for Excel and de-duplicated against the
* workbook, both of which need every sheet to exist first.
*
* A key with no sheet — a document whose details failed to load, or had none —
* has its link REMOVED rather than left dangling. The prior art leaves those
* cells underlined and unclickable, which reads as a broken link.
*/
function applySheetLinks(pending, targets, styles) {
	const linkFont = styles.link ? toExcelStyle(styles.link).font : void 0;
	for (const link of pending) {
		const name = targets.get(link.key);
		if (!name) continue;
		applyHyperlink(link.cell, sheetRef(name), link.value);
		if (linkFont) link.cell.font = {
			...link.cell.font ?? {},
			...linkFont
		};
	}
}
/**
* Attach a link to a cell without wrecking what is already in it.
*
* `cell.hyperlink` looks assignable — ExcelJS' own typings declare it on
* `Cell` — but at runtime it is a GETTER ONLY (`lib/doc/cell.js:201`), so
* assigning it throws. The only public route is the value form, and that form
* replaces the cell outright: a number linked this way stops being a number and
* no longer sums in Excel. `numFmt` does survive, since it lives on the style
* rather than the value, but the type does not.
*
* So each kind of cell takes the route that costs it nothing:
*
*   · number   — Excel's own HYPERLINK(), with the number as the displayed
*                argument and cached as `result`. Stays numeric, still sums,
*                still formats.
*   · text     — the plain value form, which for a string loses nothing at all.
*                A Date takes this route too and becomes text; dates as link
*                anchors are not a case this feature has, and the alternative
*                is emitting a serial number nobody can read.
*
* Formula cells never reach here: a formula owns `cell.value`, so there is no
* way to add a link without destroying it, and silently swapping one for the
* other would be worse than not linking. Callers skip them.
*/
function applyHyperlink(cell, target, value) {
	if (typeof value === "number") {
		cell.value = {
			formula: `HYPERLINK(${quoteFormulaArg(target)},${value})`,
			result: value
		};
		return;
	}
	cell.value = {
		text: String(value ?? ""),
		hyperlink: target
	};
}
/** A string literal inside an Excel formula: wrapped, with `"` doubled. */
function quoteFormulaArg(value) {
	return `"${value.replace(/"/g, "\"\"")}"`;
}
function writeRows(sheet, plan, pending) {
	for (const plannedRow of plan.rows) {
		const row = sheet.addRow([]);
		plannedRow.cells.forEach((planned, index) => {
			const cell = row.getCell(index + 1);
			if (planned.formula) cell.value = { formula: planned.formula };
			else if (planned.value !== null) cell.value = planned.value;
			if (planned.style.font) cell.font = planned.style.font;
			if (planned.style.fill) cell.fill = planned.style.fill;
			if (planned.style.alignment) cell.alignment = planned.style.alignment;
			if (planned.style.border) cell.border = planned.style.border;
			const numFmt = planned.numFmt ?? planned.style.numFmt;
			if (numFmt) cell.numFmt = numFmt;
			if (planned.hyperlink && !planned.formula) if (pending && planned.hyperlink.startsWith("sheet:")) pending.push({
				cell,
				key: planned.hyperlink.slice(6),
				value: planned.value
			});
			else applyHyperlink(cell, planned.hyperlink, planned.value);
		});
		if (plannedRow.height) row.height = plannedRow.height;
		row.commit?.();
	}
}
function applyMerges(sheet, plan) {
	for (const span of plan.spans) if (plan.width > span.from) safeMerge(sheet, span.row, span.from, span.row, plan.width);
	for (const [row, col, rowEnd, colEnd] of plan.merges) safeMerge(sheet, row, col, rowEnd, colEnd);
}
/**
* ExcelJS throws when two merges overlap. A template that merges a cell inside
* a heading row is a mistake, not a reason to lose the whole report — so log
* and keep going.
*/
function safeMerge(sheet, top, left, bottom, right) {
	try {
		sheet.mergeCells(top, left, bottom, right);
	} catch {
		console.warn(`[mono-export] skipped overlapping merge ${columnLetter(left)}${top}:${columnLetter(right)}${bottom}`);
	}
}
function applyWidths(sheet, plan, columns) {
	for (let i = 0; i < plan.width; i += 1) {
		const explicit = columns?.[i]?.width;
		const measured = (plan.widths[i] ?? 0) + WIDTH_PADDING;
		sheet.getColumn(i + 1).width = explicit ?? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, measured));
	}
}
async function placeImages(workbook, sheet, plan) {
	for (const pending of plan.images) {
		const payload = await toImagePayload(pending.src);
		if (!payload) {
			console.warn(`[mono-export] could not load image: ${pending.src.slice(0, 60)}`);
			continue;
		}
		const id = workbook.addImage({
			base64: payload.base64,
			extension: payload.extension
		});
		sheet.addImage(id, {
			tl: {
				col: pending.col - 1,
				row: pending.row - 1
			},
			ext: {
				width: pending.width,
				height: pending.height
			}
		});
	}
}
//#endregion
export { renderExcel };
