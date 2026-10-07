import { a as flattenTree, f as coerceValue, h as resolveTexts, i as emptyGroup, l as treeToArray, n as arrayToTree, o as nextId, p as defaultOperator, r as asRootGroup, s as odataStringToArray, t as arrayToODataString } from "./filter-odata-C1vSGZaY.js";
import { t as createNotifier } from "./notifier-CE4yxMUQ.js";
//#region src/components/filter/filter-builder.ts
function monoFilterBuilder(opts = {}) {
	const texts = resolveTexts(opts.texts);
	const actions = opts.actions !== false;
	const serialize = opts.toODataString ?? ((f) => arrayToODataString(f));
	/** Which shape the caller supplied, so `type`-less reads return the same. */
	const inputType = typeof opts.filter === "string" ? "string" : "array";
	let warnedUnparseable = false;
	/**
	* Normalise either shape into a devextreme expression. A string outside the
	* parser's subset warns ONCE and yields `null` — an empty builder is safer than
	* a filter that silently means something else.
	*/
	function toExpression(filter) {
		if (filter === null || filter === void 0 || filter === "") return null;
		if (typeof filter !== "string") return Array.isArray(filter) ? filter : null;
		try {
			return odataStringToArray(filter);
		} catch (err) {
			if (!warnedUnparseable) {
				warnedUnparseable = true;
				console.warn(`[monoFilterBuilder] could not parse the OData filter string — starting empty. Only the subset this builder emits is supported (comparisons, contains/startswith/endswith, in, and/or/not, parentheses). Reason: ${err.message}`);
			}
			return null;
		}
	}
	const originalExpression = toExpression(opts.filter);
	function buildTree(expr) {
		const node = arrayToTree(expr);
		return asRootGroup(node ? flattenTree(node) : null);
	}
	let tree = buildTree(originalExpression);
	const notifier = createNotifier();
	const notify = notifier.notify;
	const elementProps = { ...opts.props ?? {} };
	/**
	* Explicit `fields` win; a `dataGrid` only contributes columns not already
	* listed, so a table dialog can pass both and override just what it needs.
	*/
	function fields() {
		const explicit = opts.fields ?? [];
		const grid = opts.dataGrid;
		if (!grid) return explicit;
		const seen = new Set(explicit.map((f) => f.field));
		const derived = [];
		for (const col of grid.props?.().th ?? []) {
			if (!col?.field || seen.has(col.field)) continue;
			derived.push({
				field: col.field,
				caption: col.caption ?? col.field
			});
		}
		return [...explicit, ...derived];
	}
	function fieldDef(field) {
		return fields().find((f) => f.field === field);
	}
	function findNode(id, node = tree) {
		if (node.id === id) return node;
		if (node.kind !== "group") return null;
		for (const c of node.children) {
			const hit = findNode(id, c);
			if (hit) return hit;
		}
		return null;
	}
	function findParent(id, node = tree) {
		for (const c of node.children) {
			if (c.id === id) return node;
			if (c.kind === "group") {
				const hit = findParent(id, c);
				if (hit) return hit;
			}
		}
		return null;
	}
	function groupById(id) {
		if (!id) return tree;
		const node = findNode(id);
		return node && node.kind === "group" ? node : tree;
	}
	function newRule() {
		const first = fields()[0];
		const dataType = first?.dataType ?? "string";
		return {
			kind: "rule",
			id: nextId("r"),
			field: first?.field ?? "",
			operator: defaultOperator(dataType),
			value: ""
		};
	}
	function read(expr, options) {
		return (options?.type ?? inputType) === "string" ? serialize(expr) : expr;
	}
	const controller = {
		get tree() {
			return tree;
		},
		get fields() {
			return fields();
		},
		get texts() {
			return texts;
		},
		get actions() {
			return actions;
		},
		props: () => elementProps,
		/**
		* Merge, not replace — a partial patch leaves everything else alone, matching
		* `updateRule`. `undefined` values are passed straight through: `applyProps`
		* skips them on the write side, so "not declared" can never clobber a value
		* the template set.
		*/
		setProps: (patch) => {
			if (!patch) return;
			Object.assign(elementProps, patch);
			notify();
		},
		original: (options) => read(originalExpression, options),
		changed: (options) => read(treeToArray(tree), options),
		setFilter: (filter) => {
			tree = buildTree(toExpression(filter));
			notify();
		},
		reset: () => {
			tree = buildTree(originalExpression);
			notify();
		},
		clear: () => {
			tree = emptyGroup(tree.operator);
			notify();
		},
		addRule: (groupId) => {
			groupById(groupId).children.push(newRule());
			notify();
		},
		addGroup: (groupId) => {
			const g = emptyGroup("and");
			g.children.push(newRule());
			groupById(groupId).children.push(g);
			notify();
		},
		/**
		* Nest a rule: replace it in place with a group holding it plus a fresh
		* sibling, which is what the row's nested-rule button means. Nesting a group
		* just adds a child group to it.
		*/
		nest: (nodeId) => {
			const node = findNode(nodeId);
			if (!node) return;
			if (node.kind === "group") {
				const g = emptyGroup("and");
				g.children.push(newRule());
				node.children.push(g);
				notify();
				return;
			}
			const parent = findParent(nodeId);
			if (!parent) return;
			const at = parent.children.indexOf(node);
			const g = emptyGroup(parent.operator === "or" ? "and" : "or");
			g.children.push(node, newRule());
			parent.children.splice(at, 1, g);
			notify();
		},
		remove: (nodeId) => {
			const parent = findParent(nodeId);
			if (!parent) return;
			parent.children = parent.children.filter((c) => c.id !== nodeId);
			if (!parent.children.length && parent !== tree) controller.remove(parent.id);
			else notify();
		},
		updateRule: (ruleId, patch) => {
			const node = findNode(ruleId);
			if (!node || node.kind !== "rule") return;
			if (patch.field !== void 0 && patch.field !== node.field) {
				node.field = patch.field;
				node.operator = defaultOperator(fieldDef(node.field)?.dataType ?? "string");
				node.value = "";
			}
			if (patch.operator !== void 0) node.operator = patch.operator;
			if (patch.value !== void 0) {
				const dt = fieldDef(node.field)?.dataType ?? "string";
				node.value = Array.isArray(patch.value) ? patch.value.map((v) => coerceValue(v, dt)) : coerceValue(patch.value, dt);
			}
			notify();
		},
		setGroupOperator: (groupId, operator) => {
			const node = findNode(groupId);
			if (node?.kind === "group") {
				node.operator = operator;
				notify();
			}
		},
		subscribe: (cb) => notifier.subscribe(cb),
		dispose: () => notifier.clear()
	};
	return controller;
}
//#endregion
export { monoFilterBuilder as t };
