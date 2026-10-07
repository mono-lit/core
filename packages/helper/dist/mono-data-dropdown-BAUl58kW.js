import { t as monoDataGrid } from "./mono-data-grid-Db80FzdZ.js";
import { t as createNotifier } from "./notifier-CE4yxMUQ.js";
//#region src/components/dropdown-table/mono-data-dropdown.ts
function monoDataDropdown(source = null, opts = {}) {
	const keyExpr = opts.keyExpr ?? "Id";
	const displayExpr = opts.displayExpr;
	const multiple = !!opts.multiple;
	const { state: _stateRef, max: _optMax, min: _optMin, ...gridOpts } = opts;
	const grid = monoDataGrid(source, gridOpts);
	const optionLimits = {
		max: opts.max,
		min: opts.min
	};
	let elementLimits = {};
	function effectiveLimits() {
		return {
			max: elementLimits.max ?? optionLimits.max,
			min: elementLimits.min ?? optionLimits.min
		};
	}
	function applyLimits() {
		const { max, min } = effectiveLimits();
		grid.check().configure({
			max: max ?? null,
			min: min ?? null
		});
	}
	function setLimits(next) {
		if (next.max === elementLimits.max && next.min === elementLimits.min) return;
		elementLimits = {
			max: next.max,
			min: next.min
		};
		applyLimits();
		notify();
	}
	if (multiple) applyLimits();
	/** The field element's own props — the one slot the inner grid knows nothing about. */
	const dropdownTableProps = { ...opts.props?.dropdownTable ?? {} };
	/** Merged element props: the grid's slots plus this dropdown's field slot. */
	function props() {
		return {
			...grid.props(),
			dropdownTable: dropdownTableProps
		};
	}
	function propsSnapshot() {
		const g = grid.props();
		return {
			...g,
			th: (g.th ?? []).map((c) => ({ ...c })),
			dropdownTable: { ...dropdownTableProps }
		};
	}
	const notifier = createNotifier({ onFlush: () => {
		if (opts.state) opts.state.value = propsSnapshot();
	} });
	const notify = notifier.notify;
	let _value = multiple ? [] : null;
	const cache = /* @__PURE__ */ new Map();
	const keyStr = (k) => String(k);
	/** Coerce a key to the source's key type (number vs string), inferred from a row. */
	function normKey(k) {
		if (k == null || k === "") return k;
		if (typeof grid.items[0]?.[keyExpr] === "number" && !Number.isNaN(Number(k))) return Number(k);
		return k;
	}
	function displayOf(row) {
		if (row == null) return "";
		if (typeof displayExpr === "function") return String(displayExpr(row) ?? "");
		if (typeof displayExpr === "string" && displayExpr) return String(row[displayExpr] ?? "");
		return String(row[keyExpr] ?? "");
	}
	function keysOf(v) {
		if (multiple) return Array.isArray(v) ? v : v == null ? [] : [v];
		return v == null ? [] : [v];
	}
	function cacheRow(key, data) {
		const nk = normKey(key);
		cache.set(keyStr(nk), {
			key: nk,
			text: displayOf(data),
			data
		});
	}
	/** Find a currently-loaded row by key (so a clicked row caches its display text). */
	function findRow(key) {
		const ks = keyStr(normKey(key));
		return grid.items.find((r) => keyStr(normKey(r?.[keyExpr])) === ks);
	}
	function emitChange() {
		ctrl.onValueChange?.(multiple ? checkedKeys() : _value);
	}
	/**
	* MULTI-SELECT IS THE GRID'S `check()` STORE — there is not a second one.
	*
	* The dropdown used to keep its own `_value` array beside the grid's selection,
	* which is why `<mono-table-checkbox>` could bind to `dd.table` and tick without
	* the chips ever moving: it drove the other store. Delegating means every
	* `mono-table-*` helper works in the panel the same way, and drain / `pending` /
	* per-page / the drain memo come from the grid instead of being reimplemented.
	*
	* `_value` stays the SINGLE-select store only, and remains the shape consumers
	* bind (`modelValue`): for multi it is derived from the check store on read.
	*/
	const check = () => grid.check();
	/**
	* A row for `check()` to key by. It stores rows, but a selection can name a key
	* whose row is not loaded (a preset `modelValue`, or a key resolved later), so
	* fall back to a stub carrying just the key — `rowKeyOf` only reads `keyExpr`.
	*/
	function rowFor(key, rowData) {
		const nk = normKey(key);
		return rowData ?? findRow(nk) ?? cache.get(keyStr(nk))?.data ?? { [keyExpr]: nk };
	}
	/** What is selected right now, whichever store owns it. */
	function currentKeys() {
		return multiple ? checkedKeys() : keysOf(_value);
	}
	/** The multi-select value, derived from the check store (insertion order). */
	function checkedKeys() {
		return check().rows().map((row) => normKey(row?.[keyExpr]));
	}
	function isSelected(key) {
		if (multiple) return check().isChecked(keyStr(normKey(key)));
		const ks = keyStr(normKey(key));
		return keysOf(_value).some((k) => keyStr(normKey(k)) === ks);
	}
	function toggleRow(key, rowData) {
		const nk = normKey(key);
		const data = rowData ?? findRow(nk);
		if (data !== void 0) cacheRow(nk, data);
		if (multiple) {
			const on = check().isChecked(keyStr(nk));
			check().toggle(rowFor(nk, data), !on);
		} else {
			_value = nk;
			setOpen(false);
		}
		emitChange();
		notify();
	}
	function removeKey(key) {
		const nk = normKey(key);
		if (multiple) check().toggle(rowFor(nk), false);
		else _value = null;
		emitChange();
		notify();
	}
	function clear() {
		if (multiple) check().clear();
		else _value = null;
		emitChange();
		notify();
	}
	/**
	* Rows this controller already holds, indexed by key — the check store first
	* (it keeps whole row objects, not just keys), then the loaded page.
	*
	* Built lazily and ONLY when a key actually missed the cache: after a drain
	* `check().rows()` can hold thousands of rows, and it allocates a fresh array
	* on every call, so touching it per render would be a real cost for nothing.
	*/
	function heldRows() {
		const index = /* @__PURE__ */ new Map();
		const add = (row) => {
			const key = row?.[keyExpr];
			if (key === void 0 || key === null) return;
			const ks = keyStr(normKey(key));
			if (!index.has(ks)) index.set(ks, row);
		};
		for (const row of grid.items) add(row);
		if (multiple) for (const row of check().rows()) add(row);
		return index;
	}
	/**
	* Selected keys, labelled.
	*
	* A cache miss falls back to the rows already in memory before degrading to
	* `String(key)`. Without that, selecting through the GRID — which is what
	* `<mono-table-checkbox>` does, since it calls `check.selectAll()` directly
	* rather than `dd.selectAll()` — showed every chip as its own key: only
	* `selectAll()` primes the cache, and the grid subscription just notifies.
	* The row was in `check().rows()` the whole time.
	*/
	function selectedItems() {
		const keys = currentKeys();
		let held;
		return keys.map((k) => {
			const nk = normKey(k);
			const ks = keyStr(nk);
			const hit = cache.get(ks);
			if (hit) return hit;
			held ??= heldRows();
			const row = held.get(ks);
			if (row === void 0) return {
				key: nk,
				text: String(nk),
				data: void 0
			};
			cacheRow(nk, row);
			return cache.get(ks) ?? {
				key: nk,
				text: displayOf(row),
				data: row
			};
		});
	}
	function displayText() {
		return selectedItems().map((i) => i.text).join(", ");
	}
	/**
	* Seed the display cache from rows you already hold, so `resolveSelected` has
	* nothing left to fetch. The point of `setValue`'s `rows` argument and of
	* {@link selectAll}: without it, setting N keys costs N/50 `in` requests to
	* re-read text that was already in hand.
	*/
	function primeCache(rows) {
		if (!rows?.length) return;
		for (const row of rows) cacheRow(row?.[keyExpr], row);
	}
	function setValue(next, rows) {
		primeCache(rows);
		if (multiple) check().replace(keysOf(next).map((k) => rowFor(k)));
		else _value = next;
		resolveSelected();
		notify();
	}
	/**
	* Select every row the source can return — the dropdown's answer to the table's
	* `<mono-table-checkbox type="all" mode="all">`.
	*
	* `table.getData()` does the draining (chunked `store.load`, paging left alone)
	* and honours the live filter + search, so "search, then select all" selects the
	* matches and nothing else. The drained rows prime the cache, so this costs the
	* drain and NO display-resolution requests.
	*
	* Emits like `toggleRow` rather than going through `setValue`: `setValue` is the
	* inbound path (the element pushes `modelValue` down it) and deliberately does
	* not emit, so a silent bulk change would leave the element's `modelValue` stale
	* and the next push would overwrite the selection with it.
	*/
	async function selectAll() {
		if (!multiple) return;
		await check().selectAll();
		primeCache(check().rows());
		emitChange();
		notify();
	}
	function setOpen(next) {
		if (ctrl.open === next) return;
		ctrl.open = next;
		notify();
	}
	function hasStore() {
		const s = grid.dataSource;
		return typeof s?.store === "function" && !!s.store();
	}
	function storeRows(res) {
		return Array.isArray(res) ? res : res?.data ?? [];
	}
	function chunk(arr, size) {
		const out = [];
		for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
		return out;
	}
	const selectFields = () => typeof displayExpr === "string" && displayExpr ? [keyExpr, displayExpr] : void 0;
	async function resolveSelected() {
		const missing = currentKeys().filter((k) => !cache.has(keyStr(normKey(k))));
		if (!missing.length) return;
		const s = grid.dataSource;
		if (hasStore()) {
			const store = s.store();
			let rows = [];
			try {
				rows = (await Promise.all(chunk(missing, 50).map((part) => store.load({
					filter: [
						keyExpr,
						"in",
						part
					],
					select: selectFields()
				})))).flatMap(storeRows);
			} catch {
				const orFilter = (arr) => arr.map((v) => [
					keyExpr,
					"=",
					v
				]).reduce((a, b) => a ? [
					a,
					"or",
					b
				] : b, null);
				rows = (await Promise.all(chunk(missing, 15).map((part) => store.load({
					filter: orFilter(part),
					select: selectFields()
				})))).flatMap(storeRows);
			}
			for (const row of rows) cacheRow(row?.[keyExpr], row);
		} else if (typeof s?.data === "function") {
			const all = s.data();
			const byKey = new Map(all.map((r) => [keyStr(r?.[keyExpr]), r]));
			for (const k of missing) {
				const row = byKey.get(keyStr(normKey(k)));
				if (row) cacheRow(k, row);
			}
		}
		notify();
	}
	const offGrid = grid.subscribe(() => notify());
	const ctrl = {
		grid,
		/** Alias of {@link grid} — the inner `controlMonoTable`. Preferred in new
		*  code (`dd.table.load()` / `:control-table.prop="dd.table"`); `grid` stays. */
		table: grid,
		props,
		multiple,
		open: false,
		onValueChange: null,
		get value() {
			return multiple ? checkedKeys() : _value;
		},
		get selectAllPending() {
			return multiple ? check().pending : false;
		},
		set value(next) {
			setValue(next);
		},
		isSelected,
		limits: effectiveLimits,
		setLimits,
		toggleRow,
		removeKey,
		clear,
		selectAll,
		selectedItems,
		displayText,
		setValue,
		setOpen,
		resolveSelected,
		subscribe: notifier.subscribe,
		bind(next) {
			grid.bind(next);
			cache.clear();
			resolveSelected();
			notify();
		},
		dispose() {
			offGrid();
			notifier.clear();
			grid.dispose();
		}
	};
	return ctrl;
}
//#endregion
export { monoDataDropdown as t };
