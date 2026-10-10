import { a as resolveEnv, c as resolveMonoConfig } from "./create-config-DdL3Fh6T.js";
import { c as useMyToken, d as useMyJwt, n as monoJwt, s as useMyCookie, t as monoCookie } from "./universal-SQvYjTsQ.js";
import { Fragment, computed, createBlock, createCommentVNode, createElementBlock, createElementVNode, defineComponent, isRef, markRaw, normalizeStyle, onBeforeUnmount, openBlock, reactive, readonly, ref, renderList, toDisplayString, watch, withCtx } from "vue";
import { Notifications, Notivue, pastelTheme, push } from "notivue";
import { Deferred } from "devextreme/core/utils/deferred";
import { useRouter } from "vue-router";

//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") {
		for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) {
				__defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
		}
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
//#region src/composables/state.ts
const _state = reactive({
	config: void 0,
	jwt: {
		token: {},
		refreshToken: {}
	},
	cookie: {}
});
const monoStateReadonly = readonly(_state);
function monoStatePatch(patch) {
	if (patch.cookie) _state.cookie = {
		..._state.cookie,
		...patch.cookie
	};
	if (!patch.jwt) return;
	const next = { ..._state.jwt };
	for (const [key, claims] of Object.entries(patch.jwt)) {
		if (!claims) continue;
		next[key] = {
			...next[key] ?? {},
			...claims
		};
	}
	_state.jwt = next;
}
function monoState() {
	return monoStateReadonly;
}
function monoStateReset() {
	_state.cookie = {};
	_state.jwt = {
		token: {},
		refreshToken: {}
	};
}
/**
* Bridge between mono.config.ts and monoState().
*
* This reads:
* - configured cookies
* - configured jwt token cookie
* - configured refresh token cookie
*
* Then patches the shared reactive mono state.
*/
function initMono(option) {
	option = resolveMonoConfig(option);
	_state.config = option;
	for (const item of option.cookie ?? []) try {
		const value = monoCookie().get(item.name, Boolean(item.split));
		if (value != null) monoStatePatch({ cookie: { [item.name]: value } });
	} catch {}
	const patch = {};
	for (const [key, entry] of Object.entries(option.jwt ?? {})) {
		if (!entry) continue;
		warnMisCasedJwtKey(key);
		if (typeof entry.name === "object" && entry.name) {
			patch[key] = { ...entry.name };
			continue;
		}
		if (typeof entry.name !== "string") continue;
		if (Object.keys(_state.jwt[key] ?? {}).length > 0) continue;
		patch[key] = { ...monoJwt().cookieDecode?.({
			cookie: entry.name,
			splitCookie: Boolean(entry.split)
		}) ?? {} };
	}
	if (Object.keys(patch).length) monoStatePatch({ jwt: patch });
	return option;
}
/** The two keys mono itself reads by name. */
const KNOWN_JWT_KEYS = ["token", "refreshToken"];
/**
* `jwt` accepts any key, which means TypeScript's excess-property check is off for the
* block — so `refreshtoken` (lowercase `t`) compiles happily. It then hydrates as its own
* entry while `monoState().jwt.refreshToken` stays empty, and every guard reading it sees
* a logged-out user. Nothing else would ever report that, so say it here.
*/
function warnMisCasedJwtKey(key) {
	if (KNOWN_JWT_KEYS.includes(key)) return;
	const known = KNOWN_JWT_KEYS.find((k) => k.toLowerCase() === key.toLowerCase());
	if (!known) return;
	console.warn(`[@mono-lit/utility] jwt key "${key}" looks like a mis-cased "${known}". It will hydrate as its own entry, and monoState().jwt.${known} will stay empty.`);
}
function monoConfig() {
	return monoStateReadonly.config;
}
function monoEnv(key) {
	const resolved = resolveEnv(monoConfig() ?? {});
	return key == null ? resolved : resolved[key];
}
/**
* Vue plugin version.
*
* Usage:
*
* createApp(App)
*   .use(createMono(config))
*   .mount('#app')
*/
function createMono(option) {
	return { install(app) {
		initMono(option);
		app.provide("mono:config", option);
		app.provide("mono:state", monoStateReadonly);
	} };
}

//#endregion
//#region src/composables/nuxt-state.ts
/** key -> the one ref every caller of that key shares. */
const states = /* @__PURE__ */ new Map();
function useState(keyOrInit, maybeInit) {
	const key = typeof keyOrInit === "string" ? keyOrInit : void 0;
	const init = key === void 0 ? keyOrInit : maybeInit;
	if (!key) return createState(init);
	const existing = states.get(key);
	if (existing) return existing;
	const state = createState(init);
	states.set(key, state);
	return state;
}
/** Explicit alias — for hosts that don't want the bare Nuxt name in scope. */
const monoUseState = useState;
function createState(init) {
	const value = typeof init === "function" ? init() : init;
	return isRef(value) ? value : ref(value);
}
/**
* Drop keyed state so the next `useState(key, init)` re-runs `init` (Nuxt's
* `clearNuxtState`). No argument clears everything; a predicate filters by key.
*
* Only the registry entry goes — refs already handed out keep working, they're
* just no longer what that key resolves to.
*/
function clearNuxtState(keys) {
	if (keys === void 0) {
		states.clear();
		return;
	}
	if (typeof keys === "function") {
		for (const key of [...states.keys()]) if (keys(key)) states.delete(key);
		return;
	}
	for (const key of Array.isArray(keys) ? keys : [keys]) states.delete(key);
}
/** The live keyed refs — for devtools/debugging, not app logic. */
function nuxtStateKeys() {
	return [...states.keys()];
}

//#endregion
//#region src/composables/combine-layout.ts
let defineLayout = ({ menu, routes }) => {
	const allMenus = menu;
	const autoRoutes = routes;
	function joinUrl(parent, child) {
		return `${parent?.endsWith("/") ? parent.slice(0, -1) : parent}${child?.startsWith("/") ? child : `/${child}`}`;
	}
	function buildRouteMetaMap(menus) {
		const map = /* @__PURE__ */ new Map();
		const walk = (node, parentBase = "") => {
			if (!node.items?.length && node.route?.meta) {
				const fullPath = parentBase ? joinUrl(parentBase, String(node.url)) : String(node.url);
				if (map.has(fullPath)) console.warn("[route-meta] duplicated path:", fullPath, "overridden");
				map.set(fullPath, node.route.meta);
			}
			if (node.items?.length) {
				const base = String(node.url || "");
				node.items.forEach((ch) => walk(ch, base));
			}
		};
		menus.forEach((m) => walk(m));
		return map;
	}
	function joinPath(parent, child) {
		const p = parent.replace(/\/+$/, "");
		const c = child.replace(/^\/+/, "");
		if (!p) return "/" + c;
		if (!c) return p || "/";
		return `${p}/${c}`;
	}
	function walkRoutesFull(routes, fn, parentFullPath = "") {
		for (const r of routes) {
			const raw = String(r.path ?? "");
			const fullPath = raw.startsWith("/") ? raw : joinPath(parentFullPath || "", raw);
			fn(r, fullPath);
			if (r.children?.length) walkRoutesFull(r.children, fn, fullPath);
		}
	}
	const rawRoutes = [...autoRoutes];
	const routeMetaByPath = buildRouteMetaMap(allMenus);
	walkRoutesFull(rawRoutes, (r, fullPath) => {
		r.meta ??= {};
		const metaAny = r.meta;
		const fromMenu = routeMetaByPath.get(fullPath);
		if (fromMenu) Object.assign(metaAny, fromMenu);
		metaAny.title ??= typeof r.name === "string" ? r.name : fullPath;
		const isPublic = fullPath === "/" || fullPath === "/error";
		const isPage = !!r.component || !!r.components;
		if (!isPublic && isPage) metaAny.layout ??= "home";
	});
	return rawRoutes;
};

//#endregion
//#region src/composables/host-provider.ts
const registry = /* @__PURE__ */ new Map();
function getOrCreateHostRef(key, defaultValue) {
	let target = registry.get(key);
	if (!target) {
		target = ref(defaultValue);
		registry.set(key, target);
	}
	return target;
}
function monoInject(options) {
	const { key, defaultValue } = options;
	return getOrCreateHostRef(key, defaultValue);
}
function monoProvide(options) {
	const { key, syncRef, immediate = true, deep = true, resetOnUnmount = false, resetValue, deleteOnUnmount = false } = options;
	const target = getOrCreateHostRef(key, syncRef.value);
	const stop = watch(syncRef, (value) => {
		target.value = value;
	}, {
		immediate,
		deep
	});
	onBeforeUnmount(() => {
		stop();
		if (resetOnUnmount) target.value = resetValue ?? syncRef.value;
		if (deleteOnUnmount) registry.delete(key);
	});
	return target;
}

//#endregion
//#region src/core/composables/use-static-datasource.ts
const toArray$1 = (v) => v == null ? [] : Array.isArray(v) ? v : [v];
const norm = (v, ci) => ci && typeof v === "string" ? v.toLocaleLowerCase() : v;
const get = (obj, path) => {
	if (!obj) return void 0;
	const segs = path.split(/[./]/g).filter(Boolean);
	let cur = obj;
	for (const s of segs) {
		if (cur == null) return void 0;
		cur = cur[s];
	}
	return cur;
};
const pick = (o, keys) => {
	const r = {};
	for (const k of keys) r[k] = o[k];
	return r;
};
const splitCsv = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
const isLogicOp = (v) => typeof v === "string" && (v.toLocaleLowerCase() === "and" || v.toLocaleLowerCase() === "or");
function evalDxFilter(item, f, ci) {
	if (typeof f === "function") return !!f(item);
	if (!Array.isArray(f) || f.length === 0) return true;
	if (f[0] === "!" && Array.isArray(f[1])) return !evalDxFilter(item, f[1], ci);
	if (Array.isArray(f[0]) || typeof f[0] === "function") {
		let orAcc = false;
		let andAcc = true;
		let pending = "and";
		let seen = false;
		for (const part of f) {
			if (isLogicOp(part)) {
				pending = part.toLocaleLowerCase();
				continue;
			}
			const val = evalDxFilter(item, part, ci);
			if (!seen) {
				andAcc = val;
				seen = true;
			} else if (pending === "and") andAcc = andAcc && val;
			else {
				orAcc = orAcc || andAcc;
				andAcc = val;
			}
			pending = "and";
		}
		return seen ? orAcc || andAcc : true;
	}
	const [field, op, val] = f.length === 2 && f[0] !== "!" ? [
		f[0],
		"=",
		f[1]
	] : f;
	const a = get(item, String(field));
	const b = val;
	const isNumericLike = (v) => typeof v === "number" || typeof v === "string" && v.trim() !== "" && !isNaN(Number(v));
	const eq = (x, y) => {
		if (x == null || y == null) return x === y;
		if (isNumericLike(x) || isNumericLike(y)) return Number(x) === Number(y);
		return (ci ? String(x).toLocaleLowerCase() : String(x)) === (ci ? String(y).toLocaleLowerCase() : String(y));
	};
	const cmp = (x, y, rel) => {
		const op = {
			">": (a, b) => a > b,
			">=": (a, b) => a >= b,
			"<": (a, b) => a < b,
			"<=": (a, b) => a <= b
		}[rel];
		if (isNumericLike(x) || isNumericLike(y)) return op(Number(x), Number(y));
		return op(ci ? String(x).toLocaleLowerCase() : String(x), ci ? String(y).toLocaleLowerCase() : String(y));
	};
	switch (op) {
		case "=": return eq(a, b);
		case "<>": return !eq(a, b);
		case ">": return cmp(a, b, ">");
		case ">=": return cmp(a, b, ">=");
		case "<": return cmp(a, b, "<");
		case "<=": return cmp(a, b, "<=");
		case "contains": {
			const xs = (a ?? "").toString();
			const ys = (b ?? "").toString();
			return ci ? xs.toLocaleLowerCase().includes(ys.toLocaleLowerCase()) : xs.includes(ys);
		}
		case "notcontains": {
			const xs = (a ?? "").toString();
			const ys = (b ?? "").toString();
			return ci ? !xs.toLocaleLowerCase().includes(ys.toLocaleLowerCase()) : !xs.includes(ys);
		}
		case "startswith": {
			const xs = (a ?? "").toString();
			const ys = (b ?? "").toString();
			return ci ? xs.toLocaleLowerCase().startsWith(ys.toLocaleLowerCase()) : xs.startsWith(ys);
		}
		case "endswith": {
			const xs = (a ?? "").toString();
			const ys = (b ?? "").toString();
			return ci ? xs.toLocaleLowerCase().endsWith(ys.toLocaleLowerCase()) : xs.endsWith(ys);
		}
		default: return true;
	}
}
function parseOdataFilterToDx(str) {
	if (!str?.trim()) return null;
	const tokens = [];
	let i = 0;
	while (i < str.length) {
		const ch = str[i];
		if (/\s/.test(ch)) {
			i++;
			continue;
		}
		if (ch === "'") {
			let j = i + 1, out = "";
			while (j < str.length) {
				const c = str[j];
				if (c === "'" && str[j + 1] === "'") {
					out += "'";
					j += 2;
					continue;
				}
				if (c === "'") break;
				out += c;
				j++;
			}
			tokens.push(`'${out}'`);
			i = j + 1;
			continue;
		}
		if (/[(),]/.test(ch)) {
			tokens.push(ch);
			i++;
			continue;
		}
		let j = i;
		while (j < str.length && !/[\s(),]/.test(str[j])) j++;
		tokens.push(str.slice(i, j));
		i = j;
	}
	const peek = () => tokens[0];
	const pop = () => tokens.shift();
	const readValue = () => {
		const t = pop();
		if (!t) return null;
		if (t.startsWith("'")) return t.slice(1, -1);
		if (/^\d+(\.\d+)?$/.test(t)) return Number(t);
		if (/^true|false$/i.test(t)) return t.toLowerCase() === "true";
		if (/^null$/i.test(t)) return null;
		return { ident: t };
	};
	const readCmp = () => {
		const left = readValue();
		const op = (pop() || "").toLowerCase();
		if (typeof left === "object" && left.ident && peek() === "(") {
			const fn = left.ident.toLowerCase();
			pop();
			const arg1 = readValue();
			if (peek() === ",") pop();
			const arg2 = readValue();
			if (peek() === ")") pop();
			if (fn === "contains") return [
				String(arg1.ident ?? arg1),
				"contains",
				arg2
			];
			if (fn === "startswith") return [
				String(arg1.ident ?? arg1),
				"startswith",
				arg2
			];
			if (fn === "endswith") return [
				String(arg1.ident ?? arg1),
				"endswith",
				arg2
			];
			return null;
		}
		const right = readValue();
		const field = String(left.ident ?? left);
		const val = right && right.ident ? right.ident : right;
		switch (op) {
			case "eq": return [
				field,
				"=",
				val
			];
			case "ne": return [
				field,
				"<>",
				val
			];
			case "gt": return [
				field,
				">",
				val
			];
			case "ge": return [
				field,
				">=",
				val
			];
			case "lt": return [
				field,
				"<",
				val
			];
			case "le": return [
				field,
				"<=",
				val
			];
			default: return null;
		}
	};
	let expr = readCmp();
	while (tokens.length >= 2) {
		const logic = (pop() || "").toLowerCase();
		if (logic !== "and" && logic !== "or") break;
		const right = readCmp();
		if (!right) break;
		expr = [
			expr,
			logic,
			right
		];
	}
	return expr ?? null;
}
function parseOrderBy(s) {
	if (!s) return [];
	return splitCsv(s).map((p) => {
		const [field, dir] = p.split(/\s+/);
		return {
			selector: field,
			desc: String(dir ?? "").toLowerCase() === "desc"
		};
	});
}
function applySearch(rows, needle, fields, ci) {
	if (!needle) return rows;
	const n = ci ? needle.toLocaleLowerCase() : needle;
	return rows.filter((r) => fields.some((f) => {
		const v = get(r, f);
		if (v == null) return false;
		return (ci ? String(v).toLocaleLowerCase() : String(v)).includes(n);
	}));
}
function makeDxPromise() {
	let resolve, reject;
	const p = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});
	const api = {};
	api.then = p.then.bind(p);
	api.catch = p.catch.bind(p);
	api.finally = p.finally.bind(p);
	api.done = (cb) => {
		p.then(cb);
		return api;
	};
	api.fail = (cb) => {
		p.catch(cb);
		return api;
	};
	api.always = (cb) => {
		p.then(cb, cb);
		return api;
	};
	api._resolve = (v) => resolve(v);
	api._reject = (e) => reject(e);
	return api;
}
const dxResolve = (val) => {
	const d = makeDxPromise();
	d._resolve(val);
	return d;
};
async function createStaticDatasource(opts) {
	try {
		const key = String(opts.key ?? "_Id");
		const local = toArray$1(typeof opts.data === "function" ? opts.data() : opts.data).map((x) => ({ ...x }));
		let nextTemp = -1;
		const ensureKey = (row) => {
			if (row[key] == null) row[key] = nextTemp--;
			return row;
		};
		let currentParams = { ...opts.params ?? {} };
		const andFilters = (a, b) => a && b ? [
			a,
			"and",
			b
		] : a || b;
		function runOdataOnArray(rows, loadOptions) {
			const ci = opts.caseInsensitive ?? true;
			const filterDx = andFilters(typeof currentParams.$filter === "string" ? parseOdataFilterToDx(currentParams.$filter) : Array.isArray(currentParams.$filter) ? currentParams.$filter : null, Array.isArray(loadOptions?.filter) ? loadOptions.filter : null);
			let items = rows.slice();
			if (filterDx) items = items.filter((r) => evalDxFilter(r, filterDx, ci));
			const needles = [currentParams.$search, loadOptions?.searchValue].filter(Boolean).map(String);
			if (needles.length) {
				const fields = (opts.searchFields?.length ? opts.searchFields.map(String) : Object.keys(items[0] ?? [])).filter((k) => typeof items[0]?.[k] === "string");
				for (const n of needles) items = applySearch(items, n, fields, ci);
			}
			const order = parseOrderBy(currentParams.$orderby) || (Array.isArray(loadOptions?.sort) ? loadOptions.sort.map((s) => ({
				selector: String(s.selector),
				desc: !!s.desc
			})) : []);
			if (order.length) items.sort((a, b) => {
				for (const { selector, desc } of order) {
					const aa = norm(get(a, selector), ci);
					const bb = norm(get(b, selector), ci);
					if (aa < bb) return desc ? 1 : -1;
					if (aa > bb) return desc ? -1 : 1;
				}
				return 0;
			});
			const total = items.length;
			const skip = currentParams.$skip ?? loadOptions?.skip ?? 0;
			const take = currentParams.$top ?? loadOptions?.take ?? items.length;
			if (skip || take != null) items = items.slice(skip, skip + (take ?? items.length));
			const selectList = Array.isArray(currentParams.$select) ? currentParams.$select : typeof currentParams.$select === "string" ? splitCsv(currentParams.$select) : [];
			if (selectList.length) {
				const finalKeys = (opts.keepKeyOnSelect ?? true) && !selectList.includes(key) ? [...selectList, key] : selectList;
				items = items.map((x) => pick(x, finalKeys));
			}
			return {
				data: items,
				total
			};
		}
		const store = new opts.source.CustomStore({
			key,
			load: (loadOptions) => {
				const { data, total } = runOdataOnArray(local, loadOptions);
				return loadOptions?.requireTotalCount ? dxResolve({
					data,
					totalCount: total
				}) : dxResolve(data);
			},
			byKey: (k) => {
				const toKeyStr = (v) => v == null ? "" : String(v);
				return dxResolve(local.find((x) => toKeyStr(x[key]) === toKeyStr(k)) ?? null);
			},
			insert: (values) => {
				const row = ensureKey({ ...values });
				local.push(row);
				return dxResolve(row);
			},
			update: (k, values) => {
				const i = local.findIndex((x) => x[key] === k);
				if (i !== -1) {
					Object.assign(local[i], values);
					return dxResolve(local[i]);
				}
				return dxResolve(null);
			},
			remove: (k) => {
				const i = local.findIndex((x) => x[key] === k);
				if (i !== -1) local.splice(i, 1);
				return dxResolve(k);
			}
		});
		const dataSource = new opts.source.DataSource({
			store,
			reshapeOnPush: true,
			paginate: false
		});
		markRaw(store);
		markRaw(dataSource);
		return {
			dataSource,
			data: null,
			statusCode: 200,
			error: null
		};
	} catch (e) {
		return {
			dataSource: new opts.source.DataSource({ store: [] }),
			data: null,
			statusCode: 500,
			error: {
				message: e?.message ?? "Unexpected error",
				stack: String(e?.stack ?? ""),
				response: e
			}
		};
	}
}

//#endregion
//#region ../../node_modules/.pnpm/property-expr@2.0.6/node_modules/property-expr/index.js
/**
* Based on Kendo UI Core expression code <https://github.com/telerik/kendo-ui-core#license-information>
*/
var require_property_expr = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function Cache(maxSize) {
		this._maxSize = maxSize;
		this.clear();
	}
	Cache.prototype.clear = function() {
		this._size = 0;
		this._values = Object.create(null);
	};
	Cache.prototype.get = function(key) {
		return this._values[key];
	};
	Cache.prototype.set = function(key, value) {
		this._size >= this._maxSize && this.clear();
		if (!(key in this._values)) this._size++;
		return this._values[key] = value;
	};
	var SPLIT_REGEX = /[^.^\]^[]+|(?=\[\]|\.\.)/g, DIGIT_REGEX = /^\d+$/, LEAD_DIGIT_REGEX = /^\d/, SPEC_CHAR_REGEX = /[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g, CLEAN_QUOTES_REGEX = /^\s*(['"]?)(.*?)(\1)\s*$/, MAX_CACHE_SIZE = 512;
	var pathCache = new Cache(MAX_CACHE_SIZE), setCache = new Cache(MAX_CACHE_SIZE), getCache = new Cache(MAX_CACHE_SIZE);
	module.exports = {
		Cache,
		split,
		normalizePath,
		setter: function(path) {
			var parts = normalizePath(path);
			return setCache.get(path) || setCache.set(path, function setter(obj, value) {
				var index = 0;
				var len = parts.length;
				var data = obj;
				while (index < len - 1) {
					var part = parts[index];
					if (part === "__proto__" || part === "constructor" || part === "prototype") return obj;
					data = data[parts[index++]];
				}
				data[parts[index]] = value;
			});
		},
		getter: function(path, safe) {
			var parts = normalizePath(path);
			return getCache.get(path) || getCache.set(path, function getter(data) {
				var index = 0, len = parts.length;
				while (index < len) if (data != null || !safe) data = data[parts[index++]];
				else return;
				return data;
			});
		},
		join: function(segments) {
			return segments.reduce(function(path, part) {
				return path + (isQuoted(part) || DIGIT_REGEX.test(part) ? "[" + part + "]" : (path ? "." : "") + part);
			}, "");
		},
		forEach: function(path, cb, thisArg) {
			forEach(Array.isArray(path) ? path : split(path), cb, thisArg);
		}
	};
	function normalizePath(path) {
		return pathCache.get(path) || pathCache.set(path, split(path).map(function(part) {
			return part.replace(CLEAN_QUOTES_REGEX, "$2");
		}));
	}
	function split(path) {
		return path.match(SPLIT_REGEX) || [""];
	}
	function forEach(parts, iter, thisArg) {
		var len = parts.length, part, idx, isArray, isBracket;
		for (idx = 0; idx < len; idx++) {
			part = parts[idx];
			if (part) {
				if (shouldBeQuoted(part)) part = "\"" + part + "\"";
				isBracket = isQuoted(part);
				isArray = !isBracket && /^\d+$/.test(part);
				iter.call(thisArg, part, isBracket, isArray, idx, parts);
			}
		}
	}
	function isQuoted(str) {
		return typeof str === "string" && str && ["'", "\""].indexOf(str.charAt(0)) !== -1;
	}
	function hasLeadingNumber(part) {
		return part.match(LEAD_DIGIT_REGEX) && !part.match(DIGIT_REGEX);
	}
	function hasSpecialChars(part) {
		return SPEC_CHAR_REGEX.test(part);
	}
	function shouldBeQuoted(part) {
		return !isQuoted(part) && (hasLeadingNumber(part) || hasSpecialChars(part));
	}
}));

