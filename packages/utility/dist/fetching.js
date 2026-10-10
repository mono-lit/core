import { D as monoState, O as monoStatePatch, T as monoConfig, a as createUniqueFetcher, c as tryCatchDatasource, d as PREFETCH_SUPPORT, f as getPrefetchBridge, h as createStaticDatasource, i as createFetcher, l as useFetchOData, o as loadChuckStore, p as setPrefetchBridge, s as promiseWrapper, u as useNormalFetch } from "./runtime-DU2v1jQa.js";
import { t as monoCookie, u as decodeJwt } from "./universal-SQvYjTsQ.js";
import { i as matchMockRoute } from "./generate-CJ7MtcDd.js";
import { c as executeQuery, f as parseQuery, l as parseExpand, n as monoMockDb, r as resetMonoMockDb } from "./mock-db-5mJTObSC.js";
import * as monoDevextremeModule from "@mono-lit/devextreme";
import { CustomStore, DataSource, ODataStore } from "@mono-lit/devextreme";

//#region pkg/mock-db/devextreme.ts
/** DevExtreme filter expr -> OData $filter text. */
function filterToOData(filter) {
	if (!Array.isArray(filter) || !filter.length) return void 0;
	if (filter.length === 1 && typeof filter[0] === "string") return filter[0];
	if (Array.isArray(filter[0])) {
		const parts = [];
		for (const item of filter) if (Array.isArray(item)) {
			const inner = filterToOData(item);
			if (inner) parts.push(`(${inner})`);
		} else if (typeof item === "string") parts.push(item.toLowerCase() === "or" ? "or" : "and");
		return parts.join(" ") || void 0;
	}
	if (filter[0] === "!" && Array.isArray(filter[1])) {
		const inner = filterToOData(filter[1]);
		return inner ? `not (${inner})` : void 0;
	}
	const [field, operator, value] = filter;
	if (typeof field !== "string") return void 0;
	const literal = typeof value === "number" || typeof value === "boolean" ? String(value) : `'${String(value ?? "").replace(/'/g, "''")}'`;
	switch (String(operator)) {
		case "=": return `${field} eq ${literal}`;
		case "<>": return `${field} ne ${literal}`;
		case ">": return `${field} gt ${literal}`;
		case ">=": return `${field} ge ${literal}`;
		case "<": return `${field} lt ${literal}`;
		case "<=": return `${field} le ${literal}`;
		case "contains": return `contains(${field},${literal})`;
		case "notcontains": return `not contains(${field},${literal})`;
		case "startswith": return `startswith(${field},${literal})`;
		case "endswith": return `endswith(${field},${literal})`;
		default: return `${field} eq ${literal}`;
	}
}
/** DevExtreme `sort` -> our orderby rules. */
function sortToOrderBy(sort) {
	if (!sort) return void 0;
	return (Array.isArray(sort) ? sort : [sort]).map((rule) => {
		if (typeof rule === "string") return {
			field: rule,
			desc: false
		};
		if (rule?.selector) return {
			field: String(rule.selector),
			desc: Boolean(rule.desc)
		};
		return null;
	}).filter(Boolean);
}
/** Case-insensitive field read, matching the rest of the engine. */
function readField(row, name) {
	if (name in row) return row[name];
	const lower = String(name).toLowerCase();
	const hit = Object.keys(row).find((key) => key.toLowerCase() === lower);
	return hit ? row[hit] : void 0;
}
/** DevExtreme `group` loadOption -> selectors. Accepts string | {selector} | array. */
function groupSelectors(group) {
	if (!group) return [];
	return (Array.isArray(group) ? group : [group]).map((rule) => {
		if (typeof rule === "string") return {
			selector: rule,
			desc: false
		};
		if (rule?.selector) return {
			selector: String(rule.selector),
			desc: Boolean(rule.desc)
		};
		return null;
	}).filter(Boolean);
}
/** One summary value over a bucket of rows. */
function computeSummary(rows, spec) {
	const type = String(spec.summaryType ?? "count").toLowerCase();
	if (type === "count") return rows.length;
	const values = rows.map((row) => readField(row, String(spec.selector))).filter((value) => value !== void 0 && value !== null).map(Number).filter((value) => !Number.isNaN(value));
	if (!values.length) return type === "sum" ? 0 : null;
	switch (type) {
		case "sum": return values.reduce((total, value) => total + value, 0);
		case "avg": return values.reduce((total, value) => total + value, 0) / values.length;
		case "min": return Math.min(...values);
		case "max": return Math.max(...values);
		default: return null;
	}
}
/**
* Build DevExtreme's grouped result: `[{ key, items, count, summary }]`.
*
* A grid asks for grouping through `loadOptions.group`, NOT through OData `$apply`,
* and it expects this exact shape back. Returning a flat array instead makes the
* group panel render nothing while the rows still look fine — silently wrong.
*
* `groupInterval`/`isExpanded: false` collapse to `items: null` + a count, which is
* how the grid lazy-loads group contents.
*/
function groupRows(rows, selectors, options = {}) {
	if (!selectors.length) return [];
	const [current, ...rest] = selectors;
	const buckets = /* @__PURE__ */ new Map();
	for (const row of rows) {
		const key = readField(row, current.selector) ?? null;
		const id = JSON.stringify(key);
		const bucket = buckets.get(id);
		if (bucket) bucket.items.push(row);
		else buckets.set(id, {
			key,
			items: [row]
		});
	}
	const groups = [...buckets.values()].map(({ key, items }) => {
		const summary = options.groupSummary?.length ? options.groupSummary.map((spec) => computeSummary(items, spec)) : void 0;
		return {
			key,
			items: rest.length ? groupRows(items, rest, options) : options.expanded === false ? null : items,
			count: items.length,
			...summary ? { summary } : {}
		};
	});
	groups.sort((a, b) => {
		const left = a.key;
		const right = b.key;
		if (left === right) return 0;
		if (left == null) return -1;
		if (right == null) return 1;
		const cmp = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right));
		return current.desc ? -cmp : cmp;
	});
	return groups;
}
/** Translate DevExtreme loadOptions into our query shape. */
function loadOptionsToQuery(loadOptions) {
	const query = {};
	const filter = filterToOData(loadOptions?.filter);
	if (filter) query.filter = filter;
	const orderby = sortToOrderBy(loadOptions?.sort);
	if (orderby?.length) query.orderby = orderby;
	if (typeof loadOptions?.skip === "number") query.skip = loadOptions.skip;
	if (typeof loadOptions?.take === "number") query.top = loadOptions.take;
	if (query.top == null && loadOptions?.paginate !== false && typeof loadOptions?.pageSize === "number") query.top = loadOptions.pageSize;
	if (Array.isArray(loadOptions?.select) && loadOptions.select.length) query.select = loadOptions.select.map(String);
	if (loadOptions?.expand != null && (!Array.isArray(loadOptions.expand) || loadOptions.expand.length)) query.expand = parseExpand(loadOptions.expand);
	if (loadOptions?.requireTotalCount) query.count = true;
	return query;
}
/**
* A DevExtreme `DataSource` over a `CustomStore` that answers from IndexedDB
* through the same OData engine the fetch path uses — so a grid gets real
* server-style paging/filtering/sorting instead of a silent full table.
*/
function createMockDataSource({ mock, baseUrl, entity, DataSource, CustomStore, options }) {
	const readAll = async () => {
		const payload = (await mock.request({
			url: `${baseUrl}/${entity.name}`,
			method: "GET",
			params: {}
		})).data;
		return Array.isArray(payload?.value) ? payload.value : payload ?? [];
	};
	const store = new CustomStore({
		key: entity.primaryKey,
		loadMode: "processed",
		async load(loadOptions) {
			const query = loadOptionsToQuery(loadOptions);
			const rows = await readAll();
			const schema = mock.schemas.find((candidate) => candidate.baseUrl === baseUrl);
			const related = {};
			if (query.expand?.length || query.filter) {
				const seen = /* @__PURE__ */ new Set();
				const queue = [entity.name];
				while (queue.length) {
					const current = queue.shift();
					if (seen.has(current)) continue;
					seen.add(current);
					const currentEntity = schema?.entities[current];
					if (!currentEntity) continue;
					for (const field of currentEntity.relations) {
						const target = field.relation.targetEntity;
						if (!related[target]) {
							const payload = (await mock.request({
								url: `${baseUrl}/${target}`,
								method: "GET",
								params: {}
							})).data;
							related[target] = Array.isArray(payload?.value) ? payload.value : payload ?? [];
						}
						queue.push(target);
					}
				}
			}
			const result = executeQuery(rows, query, {
				entity,
				readEntity: (name) => related[name] ?? [],
				entityOf: (name) => schema?.entities[name]
			});
			const selectors = groupSelectors(loadOptions?.group);
			if (selectors.length) {
				const groups = groupRows(result.rows, selectors, {
					groupSummary: loadOptions?.groupSummary,
					expanded: loadOptions?.group?.[0]?.isExpanded
				});
				if (loadOptions?.requireTotalCount || loadOptions?.requireGroupCount) return {
					data: groups,
					totalCount: result.total,
					groupCount: groups.length,
					...loadOptions?.totalSummary?.length ? { summary: loadOptions.totalSummary.map((spec) => computeSummary(result.rows, spec)) } : {}
				};
				return groups;
			}
			if (loadOptions?.requireTotalCount) return {
				data: result.rows,
				totalCount: result.total,
				...loadOptions?.totalSummary?.length ? { summary: loadOptions.totalSummary.map((spec) => computeSummary(result.rows, spec)) } : {}
			};
			return result.rows;
		},
		async byKey(key) {
			return (await mock.request({
				url: `${baseUrl}/${entity.name}(${key})`,
				method: "GET"
			})).data;
		},
		async insert(values) {
			const response = await mock.request({
				url: `${baseUrl}/${entity.name}`,
				method: "POST",
				payload: values
			});
			if (response.error) throw new Error(response.error.message);
			return response.data;
		},
		async update(key, values) {
			const response = await mock.request({
				url: `${baseUrl}/${entity.name}(${key})`,
				method: "PUT",
				payload: values
			});
			if (response.error) throw new Error(response.error.message);
			return response.data;
		},
		async remove(key) {
			const response = await mock.request({
				url: `${baseUrl}/${entity.name}(${key})`,
				method: "DELETE"
			});
			if (response.error) throw new Error(response.error.message);
		}
	});
	const { key: _key, ...dataSourceOptions } = options ?? {};
	return new DataSource({
		...dataSourceOptions,
		store,
		key: entity.primaryKey
	});
}