//#endregion
//#region ../../node_modules/.pnpm/tiny-case@1.0.3/node_modules/tiny-case/index.js
var require_tiny_case = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const reWords = /[A-Z\xc0-\xd6\xd8-\xde]?[a-z\xdf-\xf6\xf8-\xff]+(?:['’](?:d|ll|m|re|s|t|ve))?(?=[\xac\xb1\xd7\xf7\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\xbf\u2000-\u206f \t\x0b\f\xa0\ufeff\n\r\u2028\u2029\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000]|[A-Z\xc0-\xd6\xd8-\xde]|$)|(?:[A-Z\xc0-\xd6\xd8-\xde]|[^\ud800-\udfff\xac\xb1\xd7\xf7\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\xbf\u2000-\u206f \t\x0b\f\xa0\ufeff\n\r\u2028\u2029\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\d+\u2700-\u27bfa-z\xdf-\xf6\xf8-\xffA-Z\xc0-\xd6\xd8-\xde])+(?:['’](?:D|LL|M|RE|S|T|VE))?(?=[\xac\xb1\xd7\xf7\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\xbf\u2000-\u206f \t\x0b\f\xa0\ufeff\n\r\u2028\u2029\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000]|[A-Z\xc0-\xd6\xd8-\xde](?:[a-z\xdf-\xf6\xf8-\xff]|[^\ud800-\udfff\xac\xb1\xd7\xf7\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\xbf\u2000-\u206f \t\x0b\f\xa0\ufeff\n\r\u2028\u2029\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\d+\u2700-\u27bfa-z\xdf-\xf6\xf8-\xffA-Z\xc0-\xd6\xd8-\xde])|$)|[A-Z\xc0-\xd6\xd8-\xde]?(?:[a-z\xdf-\xf6\xf8-\xff]|[^\ud800-\udfff\xac\xb1\xd7\xf7\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\xbf\u2000-\u206f \t\x0b\f\xa0\ufeff\n\r\u2028\u2029\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\d+\u2700-\u27bfa-z\xdf-\xf6\xf8-\xffA-Z\xc0-\xd6\xd8-\xde])+(?:['’](?:d|ll|m|re|s|t|ve))?|[A-Z\xc0-\xd6\xd8-\xde]+(?:['’](?:D|LL|M|RE|S|T|VE))?|\d*(?:1ST|2ND|3RD|(?![123])\dTH)(?=\b|[a-z_])|\d*(?:1st|2nd|3rd|(?![123])\dth)(?=\b|[A-Z_])|\d+|(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe2f\u20d0-\u20ff]|\ud83c[\udffb-\udfff])?(?:\u200d(?:[^\ud800-\udfff]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe2f\u20d0-\u20ff]|\ud83c[\udffb-\udfff])?)*/g;
	const words = (str) => str.match(reWords) || [];
	const upperFirst = (str) => str[0].toUpperCase() + str.slice(1);
	const join = (str, d) => words(str).join(d).toLowerCase();
	const camelCase = (str) => words(str).reduce((acc, next) => `${acc}${!acc ? next.toLowerCase() : next[0].toUpperCase() + next.slice(1).toLowerCase()}`, "");
	const pascalCase = (str) => upperFirst(camelCase(str));
	const snakeCase = (str) => join(str, "_");
	const kebabCase = (str) => join(str, "-");
	const sentenceCase = (str) => upperFirst(join(str, " "));
	const titleCase = (str) => words(str).map(upperFirst).join(" ");
	module.exports = {
		words,
		upperFirst,
		camelCase,
		pascalCase,
		snakeCase,
		kebabCase,
		sentenceCase,
		titleCase
	};
}));

//#endregion
//#region ../../node_modules/.pnpm/toposort@2.0.2/node_modules/toposort/index.js
var require_toposort = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Topological sorting function
	*
	* @param {Array} edges
	* @returns {Array}
	*/
	module.exports = function(edges) {
		return toposort(uniqueNodes(edges), edges);
	};
	module.exports.array = toposort;
	function toposort(nodes, edges) {
		var cursor = nodes.length, sorted = new Array(cursor), visited = {}, i = cursor, outgoingEdges = makeOutgoingEdges(edges), nodesHash = makeNodesHash(nodes);
		edges.forEach(function(edge) {
			if (!nodesHash.has(edge[0]) || !nodesHash.has(edge[1])) throw new Error("Unknown node. There is an unknown node in the supplied edges.");
		});
		while (i--) if (!visited[i]) visit(nodes[i], i, /* @__PURE__ */ new Set());
		return sorted;
		function visit(node, i, predecessors) {
			if (predecessors.has(node)) {
				var nodeRep;
				try {
					nodeRep = ", node was:" + JSON.stringify(node);
				} catch (e) {
					nodeRep = "";
				}
				throw new Error("Cyclic dependency" + nodeRep);
			}
			if (!nodesHash.has(node)) throw new Error("Found unknown node. Make sure to provided all involved nodes. Unknown node: " + JSON.stringify(node));
			if (visited[i]) return;
			visited[i] = true;
			var outgoing = outgoingEdges.get(node) || /* @__PURE__ */ new Set();
			outgoing = Array.from(outgoing);
			if (i = outgoing.length) {
				predecessors.add(node);
				do {
					var child = outgoing[--i];
					visit(child, nodesHash.get(child), predecessors);
				} while (i);
				predecessors.delete(node);
			}
			sorted[--cursor] = node;
		}
	}
	function uniqueNodes(arr) {
		var res = /* @__PURE__ */ new Set();
		for (var i = 0, len = arr.length; i < len; i++) {
			var edge = arr[i];
			res.add(edge[0]);
			res.add(edge[1]);
		}
		return Array.from(res);
	}
	function makeOutgoingEdges(arr) {
		var edges = /* @__PURE__ */ new Map();
		for (var i = 0, len = arr.length; i < len; i++) {
			var edge = arr[i];
			if (!edges.has(edge[0])) edges.set(edge[0], /* @__PURE__ */ new Set());
			if (!edges.has(edge[1])) edges.set(edge[1], /* @__PURE__ */ new Set());
			edges.get(edge[0]).add(edge[1]);
		}
		return edges;
	}
	function makeNodesHash(arr) {
		var res = /* @__PURE__ */ new Map();
		for (var i = 0, len = arr.length; i < len; i++) res.set(arr[i], i);
		return res;
	}
}));

//#endregion
//#region ../../node_modules/.pnpm/yup@1.7.1/node_modules/yup/index.esm.js
var import_property_expr = require_property_expr();
var import_tiny_case = require_tiny_case();
var import_toposort = /* @__PURE__ */ __toESM(require_toposort());
const toString = Object.prototype.toString;
const errorToString = Error.prototype.toString;
const regExpToString = RegExp.prototype.toString;
const symbolToString = typeof Symbol !== "undefined" ? Symbol.prototype.toString : () => "";
const SYMBOL_REGEXP = /^Symbol\((.*)\)(.*)$/;
function printNumber(val) {
	if (val != +val) return "NaN";
	return val === 0 && 1 / val < 0 ? "-0" : "" + val;
}
function printSimpleValue(val, quoteStrings = false) {
	if (val == null || val === true || val === false) return "" + val;
	const typeOf = typeof val;
	if (typeOf === "number") return printNumber(val);
	if (typeOf === "string") return quoteStrings ? `"${val}"` : val;
	if (typeOf === "function") return "[Function " + (val.name || "anonymous") + "]";
	if (typeOf === "symbol") return symbolToString.call(val).replace(SYMBOL_REGEXP, "Symbol($1)");
	const tag = toString.call(val).slice(8, -1);
	if (tag === "Date") return isNaN(val.getTime()) ? "" + val : val.toISOString(val);
	if (tag === "Error" || val instanceof Error) return "[" + errorToString.call(val) + "]";
	if (tag === "RegExp") return regExpToString.call(val);
	return null;
}
function printValue(value, quoteStrings) {
	let result = printSimpleValue(value, quoteStrings);
	if (result !== null) return result;
	return JSON.stringify(value, function(key, value) {
		let result = printSimpleValue(this[key], quoteStrings);
		if (result !== null) return result;
		return value;
	}, 2);
}
function toArray(value) {
	return value == null ? [] : [].concat(value);
}
let _Symbol$toStringTag, _Symbol$hasInstance, _Symbol$toStringTag2;
let strReg = /\$\{\s*(\w+)\s*\}/g;
_Symbol$toStringTag = Symbol.toStringTag;
var ValidationErrorNoStack = class {
	constructor(errorOrErrors, value, field, type) {
		this.name = void 0;
		this.message = void 0;
		this.value = void 0;
		this.path = void 0;
		this.type = void 0;
		this.params = void 0;
		this.errors = void 0;
		this.inner = void 0;
		this[_Symbol$toStringTag] = "Error";
		this.name = "ValidationError";
		this.value = value;
		this.path = field;
		this.type = type;
		this.errors = [];
		this.inner = [];
		toArray(errorOrErrors).forEach((err) => {
			if (ValidationError.isError(err)) {
				this.errors.push(...err.errors);
				const innerErrors = err.inner.length ? err.inner : [err];
				this.inner.push(...innerErrors);
			} else this.errors.push(err);
		});
		this.message = this.errors.length > 1 ? `${this.errors.length} errors occurred` : this.errors[0];
	}
};
_Symbol$hasInstance = Symbol.hasInstance;
_Symbol$toStringTag2 = Symbol.toStringTag;
var ValidationError = class ValidationError extends Error {
	static formatError(message, params) {
		const path = params.label || params.path || "this";
		params = Object.assign({}, params, {
			path,
			originalPath: params.path
		});
		if (typeof message === "string") return message.replace(strReg, (_, key) => printValue(params[key]));
		if (typeof message === "function") return message(params);
		return message;
	}
	static isError(err) {
		return err && err.name === "ValidationError";
	}
	constructor(errorOrErrors, value, field, type, disableStack) {
		const errorNoStack = new ValidationErrorNoStack(errorOrErrors, value, field, type);
		if (disableStack) return errorNoStack;
		super();
		this.value = void 0;
		this.path = void 0;
		this.type = void 0;
		this.params = void 0;
		this.errors = [];
		this.inner = [];
		this[_Symbol$toStringTag2] = "Error";
		this.name = errorNoStack.name;
		this.message = errorNoStack.message;
		this.type = errorNoStack.type;
		this.value = errorNoStack.value;
		this.path = errorNoStack.path;
		this.errors = errorNoStack.errors;
		this.inner = errorNoStack.inner;
		if (Error.captureStackTrace) Error.captureStackTrace(this, ValidationError);
	}
	static [_Symbol$hasInstance](inst) {
		return ValidationErrorNoStack[Symbol.hasInstance](inst) || super[Symbol.hasInstance](inst);
	}
};
let mixed = {
	default: "${path} is invalid",
	required: "${path} is a required field",
	defined: "${path} must be defined",
	notNull: "${path} cannot be null",
	oneOf: "${path} must be one of the following values: ${values}",
	notOneOf: "${path} must not be one of the following values: ${values}",
	notType: ({ path, type, value, originalValue }) => {
		const castMsg = originalValue != null && originalValue !== value ? ` (cast from the value \`${printValue(originalValue, true)}\`).` : ".";
		return type !== "mixed" ? `${path} must be a \`${type}\` type, but the final value was: \`${printValue(value, true)}\`` + castMsg : `${path} must match the configured type. The validated value was: \`${printValue(value, true)}\`` + castMsg;
	}
};
let string = {
	length: "${path} must be exactly ${length} characters",
	min: "${path} must be at least ${min} characters",
	max: "${path} must be at most ${max} characters",
	matches: "${path} must match the following: \"${regex}\"",
	email: "${path} must be a valid email",
	url: "${path} must be a valid URL",
	uuid: "${path} must be a valid UUID",
	datetime: "${path} must be a valid ISO date-time",
	datetime_precision: "${path} must be a valid ISO date-time with a sub-second precision of exactly ${precision} digits",
	datetime_offset: "${path} must be a valid ISO date-time with UTC \"Z\" timezone",
	trim: "${path} must be a trimmed string",
	lowercase: "${path} must be a lowercase string",
	uppercase: "${path} must be a upper case string"
};
let number = {
	min: "${path} must be greater than or equal to ${min}",
	max: "${path} must be less than or equal to ${max}",
	lessThan: "${path} must be less than ${less}",
	moreThan: "${path} must be greater than ${more}",
	positive: "${path} must be a positive number",
	negative: "${path} must be a negative number",
	integer: "${path} must be an integer"
};
let date = {
	min: "${path} field must be later than ${min}",
	max: "${path} field must be at earlier than ${max}"
};
let boolean = { isValue: "${path} field must be ${value}" };
let object = {
	noUnknown: "${path} field has unspecified keys: ${unknown}",
	exact: "${path} object contains unknown properties: ${properties}"
};
let array = {
	min: "${path} field must have at least ${min} items",
	max: "${path} field must have less than or equal to ${max} items",
	length: "${path} must have ${length} items"
};
let tuple = { notType: (params) => {
	const { path, value, spec } = params;
	const typeLen = spec.types.length;
	if (Array.isArray(value)) {
		if (value.length < typeLen) return `${path} tuple value has too few items, expected a length of ${typeLen} but got ${value.length} for value: \`${printValue(value, true)}\``;
		if (value.length > typeLen) return `${path} tuple value has too many items, expected a length of ${typeLen} but got ${value.length} for value: \`${printValue(value, true)}\``;
	}
	return ValidationError.formatError(mixed.notType, params);
} };
var locale = Object.assign(Object.create(null), {
	mixed,
	string,
	number,
	date,
	object,
	array,
	boolean,
	tuple
});
const isSchema = (obj) => obj && obj.__isYupSchema__;
var Condition = class Condition {
	static fromOptions(refs, config) {
		if (!config.then && !config.otherwise) throw new TypeError("either `then:` or `otherwise:` is required for `when()` conditions");
		let { is, then, otherwise } = config;
		let check = typeof is === "function" ? is : (...values) => values.every((value) => value === is);
		return new Condition(refs, (values, schema) => {
			var _branch;
			let branch = check(...values) ? then : otherwise;
			return (_branch = branch == null ? void 0 : branch(schema)) != null ? _branch : schema;
		});
	}
	constructor(refs, builder) {
		this.fn = void 0;
		this.refs = refs;
		this.refs = refs;
		this.fn = builder;
	}
	resolve(base, options) {
		let values = this.refs.map((ref) => ref.getValue(options == null ? void 0 : options.value, options == null ? void 0 : options.parent, options == null ? void 0 : options.context));
		let schema = this.fn(values, base, options);
		if (schema === void 0 || schema === base) return base;
		if (!isSchema(schema)) throw new TypeError("conditions must return a schema object");
		return schema.resolve(options);
	}
};
const prefixes = {
	context: "$",
	value: "."
};
var Reference = class {
	constructor(key, options = {}) {
		this.key = void 0;
		this.isContext = void 0;
		this.isValue = void 0;
		this.isSibling = void 0;
		this.path = void 0;
		this.getter = void 0;
		this.map = void 0;
		if (typeof key !== "string") throw new TypeError("ref must be a string, got: " + key);
		this.key = key.trim();
		if (key === "") throw new TypeError("ref must be a non-empty string");
		this.isContext = this.key[0] === prefixes.context;
		this.isValue = this.key[0] === prefixes.value;
		this.isSibling = !this.isContext && !this.isValue;
		let prefix = this.isContext ? prefixes.context : this.isValue ? prefixes.value : "";
		this.path = this.key.slice(prefix.length);
		this.getter = this.path && (0, import_property_expr.getter)(this.path, true);
		this.map = options.map;
	}
	getValue(value, parent, context) {
		let result = this.isContext ? context : this.isValue ? value : parent;
		if (this.getter) result = this.getter(result || {});
		if (this.map) result = this.map(result);
		return result;
	}
	/**
	*
	* @param {*} value
	* @param {Object} options
	* @param {Object=} options.context
	* @param {Object=} options.parent
	*/
	cast(value, options) {
		return this.getValue(value, options == null ? void 0 : options.parent, options == null ? void 0 : options.context);
	}
	resolve() {
		return this;
	}
	describe() {
		return {
			type: "ref",
			key: this.key
		};
	}
	toString() {
		return `Ref(${this.key})`;
	}
	static isRef(value) {
		return value && value.__isYupRef;
	}
};
Reference.prototype.__isYupRef = true;
const isAbsent = (value) => value == null;
function createValidation(config) {
	function validate({ value, path = "", options, originalValue, schema }, panic, next) {
		const { name, test, params, message, skipAbsent } = config;
		let { parent, context, abortEarly = schema.spec.abortEarly, disableStackTrace = schema.spec.disableStackTrace } = options;
		const resolveOptions = {
			value,
			parent,
			context
		};
		function createError(overrides = {}) {
			const nextParams = resolveParams(Object.assign({
				value,
				originalValue,
				label: schema.spec.label,
				path: overrides.path || path,
				spec: schema.spec,
				disableStackTrace: overrides.disableStackTrace || disableStackTrace
			}, params, overrides.params), resolveOptions);
			const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name, nextParams.disableStackTrace);
			error.params = nextParams;
			return error;
		}
		const invalid = abortEarly ? panic : next;
		let ctx = {
			path,
			parent,
			type: name,
			from: options.from,
			createError,
			resolve(item) {
				return resolveMaybeRef(item, resolveOptions);
			},
			options,
			originalValue,
			schema
		};
		const handleResult = (validOrError) => {
			if (ValidationError.isError(validOrError)) invalid(validOrError);
			else if (!validOrError) invalid(createError());
			else next(null);
		};
		const handleError = (err) => {
			if (ValidationError.isError(err)) invalid(err);
			else panic(err);
		};
		if (skipAbsent && isAbsent(value)) return handleResult(true);
		let result;
		try {
			var _result;
			result = test.call(ctx, value, ctx);
			if (typeof ((_result = result) == null ? void 0 : _result.then) === "function") {
				if (options.sync) throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);
				return Promise.resolve(result).then(handleResult, handleError);
			}
		} catch (err) {
			handleError(err);
			return;
		}
		handleResult(result);
	}
	validate.OPTIONS = config;
	return validate;
}
function resolveParams(params, options) {
	if (!params) return params;
	for (const key of Object.keys(params)) params[key] = resolveMaybeRef(params[key], options);
	return params;
}
function resolveMaybeRef(item, options) {
	return Reference.isRef(item) ? item.getValue(options.value, options.parent, options.context) : item;
}
function getIn(schema, path, value, context = value) {
	let parent, lastPart, lastPartDebug;
	if (!path) return {
		parent,
		parentPath: path,
		schema
	};
	(0, import_property_expr.forEach)(path, (_part, isBracket, isArray) => {
		let part = isBracket ? _part.slice(1, _part.length - 1) : _part;
		schema = schema.resolve({
			context,
			parent,
			value
		});
		let isTuple = schema.type === "tuple";
		let idx = isArray ? parseInt(part, 10) : 0;
		if (schema.innerType || isTuple) {
			if (isTuple && !isArray) throw new Error(`Yup.reach cannot implicitly index into a tuple type. the path part "${lastPartDebug}" must contain an index to the tuple element, e.g. "${lastPartDebug}[0]"`);
			if (value && idx >= value.length) throw new Error(`Yup.reach cannot resolve an array item at index: ${_part}, in the path: ${path}. because there is no value at that index. `);
			parent = value;
			value = value && value[idx];
			schema = isTuple ? schema.spec.types[idx] : schema.innerType;
		}
		if (!isArray) {
			if (!schema.fields || !schema.fields[part]) throw new Error(`The schema does not contain the path: ${path}. (failed at: ${lastPartDebug} which is a type: "${schema.type}")`);
			parent = value;
			value = value && value[part];
			schema = schema.fields[part];
		}
		lastPart = part;
		lastPartDebug = isBracket ? "[" + _part + "]" : "." + _part;
	});
	return {
		schema,
		parent,
		parentPath: lastPart
	};
}
var ReferenceSet = class ReferenceSet extends Set {
	describe() {
		const description = [];
		for (const item of this.values()) description.push(Reference.isRef(item) ? item.describe() : item);
		return description;
	}
	resolveAll(resolve) {
		let result = [];
		for (const item of this.values()) result.push(resolve(item));
		return result;
	}
	clone() {
		return new ReferenceSet(this.values());
	}
	merge(newItems, removeItems) {
		const next = this.clone();
		newItems.forEach((value) => next.add(value));
		removeItems.forEach((value) => next.delete(value));
		return next;
	}
};
function clone(src, seen = /* @__PURE__ */ new Map()) {
	if (isSchema(src) || !src || typeof src !== "object") return src;
	if (seen.has(src)) return seen.get(src);
	let copy;
	if (src instanceof Date) {
		copy = new Date(src.getTime());
		seen.set(src, copy);
	} else if (src instanceof RegExp) {
		copy = new RegExp(src);
		seen.set(src, copy);
	} else if (Array.isArray(src)) {
		copy = new Array(src.length);
		seen.set(src, copy);
		for (let i = 0; i < src.length; i++) copy[i] = clone(src[i], seen);
	} else if (src instanceof Map) {
		copy = /* @__PURE__ */ new Map();
		seen.set(src, copy);
		for (const [k, v] of src.entries()) copy.set(k, clone(v, seen));
	} else if (src instanceof Set) {
		copy = /* @__PURE__ */ new Set();
		seen.set(src, copy);
		for (const v of src) copy.add(clone(v, seen));
	} else if (src instanceof Object) {
		copy = {};
		seen.set(src, copy);
		for (const [k, v] of Object.entries(src)) copy[k] = clone(v, seen);
	} else throw Error(`Unable to clone ${src}`);
	return copy;
}
/**
* Copied from @standard-schema/spec to avoid having a dependency on it.
* https://github.com/standard-schema/standard-schema/blob/main/packages/spec/src/index.ts
*/
function createStandardPath(path) {
	if (!(path != null && path.length)) return;
	const segments = [];
	let currentSegment = "";
	let inBrackets = false;
	let inQuotes = false;
	for (let i = 0; i < path.length; i++) {
		const char = path[i];
		if (char === "[" && !inQuotes) {
			if (currentSegment) {
				segments.push(...currentSegment.split(".").filter(Boolean));
				currentSegment = "";
			}
			inBrackets = true;
			continue;
		}
		if (char === "]" && !inQuotes) {
			if (currentSegment) {
				if (/^\d+$/.test(currentSegment)) segments.push(currentSegment);
				else segments.push(currentSegment.replace(/^"|"$/g, ""));
				currentSegment = "";
			}
			inBrackets = false;
			continue;
		}
		if (char === "\"") {
			inQuotes = !inQuotes;
			continue;
		}
		if (char === "." && !inBrackets && !inQuotes) {
			if (currentSegment) {
				segments.push(currentSegment);
				currentSegment = "";
			}
			continue;
		}
		currentSegment += char;
	}
	if (currentSegment) segments.push(...currentSegment.split(".").filter(Boolean));
	return segments;
}
function createStandardIssues(error, parentPath) {
	const path = parentPath ? `${parentPath}.${error.path}` : error.path;
	return error.errors.map((err) => ({
		message: err,
		path: createStandardPath(path)
	}));
}
function issuesFromValidationError(error, parentPath) {
	var _error$inner;
	if (!((_error$inner = error.inner) != null && _error$inner.length) && error.errors.length) return createStandardIssues(error, parentPath);
	const path = parentPath ? `${parentPath}.${error.path}` : error.path;
	return error.inner.flatMap((err) => issuesFromValidationError(err, path));
}
var Schema = class {
	constructor(options) {
		this.type = void 0;
		this.deps = [];
		this.tests = void 0;
		this.transforms = void 0;
		this.conditions = [];
		this._mutate = void 0;
		this.internalTests = {};
		this._whitelist = new ReferenceSet();
		this._blacklist = new ReferenceSet();
		this.exclusiveTests = Object.create(null);
		this._typeCheck = void 0;
		this.spec = void 0;
		this.tests = [];
		this.transforms = [];
		this.withMutation(() => {
			this.typeError(mixed.notType);
		});
		this.type = options.type;
		this._typeCheck = options.check;
		this.spec = Object.assign({
			strip: false,
			strict: false,
			abortEarly: true,
			recursive: true,
			disableStackTrace: false,
			nullable: false,
			optional: true,
			coerce: true
		}, options == null ? void 0 : options.spec);
		this.withMutation((s) => {
			s.nonNullable();
		});
	}
	get _type() {
		return this.type;
	}
	clone(spec) {
		if (this._mutate) {
			if (spec) Object.assign(this.spec, spec);
			return this;
		}
		const next = Object.create(Object.getPrototypeOf(this));
		next.type = this.type;
		next._typeCheck = this._typeCheck;
		next._whitelist = this._whitelist.clone();
		next._blacklist = this._blacklist.clone();
		next.internalTests = Object.assign({}, this.internalTests);
		next.exclusiveTests = Object.assign({}, this.exclusiveTests);
		next.deps = [...this.deps];
		next.conditions = [...this.conditions];
		next.tests = [...this.tests];
		next.transforms = [...this.transforms];
		next.spec = clone(Object.assign({}, this.spec, spec));
		return next;
	}
	label(label) {
		let next = this.clone();
		next.spec.label = label;
		return next;
	}
	meta(...args) {
		if (args.length === 0) return this.spec.meta;
		let next = this.clone();
		next.spec.meta = Object.assign(next.spec.meta || {}, args[0]);
		return next;
	}
	withMutation(fn) {
		let before = this._mutate;
		this._mutate = true;
		let result = fn(this);
		this._mutate = before;
		return result;
	}
	concat(schema) {
		if (!schema || schema === this) return this;
		if (schema.type !== this.type && this.type !== "mixed") throw new TypeError(`You cannot \`concat()\` schema's of different types: ${this.type} and ${schema.type}`);
		let base = this;
		let combined = schema.clone();
		combined.spec = Object.assign({}, base.spec, combined.spec);
		combined.internalTests = Object.assign({}, base.internalTests, combined.internalTests);
		combined._whitelist = base._whitelist.merge(schema._whitelist, schema._blacklist);
		combined._blacklist = base._blacklist.merge(schema._blacklist, schema._whitelist);
		combined.tests = base.tests;
		combined.exclusiveTests = base.exclusiveTests;
		combined.withMutation((next) => {
			schema.tests.forEach((fn) => {
				next.test(fn.OPTIONS);
			});
		});
		combined.transforms = [...base.transforms, ...combined.transforms];
		return combined;
	}
	isType(v) {
		if (v == null) {
			if (this.spec.nullable && v === null) return true;
			if (this.spec.optional && v === void 0) return true;
			return false;
		}
		return this._typeCheck(v);
	}
	resolve(options) {
		let schema = this;
		if (schema.conditions.length) {
			let conditions = schema.conditions;
			schema = schema.clone();
			schema.conditions = [];
			schema = conditions.reduce((prevSchema, condition) => condition.resolve(prevSchema, options), schema);
			schema = schema.resolve(options);
		}
		return schema;
	}
	resolveOptions(options) {
		var _options$strict, _options$abortEarly, _options$recursive, _options$disableStack;
		return Object.assign({}, options, {
			from: options.from || [],
			strict: (_options$strict = options.strict) != null ? _options$strict : this.spec.strict,
			abortEarly: (_options$abortEarly = options.abortEarly) != null ? _options$abortEarly : this.spec.abortEarly,
			recursive: (_options$recursive = options.recursive) != null ? _options$recursive : this.spec.recursive,
			disableStackTrace: (_options$disableStack = options.disableStackTrace) != null ? _options$disableStack : this.spec.disableStackTrace
		});
	}
	/**
	* Run the configured transform pipeline over an input value.
	*/
	cast(value, options = {}) {
		let resolvedSchema = this.resolve(Object.assign({}, options, { value }));
		let allowOptionality = options.assert === "ignore-optionality";
		let result = resolvedSchema._cast(value, options);
		if (options.assert !== false && !resolvedSchema.isType(result)) {
			if (allowOptionality && isAbsent(result)) return result;
			let formattedValue = printValue(value);
			let formattedResult = printValue(result);
			throw new TypeError(`The value of ${options.path || "field"} could not be cast to a value that satisfies the schema type: "${resolvedSchema.type}". \n\nattempted value: ${formattedValue} \n` + (formattedResult !== formattedValue ? `result of cast: ${formattedResult}` : ""));
		}
		return result;
	}
	_cast(rawValue, options) {
		let value = rawValue === void 0 ? rawValue : this.transforms.reduce((prevValue, fn) => fn.call(this, prevValue, rawValue, this, options), rawValue);
		if (value === void 0) value = this.getDefault(options);
		return value;
	}
	_validate(_value, options = {}, panic, next) {
		let { path, originalValue = _value, strict = this.spec.strict } = options;
		let value = _value;
		if (!strict) value = this._cast(value, Object.assign({ assert: false }, options));
		let initialTests = [];
		for (let test of Object.values(this.internalTests)) if (test) initialTests.push(test);
		this.runTests({
			path,
			value,
			originalValue,
			options,
			tests: initialTests
		}, panic, (initialErrors) => {
			if (initialErrors.length) return next(initialErrors, value);
			this.runTests({
				path,
				value,
				originalValue,
				options,
				tests: this.tests
			}, panic, next);
		});
	}
	/**
	* Executes a set of validations, either schema, produced Tests or a nested
	* schema validate result.
	*/
	runTests(runOptions, panic, next) {
		let fired = false;
		let { tests, value, originalValue, path, options } = runOptions;
		let panicOnce = (arg) => {
			if (fired) return;
			fired = true;
			panic(arg, value);
		};
		let nextOnce = (arg) => {
			if (fired) return;
			fired = true;
			next(arg, value);
		};
		let count = tests.length;
		let nestedErrors = [];
		if (!count) return nextOnce([]);
		let args = {
			value,
			originalValue,
			path,
			options,
			schema: this
		};
		for (let i = 0; i < tests.length; i++) {
			const test = tests[i];
			test(args, panicOnce, function finishTestRun(err) {
				if (err) Array.isArray(err) ? nestedErrors.push(...err) : nestedErrors.push(err);
				if (--count <= 0) nextOnce(nestedErrors);
			});
		}
	}
	asNestedTest({ key, index, parent, parentPath, originalParent, options }) {
		const k = key != null ? key : index;
		if (k == null) throw TypeError("Must include `key` or `index` for nested validations");
		const isIndex = typeof k === "number";
		let value = parent[k];
		const testOptions = Object.assign({}, options, {
			strict: true,
			parent,
			value,
			originalValue: originalParent[k],
			key: void 0,
			[isIndex ? "index" : "key"]: k,
			path: isIndex || k.includes(".") ? `${parentPath || ""}[${isIndex ? k : `"${k}"`}]` : (parentPath ? `${parentPath}.` : "") + key
		});
		return (_, panic, next) => this.resolve(testOptions)._validate(value, testOptions, panic, next);
	}
	validate(value, options) {
		var _options$disableStack2;
		let schema = this.resolve(Object.assign({}, options, { value }));
		let disableStackTrace = (_options$disableStack2 = options == null ? void 0 : options.disableStackTrace) != null ? _options$disableStack2 : schema.spec.disableStackTrace;
		return new Promise((resolve, reject) => schema._validate(value, options, (error, parsed) => {
			if (ValidationError.isError(error)) error.value = parsed;
			reject(error);
		}, (errors, validated) => {
			if (errors.length) reject(new ValidationError(errors, validated, void 0, void 0, disableStackTrace));
			else resolve(validated);
		}));
	}
	validateSync(value, options) {
		var _options$disableStack3;
		let schema = this.resolve(Object.assign({}, options, { value }));
		let result;
		let disableStackTrace = (_options$disableStack3 = options == null ? void 0 : options.disableStackTrace) != null ? _options$disableStack3 : schema.spec.disableStackTrace;
		schema._validate(value, Object.assign({}, options, { sync: true }), (error, parsed) => {
			if (ValidationError.isError(error)) error.value = parsed;
			throw error;
		}, (errors, validated) => {
			if (errors.length) throw new ValidationError(errors, value, void 0, void 0, disableStackTrace);
			result = validated;
		});
		return result;
	}
	isValid(value, options) {
		return this.validate(value, options).then(() => true, (err) => {
			if (ValidationError.isError(err)) return false;
			throw err;
		});
	}
	isValidSync(value, options) {
		try {
			this.validateSync(value, options);
			return true;
		} catch (err) {
			if (ValidationError.isError(err)) return false;
			throw err;
		}
	}
	_getDefault(options) {
		let defaultValue = this.spec.default;
		if (defaultValue == null) return defaultValue;
		return typeof defaultValue === "function" ? defaultValue.call(this, options) : clone(defaultValue);
	}
	getDefault(options) {
		return this.resolve(options || {})._getDefault(options);
	}
	default(def) {
		if (arguments.length === 0) return this._getDefault();
		return this.clone({ default: def });
	}
	strict(isStrict = true) {
		return this.clone({ strict: isStrict });
	}
	nullability(nullable, message) {
		const next = this.clone({ nullable });
		next.internalTests.nullable = createValidation({
			message,
			name: "nullable",
			test(value) {
				return value === null ? this.schema.spec.nullable : true;
			}
		});
		return next;
	}
	optionality(optional, message) {
		const next = this.clone({ optional });
		next.internalTests.optionality = createValidation({
			message,
			name: "optionality",
			test(value) {
				return value === void 0 ? this.schema.spec.optional : true;
			}
		});
		return next;
	}
	optional() {
		return this.optionality(true);
	}
	defined(message = mixed.defined) {
		return this.optionality(false, message);
	}
	nullable() {
		return this.nullability(true);
	}
	nonNullable(message = mixed.notNull) {
		return this.nullability(false, message);
	}
	required(message = mixed.required) {
		return this.clone().withMutation((next) => next.nonNullable(message).defined(message));
	}
	notRequired() {
		return this.clone().withMutation((next) => next.nullable().optional());
	}
	transform(fn) {
		let next = this.clone();
		next.transforms.push(fn);
		return next;
	}
	/**
	* Adds a test function to the schema's queue of tests.
	* tests can be exclusive or non-exclusive.
	*
	* - exclusive tests, will replace any existing tests of the same name.
	* - non-exclusive: can be stacked
	*
	* If a non-exclusive test is added to a schema with an exclusive test of the same name
	* the exclusive test is removed and further tests of the same name will be stacked.
	*
	* If an exclusive test is added to a schema with non-exclusive tests of the same name
	* the previous tests are removed and further tests of the same name will replace each other.
	*/
	test(...args) {
		let opts;
		if (args.length === 1) if (typeof args[0] === "function") opts = { test: args[0] };
		else opts = args[0];
		else if (args.length === 2) opts = {
			name: args[0],
			test: args[1]
		};
		else opts = {
			name: args[0],
			message: args[1],
			test: args[2]
		};
		if (opts.message === void 0) opts.message = mixed.default;
		if (typeof opts.test !== "function") throw new TypeError("`test` is a required parameters");
		let next = this.clone();
		let validate = createValidation(opts);
		let isExclusive = opts.exclusive || opts.name && next.exclusiveTests[opts.name] === true;
		if (opts.exclusive) {
			if (!opts.name) throw new TypeError("Exclusive tests must provide a unique `name` identifying the test");
		}
		if (opts.name) next.exclusiveTests[opts.name] = !!opts.exclusive;
		next.tests = next.tests.filter((fn) => {
			if (fn.OPTIONS.name === opts.name) {
				if (isExclusive) return false;
				if (fn.OPTIONS.test === validate.OPTIONS.test) return false;
			}
			return true;
		});
		next.tests.push(validate);
		return next;
	}
	when(keys, options) {
		if (!Array.isArray(keys) && typeof keys !== "string") {
			options = keys;
			keys = ".";
		}
		let next = this.clone();
		let deps = toArray(keys).map((key) => new Reference(key));
		deps.forEach((dep) => {
			if (dep.isSibling) next.deps.push(dep.key);
		});
		next.conditions.push(typeof options === "function" ? new Condition(deps, options) : Condition.fromOptions(deps, options));
		return next;
	}
	typeError(message) {
		let next = this.clone();
		next.internalTests.typeError = createValidation({
			message,
			name: "typeError",
			skipAbsent: true,
			test(value) {
				if (!this.schema._typeCheck(value)) return this.createError({ params: { type: this.schema.type } });
				return true;
			}
		});
		return next;
	}
	oneOf(enums, message = mixed.oneOf) {
		let next = this.clone();
		enums.forEach((val) => {
			next._whitelist.add(val);
			next._blacklist.delete(val);
		});
		next.internalTests.whiteList = createValidation({
			message,
			name: "oneOf",
			skipAbsent: true,
			test(value) {
				let valids = this.schema._whitelist;
				let resolved = valids.resolveAll(this.resolve);
				return resolved.includes(value) ? true : this.createError({ params: {
					values: Array.from(valids).join(", "),
					resolved
				} });
			}
		});
		return next;
	}
	notOneOf(enums, message = mixed.notOneOf) {
		let next = this.clone();
		enums.forEach((val) => {
			next._blacklist.add(val);
			next._whitelist.delete(val);
		});
		next.internalTests.blacklist = createValidation({
			message,
			name: "notOneOf",
			test(value) {
				let invalids = this.schema._blacklist;
				let resolved = invalids.resolveAll(this.resolve);
				if (resolved.includes(value)) return this.createError({ params: {
					values: Array.from(invalids).join(", "),
					resolved
				} });
				return true;
			}
		});
		return next;
	}
	strip(strip = true) {
		let next = this.clone();
		next.spec.strip = strip;
		return next;
	}
	/**
	* Return a serialized description of the schema including validations, flags, types etc.
	*
	* @param options Provide any needed context for resolving runtime schema alterations (lazy, when conditions, etc).
	*/
	describe(options) {
		const next = (options ? this.resolve(options) : this).clone();
		const { label, meta, optional, nullable } = next.spec;
		return {
			meta,
			label,
			optional,
			nullable,
			default: next.getDefault(options),
			type: next.type,
			oneOf: next._whitelist.describe(),
			notOneOf: next._blacklist.describe(),
			tests: next.tests.filter((n, idx, list) => list.findIndex((c) => c.OPTIONS.name === n.OPTIONS.name) === idx).map((fn) => {
				const params = fn.OPTIONS.params && options ? resolveParams(Object.assign({}, fn.OPTIONS.params), options) : fn.OPTIONS.params;
				return {
					name: fn.OPTIONS.name,
					params
				};
			})
		};
	}
	get ["~standard"]() {
		const schema = this;
		return {
			version: 1,
			vendor: "yup",
			async validate(value) {
				try {
					return { value: await schema.validate(value, { abortEarly: false }) };
				} catch (err) {
					if (err instanceof ValidationError) return { issues: issuesFromValidationError(err) };
					throw err;
				}
			}
		};
	}
};
Schema.prototype.__isYupSchema__ = true;
for (const method of ["validate", "validateSync"]) Schema.prototype[`${method}At`] = function(path, value, options = {}) {
	const { parent, parentPath, schema } = getIn(this, path, value, options.context);
	return schema[method](parent && parent[parentPath], Object.assign({}, options, {
		parent,
		path
	}));
};
for (const alias of ["equals", "is"]) Schema.prototype[alias] = Schema.prototype.oneOf;
for (const alias of ["not", "nope"]) Schema.prototype[alias] = Schema.prototype.notOneOf;
const returnsTrue = () => true;
function create$8(spec) {
	return new MixedSchema(spec);
}
var MixedSchema = class extends Schema {
	constructor(spec) {
		super(typeof spec === "function" ? {
			type: "mixed",
			check: spec
		} : Object.assign({
			type: "mixed",
			check: returnsTrue
		}, spec));
	}
};
create$8.prototype = MixedSchema.prototype;
function create$7() {
	return new BooleanSchema();
}
var BooleanSchema = class extends Schema {
	constructor() {
		super({
			type: "boolean",
			check(v) {
				if (v instanceof Boolean) v = v.valueOf();
				return typeof v === "boolean";
			}
		});
		this.withMutation(() => {
			this.transform((value, _raw) => {
				if (this.spec.coerce && !this.isType(value)) {
					if (/^(true|1)$/i.test(String(value))) return true;
					if (/^(false|0)$/i.test(String(value))) return false;
				}
				return value;
			});
		});
	}
	isTrue(message = boolean.isValue) {
		return this.test({
			message,
			name: "is-value",
			exclusive: true,
			params: { value: "true" },
			test(value) {
				return isAbsent(value) || value === true;
			}
		});
	}
	isFalse(message = boolean.isValue) {
		return this.test({
			message,
			name: "is-value",
			exclusive: true,
			params: { value: "false" },
			test(value) {
				return isAbsent(value) || value === false;
			}
		});
	}
	default(def) {
		return super.default(def);
	}
	defined(msg) {
		return super.defined(msg);
	}
	optional() {
		return super.optional();
	}
	required(msg) {
		return super.required(msg);
	}
	notRequired() {
		return super.notRequired();
	}
	nullable() {
		return super.nullable();
	}
	nonNullable(msg) {
		return super.nonNullable(msg);
	}
	strip(v) {
		return super.strip(v);
	}
};
create$7.prototype = BooleanSchema.prototype;
/**
* This file is a modified version of the file from the following repository:
* Date.parse with progressive enhancement for ISO 8601 <https://github.com/csnover/js-iso8601>
* NON-CONFORMANT EDITION.
* © 2011 Colin Snover <http://zetafleet.com>
* Released under MIT license.
*/
const isoReg = /^(\d{4}|[+-]\d{6})(?:-?(\d{2})(?:-?(\d{2}))?)?(?:[ T]?(\d{2}):?(\d{2})(?::?(\d{2})(?:[,.](\d{1,}))?)?(?:(Z)|([+-])(\d{2})(?::?(\d{2}))?)?)?$/;
function parseIsoDate(date) {
	const struct = parseDateStruct(date);
	if (!struct) return Date.parse ? Date.parse(date) : NaN;
	if (struct.z === void 0 && struct.plusMinus === void 0) return new Date(struct.year, struct.month, struct.day, struct.hour, struct.minute, struct.second, struct.millisecond).valueOf();
	let totalMinutesOffset = 0;
	if (struct.z !== "Z" && struct.plusMinus !== void 0) {
		totalMinutesOffset = struct.hourOffset * 60 + struct.minuteOffset;
		if (struct.plusMinus === "+") totalMinutesOffset = 0 - totalMinutesOffset;
	}
	return Date.UTC(struct.year, struct.month, struct.day, struct.hour, struct.minute + totalMinutesOffset, struct.second, struct.millisecond);
}
function parseDateStruct(date) {
	var _regexResult$7$length, _regexResult$;
	const regexResult = isoReg.exec(date);
	if (!regexResult) return null;
	return {
		year: toNumber(regexResult[1]),
		month: toNumber(regexResult[2], 1) - 1,
		day: toNumber(regexResult[3], 1),
		hour: toNumber(regexResult[4]),
		minute: toNumber(regexResult[5]),
		second: toNumber(regexResult[6]),
		millisecond: regexResult[7] ? toNumber(regexResult[7].substring(0, 3)) : 0,
		precision: (_regexResult$7$length = (_regexResult$ = regexResult[7]) == null ? void 0 : _regexResult$.length) != null ? _regexResult$7$length : void 0,
		z: regexResult[8] || void 0,
		plusMinus: regexResult[9] || void 0,
		hourOffset: toNumber(regexResult[10]),
		minuteOffset: toNumber(regexResult[11])
	};
}
function toNumber(str, defaultValue = 0) {
	return Number(str) || defaultValue;
}
let rEmail = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
let rUrl = /^((https?|ftp):)?\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
let rUUID = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
let rIsoDateTime = new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(([+-]\\d{2}(:?\\d{2})?)|Z)$`);
let isTrimmed = (value) => isAbsent(value) || value === value.trim();
let objStringTag = {}.toString();
function create$6() {
	return new StringSchema();
}
var StringSchema = class extends Schema {
	constructor() {
		super({
			type: "string",
			check(value) {
				if (value instanceof String) value = value.valueOf();
				return typeof value === "string";
			}
		});
		this.withMutation(() => {
			this.transform((value, _raw) => {
				if (!this.spec.coerce || this.isType(value)) return value;
				if (Array.isArray(value)) return value;
				const strValue = value != null && value.toString ? value.toString() : value;
				if (strValue === objStringTag) return value;
				return strValue;
			});
		});
	}
	required(message) {
		return super.required(message).withMutation((schema) => schema.test({
			message: message || mixed.required,
			name: "required",
			skipAbsent: true,
			test: (value) => !!value.length
		}));
	}
	notRequired() {
		return super.notRequired().withMutation((schema) => {
			schema.tests = schema.tests.filter((t) => t.OPTIONS.name !== "required");
			return schema;
		});
	}
	length(length, message = string.length) {
		return this.test({
			message,
			name: "length",
			exclusive: true,
			params: { length },
			skipAbsent: true,
			test(value) {
				return value.length === this.resolve(length);
			}
		});
	}
	min(min, message = string.min) {
		return this.test({
			message,
			name: "min",
			exclusive: true,
			params: { min },
			skipAbsent: true,
			test(value) {
				return value.length >= this.resolve(min);
			}
		});
	}
	max(max, message = string.max) {
		return this.test({
			name: "max",
			exclusive: true,
			message,
			params: { max },
			skipAbsent: true,
			test(value) {
				return value.length <= this.resolve(max);
			}
		});
	}
	matches(regex, options) {
		let excludeEmptyString = false;
		let message;
		let name;
		if (options) if (typeof options === "object") ({excludeEmptyString = false, message, name} = options);
		else message = options;
		return this.test({
			name: name || "matches",
			message: message || string.matches,
			params: { regex },
			skipAbsent: true,
			test: (value) => value === "" && excludeEmptyString || value.search(regex) !== -1
		});
	}
	email(message = string.email) {
		return this.matches(rEmail, {
			name: "email",
			message,
			excludeEmptyString: true
		});
	}
	url(message = string.url) {
		return this.matches(rUrl, {
			name: "url",
			message,
			excludeEmptyString: true
		});
	}
	uuid(message = string.uuid) {
		return this.matches(rUUID, {
			name: "uuid",
			message,
			excludeEmptyString: false
		});
	}
	datetime(options) {
		let message = "";
		let allowOffset;
		let precision;
		if (options) if (typeof options === "object") ({message = "", allowOffset = false, precision = void 0} = options);
		else message = options;
		return this.matches(rIsoDateTime, {
			name: "datetime",
			message: message || string.datetime,
			excludeEmptyString: true
		}).test({
			name: "datetime_offset",
			message: message || string.datetime_offset,
			params: { allowOffset },
			skipAbsent: true,
			test: (value) => {
				if (!value || allowOffset) return true;
				const struct = parseDateStruct(value);
				if (!struct) return false;
				return !!struct.z;
			}
		}).test({
			name: "datetime_precision",
			message: message || string.datetime_precision,
			params: { precision },
			skipAbsent: true,
			test: (value) => {
				if (!value || precision == void 0) return true;
				const struct = parseDateStruct(value);
				if (!struct) return false;
				return struct.precision === precision;
			}
		});
	}
	ensure() {
		return this.default("").transform((val) => val === null ? "" : val);
	}
	trim(message = string.trim) {
		return this.transform((val) => val != null ? val.trim() : val).test({
			message,
			name: "trim",
			test: isTrimmed
		});
	}
	lowercase(message = string.lowercase) {
		return this.transform((value) => !isAbsent(value) ? value.toLowerCase() : value).test({
			message,
			name: "string_case",
			exclusive: true,
			skipAbsent: true,
			test: (value) => isAbsent(value) || value === value.toLowerCase()
		});
	}
	uppercase(message = string.uppercase) {
		return this.transform((value) => !isAbsent(value) ? value.toUpperCase() : value).test({
			message,
			name: "string_case",
			exclusive: true,
			skipAbsent: true,
			test: (value) => isAbsent(value) || value === value.toUpperCase()
		});
	}
};
create$6.prototype = StringSchema.prototype;
let isNaN$1 = (value) => value != +value;
function create$5() {
	return new NumberSchema();
}
var NumberSchema = class extends Schema {
	constructor() {
		super({
			type: "number",
			check(value) {
				if (value instanceof Number) value = value.valueOf();
				return typeof value === "number" && !isNaN$1(value);
			}
		});
		this.withMutation(() => {
			this.transform((value, _raw) => {
				if (!this.spec.coerce) return value;
				let parsed = value;
				if (typeof parsed === "string") {
					parsed = parsed.replace(/\s/g, "");
					if (parsed === "") return NaN;
					parsed = +parsed;
				}
				if (this.isType(parsed) || parsed === null) return parsed;
				return parseFloat(parsed);
			});
		});
	}
	min(min, message = number.min) {
		return this.test({
			message,
			name: "min",
			exclusive: true,
			params: { min },
			skipAbsent: true,
			test(value) {
				return value >= this.resolve(min);
			}
		});
	}
	max(max, message = number.max) {
		return this.test({
			message,
			name: "max",
			exclusive: true,
			params: { max },
			skipAbsent: true,
			test(value) {
				return value <= this.resolve(max);
			}
		});
	}
	lessThan(less, message = number.lessThan) {
		return this.test({
			message,
			name: "max",
			exclusive: true,
			params: { less },
			skipAbsent: true,
			test(value) {
				return value < this.resolve(less);
			}
		});
	}
	moreThan(more, message = number.moreThan) {
		return this.test({
			message,
			name: "min",
			exclusive: true,
			params: { more },
			skipAbsent: true,
			test(value) {
				return value > this.resolve(more);
			}
		});
	}
	positive(msg = number.positive) {
		return this.moreThan(0, msg);
	}
	negative(msg = number.negative) {
		return this.lessThan(0, msg);
	}
	integer(message = number.integer) {
		return this.test({
			name: "integer",
			message,
			skipAbsent: true,
			test: (val) => Number.isInteger(val)
		});
	}
	truncate() {
		return this.transform((value) => !isAbsent(value) ? value | 0 : value);
	}
	round(method) {
		var _method;
		let avail = [
			"ceil",
			"floor",
			"round",
			"trunc"
		];
		method = ((_method = method) == null ? void 0 : _method.toLowerCase()) || "round";
		if (method === "trunc") return this.truncate();
		if (avail.indexOf(method.toLowerCase()) === -1) throw new TypeError("Only valid options for round() are: " + avail.join(", "));
		return this.transform((value) => !isAbsent(value) ? Math[method](value) : value);
	}
};
create$5.prototype = NumberSchema.prototype;
let invalidDate = /* @__PURE__ */ new Date("");
let isDate = (obj) => Object.prototype.toString.call(obj) === "[object Date]";
function create$4() {
	return new DateSchema();
}
var DateSchema = class DateSchema extends Schema {
	constructor() {
		super({
			type: "date",
			check(v) {
				return isDate(v) && !isNaN(v.getTime());
			}
		});
		this.withMutation(() => {
			this.transform((value, _raw) => {
				if (!this.spec.coerce || this.isType(value) || value === null) return value;
				value = parseIsoDate(value);
				return !isNaN(value) ? new Date(value) : DateSchema.INVALID_DATE;
			});
		});
	}
	prepareParam(ref, name) {
		let param;
		if (!Reference.isRef(ref)) {
			let cast = this.cast(ref);
			if (!this._typeCheck(cast)) throw new TypeError(`\`${name}\` must be a Date or a value that can be \`cast()\` to a Date`);
			param = cast;
		} else param = ref;
		return param;
	}
	min(min, message = date.min) {
		let limit = this.prepareParam(min, "min");
		return this.test({
			message,
			name: "min",
			exclusive: true,
			params: { min },
			skipAbsent: true,
			test(value) {
				return value >= this.resolve(limit);
			}
		});
	}
	max(max, message = date.max) {
		let limit = this.prepareParam(max, "max");
		return this.test({
			message,
			name: "max",
			exclusive: true,
			params: { max },
			skipAbsent: true,
			test(value) {
				return value <= this.resolve(limit);
			}
		});
	}
};
DateSchema.INVALID_DATE = invalidDate;
create$4.prototype = DateSchema.prototype;
create$4.INVALID_DATE = invalidDate;
function sortFields(fields, excludedEdges = []) {
	let edges = [];
	let nodes = /* @__PURE__ */ new Set();
	let excludes = new Set(excludedEdges.map(([a, b]) => `${a}-${b}`));
	function addNode(depPath, key) {
		let node = (0, import_property_expr.split)(depPath)[0];
		nodes.add(node);
		if (!excludes.has(`${key}-${node}`)) edges.push([key, node]);
	}
	for (const key of Object.keys(fields)) {
		let value = fields[key];
		nodes.add(key);
		if (Reference.isRef(value) && value.isSibling) addNode(value.path, key);
		else if (isSchema(value) && "deps" in value) value.deps.forEach((path) => addNode(path, key));
	}
	return import_toposort.default.array(Array.from(nodes), edges).reverse();
}
function findIndex(arr, err) {
	let idx = Infinity;
	arr.some((key, ii) => {
		var _err$path;
		if ((_err$path = err.path) != null && _err$path.includes(key)) {
			idx = ii;
			return true;
		}
	});
	return idx;
}
function sortByKeyOrder(keys) {
	return (a, b) => {
		return findIndex(keys, a) - findIndex(keys, b);
	};
}
const parseJson = (value, _, schema) => {
	if (typeof value !== "string") return value;
	let parsed = value;
	try {
		parsed = JSON.parse(value);
	} catch (err) {}
	return schema.isType(parsed) ? parsed : value;
};
function deepPartial(schema) {
	if ("fields" in schema) {
		const partial = {};
		for (const [key, fieldSchema] of Object.entries(schema.fields)) partial[key] = deepPartial(fieldSchema);
		return schema.setFields(partial);
	}
	if (schema.type === "array") {
		const nextArray = schema.optional();
		if (nextArray.innerType) nextArray.innerType = deepPartial(nextArray.innerType);
		return nextArray;
	}
	if (schema.type === "tuple") return schema.optional().clone({ types: schema.spec.types.map(deepPartial) });
	if ("optional" in schema) return schema.optional();
	return schema;
}
const deepHas = (obj, p) => {
	const path = [...(0, import_property_expr.normalizePath)(p)];
	if (path.length === 1) return path[0] in obj;
	let last = path.pop();
	let parent = (0, import_property_expr.getter)((0, import_property_expr.join)(path), true)(obj);
	return !!(parent && last in parent);
};
let isObject = (obj) => Object.prototype.toString.call(obj) === "[object Object]";
function unknown(ctx, value) {
	let known = Object.keys(ctx.fields);
	return Object.keys(value).filter((key) => known.indexOf(key) === -1);
}
const defaultSort = sortByKeyOrder([]);
function create$3(spec) {
	return new ObjectSchema(spec);
}
var ObjectSchema = class extends Schema {
	constructor(spec) {
		super({
			type: "object",
			check(value) {
				return isObject(value) || typeof value === "function";
			}
		});
		this.fields = Object.create(null);
		this._sortErrors = defaultSort;
		this._nodes = [];
		this._excludedEdges = [];
		this.withMutation(() => {
			if (spec) this.shape(spec);
		});
	}
	_cast(_value, options = {}) {
		var _options$stripUnknown;
		let value = super._cast(_value, options);
		if (value === void 0) return this.getDefault(options);
		if (!this._typeCheck(value)) return value;
		let fields = this.fields;
		let strip = (_options$stripUnknown = options.stripUnknown) != null ? _options$stripUnknown : this.spec.noUnknown;
		let props = [].concat(this._nodes, Object.keys(value).filter((v) => !this._nodes.includes(v)));
		let intermediateValue = {};
		let innerOptions = Object.assign({}, options, {
			parent: intermediateValue,
			__validating: options.__validating || false
		});
		let isChanged = false;
		for (const prop of props) {
			let field = fields[prop];
			let exists = prop in value;
			let inputValue = value[prop];
			if (field) {
				let fieldValue;
				innerOptions.path = (options.path ? `${options.path}.` : "") + prop;
				field = field.resolve({
					value: inputValue,
					context: options.context,
					parent: intermediateValue
				});
				let fieldSpec = field instanceof Schema ? field.spec : void 0;
				let strict = fieldSpec == null ? void 0 : fieldSpec.strict;
				if (fieldSpec != null && fieldSpec.strip) {
					isChanged = isChanged || prop in value;
					continue;
				}
				fieldValue = !options.__validating || !strict ? field.cast(inputValue, innerOptions) : inputValue;
				if (fieldValue !== void 0) intermediateValue[prop] = fieldValue;
			} else if (exists && !strip) intermediateValue[prop] = inputValue;
			if (exists !== prop in intermediateValue || intermediateValue[prop] !== inputValue) isChanged = true;
		}
		return isChanged ? intermediateValue : value;
	}
	_validate(_value, options = {}, panic, next) {
		let { from = [], originalValue = _value, recursive = this.spec.recursive } = options;
		options.from = [{
			schema: this,
			value: originalValue
		}, ...from];
		options.__validating = true;
		options.originalValue = originalValue;
		super._validate(_value, options, panic, (objectErrors, value) => {
			if (!recursive || !isObject(value)) {
				next(objectErrors, value);
				return;
			}
			originalValue = originalValue || value;
			let tests = [];
			for (let key of this._nodes) {
				let field = this.fields[key];
				if (!field || Reference.isRef(field)) continue;
				tests.push(field.asNestedTest({
					options,
					key,
					parent: value,
					parentPath: options.path,
					originalParent: originalValue
				}));
			}
			this.runTests({
				tests,
				value,
				originalValue,
				options
			}, panic, (fieldErrors) => {
				next(fieldErrors.sort(this._sortErrors).concat(objectErrors), value);
			});
		});
	}
	clone(spec) {
		const next = super.clone(spec);
		next.fields = Object.assign({}, this.fields);
		next._nodes = this._nodes;
		next._excludedEdges = this._excludedEdges;
		next._sortErrors = this._sortErrors;
		return next;
	}
	concat(schema) {
		let next = super.concat(schema);
		let nextFields = next.fields;
		for (let [field, schemaOrRef] of Object.entries(this.fields)) {
			const target = nextFields[field];
			nextFields[field] = target === void 0 ? schemaOrRef : target;
		}
		return next.withMutation((s) => s.setFields(nextFields, [...this._excludedEdges, ...schema._excludedEdges]));
	}
	_getDefault(options) {
		if ("default" in this.spec) return super._getDefault(options);
		if (!this._nodes.length) return;
		let dft = {};
		this._nodes.forEach((key) => {
			var _innerOptions;
			const field = this.fields[key];
			let innerOptions = options;
			if ((_innerOptions = innerOptions) != null && _innerOptions.value) innerOptions = Object.assign({}, innerOptions, {
				parent: innerOptions.value,
				value: innerOptions.value[key]
			});
			dft[key] = field && "getDefault" in field ? field.getDefault(innerOptions) : void 0;
		});
		return dft;
	}
	setFields(shape, excludedEdges) {
		let next = this.clone();
		next.fields = shape;
		next._nodes = sortFields(shape, excludedEdges);
		next._sortErrors = sortByKeyOrder(Object.keys(shape));
		if (excludedEdges) next._excludedEdges = excludedEdges;
		return next;
	}
	shape(additions, excludes = []) {
		return this.clone().withMutation((next) => {
			let edges = next._excludedEdges;
			if (excludes.length) {
				if (!Array.isArray(excludes[0])) excludes = [excludes];
				edges = [...next._excludedEdges, ...excludes];
			}
			return next.setFields(Object.assign(next.fields, additions), edges);
		});
	}
	partial() {
		const partial = {};
		for (const [key, schema] of Object.entries(this.fields)) partial[key] = "optional" in schema && schema.optional instanceof Function ? schema.optional() : schema;
		return this.setFields(partial);
	}
	deepPartial() {
		return deepPartial(this);
	}
	pick(keys) {
		const picked = {};
		for (const key of keys) if (this.fields[key]) picked[key] = this.fields[key];
		return this.setFields(picked, this._excludedEdges.filter(([a, b]) => keys.includes(a) && keys.includes(b)));
	}
	omit(keys) {
		const remaining = [];
		for (const key of Object.keys(this.fields)) {
			if (keys.includes(key)) continue;
			remaining.push(key);
		}
		return this.pick(remaining);
	}
	from(from, to, alias) {
		let fromGetter = (0, import_property_expr.getter)(from, true);
		return this.transform((obj) => {
			if (!obj) return obj;
			let newObj = obj;
			if (deepHas(obj, from)) {
				newObj = Object.assign({}, obj);
				if (!alias) delete newObj[from];
				newObj[to] = fromGetter(obj);
			}
			return newObj;
		});
	}
	/** Parse an input JSON string to an object */
	json() {
		return this.transform(parseJson);
	}
	/**
	* Similar to `noUnknown` but only validates that an object is the right shape without stripping the unknown keys
	*/
	exact(message) {
		return this.test({
			name: "exact",
			exclusive: true,
			message: message || object.exact,
			test(value) {
				if (value == null) return true;
				const unknownKeys = unknown(this.schema, value);
				return unknownKeys.length === 0 || this.createError({ params: { properties: unknownKeys.join(", ") } });
			}
		});
	}
	stripUnknown() {
		return this.clone({ noUnknown: true });
	}
	noUnknown(noAllow = true, message = object.noUnknown) {
		if (typeof noAllow !== "boolean") {
			message = noAllow;
			noAllow = true;
		}
		let next = this.test({
			name: "noUnknown",
			exclusive: true,
			message,
			test(value) {
				if (value == null) return true;
				const unknownKeys = unknown(this.schema, value);
				return !noAllow || unknownKeys.length === 0 || this.createError({ params: { unknown: unknownKeys.join(", ") } });
			}
		});
		next.spec.noUnknown = noAllow;
		return next;
	}
	unknown(allow = true, message = object.noUnknown) {
		return this.noUnknown(!allow, message);
	}
	transformKeys(fn) {
		return this.transform((obj) => {
			if (!obj) return obj;
			const result = {};
			for (const key of Object.keys(obj)) result[fn(key)] = obj[key];
			return result;
		});
	}
	camelCase() {
		return this.transformKeys(import_tiny_case.camelCase);
	}
	snakeCase() {
		return this.transformKeys(import_tiny_case.snakeCase);
	}
	constantCase() {
		return this.transformKeys((key) => (0, import_tiny_case.snakeCase)(key).toUpperCase());
	}
	describe(options) {
		const next = (options ? this.resolve(options) : this).clone();
		const base = super.describe(options);
		base.fields = {};
		for (const [key, value] of Object.entries(next.fields)) {
			var _innerOptions2;
			let innerOptions = options;
			if ((_innerOptions2 = innerOptions) != null && _innerOptions2.value) innerOptions = Object.assign({}, innerOptions, {
				parent: innerOptions.value,
				value: innerOptions.value[key]
			});
			base.fields[key] = value.describe(innerOptions);
		}
		return base;
	}
};
create$3.prototype = ObjectSchema.prototype;
function create$2(type) {
	return new ArraySchema(type);
}
var ArraySchema = class extends Schema {
	constructor(type) {
		super({
			type: "array",
			spec: { types: type },
			check(v) {
				return Array.isArray(v);
			}
		});
		this.innerType = void 0;
		this.innerType = type;
	}
	_cast(_value, _opts) {
		const value = super._cast(_value, _opts);
		if (!this._typeCheck(value) || !this.innerType) return value;
		let isChanged = false;
		const castArray = value.map((v, idx) => {
			const castElement = this.innerType.cast(v, Object.assign({}, _opts, {
				path: `${_opts.path || ""}[${idx}]`,
				parent: value,
				originalValue: v,
				value: v,
				index: idx
			}));
			if (castElement !== v) isChanged = true;
			return castElement;
		});
		return isChanged ? castArray : value;
	}
	_validate(_value, options = {}, panic, next) {
		var _options$recursive;
		let innerType = this.innerType;
		let recursive = (_options$recursive = options.recursive) != null ? _options$recursive : this.spec.recursive;
		options.originalValue != null && options.originalValue;
		super._validate(_value, options, panic, (arrayErrors, value) => {
			var _options$originalValu2;
			if (!recursive || !innerType || !this._typeCheck(value)) {
				next(arrayErrors, value);
				return;
			}
			let tests = new Array(value.length);
			for (let index = 0; index < value.length; index++) {
				var _options$originalValu;
				tests[index] = innerType.asNestedTest({
					options,
					index,
					parent: value,
					parentPath: options.path,
					originalParent: (_options$originalValu = options.originalValue) != null ? _options$originalValu : _value
				});
			}
			this.runTests({
				value,
				tests,
				originalValue: (_options$originalValu2 = options.originalValue) != null ? _options$originalValu2 : _value,
				options
			}, panic, (innerTypeErrors) => next(innerTypeErrors.concat(arrayErrors), value));
		});
	}
	clone(spec) {
		const next = super.clone(spec);
		next.innerType = this.innerType;
		return next;
	}
	/** Parse an input JSON string to an object */
	json() {
		return this.transform(parseJson);
	}
	concat(schema) {
		let next = super.concat(schema);
		next.innerType = this.innerType;
		if (schema.innerType) next.innerType = next.innerType ? next.innerType.concat(schema.innerType) : schema.innerType;
		return next;
	}
	of(schema) {
		let next = this.clone();
		if (!isSchema(schema)) throw new TypeError("`array.of()` sub-schema must be a valid yup schema not: " + printValue(schema));
		next.innerType = schema;
		next.spec = Object.assign({}, next.spec, { types: schema });
		return next;
	}
	length(length, message = array.length) {
		return this.test({
			message,
			name: "length",
			exclusive: true,
			params: { length },
			skipAbsent: true,
			test(value) {
				return value.length === this.resolve(length);
			}
		});
	}
	min(min, message) {
		message = message || array.min;
		return this.test({
			message,
			name: "min",
			exclusive: true,
			params: { min },
			skipAbsent: true,
			test(value) {
				return value.length >= this.resolve(min);
			}
		});
	}
	max(max, message) {
		message = message || array.max;
		return this.test({
			message,
			name: "max",
			exclusive: true,
			params: { max },
			skipAbsent: true,
			test(value) {
				return value.length <= this.resolve(max);
			}
		});
	}
	ensure() {
		return this.default(() => []).transform((val, original) => {
			if (this._typeCheck(val)) return val;
			return original == null ? [] : [].concat(original);
		});
	}
	compact(rejector) {
		let reject = !rejector ? (v) => !!v : (v, i, a) => !rejector(v, i, a);
		return this.transform((values) => values != null ? values.filter(reject) : values);
	}
	describe(options) {
		const next = (options ? this.resolve(options) : this).clone();
		const base = super.describe(options);
		if (next.innerType) {
			var _innerOptions;
			let innerOptions = options;
			if ((_innerOptions = innerOptions) != null && _innerOptions.value) innerOptions = Object.assign({}, innerOptions, {
				parent: innerOptions.value,
				value: innerOptions.value[0]
			});
			base.innerType = next.innerType.describe(innerOptions);
		}
		return base;
	}
};
create$2.prototype = ArraySchema.prototype;
function create$1(schemas) {
	return new TupleSchema(schemas);
}
var TupleSchema = class extends Schema {
	constructor(schemas) {
		super({
			type: "tuple",
			spec: { types: schemas },
			check(v) {
				const types = this.spec.types;
				return Array.isArray(v) && v.length === types.length;
			}
		});
		this.withMutation(() => {
			this.typeError(tuple.notType);
		});
	}
	_cast(inputValue, options) {
		const { types } = this.spec;
		const value = super._cast(inputValue, options);
		if (!this._typeCheck(value)) return value;
		let isChanged = false;
		const castArray = types.map((type, idx) => {
			const castElement = type.cast(value[idx], Object.assign({}, options, {
				path: `${options.path || ""}[${idx}]`,
				parent: value,
				originalValue: value[idx],
				value: value[idx],
				index: idx
			}));
			if (castElement !== value[idx]) isChanged = true;
			return castElement;
		});
		return isChanged ? castArray : value;
	}
	_validate(_value, options = {}, panic, next) {
		let itemTypes = this.spec.types;
		super._validate(_value, options, panic, (tupleErrors, value) => {
			var _options$originalValu2;
			if (!this._typeCheck(value)) {
				next(tupleErrors, value);
				return;
			}
			let tests = [];
			for (let [index, itemSchema] of itemTypes.entries()) {
				var _options$originalValu;
				tests[index] = itemSchema.asNestedTest({
					options,
					index,
					parent: value,
					parentPath: options.path,
					originalParent: (_options$originalValu = options.originalValue) != null ? _options$originalValu : _value
				});
			}
			this.runTests({
				value,
				tests,
				originalValue: (_options$originalValu2 = options.originalValue) != null ? _options$originalValu2 : _value,
				options
			}, panic, (innerTypeErrors) => next(innerTypeErrors.concat(tupleErrors), value));
		});
	}
	describe(options) {
		const next = (options ? this.resolve(options) : this).clone();
		const base = super.describe(options);
		base.innerType = next.spec.types.map((schema, index) => {
			var _innerOptions;
			let innerOptions = options;
			if ((_innerOptions = innerOptions) != null && _innerOptions.value) innerOptions = Object.assign({}, innerOptions, {
				parent: innerOptions.value,
				value: innerOptions.value[index]
			});
			return schema.describe(innerOptions);
		});
		return base;
	}
};
create$1.prototype = TupleSchema.prototype;