//#endregion
//#region pkg/wrapper-fetching.ts
function tanstackRunner() {
	try {
		const runner = Reflect.get(monoDevextremeModule, "tanstackRun");
		return typeof runner === "function" ? runner : void 0;
	} catch {
		return;
	}
}
/** A non-2xx `fetchNormal` result, thrown so TanStack neither caches it nor skips its retry policy. */
var FailedFetchResult = class {
	result;
	constructor(result) {
		this.result = result;
	}
	get statusCode() {
		return this.result.statusCode;
	}
};
let runtimeOptions = {};
const wrapperDefaults = {
	notif: false,
	selfProxy: "",
	method: "GET",
	type: "datasource",
	allowZero: false,
	cache: false
};
function configureFetching(options = {}) {
	runtimeOptions = {
		...runtimeOptions,
		...options
	};
}
function resetFetchingConfig() {
	runtimeOptions = {};
}
function getFetchingConfig() {
	const config = monoConfig();
	if (!config) throw new Error("[@mono-lit/utility/fetching] mono config is missing. Make sure you call app.use(createMono(monoConfig)) before using fetching helpers.");
	if (!config.fetching) throw new Error("[@mono-lit/utility/fetching] config.fetching is missing in mono.config.ts.");
	return config.fetching;
}
/**
* Map the shared `fetching.source` ctors to the capitalized shape the core fetch layer
* expects. Never throws — any missing ctor is left `undefined` and the core fetch layer
* fills it from its built-in DevExtreme classes.
*/
function mapSharedSource(shared) {
	return {
		DataSource: shared?.dataSource || DataSource,
		ODataStore: shared?.oDataStore || ODataStore,
		CustomStore: shared?.customStore || CustomStore
	};
}
/**
* Resolve the source for a named odata entry: the shared `fetching.source`
* ctors plus this entry's own `oDataService` (which differs per API).
*/
function mapEntrySource(entry, shared) {
	return {
		...mapSharedSource(shared),
		OdataService: entry.oDataService
	};
}
/**
* Merge a base source with an override, letting `override` win — but only on
* its *defined* keys, so a partial inline source can't clobber a shared ctor
* with `undefined`. Returns whichever side is present when the other is absent.
*/
function mergeSource(base, override) {
	if (!base) return override;
	if (!override) return base;
	const out = { ...base };
	for (const key of Object.keys(override)) if (override[key] !== void 0) out[key] = override[key];
	return out;
}
/**
* The shared OData source ctors: the `@mono-lit/devextreme` defaults baked into
* `mapSharedSource`, with any `fetching.source` overrides on top. Tolerant of a
* missing/uninitialized config (`monoConfig()` returns `undefined` → pure
* defaults), so fully-manual (baseUrl-only) calls still get real constructors.
*
* Never returns `undefined`: the core fetch layer does NOT fall back to its own DevExtreme
* classes (it `import type`s them and calls `new source.ODataStore(...)` with no
* fallback), so a fully-absent source would crash with "ods is not a constructor".
*/
function getSharedSource() {
	return mapSharedSource(monoConfig()?.fetching?.source);
}
/**
* True for a url that is effectively missing. Guards against the common
* `url: String(import.meta.env.SOME_VAR)` pattern: when the env var is undefined
* at the moment Vite starts, `String(undefined)` yields the *truthy* literal
* `"undefined"`, which would otherwise sail past a plain `!entry.url` check and
* make the fetcher silently request `undefined/<path>` with no error.
*/
function isMissingUrl(url) {
	if (!url) return true;
	const trimmed = String(url).trim();
	return trimmed === "" || trimmed === "undefined" || trimmed === "null";
}
/**
* The page-wide mock, or null when the app declares no `mockIndexedDB`.
* Cached inside `monoMockDb()`, so this is cheap to call per request.
*
* `monoConfig()` returns a DEEPLY READONLY view of the reactive mono config,
* so `schema[...].seed` arrives as `readonly T[]` and will not assign to the
* mutable engine types. Widen it here instead of threading `readonly` through the
* whole mock-db surface: nothing downstream mutates the config — `generateSeed`
* copies every seed row (`entity.seed.map(row => ({ ...row }))`) precisely so the
* config object can never be written through.
*/
function getMockDb() {
	const config = monoConfig()?.mockIndexedDB;
	return monoMockDb(config);
}
/**
* Resolve a call to a mock route, if it is one.
*
* Checks BOTH the entry's base url and the call's own `url`, because either can
* carry the schema's base-url (`fetching.api.x.url = 'my-mock'` + `url: '/users'`,
* or a plain `url: '/my-mock/users'`).
*
* Deliberately tolerant of a missing/`"undefined"` entry url: an app running
* purely on the mock has no real backend to point at, so this must resolve
* BEFORE `resolveApiEntry`'s `isMissingUrl` throws.
*/
function resolveMockRoute(configBaseUrl, url) {
	const mock = getMockDb();
	if (!mock) return null;
	const entryUrl = (() => {
		if (!configBaseUrl) return "";
		const entry = monoConfig()?.fetching?.api?.[configBaseUrl];
		return typeof entry?.url === "string" ? entry.url : "";
	})();
	for (const candidate of [
		joinUrl(entryUrl, url),
		url,
		entryUrl
	]) {
		if (!candidate) continue;
		const route = matchMockRoute(mock.schemas, candidate);
		if (route) return {
			mock,
			route,
			url: candidate
		};
	}
	return null;
}
function joinUrl(base, path) {
	const left = String(base ?? "").replace(/\/+$/, "");
	const right = String(path ?? "").replace(/^\/+/, "");
	if (!left) return right;
	if (!right) return left;
	return `${left}/${right}`;
}
/**
* Serve a fetch call from IndexedDB, shaped exactly like the core fetch layer result so
* callers cannot tell the difference.
*
* `datasource`/`fakedatasource` hand back a real DevExtreme DataSource (over a
* CustomStore), so grids keep their server-style paging/filtering.
*/
async function serveFromMock(hit, call) {
	const { mock, route, url } = hit;
	const wantsDataSource = String(call.type ?? "").toLowerCase().includes("datasource");
	/**
	* The query, from BOTH sources the caller can use:
	*  - `options` — the core's DataSourceOptions (select/filter/sort/expand/pageSize).
	*    the core applies these even for `type: 'data'` (it builds a DataSource from them
	*    and `.load()`s it), so ignoring them here would make the mock return every
	*    row while production returned a filtered set.
	*  - `params`  — raw `$`-params. Explicit, so they win on conflict.
	*/
	const query = {
		...call.options ? loadOptionsToQuery(call.options) : {},
		...call.params ? parseQuery(call.params) : {}
	};
	if (wantsDataSource) {
		const shared = getSharedSource();
		const dataSource = createMockDataSource({
			mock,
			baseUrl: route.schema.baseUrl,
			entity: route.entity,
			DataSource: shared.DataSource,
			CustomStore: shared.CustomStore,
			options: call.options
		});
		const method = String(call.method ?? "GET").toUpperCase();
		if (method !== "GET") {
			const response = await mock.request({
				url,
				method,
				query,
				key: call.payload?.keyValue,
				payload: call.payload?.data ?? call.payload
			});
			return {
				data: response.data,
				dataSource,
				statusCode: response.statusCode,
				error: response.error
			};
		}
		return {
			data: null,
			dataSource,
			statusCode: 200,
			error: null
		};
	}
	const response = await mock.request({
		url,
		method: call.method,
		query,
		key: call.payload?.keyValue,
		payload: call.payload?.data ?? call.payload
	});
	const payload = response.data;
	return {
		data: payload && Array.isArray(payload.value) ? payload.value : payload,
		dataSource: null,
		statusCode: response.statusCode,
		error: response.error
	};
}
/**
* Look up a named entry in `fetching.api` and resolve its url (+ source for odata).
*/
function resolveApiEntry(name) {
	const fetching = getFetchingConfig();
	const entry = fetching.api?.[name];
	if (!entry) throw new Error(`[@mono-lit/utility/fetching] fetching.api["${name}"] is not defined in mono.config.ts.`);
	if (isMissingUrl(entry.url)) throw new Error(`[@mono-lit/utility/fetching] fetching.api["${name}"].url is missing (got ${JSON.stringify(entry.url)}). The backing env var was likely undefined when Vite started — check that mono-env loaded the right .env file (including any synced under .mono/apps/) and restart the dev server.`);
	return {
		type: entry.type,
		url: entry.url,
		source: entry.type === "odata" ? mapEntrySource(entry, fetching.source) : void 0
	};
}
function getRestBaseUrl(configBaseUrl, explicitBaseUrl) {
	const url = (configBaseUrl ? resolveApiEntry(configBaseUrl).url : "") || explicitBaseUrl || runtimeOptions.restBaseUrl;
	if (!url) throw new Error("[@mono-lit/utility/fetching] no base url. Pass `configBaseUrl: \"<entryName>\"` or `baseUrl`.");
	return url;
}
function getODataBaseUrl(configBaseUrl, explicitBaseUrl) {
	const url = (configBaseUrl ? resolveApiEntry(configBaseUrl).url : "") || explicitBaseUrl || runtimeOptions.odataBaseUrl;
	if (!url) throw new Error("[@mono-lit/utility/fetching] no odata base url. Pass `configBaseUrl: \"<entryName>\"` or `baseUrl`.");
	return url;
}
/**
* Resolve the OData source ctors. Never throws — when nothing is configured it
* returns `undefined` and the core fetch layer falls back to its built-in DevExtreme
* classes.
*
* With `configBaseUrl`, the named entry's resolved source wins (already the
* shared `fetching.source` ctors merged with that entry's `oDataService`).
* Without it, the shared `fetching.source` is the base, with any inline
* per-call `source` overriding it per defined field.
*/
function getODataSource(configBaseUrl, inlineSource) {
	if (configBaseUrl) return resolveApiEntry(configBaseUrl).source;
	return mergeSource(getSharedSource(), inlineSource);
}
/** The `split` flag a cookie declares in the top-level `cookie[]` array. */
function cookieSplit(name) {
	if (!name) return false;
	return Boolean(monoConfig()?.cookie?.find((c) => c.name === name)?.split);
}
/**
* Read a token cookie.
*
* The LIVE cookie wins over the hydrated state, and state is patched when they differ.
* That order is load-bearing: a token refresh writes the new value straight to
* `document.cookie` and touches nothing else. Reading the hydrated state first — which
* is what this used to do — meant that after the very first refresh we kept sending the
* OLD token forever, so the refresh "worked" once and then everything 401'd.
*
* State remains the fallback for SSR, where `monoCookie()` resolves from the h3 event.
*/
function readCookieValue(name) {
	const state = monoState();
	try {
		const live = monoCookie?.().get(name, cookieSplit(name)) ?? void 0;
		if (live) {
			if (state.cookie?.[name] !== live) monoStatePatch({ cookie: { [name]: live } });
			return live;
		}
	} catch {}
	return state.cookie?.[name];
}
/**
* Which cookie goes on which request.
*
* The object form of `use` names cookies directly. The legacy string form
* (`'token'` / `'tokenRefresh'`) selects between the deprecated `auth.token` /
* `auth.tokenRefresh` names, and still works — the hosts continue to use it, and a
* remote's `auth` deep-merges onto the host's, so both shapes can appear at once.
*/
function resolveAuthCookies() {
	const auth = monoConfig()?.fetching?.auth;
	if (!auth) return {};
	const use = auth.use;
	if (use && typeof use === "object") return {
		apiCookie: use.apiRequest ?? auth.tokenRefresh,
		refreshCookie: use.refreshTokenRequest ?? auth.token
	};
	return {
		apiCookie: use === "token" ? auth.token : auth.tokenRefresh ?? auth.token,
		refreshCookie: auth.token
	};
}
/**
* The core's `ConfigType`, built from our cookie names.
*
* The mapping looks inverted. It is not — the core hardcodes both sides:
*   - it sends `jwtRefreshName` on ordinary API requests   (getRequestToken)
*   - it sends `jwtName` as the Bearer ON the refresh call (refetchRefreshToken)
*
* So `use.apiRequest` -> `jwtRefreshName`, and `use.refreshTokenRequest` -> `jwtName`.
* Please don't "fix" this.
*/
function getMonoTokenConfig() {
	const { apiCookie, refreshCookie } = resolveAuthCookies();
	if (!apiCookie && !refreshCookie) return void 0;
	return {
		jwtName: refreshCookie ?? "",
		jwtRefreshName: apiCookie ?? ""
	};
}
/**
* The refresh request, in the shape the core and `src/token` expect (`MonoFetchCookieOptions`).
*
* Returns `undefined` when the app declares no `requestRefreshTokenRequest`, which
* leaves the core's refresh machinery dormant — the behaviour mono had before this existed.
*/
function getRefreshRequestOptions(configBaseUrl) {
	const refresh = (monoConfig()?.fetching?.auth)?.requestRefreshTokenRequest;
	if (!refresh?.fetchParams?.url) return void 0;
	const { apiCookie } = resolveAuthCookies();
	const name = refresh.name ?? apiCookie;
	if (!refresh.path?.milis && !refresh.path?.days) console.warn("[@mono-lit/utility/fetching] auth.requestRefreshTokenRequest.path has neither `milis` nor `days`. That is the cookie lifetime — without it the refreshed token is never stored, and the refresh will appear to succeed while changing nothing.");
	const options = refresh.fetchParams.options ?? {};
	return {
		name,
		path: refresh.path,
		splitCookie: refresh.splitCookie ?? cookieSplit(name),
		fetchParams: {
			url: refresh.fetchParams.url,
			options: {
				...options,
				baseUrl: options.baseUrl ?? refreshBaseUrl(configBaseUrl)
			}
		}
	};
}
/**
* Where `/Auth/RefreshToken` lives when the app doesn't say.
*
* A refresh endpoint is a REST route, so the base of the call that TRIGGERED the refresh
* is the wrong default whenever that call was OData: it would POST the refresh at the
* `/odata` root and 404 on every attempt, with a config that looks entirely reasonable.
* Prefer a `restful` entry — the triggering one if it is REST, else the first declared.
*/
function refreshBaseUrl(configBaseUrl) {
	const api = monoConfig()?.fetching?.api ?? {};
	const own = configBaseUrl ? api[configBaseUrl] : void 0;
	if (own?.type === "restful" && own.url) return own.url;
	return Object.values(api).find((e) => e?.type === "restful" && e?.url)?.url ?? runtimeOptions.restBaseUrl;
}
/**
* Everything the core needs to refresh a token on its own: the cookie names, the refresh
* request, and what to do when it can't be saved. Spread into every core call.
*/
function authArgs(configBaseUrl) {
	const auth = monoConfig()?.fetching?.auth;
	return {
		config: getMonoTokenConfig(),
		tokenOptions: getRefreshRequestOptions(configBaseUrl),
		expiredBehaviour: auth?.expiredBehaviour,
		unauthCall: runtimeOptions.unauthCall
	};
}
/**
* The token that goes on this call.
*
* Hand the core the RAW cookie value, untouched: the core decides whether a passed token is
* "the cookie" or "the caller's own" by byte-equality with the live cookie, and only a
* cookie-derived token keeps following the cookie across refreshes for the life of a
* DataSource. Anything that transforms the value here turns every store into one that
* sends the token it was built with forever.
*/
function getRequestToken(manualToken) {
	if (manualToken) return manualToken;
	if (runtimeOptions.token) return runtimeOptions.token;
	if (!monoConfig()?.fetching) return;
	const { apiCookie, refreshCookie } = resolveAuthCookies();
	const chosenName = apiCookie ?? "MONO_tokenRefresh";
	const fallbackName = refreshCookie ?? "MONO_token";
	let value = readCookieValue(chosenName);
	if (!value && fallbackName && fallbackName !== chosenName) value = readCookieValue(fallbackName);
	if (!value && (apiCookie || refreshCookie)) {
		const state = monoState();
		console.warn("[@mono-lit/utility/fetching] request token is empty", {
			apiCookie,
			refreshCookie,
			configuredCookies: monoConfig()?.cookie?.map((c) => c.name) ?? [],
			availableCookieKeys: Object.keys(state.cookie ?? {}),
			cookieState: state.cookie
		});
	}
	return value;
}
function resolveNotif(enabled) {
	if (!enabled) return false;
	return runtimeOptions.notif || false;
}
function mergeHeaders(baseHeaders, overrideHeaders) {
	return {
		...baseHeaders ?? {},
		...overrideHeaders ?? {}
	};
}
function getGlobalHeaders() {
	return (monoConfig()?.fetching)?.headers ?? {};
}
/**
* Optional helper if you want to manually refresh state before fetching.
*
* Usually unnecessary if createMono(monoConfig) already runs once.
*/
function getFetchingRuntime(configBaseUrl) {
	const safe = (fn) => {
		try {
			return fn();
		} catch {
			return;
		}
	};
	return {
		config: getFetchingConfig(),
		restBaseUrl: safe(() => getRestBaseUrl(configBaseUrl)),
		odataBaseUrl: safe(() => getODataBaseUrl(configBaseUrl)),
		source: safe(() => getODataSource(configBaseUrl)),
		token: getRequestToken()
	};
}
const useCreateFetcher = (base) => {
	const { configBaseUrl, ...rest } = base;
	const mockRoute = resolveMockRoute(configBaseUrl, base.url);
	if (mockRoute) return {
		prefetch: (_option) => describePrefetch(() => {}),
		prefetchLoad: (_loadOptions, _option) => describePrefetch(() => {}),
		async response(option) {
			return await serveFromMock(mockRoute, {
				type: option?.type ?? base.type ?? "datasource",
				method: option?.method ?? base.method,
				params: option?.params ?? base.params,
				payload: option?.payload ?? base.payload,
				options: option?.options ?? base.options
			});
		}
	};
	const resolved = (overrides = {}) => createFetcher({
		...authArgs(configBaseUrl),
		...rest,
		token: getRequestToken(base.token),
		notif: resolveNotif(Boolean(base.notif)),
		baseUrl: getODataBaseUrl(configBaseUrl, base.baseUrl),
		source: getODataSource(configBaseUrl, base.source),
		...overrides
	});
	let fetcher;
	/** The same fetcher in capture mode (`definePrefetch` twins): nothing is sent, no token is read. */
	const capturing = (emit, load) => createFetcher({
		...authArgs(configBaseUrl),
		...rest,
		token: PREFETCH_CAPTURE_TOKEN,
		baseUrl: getODataBaseUrl(configBaseUrl, base.baseUrl),
		source: getODataSource(configBaseUrl, base.source),
		__capture: {
			emit,
			auth: prefetchAuthHint(),
			...load ? { load } : {}
		}
	});
	return {
		response: (option) => (fetcher ??= resolved()).response(option),
		/**
		* `definePrefetch` twin of `.response(option)`: describes the first load the browser's
		* `.response(option)` (and the widget bound to it) will send, without sending anything.
		*/
		prefetch: (option) => describeOData(configBaseUrl, base.source, async (emit) => {
			await capturing(emit).response(option);
		}),
		/**
		* `definePrefetch` twin of `(await .response(option)).dataSource.store().load(loadOptions)`:
		* describes ONE store load with exactly these load options (e.g. a session cache that keeps
		* the store and loads it per query). `loadOptions` as DevExtreme's `store.load()` takes them.
		*/
		prefetchLoad: (loadOptions = {}, option) => describeOData(configBaseUrl, base.source, async (emit) => {
			await capturing(emit, loadOptions).response(option);
		})
	};
};
function useTryCatchDatasource(opt) {
	return tryCatchDatasource({
		...opt,
		notif: runtimeOptions.notif || false
	});
}
const createStaticDataSource = async (opt) => {
	return await createStaticDatasource(opt);
};
const useMyFetchOData = async ({ url, options, type = wrapperDefaults.type, params, notif = wrapperDefaults.notif, headers, selfProxy = wrapperDefaults.selfProxy, method = wrapperDefaults.method, force, allowZero = wrapperDefaults.allowZero, cache = wrapperDefaults.cache, override, baseUrl, configBaseUrl, source, token, payload = {
	data: null,
	keyValue: null,
	keyName: "",
	keyType: ""
}, ...rest }) => {
	const mockRoute = resolveMockRoute(configBaseUrl, url);
	if (mockRoute) return await serveFromMock(mockRoute, {
		type,
		method,
		params,
		payload,
		options
	});
	return await useFetchOData({
		...authArgs(configBaseUrl),
		...rest,
		source: getODataSource(configBaseUrl, source),
		url,
		options,
		override,
		cache,
		type,
		force,
		token: getRequestToken(token),
		notif: resolveNotif(Boolean(notif)),
		allowZero,
		params,
		headers: mergeHeaders(getGlobalHeaders(), headers),
		selfProxy,
		method,
		baseUrl: getODataBaseUrl(configBaseUrl, baseUrl),
		payload
	});
};
const useFetchOdataUnique = async ({ url, options, type = wrapperDefaults.type, params, notif = wrapperDefaults.notif, headers, selfProxy = wrapperDefaults.selfProxy, method = wrapperDefaults.method, force, allowZero = wrapperDefaults.allowZero, cache = wrapperDefaults.cache, override, baseUrl, configBaseUrl, source, token, unique, payload = {
	data: null,
	keyValue: null,
	keyName: "",
	keyType: ""
}, ...rest }) => {
	return await createUniqueFetcher({
		...authArgs(configBaseUrl),
		...rest,
		source: getODataSource(configBaseUrl, source),
		url,
		unique,
		options,
		override,
		cache,
		type,
		force,
		token: getRequestToken(token),
		notif: resolveNotif(Boolean(notif)),
		allowZero,
		params,
		headers: mergeHeaders(getGlobalHeaders(), headers),
		selfProxy,
		method,
		baseUrl: getODataBaseUrl(configBaseUrl, baseUrl),
		payload
	});
};
async function useMyFetch(url, opt) {
	const { configBaseUrl, ...rest } = opt;
	const mockRoute = resolveMockRoute(configBaseUrl, url);
	if (mockRoute) {
		const response = await mockRoute.mock.request({
			url: mockRoute.url,
			method: opt?.method,
			params: opt?.params,
			payload: opt?.body ?? opt?.payload
		});
		const payload = response.data;
		const data = payload && Array.isArray(payload.value) ? payload.value : payload;
		return {
			statusCode: response.statusCode,
			data: data ?? null,
			message: response.error?.message ?? null,
			all: response.data
		};
	}
	const { config, tokenOptions, expiredBehaviour, unauthCall } = authArgs(configBaseUrl);
	const { config: _ownConfig, tanstack, ...restOptions } = rest;
	const send = (signal) => useNormalFetch(url, {
		...signal ? { signal } : {},
		tokenOptions,
		expiredBehaviour,
		unauthCall,
		...restOptions,
		token: getRequestToken(opt.token),
		baseUrl: getRestBaseUrl(configBaseUrl, opt.baseUrl),
		notif: resolveNotif(Boolean(opt?.notif)),
		headers: mergeHeaders(getGlobalHeaders(), opt.headers)
	}, _ownConfig ?? config);
	const runner = tanstack ? tanstackRunner() : void 0;
	if (!runner) return await send();
	const method = String(restOptions.method ?? "GET").toUpperCase();
	try {
		return await runner({
			kind: method === "GET" ? "query" : "mutation",
			key: [
				"mono-fetch",
				method,
				getRestBaseUrl(configBaseUrl, opt.baseUrl) + url,
				restOptions.body ?? null
			],
			tanstack,
			task: async (signal) => {
				const result = await send(signal);
				if (!result || result.statusCode === 0 || result.statusCode >= 400) throw new FailedFetchResult(result);
				return result;
			}
		});
	} catch (error) {
		if (error instanceof FailedFetchResult) return error.result;
		throw error;
	}
}
const loadChuckStores = async (opt) => {
	return await loadChuckStore(opt);
};
/** Marks a `definePrefetch` descriptor (@mono-lit/nuxt-pre-fetch's protocol; no import needed). */
const PREFETCH_DESCRIPTOR = Symbol.for("nuxt-pre-fetch.descriptor");
/** Stands in for the token while a call is described (it never leaves the server). */
const PREFETCH_CAPTURE_TOKEN = "mono-prefetch-capture";
function describePrefetch(run) {
	return {
		[PREFETCH_DESCRIPTOR]: true,
		collect: async (_context, emit) => {
			await run(emit);
		}
	};
}
/**
* An OData twin. Describing an OData call on the server needs a data layer that builds its exact
* request there (`@mono-lit/data`, whose stores carry `Symbol.for('mono.prefetch')`). With plain
* DevExtreme stores (`@mono-lit/devextreme`) the twin describes nothing — no store is built, no
* error — and the call is learned instead (`prefetch: true`, see host-nuxt).
*/
function describeOData(configBaseUrl, source, run) {
	return describePrefetch(async (emit) => {
		if (!describesRequests(configBaseUrl, source)) return;
		await run(emit);
	});
}
/** The cookie API requests carry their Bearer from (`fetching.auth`) — read by the server per request. */
function prefetchAuthHint() {
	const { apiCookie } = resolveAuthCookies();
	if (!apiCookie) return void 0;
	return getRefreshRequestOptions()?.splitCookie ?? cookieSplit(apiCookie) ? {
		cookie: apiCookie,
		split: true
	} : { cookie: apiCookie };
}
/**
* `definePrefetch` twin of `monoFetch(url, opt)`: the same arguments, nothing sent — describes
* the GET the browser's call will send (base url, headers and auth from `fetching` config).
*/
function prefetchMonoFetch(url, opt = {}) {
	return describePrefetch((emit) => {
		if (resolveMockRoute(opt.configBaseUrl, url)) return;
		if (String(opt.method ?? "GET").toUpperCase() !== "GET" || opt.body != null) return;
		emit({
			url: getRestBaseUrl(opt.configBaseUrl, opt.baseUrl) + url,
			headers: mergeHeaders(getGlobalHeaders(), opt.headers),
			auth: prefetchAuthHint()
		});
	});
}
/**
* `definePrefetch` twin of `monoFetchOdata(params)`: runs the same call in capture mode —
* the store builds exactly the request the browser will send (`data`: what the call loads;
* `datasource`: the first page a bound widget loads), nothing is fetched.
*/
function prefetchMonoFetchOdata(params) {
	return describeOData(params.configBaseUrl, params.source, async (emit) => {
		await useMyFetchOData({
			...params,
			token: PREFETCH_CAPTURE_TOKEN,
			notif: false,
			__capture: {
				emit,
				auth: prefetchAuthHint()
			}
		});
	});
}
/** Whether the data layer these OData calls use can describe its requests (its ODataStore is flagged). */
function describesRequests(configBaseUrl, source) {
	return !!(getODataSource(configBaseUrl, source)?.ODataStore)?.[PREFETCH_SUPPORT];
}
/** `monoFetch` with its `definePrefetch` twin: `monoFetch.prefetch(url, opt)`. */
const monoFetch = Object.assign(useMyFetch, { prefetch: prefetchMonoFetch });
/** `monoFetchOdata` / `monoOdataFetch` with `.prefetch(params)`. */
const monoFetchOdata = Object.assign(useMyFetchOData, { prefetch: prefetchMonoFetchOdata });
/**
* Installs the `prefetch` host (e.g. `useNuxtApp().$nuxtPreFetch` from @mono-lit/nuxt-pre-fetch;
* `@mono-lit/utility/nuxt` does it for you). REST calls use it here; OData stores use it through
* the data layer when it supports it (`@mono-lit/data`'s `setPrefetchProvider`, detected like
* `tanstackRun`). `null` removes it.
*/
function monoSetPrefetchBridge(next) {
	setPrefetchBridge(next);
	const setProvider = Reflect.get(monoDevextremeModule, "setPrefetchProvider");
	if (typeof setProvider === "function") setProvider(next);
}
/**
* Inside `definePrefetch(pattern, ctx => …)`: what the browser's `monoState()` would hold for
* this request — the claims of every `jwt` entry of `mono.config` (decoded from the page
* request's cookies; split cookies joined) and a cookie reader that understands `split`.
*/
function monoPrefetchContext(context) {
	const cookies = context?.cookies ?? {};
	const cookie = (name, split) => {
		if (split ?? cookieSplit(name)) {
			const prefix = `${name}_split_`;
			const chunks = Object.keys(cookies).filter((key) => key.startsWith(prefix) && /^\d+$/.test(key.slice(prefix.length))).sort((a, b) => Number(a.slice(prefix.length)) - Number(b.slice(prefix.length))).map((key) => cookies[key]);
			if (chunks.length) return chunks.join("");
		}
		return cookies[name] || void 0;
	};
	const jwt = {};
	for (const [key, entry] of Object.entries(monoConfig()?.jwt ?? {})) {
		if (!entry) continue;
		if (typeof entry.name === "object" && entry.name) jwt[key] = { ...entry.name };
		else if (typeof entry.name === "string") jwt[key] = { ...decodeJwt(cookie(entry.name, Boolean(entry.split))) ?? {} };
	}
	return {
		jwt,
		cookie
	};
}

//#endregion
export { createFetcher, configureFetching as monoConfigureFetching, useCreateFetcher as monoCreateFetcher, monoFetch, monoFetchOdata, monoFetchOdata as monoOdataFetch, useFetchOdataUnique as monoFetchOdataUnique, useFetchOdataUnique as monoOdataFetchUnique, getFetchingRuntime as monoFetchingRuntime, loadChuckStores as monoLoadChuckStores, monoMockDb, getODataBaseUrl as monoOdataBaseUrl, getODataSource as monoOdataSource, getPrefetchBridge as monoPrefetchBridge, monoPrefetchContext, getRequestToken as monoRequestToken, resetFetchingConfig as monoResetFetchingConfig, getRestBaseUrl as monoRestBaseUrl, monoSetPrefetchBridge, createStaticDataSource as monoStaticDataSource, useTryCatchDatasource as monoTryCatchDatasource, promiseWrapper, resetMonoMockDb };