//#endregion
//#region src/core/composables/use-helper.ts
const useHelper = () => {
	let notif = async (options) => {
		const { props, ...other } = options;
		const data = {
			...other,
			props: {
				...props,
				isNewMessageRequest: true
			}
		};
		if (options.type === "success") return push.success({
			duration: 3e3,
			...data
		});
		if (options.type === "info") return push.info({
			duration: 3e3,
			...data
		});
		if (options.type === "warning") return push.warning({
			duration: 3e3,
			...data
		});
		if (options.type === "error") return push.error({
			duration: 0,
			...data
		});
		if (options.type === "promise") {
			let cancelled = false;
			let timer;
			const notification = push.promise({
				...data,
				onManualClear: () => {
					cancelled = true;
					if (timer) clearTimeout(timer);
				}
			});
			await new Promise((resolve) => {
				timer = setTimeout(resolve, options.duration ?? 4e3);
			});
			if (cancelled) return;
			if (!options.props?.buttons?.find((e) => e.to === options.route?.path) && options.router && options.props?.redirect) {
				notification.resolve("Dialihkan ke halaman daftar data!");
				await options.router.push(options.props.redirect);
			}
			notification.clear();
		}
	};
	/**
	* fungsi mengecek semua inputan validasi, jika satu inputan masih salah maka akan mereturn true
	* @param error adalah list data error
	*/
	let validateAllSchemaCheck = (error) => !Object.values(error).every((e) => e.valid);
	/**
	
	* ShortHand Validasi batch schema yup
	* @param schema adalah list data schema yang ingin divalidasi
	* @param input adalah list data input yang ingin divalidasi, harus dicocokkan
	* @param error adalah list data error yang akan ditampilkan
	*/
	/** ───────────────── helpers ───────────────── */
	async function validateAllSchema({ schema, input, error }, callback) {
		function buildPartialSchema(inputObj, schemaObj) {
			if (!("fields" in schemaObj)) return schemaObj;
			const picked = {};
			const shape = schemaObj.fields;
			for (const key of Object.keys(shape)) if (key in (inputObj ?? {})) {
				const fieldSchema = shape[key];
				const value = inputObj?.[key];
				picked[key] = fieldSchema.type === "object" && value !== null && typeof value === "object" && !Array.isArray(value) ? buildPartialSchema(value, fieldSchema) : fieldSchema;
			}
			return create$3().shape(picked);
		}
		const partialSchema = buildPartialSchema(input, schema);
		function setNestedError(obj, path, message) {
			const keys = path.split(".");
			const lastKey = keys.pop();
			let cursor = obj;
			for (const k of keys) {
				cursor[k] = cursor[k] ?? {};
				cursor = cursor[k];
			}
			if (cursor[lastKey]) {
				cursor[lastKey].message = message;
				cursor[lastKey].valid = false;
			}
		}
		try {
			await partialSchema.validate(input, { abortEarly: false });
			callback?.();
			return true;
		} catch (e) {
			if ("inner" in e) e.inner.forEach((err) => setNestedError(error, err.path, err.message));
			const everyValid = (obj) => Object.values(obj).every((v) => typeof v === "object" && "valid" in v ? v.valid : everyValid(v));
			return everyValid(error);
		}
	}
	/**
	* ShortHand single Validasi schema yup
	* @param schema adalah list data schema yang ingin divalidasi
	* @param field adalah field data yang ingin divalidasi
	* @param input adalah data input yang ingin divalidasi, harus dicocokkan
	* @param error adalah data error yang akan ditampilkan
	* @param callback
	*/
	let validateSchema = async ({ schema, field, input, error }, callback) => {
		if (schema?.fields[field]) await schema.validateAt(field, input).then(() => {
			error[field].message = "";
			error[field].valid = true;
			if (callback) return callback();
		}).catch((err) => {
			if (field && !Array.isArray(input[field])) {
				if (!input[field]) {
					error[err.path].message = err.message;
					error[err.path].valid = false;
				}
			} else {
				error[err.path].message = err.message;
				error[err.path].valid = false;
			}
		});
		return !error[field].valid;
	};
	function clearSchemaValidation({ error }) {
		const clear = (obj) => {
			for (const key in obj.value) {
				const val = obj.value[key];
				if (typeof val === "object" && val !== null && "valid" in val && "message" in val) {
					val.valid = true;
					val.message = "";
				} else if (typeof val === "object" && val !== null) clear(val);
			}
		};
		clear(error);
	}
	function replacerData({ fn, type, item, key, items }) {
		if (type === "data") {
			const arr = items.var ? items.var[items.key] : items.value;
			const idx = arr.findIndex((e) => e?.[key] == item?.[key]);
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
		if (type === "datasource") {
			if ("@odata.context" in item) delete item["@odata.context"];
			if ("@odata.url" in item) delete item["@odata.url"];
			const ds = items.var ? items.var[items.key] : items.value;
			const coll = ds.items();
			const idx = coll.findIndex((e) => e?.[String(key)] == item?.[String(key)]);
			const store = ds.store();
			const k = item?.[String(key)];
			if (fn === "push") {
				coll.unshift(item);
				store.push([{
					type: "insert",
					data: item,
					key: k
				}]);
				return;
			}
			if (fn === "replace") {
				if (idx >= 0) {
					const target = coll[idx];
					if (target && typeof target === "object") Object.assign(target, item);
					else coll.splice(idx, 1, { ...item });
				}
				return;
			}
			if (fn === "remove") {
				if (idx >= 0) coll.splice(idx, 1);
				store.push([{
					type: "remove",
					key: k
				}]);
				return;
			}
		}
	}
	const filterOrIn = (field, values, combine = false) => {
		const vs = (values ?? []).filter((v) => v !== void 0 && v !== null);
		if (!vs.length) return null;
		if (combine) return [
			field,
			"in",
			vs
		];
		return vs.map((v) => [
			field,
			"=",
			v
		]).reduce((a, c) => a ? [
			a,
			"or",
			c
		] : c, null);
	};
	function isLikelyFieldPath(s) {
		return /^[A-Za-z_][A-Za-z0-9_]*(\/[A-Za-z_][A-Za-z0-9_]*)*$/.test(s.trim());
	}
	function isSimpleCondition(arr) {
		return Array.isArray(arr) && arr.length === 3 && typeof arr[0] === "string" && typeof arr[1] === "string" && isLikelyFieldPath(arr[0]);
	}
	function unwrapRedundant(f) {
		let cur = f;
		while (Array.isArray(cur) && cur.length === 1 && Array.isArray(cur[0])) cur = cur[0];
		return cur;
	}
	function toExpr(node) {
		if (node == null) return "";
		if (typeof node === "string") {
			const s = node.trim().toLowerCase();
			if (s === "and" || s === "or" || s === "!" || s === "=") return "";
			return node;
		}
		if (!Array.isArray(node)) return "";
		if (node.length === 2 && node[0] === "!" && Array.isArray(node[1])) {
			const inner = toExpr(unwrapRedundant(node[1]));
			return inner ? `not (${inner})` : "";
		}
		if (isSimpleCondition(node)) {
			const [field, op, value] = node;
			return simpleConditionToOData(field, op, value);
		}
		const parts = node;
		if (parts.length === 1 && Array.isArray(parts[0])) return toExpr(parts[0]);
		let out = "";
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			if (typeof part === "string") {
				const s = part.toLowerCase();
				if (s === "and" || s === "or") {
					out += ` ${s} `;
					continue;
				}
			}
			const sub = toExpr(unwrapRedundant(part));
			if (!sub) continue;
			out += `(${sub})`;
		}
		return out.trim();
	}
	function literal(v) {
		if (v === null) return "null";
		if (v === void 0) return "null";
		if (v instanceof Date) return v.toISOString();
		const t = typeof v;
		if (t === "number" || t === "bigint") return String(v);
		if (t === "boolean") return v ? "true" : "false";
		return `'${String(v).replace(/'/g, "''")}'`;
	}
	function simpleConditionToOData(field, op, value) {
		const o = op.trim().toLowerCase();
		if (o === "in" || o === "anyof" || o === "noneof") {
			const list = (Array.isArray(value) ? value : [value]).filter((v) => v !== void 0 && v !== null).map(literal).join(",");
			if (!list) return o === "noneof" ? "true" : "false";
			const expr = `${field} in (${list})`;
			return o === "noneof" ? `not (${expr})` : expr;
		}
		if (o === "contains" || o === "notcontains") {
			const fn = `contains(${field},${literal(value)})`;
			return o === "notcontains" ? `not (${fn})` : fn;
		}
		if (o === "startswith") return `startswith(${field},${literal(value)})`;
		if (o === "endswith") return `endswith(${field},${literal(value)})`;
		const odataOp = {
			"=": "eq",
			"==": "eq",
			"<>": "ne",
			"!=": "ne",
			">": "gt",
			">=": "ge",
			"<": "lt",
			"<=": "le"
		}[o];
		if (!odataOp) throw new Error(`Unsupported operator: ${op}`);
		return `${field} ${odataOp} ${literal(value)}`;
	}
	function dxFilterToString({ filter, encode = false }) {
		const expr = toExpr(unwrapRedundant(filter));
		return encode ? encodeURIComponent(expr) : expr;
	}
	function isJSONString({ input, strict = false, root = ["array", "object"] }) {
		function getRootKind(v) {
			if (v === null || typeof v !== "object") return "primitive";
			return Array.isArray(v) ? "array" : "object";
		}
		/** Heuristically convert JSON5/JS-literal-ish text to strict JSON */
		function toStrictJSON(input) {
			let out = input;
			out = out.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "");
			out = out.replace(/'(?:\\.|[^'\\])*'/g, (m) => {
				return `"${m.slice(1, -1).replace(/\\'/g, "'").replace(/"/g, "\\\"")}"`;
			});
			out = out.replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, `$1"$2"$3`);
			out = out.replace(/,(\s*[}\]])/g, "$1");
			out = out.replace(/\b-?Infinity\b|\bNaN\b/g, "null");
			return out;
		}
		if (typeof input !== "string") return false;
		const s = input.trim();
		let value;
		try {
			value = JSON.parse(s);
		} catch {
			if (strict) return false;
			try {
				value = JSON.parse(toStrictJSON(s));
			} catch {
				return false;
			}
		}
		const allowed = Array.isArray(root) ? root : [root];
		if (allowed.includes("any")) return true;
		const kind = getRootKind(value);
		return allowed.includes(kind);
	}
	function safeJSONParse(str) {
		if (typeof str !== "string") return null;
		try {
			const firstParse = JSON.parse(str);
			if (typeof firstParse === "string") str = firstParse;
			else return firstParse;
		} catch (e) {}
		if (str.startsWith("[") && str.endsWith("]")) str = str.substring(1, str.length - 1);
		const start = str.indexOf("{");
		const end = str.lastIndexOf("}");
		if (start >= 0 && end > start) {
			const innerJson = str.substring(start, end + 1);
			try {
				return JSON.parse(innerJson);
			} catch (innerErr) {
				return null;
			}
		}
		return null;
	}
	function isDate(value) {
		if (value instanceof Date) return !isNaN(value.getTime());
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
	};
};

//#endregion
//#region ../../node_modules/.pnpm/tslib@2.3.1/node_modules/tslib/tslib.js
var require_tslib = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/*! *****************************************************************************
	Copyright (c) Microsoft Corporation.
	
	Permission to use, copy, modify, and/or distribute this software for any
	purpose with or without fee is hereby granted.
	
	THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
	REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
	AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
	INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
	LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
	OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
	PERFORMANCE OF THIS SOFTWARE.
	***************************************************************************** */
	var __extends;
	var __assign;
	var __rest;
	var __decorate;
	var __param;
	var __metadata;
	var __awaiter;
	var __generator;
	var __exportStar;
	var __values;
	var __read;
	var __spread;
	var __spreadArrays;
	var __spreadArray;
	var __await;
	var __asyncGenerator;
	var __asyncDelegator;
	var __asyncValues;
	var __makeTemplateObject;
	var __importStar;
	var __importDefault;
	var __classPrivateFieldGet;
	var __classPrivateFieldSet;
	var __createBinding;
	(function(factory) {
		var root = typeof global === "object" ? global : typeof self === "object" ? self : typeof this === "object" ? this : {};
		if (typeof define === "function" && define.amd) define("tslib", ["exports"], function(exports$1) {
			factory(createExporter(root, createExporter(exports$1)));
		});
		else if (typeof module === "object" && typeof module.exports === "object") factory(createExporter(root, createExporter(module.exports)));
		else factory(createExporter(root));
		function createExporter(exports$2, previous) {
			if (exports$2 !== root) if (typeof Object.create === "function") Object.defineProperty(exports$2, "__esModule", { value: true });
			else exports$2.__esModule = true;
			return function(id, v) {
				return exports$2[id] = previous ? previous(id, v) : v;
			};
		}
	})(function(exporter) {
		var extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
			d.__proto__ = b;
		} || function(d, b) {
			for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
		};
		__extends = function(d, b) {
			if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
			extendStatics(d, b);
			function __() {
				this.constructor = d;
			}
			d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		};
		__assign = Object.assign || function(t) {
			for (var s, i = 1, n = arguments.length; i < n; i++) {
				s = arguments[i];
				for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
			}
			return t;
		};
		__rest = function(s, e) {
			var t = {};
			for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
			if (s != null && typeof Object.getOwnPropertySymbols === "function") {
				for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
			}
			return t;
		};
		__decorate = function(decorators, target, key, desc) {
			var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
			if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
			else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
			return c > 3 && r && Object.defineProperty(target, key, r), r;
		};
		__param = function(paramIndex, decorator) {
			return function(target, key) {
				decorator(target, key, paramIndex);
			};
		};
		__metadata = function(metadataKey, metadataValue) {
			if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
		};
		__awaiter = function(thisArg, _arguments, P, generator) {
			function adopt(value) {
				return value instanceof P ? value : new P(function(resolve) {
					resolve(value);
				});
			}
			return new (P || (P = Promise))(function(resolve, reject) {
				function fulfilled(value) {
					try {
						step(generator.next(value));
					} catch (e) {
						reject(e);
					}
				}
				function rejected(value) {
					try {
						step(generator["throw"](value));
					} catch (e) {
						reject(e);
					}
				}
				function step(result) {
					result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
				}
				step((generator = generator.apply(thisArg, _arguments || [])).next());
			});
		};
		__generator = function(thisArg, body) {
			var _ = {
				label: 0,
				sent: function() {
					if (t[0] & 1) throw t[1];
					return t[1];
				},
				trys: [],
				ops: []
			}, f, y, t, g;
			return g = {
				next: verb(0),
				"throw": verb(1),
				"return": verb(2)
			}, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
				return this;
			}), g;
			function verb(n) {
				return function(v) {
					return step([n, v]);
				};
			}
			function step(op) {
				if (f) throw new TypeError("Generator is already executing.");
				while (_) try {
					if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
					if (y = 0, t) op = [op[0] & 2, t.value];
					switch (op[0]) {
						case 0:
						case 1:
							t = op;
							break;
						case 4:
							_.label++;
							return {
								value: op[1],
								done: false
							};
						case 5:
							_.label++;
							y = op[1];
							op = [0];
							continue;
						case 7:
							op = _.ops.pop();
							_.trys.pop();
							continue;
						default:
							if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
								_ = 0;
								continue;
							}
							if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
								_.label = op[1];
								break;
							}
							if (op[0] === 6 && _.label < t[1]) {
								_.label = t[1];
								t = op;
								break;
							}
							if (t && _.label < t[2]) {
								_.label = t[2];
								_.ops.push(op);
								break;
							}
							if (t[2]) _.ops.pop();
							_.trys.pop();
							continue;
					}
					op = body.call(thisArg, _);
				} catch (e) {
					op = [6, e];
					y = 0;
				} finally {
					f = t = 0;
				}
				if (op[0] & 5) throw op[1];
				return {
					value: op[0] ? op[1] : void 0,
					done: true
				};
			}
		};
		__exportStar = function(m, o) {
			for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
		};
		__createBinding = Object.create ? (function(o, m, k, k2) {
			if (k2 === void 0) k2 = k;
			Object.defineProperty(o, k2, {
				enumerable: true,
				get: function() {
					return m[k];
				}
			});
		}) : (function(o, m, k, k2) {
			if (k2 === void 0) k2 = k;
			o[k2] = m[k];
		});
		__values = function(o) {
			var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
			if (m) return m.call(o);
			if (o && typeof o.length === "number") return { next: function() {
				if (o && i >= o.length) o = void 0;
				return {
					value: o && o[i++],
					done: !o
				};
			} };
			throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
		};
		__read = function(o, n) {
			var m = typeof Symbol === "function" && o[Symbol.iterator];
			if (!m) return o;
			var i = m.call(o), r, ar = [], e;
			try {
				while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
			} catch (error) {
				e = { error };
			} finally {
				try {
					if (r && !r.done && (m = i["return"])) m.call(i);
				} finally {
					if (e) throw e.error;
				}
			}
			return ar;
		};
		/** @deprecated */
		__spread = function() {
			for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
			return ar;
		};
		/** @deprecated */
		__spreadArrays = function() {
			for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
			for (var r = Array(s), k = 0, i = 0; i < il; i++) for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++) r[k] = a[j];
			return r;
		};
		__spreadArray = function(to, from, pack) {
			if (pack || arguments.length === 2) {
				for (var i = 0, l = from.length, ar; i < l; i++) if (ar || !(i in from)) {
					if (!ar) ar = Array.prototype.slice.call(from, 0, i);
					ar[i] = from[i];
				}
			}
			return to.concat(ar || Array.prototype.slice.call(from));
		};
		__await = function(v) {
			return this instanceof __await ? (this.v = v, this) : new __await(v);
		};
		__asyncGenerator = function(thisArg, _arguments, generator) {
			if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
			var g = generator.apply(thisArg, _arguments || []), i, q = [];
			return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
				return this;
			}, i;
			function verb(n) {
				if (g[n]) i[n] = function(v) {
					return new Promise(function(a, b) {
						q.push([
							n,
							v,
							a,
							b
						]) > 1 || resume(n, v);
					});
				};
			}
			function resume(n, v) {
				try {
					step(g[n](v));
				} catch (e) {
					settle(q[0][3], e);
				}
			}
			function step(r) {
				r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
			}
			function fulfill(value) {
				resume("next", value);
			}
			function reject(value) {
				resume("throw", value);
			}
			function settle(f, v) {
				if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
			}
		};
		__asyncDelegator = function(o) {
			var i, p;
			return i = {}, verb("next"), verb("throw", function(e) {
				throw e;
			}), verb("return"), i[Symbol.iterator] = function() {
				return this;
			}, i;
			function verb(n, f) {
				i[n] = o[n] ? function(v) {
					return (p = !p) ? {
						value: __await(o[n](v)),
						done: n === "return"
					} : f ? f(v) : v;
				} : f;
			}
		};
		__asyncValues = function(o) {
			if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
			var m = o[Symbol.asyncIterator], i;
			return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
				return this;
			}, i);
			function verb(n) {
				i[n] = o[n] && function(v) {
					return new Promise(function(resolve, reject) {
						v = o[n](v), settle(resolve, reject, v.done, v.value);
					});
				};
			}
			function settle(resolve, reject, d, v) {
				Promise.resolve(v).then(function(v) {
					resolve({
						value: v,
						done: d
					});
				}, reject);
			}
		};
		__makeTemplateObject = function(cooked, raw) {
			if (Object.defineProperty) Object.defineProperty(cooked, "raw", { value: raw });
			else cooked.raw = raw;
			return cooked;
		};
		var __setModuleDefault = Object.create ? (function(o, v) {
			Object.defineProperty(o, "default", {
				enumerable: true,
				value: v
			});
		}) : function(o, v) {
			o["default"] = v;
		};
		__importStar = function(mod) {
			if (mod && mod.__esModule) return mod;
			var result = {};
			if (mod != null) {
				for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
			}
			__setModuleDefault(result, mod);
			return result;
		};
		__importDefault = function(mod) {
			return mod && mod.__esModule ? mod : { "default": mod };
		};
		__classPrivateFieldGet = function(receiver, state, kind, f) {
			if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
			if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
			return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
		};
		__classPrivateFieldSet = function(receiver, state, value, kind, f) {
			if (kind === "m") throw new TypeError("Private method is not writable");
			if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
			if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
			return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
		};
		exporter("__extends", __extends);
		exporter("__assign", __assign);
		exporter("__rest", __rest);
		exporter("__decorate", __decorate);
		exporter("__param", __param);
		exporter("__metadata", __metadata);
		exporter("__awaiter", __awaiter);
		exporter("__generator", __generator);
		exporter("__exportStar", __exportStar);
		exporter("__createBinding", __createBinding);
		exporter("__values", __values);
		exporter("__read", __read);
		exporter("__spread", __spread);
		exporter("__spreadArrays", __spreadArrays);
		exporter("__spreadArray", __spreadArray);
		exporter("__await", __await);
		exporter("__asyncGenerator", __asyncGenerator);
		exporter("__asyncDelegator", __asyncDelegator);
		exporter("__asyncValues", __asyncValues);
		exporter("__makeTemplateObject", __makeTemplateObject);
		exporter("__importStar", __importStar);
		exporter("__importDefault", __importDefault);
		exporter("__classPrivateFieldGet", __classPrivateFieldGet);
		exporter("__classPrivateFieldSet", __classPrivateFieldSet);
	});
}));

//#endregion
//#region ../../node_modules/.pnpm/@odata2ts+http-client-base@0.5.4/node_modules/@odata2ts/http-client-base/lib/ErrorMessageRetriever.js
var require_ErrorMessageRetriever = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.retrieveErrorMessage = void 0;
	/**
	* Retrieves the OData error message from the response (V2 and V4 are supported).
	* The structure of the error message is specified by OData.
	*
	* @param errorResponse
	*/
	const retrieveErrorMessage = (errorResponse) => {
		var _a;
		const eMsg = (_a = errorResponse === null || errorResponse === void 0 ? void 0 : errorResponse.error) === null || _a === void 0 ? void 0 : _a.message;
		return typeof (eMsg === null || eMsg === void 0 ? void 0 : eMsg.value) === "string" ? eMsg.value : eMsg;
	};
	exports.retrieveErrorMessage = retrieveErrorMessage;
}));

//#endregion
//#region ../../node_modules/.pnpm/@odata2ts+http-client-base@0.5.4/node_modules/@odata2ts/http-client-base/lib/HttpMethods.js
var require_HttpMethods = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.HttpMethods = void 0;
	(function(HttpMethods) {
		HttpMethods["Get"] = "GET";
		HttpMethods["Post"] = "POST";
		HttpMethods["Put"] = "PUT";
		HttpMethods["Patch"] = "PATCH";
		HttpMethods["Delete"] = "DELETE";
	})(exports.HttpMethods || (exports.HttpMethods = {}));
}));

//#endregion
//#region ../../node_modules/.pnpm/@odata2ts+http-client-base@0.5.4/node_modules/@odata2ts/http-client-base/lib/BaseHttpClient.js
var require_BaseHttpClient = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.BaseHttpClient = exports.DEFAULT_CSRF_TOKEN_KEY = void 0;
	const tslib_1 = require_tslib();
	const ErrorMessageRetriever_1 = require_ErrorMessageRetriever();
	const HttpMethods_1 = require_HttpMethods();
	exports.DEFAULT_CSRF_TOKEN_KEY = "x-csrf-token";
	const EDIT_METHODS = [
		HttpMethods_1.HttpMethods.Post,
		HttpMethods_1.HttpMethods.Put,
		HttpMethods_1.HttpMethods.Patch,
		HttpMethods_1.HttpMethods.Delete
	];
	const FAILURE_MISSING_CSRF_URL = "When automatic CSRF token handling is activated, the URL must be supplied via attribute [csrfTokenFetchUrl]!";
	const FAILURE_MISSING_URL = "Value for URL must be provided!";
	const JSON_VALUE = "application/json";
	function getInternalConfigWithJsonHeaders(headers, setContentType = true) {
		return {
			headers: Object.assign(Object.assign({ Accept: JSON_VALUE }, setContentType ? { "Content-Type": JSON_VALUE } : void 0), headers),
			dataType: "json"
		};
	}
	var BaseHttpClient = class {
		constructor(baseOptions = { useCsrfProtection: false }) {
			var _a;
			this.baseOptions = baseOptions;
			this.csrfTokenKey = exports.DEFAULT_CSRF_TOKEN_KEY;
			this.retrieveErrorMessage = ErrorMessageRetriever_1.retrieveErrorMessage;
			if (baseOptions.useCsrfProtection && !((_a = baseOptions.csrfTokenFetchUrl) === null || _a === void 0 ? void 0 : _a.trim())) throw new Error(FAILURE_MISSING_CSRF_URL);
		}
		getCsrfTokenKey() {
			return this.csrfTokenKey;
		}
		setCsrfTokenKey(newKey) {
			this.csrfTokenKey = newKey || exports.DEFAULT_CSRF_TOKEN_KEY;
		}
		setErrorMessageRetriever(getErrorMsg) {
			this.retrieveErrorMessage = getErrorMsg;
		}
		setupSecurityToken() {
			return tslib_1.__awaiter(this, void 0, void 0, function* () {
				if (!this.csrfToken) this.csrfToken = yield this.fetchSecurityToken();
				return [this.csrfTokenKey, this.csrfToken];
			});
		}
		fetchSecurityToken() {
			return tslib_1.__awaiter(this, void 0, void 0, function* () {
				const fetchUrl = this.baseOptions.csrfTokenFetchUrl;
				return (yield this.sendRequest(HttpMethods_1.HttpMethods.Get, fetchUrl, void 0, void 0, {
					noBodyEvaluation: true,
					headers: {
						[this.csrfTokenKey]: "Fetch",
						Accept: JSON_VALUE
					}
				})).headers[this.csrfTokenKey];
			});
		}
		/**
		* Follows the template pattern.
		*
		* @param method
		* @param url
		* @param data
		* @param requestConfig
		* @param internalConfig
		* @private
		*/
		sendRequest(method, url, data, requestConfig, internalConfig = {}) {
			return tslib_1.__awaiter(this, void 0, void 0, function* () {
				if (typeof url !== "string") throw new Error(FAILURE_MISSING_URL);
				if (this.baseOptions.useCsrfProtection && EDIT_METHODS.includes(method)) {
					const [tokenKey, tokenValue] = yield this.setupSecurityToken();
					if (tokenValue) {
						if (!internalConfig.headers) internalConfig.headers = {};
						internalConfig.headers[tokenKey] = tokenValue;
					}
				}
				try {
					return yield this.executeRequest(method, url, data, requestConfig, Object.keys(internalConfig).length ? internalConfig : void 0);
				} catch (e) {
					const clientError = e;
					if (!!this.baseOptions.useCsrfProtection && clientError.status === 403 && !!clientError.headers && clientError.headers["x-csrf-token"] === "Required") {
						this.csrfToken = void 0;
						return this.sendRequest(method, url, data, requestConfig);
					}
					throw e;
				}
			});
		}
		get(url, requestConfig, additionalHeaders) {
			return this.sendRequest(HttpMethods_1.HttpMethods.Get, url, void 0, requestConfig, getInternalConfigWithJsonHeaders(additionalHeaders, false));
		}
		post(url, data, requestConfig, additionalHeaders) {
			return this.sendRequest(HttpMethods_1.HttpMethods.Post, url, data, requestConfig, getInternalConfigWithJsonHeaders(additionalHeaders));
		}
		put(url, data, requestConfig, additionalHeaders) {
			return this.sendRequest(HttpMethods_1.HttpMethods.Put, url, data, requestConfig, getInternalConfigWithJsonHeaders(additionalHeaders));
		}
		patch(url, data, requestConfig, additionalHeaders) {
			return this.sendRequest(HttpMethods_1.HttpMethods.Patch, url, data, requestConfig, getInternalConfigWithJsonHeaders(additionalHeaders));
		}
		getAdditionalHeaders(additionalHeaders) {
			return additionalHeaders ? { headers: additionalHeaders } : void 0;
		}
		delete(url, requestConfig, additionalHeaders) {
			return this.sendRequest(HttpMethods_1.HttpMethods.Delete, url, void 0, requestConfig, getInternalConfigWithJsonHeaders(additionalHeaders, false));
		}
		getBlob(url, requestConfig, additionalHeaders) {
			return this.sendRequest(HttpMethods_1.HttpMethods.Get, url, void 0, requestConfig, Object.assign(Object.assign({}, this.getAdditionalHeaders(additionalHeaders)), { dataType: "blob" }));
		}
		getStream(url, requestConfig, additionalHeaders) {
			return this.sendRequest(HttpMethods_1.HttpMethods.Get, url, void 0, requestConfig, Object.assign(Object.assign({}, this.getAdditionalHeaders(additionalHeaders)), { dataType: "stream" }));
		}
		updateBlob(url, data, mimeType, requestConfig, additionalHeaders) {
			return this.sendRequest(HttpMethods_1.HttpMethods.Put, url, data, requestConfig, {
				headers: Object.assign(Object.assign({}, additionalHeaders), {
					Accept: mimeType,
					"Content-Type": mimeType
				}),
				dataType: "blob"
			});
		}
	};
	exports.BaseHttpClient = BaseHttpClient;
}));

//#endregion
//#region ../../node_modules/.pnpm/@odata2ts+http-client-base@0.5.4/node_modules/@odata2ts/http-client-base/lib/index.js
var require_lib$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.HttpMethods = exports.BaseHttpClient = void 0;
	require_tslib().__exportStar(require_ErrorMessageRetriever(), exports);
	var BaseHttpClient_1 = require_BaseHttpClient();
	Object.defineProperty(exports, "BaseHttpClient", {
		enumerable: true,
		get: function() {
			return BaseHttpClient_1.BaseHttpClient;
		}
	});
	var HttpMethods_1 = require_HttpMethods();
	Object.defineProperty(exports, "HttpMethods", {
		enumerable: true,
		get: function() {
			return HttpMethods_1.HttpMethods;
		}
	});
}));

//#endregion
//#region ../../node_modules/.pnpm/@odata2ts+http-client-fetch@0.9.0/node_modules/@odata2ts/http-client-fetch/lib/FetchClientError.js
var require_FetchClientError = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.FetchClientError = void 0;
	var FetchClientError = class extends Error {
		constructor(message, status, headers, cause, responseData) {
			super(message, { cause });
			this.status = status;
			this.headers = headers;
			this.cause = cause;
			this.responseData = responseData;
			this.name = this.constructor.name;
		}
	};
	exports.FetchClientError = FetchClientError;
}));

//#endregion
//#region ../../node_modules/.pnpm/@odata2ts+http-client-fetch@0.9.0/node_modules/@odata2ts/http-client-fetch/lib/FetchRequestConfig.js
var require_FetchRequestConfig = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.mergeFetchConfig = exports.getDefaultConfig = void 0;
	const tslib_1 = require_tslib();
	const DEFAULT_CONFIG = { cache: "no-store" };
	function getDefaultConfig(config) {
		return mergeFetchConfig(DEFAULT_CONFIG, config);
	}
	exports.getDefaultConfig = getDefaultConfig;
	function mergeFetchConfig(...configs) {
		if (!configs.length) return;
		return configs.filter((c) => !!c).reduce((collector, current) => {
			const { headers } = current, passThrough = tslib_1.__rest(current, ["headers"]);
			const collectedHeaders = collector.headers;
			if (headers && headers instanceof Headers) headers.forEach((val, key) => collectedHeaders.set(key, val));
			else if (headers) Object.entries(headers).forEach(([key, val]) => collectedHeaders.set(key, val));
			return Object.assign(Object.assign({}, collector), passThrough);
		}, { headers: new Headers() });
	}
	exports.mergeFetchConfig = mergeFetchConfig;
}));

//#endregion
//#region ../../node_modules/.pnpm/@odata2ts+http-client-fetch@0.9.0/node_modules/@odata2ts/http-client-fetch/lib/FetchClient.js
var require_FetchClient = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.FetchClient = exports.DEFAULT_ERROR_MESSAGE = void 0;
	const tslib_1 = require_tslib();
	const http_client_base_1 = require_lib$1();
	const FetchClientError_1 = require_FetchClientError();
	const FetchRequestConfig_1 = require_FetchRequestConfig();
	exports.DEFAULT_ERROR_MESSAGE = "No error message!";
	const FETCH_FAILURE_MESSAGE = "OData request failed entirely: ";
	const JSON_RETRIEVAL_FAILURE_MESSAGE = "Retrieving JSON body from OData response failed: ";
	const BLOB_RETRIEVAL_FAILURE_MESSAGE = "Retrieving blob from OData response failed: ";
	const RESPONSE_FAILURE_MESSAGE = "OData server responded with error: ";
	function buildErrorMessage(prefix, error) {
		return prefix + ((typeof error === "string" ? error : error === null || error === void 0 ? void 0 : error.message) || exports.DEFAULT_ERROR_MESSAGE);
	}
	var FetchClient = class extends http_client_base_1.BaseHttpClient {
		constructor(config, clientOptions) {
			super(clientOptions);
			this.config = (0, FetchRequestConfig_1.getDefaultConfig)(config);
		}
		executeRequest(method, url, data, requestConfig = {}, internalConfig = {}) {
			return tslib_1.__awaiter(this, void 0, void 0, function* () {
				const { headers, noBodyEvaluation } = internalConfig;
				const _a = (0, FetchRequestConfig_1.mergeFetchConfig)(this.config, { headers }, requestConfig), { params } = _a, config = tslib_1.__rest(_a, ["params"]);
				config.method = method;
				if (typeof data !== "undefined") config.body = internalConfig.dataType === "json" ? JSON.stringify(data) : data;
				let finalUrl = url;
				if (params && Object.values(params).length) finalUrl += (url.match(/\?/) ? "&" : "?") + new URLSearchParams(params).toString();
				let response;
				try {
					response = yield fetch(finalUrl, config);
				} catch (fetchError) {
					throw new FetchClientError_1.FetchClientError(buildErrorMessage(FETCH_FAILURE_MESSAGE, fetchError), void 0, void 0, fetchError);
				}
				if (!response.ok) {
					let responseData;
					try {
						responseData = yield this.getResponseBody(response, internalConfig);
					} catch (e) {
						responseData = void 0;
					}
					const errMsg = this.retrieveErrorMessage(responseData);
					throw new FetchClientError_1.FetchClientError(buildErrorMessage(RESPONSE_FAILURE_MESSAGE, errMsg), response.status, this.mapHeaders(response.headers), new Error(errMsg || exports.DEFAULT_ERROR_MESSAGE), responseData);
				}
				let responseData;
				try {
					responseData = noBodyEvaluation ? void 0 : yield this.getResponseBody(response, internalConfig);
				} catch (error) {
					const msg = internalConfig.dataType === "blob" ? BLOB_RETRIEVAL_FAILURE_MESSAGE : JSON_RETRIEVAL_FAILURE_MESSAGE;
					throw new FetchClientError_1.FetchClientError(buildErrorMessage(msg, error), response.status, this.mapHeaders(response.headers), error);
				}
				return {
					status: response.status,
					statusText: response.statusText,
					headers: this.mapHeaders(response.headers),
					data: responseData
				};
			});
		}
		getResponseBody(response, options) {
			return tslib_1.__awaiter(this, void 0, void 0, function* () {
				if (response.status === 204) return;
				switch (options.dataType) {
					case "json": return response.json();
					case "blob": return response.blob();
					case "stream": return response.body;
				}
			});
		}
		mapHeaders(headers) {
			const result = {};
			headers.forEach((value, key) => result[key] = value);
			return result;
		}
	};
	exports.FetchClient = FetchClient;
}));

//#endregion
//#region ../../node_modules/.pnpm/@odata2ts+http-client-fetch@0.9.0/node_modules/@odata2ts/http-client-fetch/lib/index.js
var require_lib = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.FetchClientError = void 0;
	require_tslib().__exportStar(require_FetchClient(), exports);
	var FetchClientError_1 = require_FetchClientError();
	Object.defineProperty(exports, "FetchClientError", {
		enumerable: true,
		get: function() {
			return FetchClientError_1.FetchClientError;
		}
	});
}));

//#endregion
//#region src/core/composables/prefetch-bridge.ts
var import_lib = require_lib();
/** Store classes that implement the `prefetch` option themselves (`@mono-lit/data`). */
const PREFETCH_SUPPORT = Symbol.for("mono.prefetch");
let bridge = null;
function setPrefetchBridge(next) {
	bridge = next;
}
function getPrefetchBridge() {
	return bridge;
}
const CREDENTIAL_HEADERS = new Set([
	"authorization",
	"cookie",
	"set-cookie",
	"proxy-authorization",
	"x-api-key"
]);
function safeHeaders(headers) {
	if (!headers || typeof headers !== "object") return void 0;
	const out = {};
	for (const [name, value] of Object.entries(headers)) {
		if (CREDENTIAL_HEADERS.has(name.toLowerCase()) || typeof value !== "string") continue;
		out[name] = value;
	}
	return Object.keys(out).length ? out : void 0;
}
/** Reports a request (credential headers stripped). A no-op without a bridge. */
function learnPrefetch(request) {
	if (!bridge || !request?.url) return;
	try {
		const headers = safeHeaders(request.headers);
		bridge.learn({
			url: request.url,
			...request.query && Object.keys(request.query).length ? { query: { ...request.query } } : {},
			...headers ? { headers } : {},
			...request.auth ? { auth: request.auth } : {}
		});
	} catch {}
}
/**
* A per-store `@mono-lit/data` prefetch provider that captures the store's first load exactly as
* it would be sent, and answers it with an empty result (nothing is fetched here).
*/
function captureProvider(emit) {
	return {
		learn: (request) => emit(request),
		expects: () => true,
		take: async () => ({ data: {
			"value": [],
			"@odata.count": 0
		} })
	};
}
/**
* Serving plain DevExtreme stores (`@mono-lit/devextreme`), which can't serve by themselves.
*
* DevExtreme's OData stores call the store's `beforeSend(request)` and then, synchronously in the
* same call, open and send ONE XMLHttpRequest for it. So utility's own `beforeSend` arms the
* request the bridge expects ({@link armPrefetchServe}), and the very next `send()` of a GET to that
* URL is answered from the prefetched result instead of the network — DevExtreme then parses it
* exactly like a response (dates, `@odata.count`, `map`). This needs no access to DevExtreme's own
* modules (in Vite dev the data layer is pre-bundled with its OWN copy of DevExtreme's internals,
* out of reach of an `ajax.inject` from here). Every other XHR is untouched; a missing result (e.g.
* it failed on the server) is sent normally — the request was opened but not yet sent.
*/
let armed = null;
const opened = /* @__PURE__ */ new WeakMap();
let xhrPatched = false;
function patchXhr() {
	if (xhrPatched) return true;
	const proto = globalThis.XMLHttpRequest?.prototype;
	if (!proto || typeof proto.open !== "function" || typeof proto.send !== "function") return false;
	xhrPatched = true;
	const { open, send, abort } = proto;
	proto.open = function(method, url, ...rest) {
		opened.set(this, {
			method: String(method).toUpperCase(),
			url: String(url)
		});
		return open.call(this, method, url, ...rest);
	};
	proto.send = function(body) {
		const request = opened.get(this);
		const hit = armed;
		armed = null;
		if (!hit || request?.method !== "GET" || !request.url.startsWith(hit.url)) return send.call(this, body);
		const xhr = this;
		let aborted = false;
		xhr.abort = function() {
			aborted = true;
			return abort.call(xhr);
		};
		const passThrough = () => {
			if (!aborted) send.call(xhr, body);
		};
		hit.bridge.take("GET", hit.url, hit.query).then((result) => {
			if (aborted) return;
			if (!result) return passThrough();
			const text = JSON.stringify(result.data);
			for (const [name, value] of Object.entries({
				readyState: 4,
				status: 200,
				statusText: "OK",
				responseText: text,
				response: text,
				responseURL: request.url
			})) Object.defineProperty(xhr, name, {
				configurable: true,
				value
			});
			xhr.onreadystatechange?.(new Event("readystatechange"));
			xhr.onload?.(new Event("load"));
			xhr.onloadend?.(new Event("loadend"));
		}, passThrough);
	};
	return true;
}
/**
* Called from a plain DevExtreme store's `beforeSend` with the final request: when the bridge has a
* result for this GET, the XHR DevExtreme sends right after is answered from it. Returns whether
* it was armed.
*/
function armPrefetchServe(url, query) {
	armed = null;
	const current = bridge;
	if (!current || typeof url !== "string" || !url) return false;
	try {
		if (!current.expects("GET", url, query) || !patchXhr()) return false;
	} catch {
		return false;
	}
	armed = {
		url,
		query,
		bridge: current
	};
	queueMicrotask(() => {
		if (armed?.url === url) armed = null;
	});
	return true;
}

//#endregion
//#region src/core/composables/use-fetch-helper.ts
/**
* Deterministic serialization of a value, for request-dedupe keys.
*
* DEEP and key-sorted. The previous one-liner handed the value's own TOP-LEVEL
* keys to `JSON.stringify` as a REPLACER ARRAY, and a replacer array filters
* every object in the tree by that one list — so nested objects lost every key
* that did not also appear at the top. `{ sort: [{ selector: "A" }] }` and
* `{ sort: [{ selector: "B" }] }` both collapsed to `{"sort":[{}]}`, i.e. to the
* SAME key, so two concurrent loads differing only by sort field deduped into
* one. A key that cannot tell two requests apart does not save a request — it
* hands the second caller the first caller's rows.
*/
function stable(v) {
	const seen = /* @__PURE__ */ new WeakSet();
	const walk = (x) => {
		if (typeof x === "function") return "[fn]";
		if (!x || typeof x !== "object") return x;
		if (seen.has(x)) return "[circular]";
		seen.add(x);
		if (Array.isArray(x)) return x.map(walk);
		return Object.keys(x).sort().reduce((acc, k) => {
			acc[k] = walk(x[k]);
			return acc;
		}, {});
	};
	try {
		return JSON.stringify(walk(v)) ?? "undefined";
	} catch {
		return String(v);
	}
}
/**
* The part of a request that lives in `params` rather than in the url.
*
* `params` (`$apply`, `$filter`, …) are attached to the request LATER, inside the
* store's `beforeSend` — they are not in the url the store was built with. So two
* DataSources over one endpoint that differ ONLY by `params` are different
* requests that look identical to anything keying on the url alone.
*
* Sorted by key so the same params written in a different order still match.
*/
const paramsIdentity = (p) => Object.entries(p ?? {}).filter(([, v]) => v !== void 0 && v !== null).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => `${k}=${String(v)}`).join("&");
/**
* A store built with a caller `override` opts OUT of cross-store sharing:
* `override.dataSource` is spread into the ODataStore config and can replace the
* url, the params or `beforeSend` itself, none of which is comparable by value.
* Such a store still dedupes against ITSELF — the ordinary case of one grid
* firing the same load twice — just never against another store.
*/
let storeIdSeq = 0;
const nextStoreId = () => `#store${++storeIdSeq}`;
/** Endpoints already reported for ignoring `$count=true` (see the `load` override in useFetchOData) — once per URL. */
const warnedNoCount = /* @__PURE__ */ new Set();
/** The counting strategy that worked for an endpoint, so later pages skip the ones it ignores. */
const countStrategy = /* @__PURE__ */ new Map();
/**
* The row count of an OData query, for an endpoint that ignores `$count=true`.
*
* Tried in order — first success wins and is remembered per URL:
*   path    `GET {url}/$count?$filter=…`                       → the bare integer (a different
*           server code path from the query option, and honoured where that one is not);
*   apply   `GET {url}?$apply=filter(…)/aggregate($count as Count)` → `value[0].Count`. Accepted
*           only when the body has that shape — a server that ignores `$apply` sends rows back;
*   select  `GET {url}?$select={key}&$filter=…`, unpaged        → `value.length`. The last resort,
*           and what DevExtreme did anyway, as one request that is as small as the server allows.
* `null` when nothing worked; the caller then leaves DevExtreme to its own fallback.
*
* `sent` is what `beforeSend` last put on the wire — its `$filter` is the compiled search +
* filter of the page query, and its headers carry the bearer.
*/
async function resolveTotal(url, key, sent) {
	const filter = sent?.params?.["$filter"] ? String(sent.params["$filter"]) : "";
	const headers = {
		...sent?.headers || {},
		Accept: "application/json, text/plain"
	};
	const get = async (target) => {
		const r = await fetch(target, { headers });
		if (!r.ok) throw new Error(`HTTP ${r.status}`);
		return r.text();
	};
	const withFilter = (qs) => {
		if (filter) qs.set("$filter", filter);
		return qs;
	};
	const strategies = {
		path: async () => {
			const qs = withFilter(new URLSearchParams());
			const n = parseInt(await get(`${url}/$count${qs.size ? `?${qs}` : ""}`), 10);
			if (!Number.isFinite(n)) throw new Error("not a count");
			return n;
		},
		apply: async () => {
			const qs = new URLSearchParams();
			qs.set("$apply", `${filter ? `filter(${filter})/` : ""}aggregate($count as Count)`);
			const body = JSON.parse(await get(`${url}?${qs}`));
			const n = Number(body?.value?.[0]?.Count);
			if (!Array.isArray(body?.value) || body.value.length !== 1 || !Number.isFinite(n)) throw new Error("$apply ignored");
			return n;
		},
		select: async () => {
			const qs = withFilter(new URLSearchParams());
			qs.set("$select", key);
			const body = JSON.parse(await get(`${url}?${qs}`));
			if (!Array.isArray(body?.value)) throw new Error("no value array");
			return body.value.length;
		}
	};
	const order = [
		"path",
		"apply",
		"select"
	];
	const known = countStrategy.get(url);
	for (const name of known ? [known, ...order.filter((o) => o !== known)] : order) try {
		const n = await strategies[name]();
		countStrategy.set(url, name);
		if (!warnedNoCount.has(url)) {
			warnedNoCount.add(url);
			console.warn(`[@mono-lit/utility] ${url}: the server ignores $count=true (no @odata.count); the total is counted via "${name}" instead. Enable $count on this OData endpoint.`);
		}
		return n;
	} catch {}
	return null;
}
const cookie = useMyCookie();
const jwt = useMyJwt();
const slTkn = useMyToken();
let refreshPromise = null;
let proactivePromise = null;
async function retryFetchClientOnce(fn, config, tokenOptions) {
	try {
		return await fn();
	} catch (err) {
		if ((err?.status ?? err?.response?.status ?? err?.httpStatus) !== 401) throw err;
		if (!await refreshTokenOnce({
			config,
			options: tokenOptions
		})) throw err;
		return await fn();
	}
}
function getCookieToken(name, split = false) {
	if (!name) return null;
	let v;
	try {
		v = cookie.get(name, split);
	} catch {
		return null;
	}
	if (v == null || v === "" || v === "undefined" || v === "null") return null;
	return v;
}
function isUsableToken(v) {
	if (!v) return false;
	return Boolean(jwt.cookieDecode({ token: v }));
}
let refetchRefreshToken = async ({ token: tkn, config, options }) => {
	const token = tkn || getCookieToken(config?.jwtName, true);
	if (!token) return {
		ok: false,
		reason: "no-main"
	};
	const decodeToken = jwt.cookieDecode({ token });
	const mergedOptions = {
		...options,
		name: options?.name ?? config?.jwtRefreshName,
		splitCookie: options?.splitCookie ?? false,
		fetchParams: {
			...options?.fetchParams,
			options: {
				...options?.fetchParams?.options,
				headers: {
					...options?.fetchParams?.options?.headers || {},
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json"
				},
				body: options?.fetchParams?.options?.body ?? JSON.stringify({ username: decodeToken?.USER_NAME })
			}
		}
	};
	await slTkn.fetch(mergedOptions);
	const stored = getCookieToken(options?.name ?? config?.jwtRefreshName, options?.splitCookie ?? false);
	if (!isUsableToken(stored)) return {
		ok: false,
		reason: "store-failed"
	};
	return {
		ok: true,
		token: stored
	};
};
/**
* Where the api-token cookie lives — the SAME name/split `refetchRefreshToken` writes to,
* so what a refresh stores is exactly what the next request reads.
*/
function apiCookieRef(config, tokenOptions) {
	return {
		name: tokenOptions?.name ?? config?.jwtRefreshName,
		split: tokenOptions?.splitCookie ?? false
	};
}
/**
* Was `token` READ from one of the configured cookies?
*
* @mono-lit/utility resolves the live cookie once, at call time, and hands it over as `token`.
* The core cannot be told "this was a cookie" any other way — but on the client mono reads the
* very same `document.cookie` this module does, so byte-equality with the cookie IS that
* signal. A token equal to no cookie was chosen by the caller and stays pinned; no readable
* cookie at all (SSR) also pins it, which keeps the passed value as the fallback there.
*
* The main-cookie check covers mono's own fallback: when the api cookie is missing it sends
* the main token instead.
*/
function tokenFollowsCookie(token, config, tokenOptions) {
	if (!token) return true;
	const api = apiCookieRef(config, tokenOptions);
	return token === getCookieToken(api.name, api.split) || token === getCookieToken(config?.jwtName, true);
}
/**
* For the `prefetch` option: the cookie a request's Bearer came from, so the prefetch host can
* read the same cookie off the page request itself — the token is never reported. A token that
* matches no cookie (the caller's own) gets no hint: the host's replay then goes without auth
* and the browser fetches as usual if that fails.
*/
function prefetchAuthFor(token, config, tokenOptions) {
	if (!token) return void 0;
	const api = apiCookieRef(config, tokenOptions);
	if (api.name && token === getCookieToken(api.name, api.split)) return api.split ? {
		cookie: api.name,
		split: true
	} : { cookie: api.name };
	if (config?.jwtName && token === getCookieToken(config.jwtName, true)) return {
		cookie: config.jwtName,
		split: true
	};
}
/**
* The Bearer for a request.
*
* `followCookie` is the fix for a store that outlives its token: a DataSource is built once
* and issues requests for as long as the page lives, while the cookie under it is replaced
* by every refresh — the core's own 401 path, the one another store on the page triggered, or
* the app's timer. Reading `manualToken` first meant the store sent the token it was BUILT
* with forever, so after a refresh every request 401'd again. With `followCookie` the live
* cookie wins and the captured value is only the fallback for where no cookie is readable.
*/
function getRequestToken({ manualToken, config, tokenOptions, followCookie = false }) {
	if (manualToken && !followCookie) return manualToken;
	const api = apiCookieRef(config, tokenOptions);
	return getCookieToken(api.name, api.split) || manualToken || null;
}
/**
* `unauthCall` means ONE thing: a refresh was attempted and could not save the session.
*
* It is not "a 401 happened" — every 401 path below tries `refreshTokenOnce` first — and it is not
* "there is no token", because at boot that is indistinguishable from a cold start whose cookies the
* app has not renewed yet. Getting that wrong is what used to throw a signed-in user back to the
* login gate on the first request of the session.
*
* The latch is for the fan-out: a page with several grids answers a dead session with several 401s,
* and each would otherwise fire its own redirect. It clears the moment a refresh succeeds, so the
* NEXT dead session redirects again.
*/
let unauthFired = false;
function callUnauth(unauthCall) {
	if (!unauthCall || unauthFired) return;
	unauthFired = true;
	unauthCall();
}
/** A refresh worked — the session is alive again, so arm the latch for next time. */
function resetUnauthLatch() {
	unauthFired = false;
}
async function ensureFreshToken({ token, config, tokenOptions, leewaySeconds = 60 }) {
	const split = tokenOptions?.splitCookie ?? false;
	const current = token ?? getCookieToken(tokenOptions?.name ?? config?.jwtRefreshName, split);
	if (!tokenOptions?.fetchParams?.url) return current;
	let expiring = !current;
	if (current) try {
		const decoded = jwt.cookieDecode({ token: current });
		const now = Math.floor(Date.now() / 1e3);
		expiring = !decoded?.exp || Number(decoded.exp) - now <= leewaySeconds;
	} catch {
		expiring = true;
	}
	if (!expiring) return current;
	const mainToken = getCookieToken(config?.jwtName, true);
	if (!mainToken) return current;
	proactivePromise ??= refetchRefreshToken({
		token: mainToken,
		config,
		options: tokenOptions
	});
	try {
		const result = await proactivePromise;
		if (result.ok) {
			resetUnauthLatch();
			return result.token;
		}
		if (result.reason === "no-main") return current;
		console.warn("[@mono-lit/utility] proactive refresh did not produce a usable token — check tokenOptions.path against the /Auth/RefreshToken response shape.");
		return current;
	} finally {
		proactivePromise = null;
	}
}
async function refreshTokenOnce({ config, options } = {}) {
	refreshPromise ??= (async () => {
		const mainToken = getCookieToken(config?.jwtName, true);
		if (!mainToken) return null;
		try {
			const r = await refetchRefreshToken({
				token: mainToken,
				config,
				options
			});
			return r.ok ? r.token : getCookieToken(config?.jwtRefreshName);
		} catch {
			return getCookieToken(config?.jwtRefreshName);
		}
	})();
	try {
		const token = await refreshPromise;
		if (token) resetUnauthLatch();
		return token;
	} finally {
		refreshPromise = null;
	}
}
async function authFetch({ url, init = {}, config, options }) {
	const { token: manualToken, skipAuthRetry, ...fetchInit } = init;
	const token = getRequestToken({
		manualToken,
		config,
		tokenOptions: options
	});
	const headers = new Headers(fetchInit.headers);
	if (token) headers.set("Authorization", `Bearer ${token}`);
	if (fetchInit.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
	const res = await fetch(url, {
		...fetchInit,
		headers
	});
	if (res.status !== 401 || skipAuthRetry) return res;
	const newToken = await refreshTokenOnce({
		config,
		options
	});
	if (!newToken) return res;
	const retryHeaders = new Headers(headers);
	retryHeaders.set("Authorization", `Bearer ${newToken}`);
	if (fetchInit.body && !retryHeaders.has("Content-Type")) retryHeaders.set("Content-Type", "application/json");
	return await fetch(url, {
		...fetchInit,
		headers: retryHeaders
	});
}
function createRequestManager() {
	const inflightFetch = /* @__PURE__ */ new Map();
	const controllers = /* @__PURE__ */ new Map();
	const inflightStore = /* @__PURE__ */ new Map();
	function keyFetch(url, init) {
		const method = (init?.method ?? "GET").toUpperCase();
		if (method === "GET") return `${method} ${url}`;
		return `${method} ${url} ${String(init?.body ?? "")}`;
	}
	async function smartFetch({ url, init = {}, policy = "share", config, tokenOptions }) {
		if ((init?.method ?? "GET").toUpperCase() !== "GET" && policy === "share") policy = "abort-prev";
		const k = keyFetch(url, init);
		if (policy === "share") {
			const existing = inflightFetch.get(k);
			if (existing) return await existing;
			const p = authFetch({
				url,
				init,
				config,
				options: tokenOptions
			}).finally(() => inflightFetch.delete(k));
			inflightFetch.set(k, p);
			return await p;
		}
		const prev = controllers.get(k);
		if (prev) prev.abort();
		const ac = new AbortController();
		controllers.set(k, ac);
		try {
			return await authFetch({
				url,
				init: {
					...init,
					signal: ac.signal
				},
				config,
				options: tokenOptions
			});
		} finally {
			if (controllers.get(k) === ac) controllers.delete(k);
		}
	}
	function tryAbort(p) {
		if (p && typeof p.abort === "function") p.abort();
		else if (p?.xhr && typeof p.xhr.abort === "function") p.xhr.abort();
	}
	function attachCleanup(p, cleanup) {
		if (p && typeof p.always === "function") p.always(cleanup);
		else if (p && typeof p.finally === "function") p.finally(cleanup).catch(() => {});
		else p?.then?.(cleanup, cleanup);
	}
	function patchDxStore(store, name, policy = "share") {
		if (!store || store.__reqPatched) return;
		store.__reqPatched = true;
		const origLoad = store.load?.bind(store);
		const origByKey = store.byKey?.bind(store);
		if (origLoad) store.load = (loadOptions) => {
			const k = `${name}::load::${stable(loadOptions ?? {})}`;
			const existing = inflightStore.get(k);
			if (existing) {
				if (policy === "share") return existing;
				tryAbort(existing);
				inflightStore.delete(k);
			}
			const p = origLoad(loadOptions);
			inflightStore.set(k, p);
			attachCleanup(p, () => {
				if (inflightStore.get(k) === p) inflightStore.delete(k);
			});
			return p;
		};
		if (origByKey) store.byKey = (key, extra) => {
			const k = `${name}::byKey::${stable(key)}::${stable(extra)}`;
			const existing = inflightStore.get(k);
			if (existing) {
				if (policy === "share") return existing;
				tryAbort(existing);
				inflightStore.delete(k);
			}
			const p = origByKey(key, extra);
			inflightStore.set(k, p);
			attachCleanup(p, () => {
				if (inflightStore.get(k) === p) inflightStore.delete(k);
			});
			return p;
		};
	}
	return {
		smartFetch,
		patchDxStore
	};
}
const manageRequest = createRequestManager();
function httpVariant(input) {
	const status = toStatus(input);
	if (status == null) return void 0;
	const bucket = Math.trunc(status / 100);
	return bucket === 4 ? "warning" : bucket === 5 ? "error" : void 0;
}
function toStatus(input) {
	if (typeof input === "number") return input;
	if (typeof input === "string") {
		const n = Number(input);
		return Number.isFinite(n) ? n : null;
	}
	if (input && typeof input === "object") {
		if (typeof input.status === "number") return input.status;
		const res = input.response;
		if (res && typeof res.status === "number") return res.status;
	}
	return null;
}
const mapOdataService = ({ url, services }) => {
	if (!services) return void 0;
	function lastPathSegment(input) {
		const segs = input.split("?")[0].split("/").filter(Boolean);
		if (!segs.length) return null;
		const raw = segs[segs.length - 1];
		return decodeURIComponent(raw.replace(/\(.*\)$/, ""));
	}
	if (lastPathSegment(url)) return {
		Service: services,
		EntityAccessor: (svc) => svc[lastPathSegment(url)]()
	};
};
function extractErrorMessage(source, fallback = "Terjadi kesalahan!.") {
	if (source == null) return fallback;
	if (typeof source === "string") return source.trim() || fallback;
	const found = [];
	const add = (s) => {
		if (typeof s === "string" && s.trim()) found.push(s.trim());
	};
	const visit = (val, depth) => {
		if (!val || typeof val !== "object" || depth > 3) return;
		for (const [k, v] of Object.entries(val)) {
			if (/message/i.test(k)) {
				if (typeof v === "string") add(v);
				else if (v && typeof v === "object" && typeof v.value === "string") add(v.value);
			}
			if (v && typeof v === "object") visit(v, depth + 1);
		}
	};
	visit(source, 0);
	if (!found.length && typeof source?.message === "string") add(source.message);
	const unique = [...new Set(found)];
	return unique.length ? unique.join("\n\n") : fallback;
}
function adaptFetchClientErrorToDx(err) {
	if (err instanceof import_lib.FetchClientError) {
		const status = err.status;
		const body = err.responseData ?? null;
		const msg = extractErrorMessage(body, err.message || "Unexpected error");
		const dxErr = new Error(msg);
		dxErr.httpStatus = status;
		dxErr.status = status;
		dxErr.errorDetails = {
			status,
			statusText: err.statusText ?? "",
			responseText: body ? JSON.stringify(body) : ""
		};
		return dxErr;
	}
	return err;
}
function splitOdata(urlAbs) {
	const i = urlAbs.indexOf("/odata");
	if (i < 0) return null;
	return {
		root: urlAbs.slice(0, i + 6),
		rest: urlAbs.slice(i + 6)
	};
}
function parseODataUrl(urlAbs) {
	const spl = splitOdata(urlAbs);
	if (!spl) return null;
	const [path, query = ""] = spl.rest.split("?");
	const m = path.replace(/^\//, "").match(/^([^/()]+)(?:\(([^)]+)\))?(?:\/(.*))?$/);
	if (!m) return null;
	const entitySet = m[1];
	const parenKey = m[2] ?? null;
	let slashKey = null;
	if (!parenKey && m[3]) {
		const firstSeg = m[3].split("/")[0];
		if (firstSeg) slashKey = decodeURIComponent(firstSeg);
	}
	const rawKey = parenKey ?? slashKey;
	const canonicalSetUrl = `${spl.root.replace(/\/$/, "")}/${entitySet}`;
	const canonicalUrlWithKey = rawKey ? `${canonicalSetUrl}(${rawKey})${query ? `?${query}` : ""}` : `${canonicalSetUrl}${query ? `?${query}` : ""}`;
	return {
		root: spl.root,
		entitySet,
		rawKey,
		hasParenKey: Boolean(parenKey),
		hasSlashKey: Boolean(slashKey),
		canonicalSetUrl,
		canonicalUrlWithKey,
		query
	};
}
function toRelativeFromRoot(url, root) {
	try {
		const abs = new URL(url, root);
		const base = new URL(root);
		if (abs.origin === base.origin) {
			const rel = abs.pathname + (abs.search || "");
			const rootPath = base.pathname.replace(/\/$/, "");
			return (rel.startsWith(rootPath) ? rel.slice(rootPath.length) : rel).replace(/^\/+/, "");
		}
	} catch {}
	return url.replace(/^\/+/, "");
}
async function odataBatchWrite({ client, canonicalSetUrl, root, ops }) {
	const batchId = `batch_${crypto.randomUUID()}`;
	const changeId = `changeset_${crypto.randomUUID()}`;
	const lines = [];
	lines.push(`--${batchId}`);
	lines.push(`Content-Type: multipart/mixed; boundary=${changeId}`, "");
	for (let i = 0; i < ops.length; i++) {
		const o = ops[i];
		const relUrl = toRelativeFromRoot(o.url || canonicalSetUrl, root);
		lines.push(`--${changeId}`);
		lines.push("Content-Type: application/http");
		lines.push("Content-Transfer-Encoding: binary");
		lines.push(`Content-ID: ${i + 1}`, "");
		lines.push(`${o.method} ${relUrl} HTTP/1.1`);
		lines.push("Content-Type: application/json; charset=utf-8", "");
		if (o.method === "DELETE") lines.push("");
		else lines.push(JSON.stringify(o.body ?? {}), "");
	}
	lines.push(`--${changeId}--`, "");
	lines.push(`--${batchId}--`, "");
	const body = lines.join("\r\n");
	return client.post(`${root.replace(/\/$/, "")}/$batch`, body, { headers: {
		"Content-Type": `multipart/mixed; boundary=${batchId}`,
		"Accept": "multipart/mixed"
	} });
}
function pickKeyForRow(row, i, payload) {
	if (Array.isArray(payload.keyValue)) return payload.keyValue[i];
	const name = payload.keyName || "Id";
	return row?.[name];
}
function isInsertKey(key) {
	if (key == null || key === "") return true;
	if (typeof key === "number" && key < 0) return true;
	if (key && typeof key === "object" && !Array.isArray(key)) {
		const entries = Object.entries(key);
		if (!entries.length) return true;
		if (entries.every(([_, v]) => v == null || v === "" || typeof v === "number" && v < 0)) return true;
	}
	return false;
}
function stripKeyOnInsert(row, keyName = "Id") {
	if (row && Object.prototype.hasOwnProperty.call(row, keyName)) {
		const clone = { ...row };
		delete clone[keyName];
		return clone;
	}
	return row;
}
function buildKeySegment(key) {
	const quote = (v) => {
		if (v instanceof Date) return `'${v.toISOString().replace(/'/g, "''")}'`;
		if (typeof v === "string") return `'${v.replace(/'/g, "''")}'`;
		return String(v);
	};
	if (key == null) return "";
	if (typeof key === "object" && !Array.isArray(key)) return `(${Object.entries(key).map(([k, v]) => `${k}=${quote(v)}`).join(",")})`;
	return `(${quote(key)})`;
}
function parseDxError(err) {
	const wrapped = err?.error;
	const status = wrapped?.httpStatus ?? err?.httpStatus ?? err?.status ?? err?.xhr?.status ?? err?.errorDetails?.status ?? null;
	const xhr = err?.errorDetails ?? err?.xhr ?? wrapped ?? null;
	let body = null;
	if (xhr?.responseJSON) body = xhr.responseJSON;
	if (!body && typeof xhr?.responseText === "string") try {
		body = JSON.parse(xhr.responseText);
	} catch {}
	if (!body && typeof xhr?.response === "string") try {
		body = JSON.parse(xhr.response);
	} catch {}
	if (!body && wrapped && typeof wrapped === "object") body = wrapped;
	if (!body && typeof err === "object" && (err.error || err.Message || err.message)) body = err;
	const message = status == 401 ? "Unauthorized access" : status == 403 ? "Forbidden access" : extractErrorMessage(body, "") || extractErrorMessage(wrapped, "") || extractErrorMessage(err, "Unexpected error");
	return {
		status,
		code: body?.error?.code ?? body?.ErrorCode ?? body?.code ?? null,
		message,
		body: body ?? xhr ?? err,
		err
	};
}
const useFetchOData = async ({ url, options, source, type = "datasource", params, notif = false, force = false, token, headers, selfProxy = "", method = "GET", baseUrl, override, allowZero = false, cache = false, expiredBehaviour, unauthCall, payload = {
	data: null,
	keyValue: null,
	keyName: "",
	keyType: ""
}, config, tokenOptions, tanstack, prefetch, __capture }) => {
	const helper = typeof window !== "undefined" && window.helper || useHelper();
	const isNotif = __capture ? void 0 : typeof notif === "boolean" && notif === true ? helper.notif : notif;
	const zeroGuardFields = "all";
	const isZeroVal = (v) => v === 0 || v === "0";
	const shouldStripZero = (k, v, allowZero, guard) => !allowZero && !k.startsWith("$") && isZeroVal(v) && (guard === "all" || Array.isArray(guard) && guard.includes(k));
	function stripZeroParams(params, allowZero, guard) {
		if (!params) return;
		for (const [k, v] of Object.entries(params)) if (shouldStripZero(k, v, allowZero, guard)) delete params[k];
	}
	function containsZeroInDxFilter(expr, allowZero, guard) {
		if (allowZero || !expr) return false;
		if (Array.isArray(expr)) {
			if (expr.length >= 3 && typeof expr[0] === "string") {
				const [field, , val] = expr;
				if (isZeroVal(val) && (guard === "all" || Array.isArray(guard) && guard.includes(field))) return true;
			}
			return expr.some((e) => containsZeroInDxFilter(e, allowZero, guard));
		}
		if (expr && typeof expr === "object") return Object.values(expr).some((v) => containsZeroInDxFilter(v, allowZero, guard));
		return false;
	}
	try {
		if (!__capture) token = await ensureFreshToken({
			token,
			config,
			tokenOptions
		}) ?? void 0;
		const followCookie = tokenFollowsCookie(token, config, tokenOptions);
		const readToken = () => getRequestToken({
			manualToken: token,
			config,
			tokenOptions,
			followCookie
		}) ?? void 0;
		let dataSource = null;
		let authReloadPending = false;
		const bearerOf = (h) => {
			const v = h?.Authorization ?? h?.authorization;
			return typeof v === "string" && v.startsWith("Bearer ") ? v.slice(7) : void 0;
		};
		const onStore401 = (err) => {
			const refusedToken = bearerOf(err?.requestOptions?.headers ?? err?.error?.requestOptions?.headers) ?? readToken();
			refreshTokenOnce({
				config,
				options: tokenOptions
			}).then((newToken) => {
				if (newToken) {
					if ((type === "datasource" || type === "fakedatasource") && newToken !== refusedToken && !authReloadPending && typeof dataSource?.reload === "function") {
						authReloadPending = true;
						Promise.resolve(dataSource.reload()).then(() => {
							authReloadPending = false;
						}, () => {});
					}
					return;
				}
				if (unauthCall) {
					callUnauth(unauthCall);
					return;
				}
				if (expiredBehaviour === "refresh" && typeof window !== "undefined") window.location.reload();
			});
		};
		const urls = `${selfProxy ? selfProxy : baseUrl}${url}`;
		const ds = source?.DataSource;
		const cs = source?.CustomStore;
		const ods = source?.ODataStore;
		const tanstackFlag = Symbol.for("mono.tanstack");
		const odsTanstack = tanstack && ods?.[tanstackFlag] ? { tanstack } : {};
		const csTanstack = tanstack && cs?.[tanstackFlag] ? { tanstack } : {};
		if (__capture && !ods?.[PREFETCH_SUPPORT]) throw new Error("[@mono-lit/utility] .prefetch() needs a data layer that supports it (@mono-lit/data stores)");
		const odsPrefetch = __capture ? { prefetch: {
			auth: __capture.auth,
			provider: captureProvider(__capture.emit)
		} } : prefetch && ods?.[PREFETCH_SUPPORT] ? { prefetch: { auth: prefetchAuthFor(readToken(), config, tokenOptions) } } : {};
		let firstLoadReported = false;
		const learnFirstLoad = (req, latestToken) => {
			if (__capture || ods?.[PREFETCH_SUPPORT] || !getPrefetchBridge()) return;
			if (String(req?.method ?? "get").toLowerCase() !== "get") return;
			if (prefetch !== false) armPrefetchServe(req.url, req.params);
			if (!prefetch || firstLoadReported || req?.url !== urls) return;
			firstLoadReported = true;
			learnPrefetch({
				url: req.url,
				query: req.params,
				headers: req.headers,
				auth: prefetchAuthFor(latestToken, config, tokenOptions)
			});
		};
		const keyName = payload?.keyName || options?.key || "Id";
		const isFake = type === "fakedatasource" || type === "fakedata";
		function isZeroKey(v) {
			if (v === 0 || v === "0") return true;
			if (Array.isArray(v)) return v.some(isZeroKey);
			if (v && typeof v === "object") return Object.values(v).some(isZeroKey);
			return false;
		}
		function applyByKeyGuardAndCache(store, { allowZero, cache }) {
			if (!store || store.__byKeyPatched) return;
			store.__byKeyPatched = true;
			const cacheMap = /* @__PURE__ */ new Map();
			store.__byKeyCache = cacheMap;
			const origByKey = typeof store.byKey === "function" ? store.byKey.bind(store) : null;
			if (origByKey) store.byKey = (key, extra) => {
				if (!allowZero) {
					const isZero = (v) => v === 0 || v === "0" || Array.isArray(v) && v.some(isZero) || v && typeof v === "object" && Object.values(v).some(isZero);
					if (isZero(key)) return dxResolve(null);
				}
				if (cache && cacheMap.has(key)) return dxResolve(cacheMap.get(key));
				const dxp = ensureDx(origByKey(key, extra));
				dxp.done?.((val) => {
					if (cache) cacheMap.set(key, val);
				});
				dxp.then?.((val) => {
					if (cache) cacheMap.set(key, val);
				});
				return dxp;
			};
			const origLoad = typeof store.load === "function" ? store.load.bind(store) : null;
			if (origLoad) store.load = (loadOptions) => {
				const hasZero = (expr) => {
					if (!expr) return false;
					if (Array.isArray(expr)) {
						if (expr.length >= 3 && typeof expr[0] === "string") {
							const [, , val] = expr;
							if (val === 0 || val === "0") return true;
						}
						return expr.some(hasZero);
					}
					if (expr && typeof expr === "object") return Object.values(expr).some((v) => v === 0 || v === "0" || hasZero(v));
					return false;
				};
				if (!allowZero && hasZero(loadOptions?.filter)) return dxResolve(loadOptions?.requireTotalCount ? {
					data: [],
					totalCount: 0
				} : []);
				return ensureDx(origLoad(loadOptions));
			};
			const origUpdate = typeof store.update === "function" ? store.update.bind(store) : null;
			if (origUpdate) store.update = (key, values) => {
				cacheMap.delete(key);
				return ensureDx(origUpdate(key, values));
			};
			const origRemove = typeof store.remove === "function" ? store.remove.bind(store) : null;
			if (origRemove) store.remove = (key) => {
				cacheMap.delete(key);
				return ensureDx(origRemove(key));
			};
			const origInsert = typeof store.insert === "function" ? store.insert.bind(store) : null;
			if (origInsert) store.insert = (values) => {
				cacheMap.clear();
				return ensureDx(origInsert(values));
			};
		}
		function makeDxPromise() {
			let resolve, reject;
			const p = new Promise((res, rej) => {
				resolve = res;
				reject = rej;
			});
			const api = {};
			api.then = p.then.bind(p);
			api.catch = p.catch.bind(p);
			api.finally = p.finally.bind(p);
			api.done = (cb) => {
				p.then(cb);
				return api;
			};
			api.fail = (cb) => {
				p.catch(cb);
				return api;
			};
			api.always = (cb) => {
				p.then(cb, cb);
				return api;
			};
			api._resolve = (v) => resolve(v);
			api._reject = (e) => reject(e);
			return api;
		}
		function dxResolve(val) {
			const d = makeDxPromise();
			d._resolve(val);
			return d;
		}
		function dxFromPromise(np) {
			const d = makeDxPromise();
			np.then(d._resolve, d._reject);
			return d;
		}
		const ensureDx = (x) => x && typeof x.fail === "function" ? x : dxFromPromise(Promise.resolve(x));
		function sanitizeDsOptions(opts = {}) {
			const { store, load, byKey, insert, update, remove, totalCount, ...rest } = opts;
			return rest;
		}
		const buildUrlWithParams = (base, extra, key) => {
			const u = new URL(base, typeof window !== "undefined" ? window.location.origin : "http://localhost");
			if (key != null) u.pathname += `/${encodeURIComponent(String(key))}`;
			Object.entries(extra || {}).forEach(([k, v]) => {
				if (v !== void 0 && v !== null) u.searchParams.set(k, String(v));
			});
			return u.toString();
		};
		const fakeWrite = async ({ verb, body, key, config }) => {
			const target = buildUrlWithParams(urls, params, verb === "POST" ? null : key);
			const resp = await manageRequest.smartFetch({
				url: target,
				init: {
					token: readToken(),
					method: verb,
					headers: {
						"Content-Type": "application/json",
						...headers || {}
					},
					body: verb === "DELETE" ? void 0 : JSON.stringify(body ?? {})
				},
				config,
				tokenOptions
			});
			const statusCode = resp.status;
			const json = statusCode !== 204 ? await resp.json().catch(() => null) : null;
			if (!resp.ok) return {
				data: null,
				statusCode,
				error: {
					message: resp.statusText,
					stack: "",
					response: json
				}
			};
			return {
				data: json,
				statusCode,
				error: null
			};
		};
		let store;
		if (isFake) if (method === "GET") store = new ods({
			url: urls,
			version: 4,
			key: keyName,
			...payload.keyType && { keyType: payload.keyType },
			beforeSend: (req) => {
				try {
					if (force) {
						req.url = urls;
						req.method = method;
						req.params = { ...params || {} };
					} else req.params = {
						...req.params || {},
						...params || {}
					};
					const latestToken = readToken();
					req.headers = {
						...req.headers || {},
						...headers || {},
						...latestToken ? { Authorization: `Bearer ${latestToken}` } : {}
					};
					stripZeroParams(req.params, allowZero, zeroGuardFields);
					override?.dataSource?.beforeSend?.(req);
					learnFirstLoad(req, latestToken);
				} catch {}
			},
			errorHandler: (err) => {
				const p = parseDxError(err);
				if (isNotif) isNotif({
					type: httpVariant(p.status),
					message: `${p.message}`
				});
				if (p.status === 401) onStore401(err);
			},
			...odsTanstack,
			...odsPrefetch,
			...override?.dataSource
		});
		else store = new cs({
			key: keyName,
			load: async (loadOptions) => {
				const sp = new URLSearchParams();
				const s = loadOptions.sort && loadOptions.sort[0] || null;
				if (loadOptions.searchValue) sp.set("q", String(loadOptions.searchValue));
				if (s?.selector) {
					sp.set("_sort", String(s.selector));
					sp.set("_order", s.desc ? "desc" : "asc");
				}
				if (loadOptions.skip != null) sp.set("_start", String(loadOptions.skip));
				if (loadOptions.take != null) sp.set("_limit", String(loadOptions.take));
				const resp = await manageRequest.smartFetch({
					url: `${urls}${sp.toString() ? `?${sp.toString()}` : ""}`,
					init: {
						token: readToken(),
						headers: {
							"Content-Type": "application/json",
							...headers || {}
						}
					},
					tokenOptions,
					config
				});
				if (!resp.ok) throw new Error(`Load failed: ${resp.status} ${resp.statusText}`);
				const data = await resp.json();
				return {
					data,
					totalCount: Number(resp.headers.get("X-Total-Count")) || (Array.isArray(data) ? data.length : 0)
				};
			},
			byKey: (key) => {
				if (!isFake) {
					const origByKey = store.byKey?.bind(store);
					if (typeof origByKey === "function") store.byKey = (key, extra) => {
						if (!allowZero && isZeroKey(key)) return dxResolve(null);
						return ensureDx(origByKey(key, extra));
					};
				}
				return dxFromPromise(manageRequest.smartFetch({
					url: `${urls}/${encodeURIComponent(String(key))}`,
					init: {
						token: readToken(),
						headers: {
							"Content-Type": "application/json",
							...headers || {}
						}
					},
					tokenOptions,
					config
				}).then((resp) => {
					if (!resp.ok) throw new Error(`byKey failed: ${resp.status} ${resp.statusText}`);
					return resp.json();
				}));
			},
			insert: (values) => fakeWrite({
				verb: "POST",
				body: values,
				config
			}).then((r) => {
				if (r.error) throw r.error;
				return r.data;
			}),
			update: (key, values) => fakeWrite({
				verb: "PATCH",
				body: values,
				key,
				config
			}).then((r) => {
				if (r.error) throw r.error;
				return r.data;
			}),
			remove: (key) => fakeWrite({
				verb: "DELETE",
				key,
				config
			}).then((r) => {
				if (r.error) throw r.error;
				return key;
			}),
			...csTanstack,
			...override?.fakeDataSource
		});
		else {
			const odsInst = new ods({
				url: urls,
				version: 4,
				key: keyName,
				...payload.keyType && { keyType: payload.keyType },
				beforeSend: (req) => {
					const latestToken = readToken();
					try {
						if (force) {
							req.url = urls;
							req.method = method;
							req.params = { ...params || {} };
						} else req.params = {
							...req.params || {},
							...params || {}
						};
						req.headers = {
							...req.headers || {},
							...headers || {},
							...latestToken ? { Authorization: `Bearer ${latestToken}` } : {}
						};
						stripZeroParams(req.params, allowZero, zeroGuardFields);
						override?.dataSource?.beforeSend?.(req);
						learnFirstLoad(req, latestToken);
						lastSent = {
							params: { ...req.params || {} },
							headers: { ...req.headers || {} }
						};
					} catch {}
				},
				errorHandler: (err) => {
					const p = parseDxError(err);
					if (isNotif) isNotif({
						type: httpVariant(p.status),
						message: `${p.message}`
					});
					if (p.status === 401) onStore401(err);
				},
				...odsTanstack,
				...odsPrefetch,
				...override?.dataSource
			});
			/**
			* Supply the total ourselves when the server ignores $count=true.
			*
			* DevExtreme's DataSource needs extra.totalCount from a requireTotalCount load; an
			* endpoint that answers without @odata.count makes it fall back to store.totalCount()
			* — a second request, and on such an endpoint the same query again (it ignores that
			* $count too), so paging cost the whole table twice. So: run the load as usual; if
			* the total is missing, work it out with the cheapest thing the server honours (see
			* resolveTotal) — with the SAME $filter the load went out with, captured in
			* beforeSend — and resolve (data, { totalCount }), so DevExtreme never reaches its
			* fallback. If nothing works, resolve as received and let it.
			*/
			let lastSent = null;
			const origStoreLoad = odsInst.load.bind(odsInst);
			odsInst.load = (loadOptions) => {
				lastSent = null;
				const inner = origStoreLoad(loadOptions);
				if (!loadOptions?.requireTotalCount) return inner;
				const sent = lastSent;
				const d = Deferred();
				inner.done((data, extra) => {
					if (extra && Number.isFinite(Number(extra.totalCount))) {
						d.resolve(data, extra);
						return;
					}
					resolveTotal(urls, keyName, sent).then((n) => d.resolve(data, n == null ? extra : {
						...extra || {},
						totalCount: n
					})).catch(() => d.resolve(data, extra));
				}).fail((err) => d.reject(err));
				return d.promise();
			};
			if (source?.OdataService) {
				const OdataService = mapOdataService({
					url,
					services: source?.OdataService
				});
				if (method === "GET") store = odsInst;
				if (method !== "GET" && OdataService) {
					const parsed = parseODataUrl(urls);
					const createHttpClient = () => {
						const latestToken = readToken();
						return new import_lib.FetchClient({
							headers: {
								"Content-Type": "application/json",
								"Accept": "application/json",
								...headers || {},
								...latestToken ? { Authorization: `Bearer ${latestToken}` } : {}
							},
							...params || {}
						});
					};
					const createOdataServiceClient = () => {
						const httpClient = createHttpClient();
						const svc = new OdataService.Service(httpClient, parsed.root);
						const callIfMethod = (x) => typeof x === "function" ? x.call(svc) : x;
						let entityApi = callIfMethod(OdataService?.EntityAccessor?.(svc)) || callIfMethod(svc[String(parsed.entitySet)]) || callIfMethod(svc[`DTO_${parsed.entitySet}`]) || null;
						if (!entityApi) for (const k of Object.keys(svc)) {
							const fn = svc[k];
							if (typeof fn === "function") {
								const api = fn.call(svc);
								if (api?.entity && (api?.post || api?.query)) {
									entityApi = api;
									break;
								}
							}
						}
						return {
							httpClient,
							svc,
							entityApi
						};
					};
					if (Array.isArray(payload.data) && payload.useBatch && !isFake) {
						const rows = payload.data;
						const keyName = payload.keyName || "Id";
						const preferPut = method === "PUT";
						const keySeg = (k) => buildKeySegment(k);
						const ops = rows.map((row, i) => {
							const key = pickKeyForRow(row, i, {
								keyName,
								keyValue: payload.keyValue
							});
							if (isInsertKey(key)) return {
								method: "POST",
								url: parsed.canonicalSetUrl,
								body: stripKeyOnInsert(row, keyName)
							};
							return {
								method: preferPut ? "PUT" : "PATCH",
								url: `${parsed.canonicalSetUrl}${keySeg(key)}`,
								body: row
							};
						});
						return {
							data: await odataBatchWrite({
								client: createHttpClient(),
								root: parsed.root,
								ops
							}),
							statusCode: 200,
							error: null,
							dataSource: null
						};
					}
					store = new cs({
						key: keyName,
						...csTanstack,
						load: (lo) => odsInst.load(lo),
						byKey: (k) => odsInst.byKey(k),
						insert: async (values) => {
							try {
								return await retryFetchClientOnce(async () => {
									const { httpClient, entityApi } = createOdataServiceClient();
									if (entityApi?.post) return await entityApi.post(values) ?? values;
									return await httpClient.post(String(parsed.canonicalSetUrl), values);
								}, config, tokenOptions);
							} catch (e) {
								throw adaptFetchClientErrorToDx(e);
							}
						},
						update: async (id, values) => {
							try {
								return await retryFetchClientOnce(async () => {
									const { httpClient, entityApi } = createOdataServiceClient();
									const keySeg = buildKeySegment(id);
									if (method === "PUT") return entityApi?.entity?.call ? await entityApi.entity(id).put(values) ?? values : await httpClient.put(`${parsed.canonicalSetUrl}${keySeg}`, values);
									return entityApi?.entity?.call ? await entityApi.entity(id).patch(values) ?? values : await httpClient.patch(`${parsed.canonicalSetUrl}${keySeg}`, values);
								}, config, tokenOptions);
							} catch (e) {
								throw adaptFetchClientErrorToDx(e);
							}
						},
						remove: async (id) => {
							try {
								return await retryFetchClientOnce(async () => {
									const { httpClient, entityApi } = createOdataServiceClient();
									const keySeg = buildKeySegment(id);
									return entityApi?.entity?.call ? await entityApi.entity(id).delete() ?? id : await httpClient.delete(`${parsed.canonicalSetUrl}${keySeg}`);
								}, config, tokenOptions);
							} catch (e) {
								throw adaptFetchClientErrorToDx(e);
							}
						}
					});
				}
			} else store = odsInst;
		}
		if (!__capture) manageRequest.patchDxStore(store, override?.dataSource ? `${urls}::${nextStoreId()}` : `${urls}?${paramsIdentity(params)}::${stable(headers)}::${method}${force ? "::force" : ""}`, "share");
		applyByKeyGuardAndCache(store, {
			allowZero,
			cache
		});
		dataSource = new ds({
			...sanitizeDsOptions(options),
			store
		});
		markRaw(store);
		markRaw(dataSource);
		const origLoadSingle = dataSource.loadSingle;
		if (typeof origLoadSingle === "function") dataSource.loadSingle = function(prop, value, select) {
			if (!allowZero && isZeroKey(value)) return dxResolve(null);
			return ensureDx(origLoadSingle.call(this, prop, value, select));
		};
		let result;
		if (method !== "GET") {
			if (isFake && Array.isArray(payload.data) && payload.useBatch) {
				const rows = payload.data;
				const keyName = payload.keyName || "Id";
				const preferPut = method === "PUT";
				return {
					data: await Promise.allSettled(rows.map(async (row, i) => {
						const key = pickKeyForRow(row, i, {
							keyName,
							keyValue: payload.keyValue
						});
						if (isInsertKey(key)) {
							const r = await fakeWrite({
								verb: "POST",
								body: stripKeyOnInsert(row, keyName),
								config
							});
							if (r.error) throw r.error;
							return r.data;
						} else {
							const r = await fakeWrite({
								verb: preferPut ? "PUT" : "PATCH",
								body: row,
								key,
								config
							});
							if (r.error) throw r.error;
							return r.data;
						}
					})),
					statusCode: 207,
					error: null,
					dataSource: null
				};
			}
			if (!isFake) {
				const origByKey = store.byKey?.bind(store);
				if (typeof origByKey === "function") store.byKey = (key, extra) => {
					if (!allowZero && isZeroKey(key)) return dxResolve(null);
					return ensureDx(origByKey(key, extra));
				};
				const origLoad = store.load?.bind(store);
				if (typeof origLoad === "function") store.load = (loadOptions) => {
					if (containsZeroInDxFilter(loadOptions?.filter, allowZero, zeroGuardFields)) return dxResolve(loadOptions?.requireTotalCount ? {
						data: [],
						totalCount: 0
					} : []);
					return ensureDx(origLoad(loadOptions));
				};
			}
			if (isFake) {
				if (method === "POST") {
					const r = await fakeWrite({
						verb: "POST",
						body: payload.data,
						config
					});
					return {
						data: r.data,
						statusCode: r.statusCode,
						error: r.error,
						dataSource: null
					};
				}
				if (method === "PUT") {
					const r = await fakeWrite({
						verb: "PUT",
						body: payload.data,
						key: payload.keyValue,
						config
					});
					return {
						data: r.data,
						statusCode: r.statusCode,
						error: r.error,
						dataSource: null
					};
				}
				if (method === "PATCH") {
					const r = await fakeWrite({
						verb: "PATCH",
						body: payload.data,
						key: payload.keyValue,
						config
					});
					return {
						data: r.data,
						statusCode: r.statusCode,
						error: r.error,
						dataSource: null
					};
				}
				if (method === "DELETE") {
					const r = await fakeWrite({
						verb: "DELETE",
						key: payload.keyValue,
						config
					});
					return {
						data: r.data,
						statusCode: r.statusCode,
						error: r.error,
						dataSource: null
					};
				}
			} else {
				if (method === "POST") result = await store.insert(payload.data);
				if (method === "PATCH" || method === "PUT") result = await store.update(payload.keyValue, payload.data);
				if (method === "DELETE") result = await store.remove(payload.keyValue);
				if (source?.OdataService) return {
					data: result.data,
					dataSource: null,
					statusCode: result?.status || (result ? 200 : 500),
					error: null
				};
				return {
					data: result,
					statusCode: 200,
					error: null,
					dataSource: null
				};
			}
		}
		if (method === "GET") {
			if (__capture) {
				if (__capture.load) await dataSource.store().load(__capture.load);
				else await dataSource.load();
				return {
					dataSource: null,
					data: null,
					statusCode: 200,
					error: null
				};
			}
			if (type === "data" || type === "fakedata") {
				const usedToken = readToken();
				try {
					result = await dataSource.load();
				} catch (err) {
					let p = parseDxError(err);
					let failure = err;
					if (type === "data" && p.status === 401) {
						const newToken = await refreshTokenOnce({
							config,
							options: tokenOptions
						});
						if (newToken && newToken !== usedToken) try {
							result = await dataSource.load();
							return {
								dataSource,
								data: result,
								statusCode: 200,
								error: null
							};
						} catch (err2) {
							p = parseDxError(err2);
							failure = err2;
						}
					}
					if (isNotif) isNotif?.({
						type: httpVariant(p.status),
						message: `${p.message}`
					});
					return {
						data: null,
						dataSource,
						statusCode: p.status ?? 500,
						error: {
							message: p.message,
							stack: String(failure?.stack ?? ""),
							response: p.body
						}
					};
				}
			}
			return {
				dataSource,
				data: result,
				statusCode: 200,
				error: null
			};
		}
		return {
			data: result,
			statusCode: 200,
			error: null,
			dataSource: null
		};
	} catch (error) {
		const p = parseDxError(error);
		const status = p.status ?? Number(error?.status) ?? 500;
		if (isNotif) isNotif?.({
			type: httpVariant(p.status),
			message: `${p.message}`
		});
		return {
			data: null,
			statusCode: status,
			error: {
				message: p.message,
				stack: String(error?.stack ?? ""),
				response: p.body
			},
			dataSource: null
		};
	}
};
function createFetcher(base) {
	const build = (option) => {
		const { options: optOverrides, ...rest } = option ?? {};
		return {
			...base,
			...rest,
			url: base.url,
			type: base.type ?? "datasource",
			options: {
				...base.options ?? {},
				...optOverrides ?? {},
				key: base.options?.key ?? "Id"
			}
		};
	};
	return { response(option) {
		return useFetchOData(build(option));
	} };
}
const createUniqueFetcher = async (opt) => {
	const keyField = String(opt.options?.key ?? "Id");
	const api = (params) => useFetchOData({
		...opt,
		url: opt.url,
		type: "data",
		params,
		options: {
			key: keyField,
			paginate: false
		}
	});
	const { data: picks = [] } = await api({
		$apply: `groupby((${opt.unique}), aggregate(${keyField} with max as PickId))`,
		$orderby: `${opt.unique} asc`
	});
	const ids = picks.length > 0 ? (picks ?? []).map((p) => p.PickId).filter(Boolean) : [];
	return await useFetchOData({
		...opt,
		params: {
			...opt.params || {},
			$filter: `${keyField} in (${ids.join(",")})`
		}
	});
};
async function useNormalFetch(url, options, config) {
	let response = null;
	const { notif } = useHelper();
	const isNotif = typeof options?.notif === "boolean" && options.notif === true ? notif : options?.notif;
	try {
		const { token, tokenOptions, prefetch, ...fetchOptions } = options;
		const freshToken = await ensureFreshToken({
			token,
			config,
			tokenOptions
		}) ?? void 0;
		const fullUrl = (options?.baseUrl ?? "") + url;
		const isGet = String(fetchOptions.method ?? "GET").toUpperCase() === "GET" && fetchOptions.body == null;
		const bridge = prefetch !== false && isGet ? getPrefetchBridge() : null;
		if (bridge) {
			if (prefetch) learnPrefetch({
				url: fullUrl,
				headers: options?.headers,
				auth: prefetchAuthFor(freshToken ?? token, config, tokenOptions)
			});
			const hit = bridge.expects("GET", fullUrl) ? await bridge.take("GET", fullUrl) : void 0;
			if (hit) {
				const body = hit.data;
				return {
					data: body?.data,
					statusCode: 200,
					message: body?.message || null,
					all: body
				};
			}
		}
		response = await manageRequest.smartFetch({
			url: options?.baseUrl + url,
			init: {
				...fetchOptions,
				token: freshToken,
				headers: {
					...options?.headers,
					"Content-Type": "application/json"
				}
			},
			tokenOptions,
			config
		});
		if (!response.ok) {
			if (response.status === 401) {
				callUnauth(options?.unauthCall);
				if (options?.expiredBehaviour === "refresh" && !options?.unauthCall) {
					if (typeof window !== "undefined") window.location.reload();
				}
			}
			const raw = await response.text();
			let errorResponse = null;
			try {
				errorResponse = raw === "" ? null : JSON.parse(raw);
			} catch {
				errorResponse = raw;
			}
			const errorReturn = extractErrorMessage(errorResponse, response.statusText || "Terjadi kesalahan!.");
			if (isNotif) isNotif({
				message: errorReturn,
				type: response.status >= 400 && response.status < 500 ? "warning" : "error"
			});
			return {
				message: errorReturn,
				statusCode: response.status,
				data: null,
				all: errorResponse
			};
		} else {
			const raw = await response.text();
			let responseData;
			try {
				responseData = raw === "" ? null : JSON.parse(raw);
			} catch {
				responseData = raw;
			}
			return {
				data: responseData?.data,
				statusCode: response.status,
				message: responseData?.message || null,
				all: responseData
			};
		}
	} catch (error) {
		const sttsCode = Number(response?.status) >= 400 && Number(response?.status) < 500 ? "warning" : "error";
		const msg = extractErrorMessage(error, response?.statusText || "Tejadi kesalahan!.");
		if (isNotif) isNotif({
			message: msg,
			type: sttsCode
		});
		return {
			message: msg,
			statusCode: 500,
			data: null,
			all: null
		};
	}
}
async function tryCatchDatasource({ tryCallback, catchCallback, finallyCallback, notif }) {
	const helper = typeof window !== "undefined" && window.helper || useHelper();
	const isNotif = typeof notif === "boolean" && notif === true ? helper.notif : notif;
	try {
		return await tryCallback();
	} catch (error) {
		const p = parseDxError(error);
		if (isNotif) isNotif({
			type: httpVariant(p.status),
			message: p.message
		});
		if (catchCallback) return await catchCallback(error, p);
		throw error;
	} finally {
		await finallyCallback?.();
	}
}
function normalizeLoadResult(res) {
	return {
		rows: Array.isArray(res) ? res : res?.data ?? [],
		totalCount: Array.isArray(res) ? void 0 : typeof res?.totalCount === "number" ? res.totalCount : void 0
	};
}
async function promisePool(items, worker, concurrency = 4) {
	const results = new Array(items.length);
	let i = 0;
	const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
		while (i < items.length) {
			const idx = i++;
			results[idx] = await worker(items[idx], idx);
		}
	});
	await Promise.all(runners);
	return results;
}
async function loadChuckStore({ datasource, options, limit = 100, maxRows = Infinity, concurrency = 1 }) {
	const store = datasource.store();
	const { rows: firstRows, totalCount } = normalizeLoadResult(await store.load({
		...options,
		take: limit,
		skip: 0,
		requireTotalCount: true
	}));
	if (firstRows.length === 0) return [];
	if (firstRows.length < limit) return firstRows.slice(0, maxRows);
	if (firstRows.length >= maxRows) return firstRows.slice(0, maxRows);
	const outMax = Math.min(maxRows, Number.isFinite(totalCount) ? totalCount : Infinity);
	if (!Number.isFinite(totalCount) || concurrency <= 1) {
		const out = [...firstRows];
		let skip = firstRows.length;
		while (out.length < outMax) {
			const take = Math.min(limit, outMax - out.length);
			const { rows } = normalizeLoadResult(await store.load({
				...options,
				take,
				skip
			}));
			out.push(...rows);
			if (rows.length < take) break;
			if (rows.length === 0) break;
			skip += rows.length;
		}
		return out;
	}
	const total = Math.min(totalCount, outMax);
	const totalPages = Math.ceil(total / limit);
	return [firstRows, ...await promisePool(Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => i + 1), async (pageNo) => {
		const skip = pageNo * limit;
		const take = Math.min(limit, total - skip);
		if (take <= 0) return [];
		return normalizeLoadResult(await store.load({
			...options,
			take,
			skip
		})).rows;
	}, concurrency)].flat();
}
async function promiseWrapper({ task, type = "allSettled" }) {
	const entries = Object.entries(task);
	if (type === "all") {
		const pairs = await Promise.all(entries.map(async ([key, p]) => [key, await p]));
		return {
			values: Object.fromEntries(pairs),
			errors: {}
		};
	}
	const results = await Promise.all(entries.map(([key, p]) => p.then((value) => ({
		key,
		ok: true,
		value
	})).catch((reason) => ({
		key,
		ok: false,
		reason
	}))));
	const values = {};
	const errors = {};
	for (const r of results) if (r.ok) values[r.key] = r.value;
	else errors[r.key] = r.reason;
	return {
		values,
		errors
	};
}

//#endregion
//#region \0/plugin-vue/export-helper
var export_helper_default = (sfc, props) => {
	const target = sfc.__vccOpts || sfc;
	for (const [key, val] of props) target[key] = val;
	return target;
};

//#endregion
//#region src/core/components/Notif.vue
const _sfc_main$1 = /*@__PURE__*/ defineComponent({
	__name: "Notif",
	props: { item: {
		type: Object,
		required: true
	} },
	setup(__props, { expose: __expose }) {
		__expose();
		const router = useRouter();
		const props = __props;
		const isPromise = computed(() => props.item.type === "promise");
		const cardStyle = computed(() => ({
			background: "#ffffff",
			padding: "0.75rem",
			boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
			borderRadius: "0.25rem",
			width: "21.25rem",
			border: isPromise.value ? "1px solid #d1d5db" : "0",
			boxSizing: "border-box"
		}));
		const buttons = computed(() => props.item.props?.buttons ?? []);
		const hasSingleButton = computed(() => buttons.value.length === 1);
		const btnLabel = (btn) => btn?.text ?? btn?.label ?? "";
		const onClickBtn = async (btn) => {
			if (!btn?.to) {
				props.item.clear();
				return;
			}
			await router.push(String(btn.to));
			props.item.clear();
		};
		const __returned__ = {
			router,
			props,
			isPromise,
			cardStyle,
			buttons,
			hasSingleButton,
			btnLabel,
			onClickBtn
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
const _hoisted_1 = { style: {
	"display": "flex",
	"flex-direction": "row",
	"gap": "0.5rem",
	"align-items": "flex-start"
} };
const _hoisted_2 = {
	key: 0,
	viewBox: "0 0 24 24",
	width: "24",
	height: "24",
	style: {
		flex: "none",
		color: "#16a34a"
	},
	fill: "currentColor",
	"aria-hidden": "true"
};
const _hoisted_3 = {
	key: 1,
	viewBox: "0 0 24 24",
	width: "24",
	height: "24",
	style: {
		flex: "none",
		color: "#dc2626"
	},
	fill: "currentColor",
	"aria-hidden": "true"
};
const _hoisted_4 = {
	key: 2,
	viewBox: "0 0 24 24",
	width: "24",
	height: "24",
	style: {
		flex: "none",
		color: "#2563eb"
	},
	fill: "currentColor",
	"aria-hidden": "true"
};
const _hoisted_5 = {
	key: 3,
	viewBox: "0 0 24 24",
	width: "24",
	height: "24",
	style: {
		flex: "none",
		color: "#ca8a04"
	},
	fill: "currentColor",
	"aria-hidden": "true"
};
const _hoisted_6 = {
	key: 4,
	viewBox: "0 0 24 24",
	width: "24",
	height: "24",
	style: {
		flex: "none",
		color: "#4f46e5"
	},
	fill: "currentColor",
	"aria-hidden": "true"
};
const _hoisted_7 = ["aria-live", "role"];
const _hoisted_8 = { style: {
	"display": "flex",
	"flex-direction": "row",
	"justify-content": "flex-end",
	"gap": "0.75rem",
	"margin-top": "0.75rem"
} };
const _hoisted_9 = ["onClick"];
function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createElementBlock("div", { style: normalizeStyle($setup.cardStyle) }, [createElementVNode("div", _hoisted_1, [
		$props.item.type === "success" ? (openBlock(), createElementBlock("svg", _hoisted_2, [..._cache[1] || (_cache[1] = [createElementVNode("path", { d: "M20 12a8 8 0 0 1-8 8a8 8 0 0 1-8-8a8 8 0 0 1 8-8c.76 0 1.5.11 2.2.31l1.57-1.57A9.8 9.8 0 0 0 12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10M7.91 10.08L6.5 11.5L11 16L21 6l-1.41-1.42L11 13.17z" }, null, -1)])])) : createCommentVNode("v-if", true),
		$props.item.type === "error" ? (openBlock(), createElementBlock("svg", _hoisted_3, [..._cache[2] || (_cache[2] = [createElementVNode("path", { d: "M12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8m0-18C6.47 2 2 6.47 2 12s4.47 10 10 10s10-4.47 10-10S17.53 2 12 2m2.59 6L12 10.59L9.41 8L8 9.41L10.59 12L8 14.59L9.41 16L12 13.41L14.59 16L16 14.59L13.41 12L16 9.41z" }, null, -1)])])) : createCommentVNode("v-if", true),
		$props.item.type === "info" ? (openBlock(), createElementBlock("svg", _hoisted_4, [..._cache[3] || (_cache[3] = [createElementVNode("path", { d: "M11 7v2h2V7zm3 10v-2h-1v-4h-3v2h1v2h-1v2zm8-5c0 5.5-4.5 10-10 10S2 17.5 2 12S6.5 2 12 2s10 4.5 10 10m-2 0c0-4.42-3.58-8-8-8s-8 3.58-8 8s3.58 8 8 8s8-3.58 8-8" }, null, -1)])])) : createCommentVNode("v-if", true),
		$props.item.type === "warning" ? (openBlock(), createElementBlock("svg", _hoisted_5, [..._cache[4] || (_cache[4] = [createElementVNode("path", { d: "M11 15h2v2h-2zm0-8h2v6h-2zm1-5C6.47 2 2 6.5 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m0 18a8 8 0 0 1-8-8a8 8 0 0 1 8-8a8 8 0 0 1 8 8a8 8 0 0 1-8 8" }, null, -1)])])) : createCommentVNode("v-if", true),
		createCommentVNode(" promise spinner: inline SVG SMIL rotation — no CSS / no <style> / no build config "),
		$props.item.type === "promise" ? (openBlock(), createElementBlock("svg", _hoisted_6, [..._cache[5] || (_cache[5] = [createElementVNode("path", { d: "M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8" }, [createElementVNode("animateTransform", {
			attributeName: "transform",
			type: "rotate",
			from: "0 12 12",
			to: "360 12 12",
			dur: "0.8s",
			repeatCount: "indefinite"
		})], -1)])])) : createCommentVNode("v-if", true),
		createElementVNode("p", {
			style: {
				"font-size": "0.875rem",
				"margin": "0"
			},
			"aria-live": $props.item.ariaLive,
			role: $props.item.ariaRole
		}, toDisplayString($props.item.message), 9, _hoisted_7)
	]), createElementVNode("div", _hoisted_8, [(openBlock(true), createElementBlock(Fragment, null, renderList($setup.buttons, (btn, idx) => {
		return openBlock(), createElementBlock("button", {
			key: idx,
			type: "button",
			onClick: ($event) => $setup.onClickBtn(btn),
			style: normalizeStyle({
				textTransform: "capitalize",
				padding: "0.375rem 0.75rem",
				borderRadius: "0.25rem",
				border: "1px solid #d1d5db",
				background: btn.color ?? "transparent",
				color: btn.color ? "#ffffff" : "#374151",
				cursor: "pointer",
				font: "inherit",
				fontSize: "0.875rem"
			})
		}, toDisplayString($setup.btnLabel(btn)), 13, _hoisted_9);
	}), 128)), $setup.hasSingleButton ? (openBlock(), createElementBlock("button", {
		key: 0,
		type: "button",
		onClick: _cache[0] || (_cache[0] = ($event) => $props.item.clear()),
		style: {
			textTransform: "capitalize",
			padding: "0.375rem 0.75rem",
			borderRadius: "0.25rem",
			border: "1px solid #ef9a9a",
			background: "rgba(229,57,53,0.12)",
			color: "#c62828",
			cursor: "pointer",
			font: "inherit",
			fontSize: "0.875rem"
		}
	}, " Batal ")) : createCommentVNode("v-if", true)])], 4);
}
var Notif_default = /*#__PURE__*/ export_helper_default(_sfc_main$1, [["render", _sfc_render$1], ["__file", "C:\\Users\\VCT-DEV\\Desktop\\libs\\packages\\utility\\src\\core\\components\\Notif.vue"]]);

//#endregion
//#region src/composables/use-mono-utility.ts
/**
* The shared helper surface — validation (Yup), notifications, list/DataSource
* add-update-remove, OData filters, JSON parsing — combined into `@mono-lit/utility` so
* apps import from one place:
*
* ```ts
* import { useMonoUtility } from '@mono-lit/utility/runtime'
* const { validateAllSchema, notif, replacerData } = useMonoUtility()
* ```
*
* Same surface as the core `useUtils()` (src/core); `useMonoUtility` is the public name.
*/
const useMonoUtility = () => useHelper();

//#endregion
//#region src/components/MonoNotivue.vue
const _sfc_main = /*@__PURE__*/ defineComponent({
	__name: "MonoNotivue",
	setup(__props, { expose: __expose }) {
		__expose();
		/**
		* Drop-in notification renderer for a template's `App.vue` — replaces the
		* hand-wired `<Notivue v-slot>…</Notivue>` block that every app repeated. Action
		* notifications (`props.isAction`) render the custom card with buttons; everything
		* else uses notivue's default `<Notifications>` with the pastel theme.
		*
		*   <template><main><MonoNotivue /><RouterView /></main></template>
		*
		* The `createNotivue(...)` plugin registration and `notivue/*.css` imports still
		* live once in the app's `main.ts`.
		*/
		const __returned__ = {
			get Notivue() {
				return Notivue;
			},
			get Notifications() {
				return Notifications;
			},
			get pastelTheme() {
				return pastelTheme;
			},
			get MonoNotifAction() {
				return Notif_default;
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createBlock($setup["Notivue"], null, {
		default: withCtx((item) => [item.props.isAction ? (openBlock(), createBlock($setup["MonoNotifAction"], {
			key: 0,
			item
		}, null, 8, ["item"])) : (openBlock(), createBlock($setup["Notifications"], {
			key: 1,
			item,
			theme: $setup.pastelTheme
		}, null, 8, ["item", "theme"]))]),
		_: 1
	});
}
var MonoNotivue_default = /*#__PURE__*/ export_helper_default(_sfc_main, [["render", _sfc_render], ["__file", "C:\\Users\\VCT-DEV\\Desktop\\libs\\packages\\utility\\src\\components\\MonoNotivue.vue"]]);

//#endregion
export { createMono as C, monoState as D, monoEnv as E, monoStatePatch as O, useState as S, monoConfig as T, monoProvide as _, createUniqueFetcher as a, monoUseState as b, tryCatchDatasource as c, PREFETCH_SUPPORT as d, getPrefetchBridge as f, monoInject as g, createStaticDatasource as h, createFetcher as i, monoStateReset as k, useFetchOData as l, useHelper as m, useMonoUtility as n, loadChuckStore as o, setPrefetchBridge as p, Notif_default as r, promiseWrapper as s, MonoNotivue_default as t, useNormalFetch as u, defineLayout as v, initMono as w, nuxtStateKeys as x, clearNuxtState as y };