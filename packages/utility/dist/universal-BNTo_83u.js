import { jwtDecode } from "jwt-decode";

//#region src/token/cookie-core.ts
/** Regex matching a split chunk cookie: `<encName>_split_<idx>=`. */
function chunkPattern(name) {
	return new RegExp(`^${encodeURIComponent(name)}_split_(\\d+)=`);
}
/** From raw "encName=encValue" entries, return this name's chunk values, index-ordered + decoded. */
function parseChunks(rawEntries, name) {
	const pattern = chunkPattern(name);
	const hits = [];
	for (const c of rawEntries) {
		const m = c.match(pattern);
		if (m) hits.push({
			idx: Number(m[1]),
			raw: c
		});
	}
	hits.sort((a, b) => a.idx - b.idx);
	let combined = "";
	for (const { raw } of hits) {
		const eqPos = raw.indexOf("=");
		if (eqPos >= 0) combined += decodeURIComponent(raw.substring(eqPos + 1));
	}
	return combined;
}
/** Indexes of this name's existing chunks (for cleanup before a rewrite). */
function chunkIndexes(rawEntries, name) {
	const pattern = chunkPattern(name);
	const idx = [];
	for (const c of rawEntries) {
		const m = c.match(pattern);
		if (m) idx.push(Number(m[1]));
	}
	return idx.sort((a, b) => a - b);
}
/** Slice a value into ~`every`-char parts. */
function splitValue(value, every) {
	const parts = [];
	let i = 0;
	while (i * every < value.length) {
		parts.push(value.slice(i * every, (i + 1) * every));
		i++;
	}
	return parts;
}
/** Compute an expiry Date from `days`/`milis` (returns undefined when neither given). */
function computeExpiry(days, milis) {
	if (!days && !milis) return void 0;
	const expires = /* @__PURE__ */ new Date();
	if (milis) expires.setTime(expires.getTime() + milis);
	if (days) expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1e3);
	return expires;
}
/**
* Build a `{ get, add, remove }` cookie util over any synchronous `CookieStore`.
* Carries the exact original semantics: split handling, days/milis expiry, and a
* write-verify (re-read after write) before reporting success.
*/
function createCookie(store) {
	const get = (name, split = false) => {
		if (split) {
			const combined = parseChunks(store.readAll(), name);
			if (combined) return combined;
		}
		return store.read(name);
	};
	const add = ({ name, value, days, milis, split = false, splitEvery = 2e3 }) => {
		if (!days && !milis) return null;
		try {
			const expires = computeExpiry(days, milis);
			if (split) {
				for (const idx of chunkIndexes(store.readAll(), name)) store.delete(`${name}_split_${idx}`);
				store.delete(name);
				const parts = splitValue(value, splitEvery);
				let ok = true;
				parts.forEach((part, i) => {
					store.write(`${name}_split_${i}`, part, expires);
					ok &&= store.read(`${name}_split_${i}`) === part;
				});
				if (ok) return value || get(name, true);
			} else {
				store.write(name, value, expires);
				if (store.read(name) === value) return value || get(name);
			}
		} catch {
			return null;
		}
	};
	const remove = (name, split = false) => {
		if (split) {
			for (const idx of chunkIndexes(store.readAll(), name)) store.delete(`${name}_split_${idx}`);
			store.delete(name);
			return true;
		}
		if (get(name) !== null) {
			store.delete(name);
			return true;
		}
		return false;
	};
	return {
		add,
		get,
		remove
	};
}

//#endregion
//#region src/token/token-core.ts
/** Pure: read `a.b.c` off an object. */
function getByPath(obj, path) {
	if (path) return path?.split(".").reduce((acc, key) => acc?.[key], obj);
	return null;
}
/**
* Build the token util ({ get, add, decode, validate, replace, fetch, wrap }) over
* injected cookie/jwt/fetch dependencies. Behavior matches the original `useMyToken`.
*/
function createToken(deps, options) {
	const { cookie, isJwt, decode, fetch } = deps;
	const get = (name, split) => {
		const token = cookie.get(String(name || options?.name), Boolean(split) || Boolean(options?.splitCookie));
		if (token) return token;
		return null;
	};
	const add = ({ name, value, days, milis, splitCookie }) => {
		return cookie.add({
			name: String(name || options?.name),
			value: String(value || options?.value),
			days: Number(days || options?.days),
			milis: Number(milis || options?.milis),
			split: Boolean(splitCookie || options?.splitCookie)
		});
	};
	const decodeToken = (name, split) => {
		const token = cookie.get(String(name || options?.name), split || Boolean(options?.splitCookie));
		if (token && isJwt(token)) return decode(token);
		return null;
	};
	const validate = (name, split) => {
		const getToken = get(String(name || options?.name), Boolean(split) || Boolean(options?.splitCookie));
		if (getToken && !["", "undefined"].includes(String(getToken))) {
			const decoded = decodeToken(String(name || options?.name), Boolean(split) || Boolean(options?.splitCookie));
			if (decoded) {
				const currentTime = Math.floor(Date.now() / 1e3);
				if (decoded.exp && Number(decoded.exp) > currentTime) return true;
			}
		}
		return false;
	};
	const replace = ({ name, value, days, milis, splitCookie }) => {
		const addCookie = cookie.add({
			name: String(name || options?.name),
			value: String(value || options?.value),
			days: Number(days || options?.days),
			milis: Number(milis || options?.milis),
			split: Boolean(splitCookie) || Boolean(options?.splitCookie)
		});
		return Boolean(addCookie);
	};
	const fetchToken = async ({ fetchParams, name, path, splitCookie } = {}) => {
		if (!validate(String(name || options?.name))) {
			const { all } = await fetch(String(fetchParams?.url || options?.fetchParams?.url), {
				...fetchParams?.options,
				...options?.fetchParams?.options
			});
			if (all) return {
				response: all,
				cookie: add({
					name: String(name || options?.name) || getByPath(all, String(path?.name || options?.path?.name)),
					value: getByPath(all, String(path?.value || options?.path?.value)),
					milis: getByPath(all, String(path?.milis || options?.path?.milis)),
					days: getByPath(all, String(path?.days || options?.path?.days)),
					splitCookie: Boolean(splitCookie) || Boolean(options?.splitCookie)
				})
			};
		}
		return {
			response: null,
			cookie: null
		};
	};
	const wrap = async ({ name, fetchParams, path, splitCookie } = {}, callback) => {
		await fetchToken({
			fetchParams: {
				...fetchParams,
				...options?.fetchParams
			},
			name: String(name || options?.name),
			path: {
				...path,
				...options?.path
			}
		});
		const getStoredToken = cookie.get(String(name || options?.name), Boolean(splitCookie) || Boolean(options?.splitCookie));
		if (getStoredToken && callback) return callback(getStoredToken);
	};
	return {
		decode: decodeToken,
		add,
		get,
		replace,
		fetch: fetchToken,
		validate,
		wrap
	};
}

//#endregion
//#region src/token/jwt.ts
/** Pure: is this string shaped like a JWT? */
const isJwt = (jwt) => /^([A-Za-z0-9-_]+)\.([A-Za-z0-9-_]+)\.([A-Za-z0-9-_.+/=]+)$/.test(jwt);
/** Pure: decode a JWT string into its payload, or null when not a JWT. */
function decodeJwt(token) {
	if (token && isJwt(token)) return jwtDecode(token);
	return null;
}
const useMyJwt = () => {
	/**
	* Jwt decode untuk mengambil payload informasi user.
	* @param cookie nama cookie jwt yang ingin didecode (read via client document.cookie)
	*/
	const cookieDecode = ({ cookie, token, splitCookie }) => {
		if (cookie) {
			const decoded = decodeJwt(useMyCookie().get(cookie, Boolean(splitCookie)));
			if (decoded) return decoded;
		}
		return decodeJwt(token);
	};
	return {
		isJwt,
		cookieDecode
	};
};

//#endregion
//#region src/token/fetch.ts
async function useMyFetch(url, options) {
	let response = null;
	try {
		response = await fetch(options?.baseUrl + url, {
			...options,
			headers: {
				...options?.headers,
				"Content-Type": "application/json",
				...options?.token && { Authorization: `Bearer ${options.token}` }
			}
		});
		if (!response.ok) {
			if (response.status === 401) {
				if (options?.unauthCall) options.unauthCall();
			}
			const errorResponse = await response.json();
			const error = errorResponse?.Message || errorResponse?.message || errorResponse?.Error || errorResponse || "Terjadi kesalahan!.";
			const errorReturn = typeof error === "string" ? error : JSON.stringify(error);
			const respon = {
				message: errorReturn,
				statusCode: response.status,
				data: null,
				all: null
			};
			if (options.callback) options.callback({
				message: errorReturn,
				statusCode: response.status,
				data: null,
				all: null
			});
			return respon;
		} else {
			const raw = await response.text();
			let responseData;
			try {
				responseData = raw === "" ? null : JSON.parse(raw);
			} catch {
				responseData = raw;
			}
			const respon = {
				data: responseData?.data,
				statusCode: response.status,
				message: responseData?.message || null,
				all: responseData
			};
			if (options.callback) options.callback(respon);
			return respon;
		}
	} catch (error) {
		const respon = {
			message: error?.message || "Tejadi kesalahan!.",
			statusCode: 500,
			data: null,
			all: null
		};
		if (options.callback) options.callback(respon);
		return {
			message: error?.message || "Tejadi kesalahan!.",
			statusCode: 500,
			data: null,
			all: null
		};
	}
}

//#endregion
//#region src/token/client.ts
/** Synchronous `CookieStore` over `document.cookie` (original encoding preserved). */
const documentCookieStore = {
	read(name) {
		const nameEQ = encodeURIComponent(name) + "=";
		const cookies = document.cookie.split(";").map((s) => s.trim());
		for (const cookie of cookies) if (cookie.startsWith(nameEQ)) return decodeURIComponent(cookie.substring(nameEQ.length));
		return null;
	},
	readAll() {
		return document.cookie.split(";").map((s) => s.trim()).filter(Boolean);
	},
	write(name, value, expires) {
		const parts = [
			`${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
			expires ? `expires=${expires.toUTCString()}` : "",
			"path=/"
		].filter(Boolean);
		document.cookie = parts.join("; ");
	},
	delete(name) {
		document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
	}
};
/** Client cookie util — `document.cookie` backed (unchanged public shape). */
const useMyCookie = () => createCookie(documentCookieStore);
/** Client token util — `document.cookie` backed (unchanged public shape). */
const useMyToken = (options) => createToken({
	cookie: useMyCookie(),
	isJwt,
	decode: decodeJwt,
	fetch: useMyFetch
}, options);

//#endregion
//#region src/token/storage.ts
const useMyStorage = (options) => {
	const storage = !options?.type || options.type == "local" ? localStorage : sessionStorage;
	const get = (name) => {
		const optionName = name || options?.name;
		if (typeof optionName === "string") return storage.getItem(optionName);
		if (Array.isArray(optionName)) {
			const mapStorage = optionName?.map((e) => {
				return {
					name: e,
					value: storage.getItem(e)
				};
			}).filter((e) => e.value);
			if (mapStorage.length > 0) return mapStorage;
			return null;
		}
		if (optionName instanceof RegExp) {
			var result = [];
			for (let i = 0; i < storage.length; i++) {
				const key = storage.key(i);
				if (key && optionName.test(key)) result.push({
					name: key,
					value: storage.getItem(key) ?? void 0
				});
			}
			const filterResult = result.filter((e) => e.value);
			if (filterResult.length > 0) return filterResult;
			return null;
		}
		return null;
	};
	const change = ({ name, value }) => {
		const optionName = name || options?.name;
		const optionValue = value || options?.value;
		if (typeof optionName !== "string" || typeof optionValue === "undefined") return null;
		const existing = storage.getItem(optionName);
		if (!existing) return null;
		try {
			const parsed = JSON.parse(existing);
			if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && typeof optionValue === "object" && !Array.isArray(optionValue)) {
				const merged = {
					...parsed,
					...optionValue
				};
				const stringified = JSON.stringify(merged);
				storage.setItem(optionName, stringified);
				return stringified;
			}
			const stringified = typeof optionValue === "string" ? optionValue : JSON.stringify(optionValue);
			storage.setItem(optionName, stringified);
			return stringified;
		} catch {
			const stringified = typeof optionValue === "string" ? optionValue : JSON.stringify(optionValue);
			storage.setItem(optionName, stringified);
			return stringified;
		}
	};
	const add = ({ name, value, items }) => {
		const optionName = name || options?.name;
		const optionValue = value || options?.value;
		const optionItems = items || options?.items;
		if (!optionItems && typeof optionName === "string" && optionValue) {
			const stringified = typeof optionValue === "string" ? optionValue : JSON.stringify(optionValue);
			storage.setItem(optionName, stringified);
			return stringified;
		}
		if (optionItems) {
			const filterItems = optionItems.filter((item) => typeof item?.name === "string" && item.value);
			var stringifiedd = "";
			filterItems.forEach((item) => {
				const stringified = typeof item.value === "string" ? item.value : JSON.stringify(item.value);
				stringifiedd += stringified;
				storage.setItem(String(item?.name), stringified);
			});
			return stringifiedd;
		}
		return null;
	};
	const remove = (name) => {
		const optionName = name || options?.name;
		if (typeof optionName === "string") {
			storage.removeItem(optionName);
			return true;
		}
		if (Array.isArray(optionName)) {
			optionName.forEach((key) => storage.removeItem(key));
			return true;
		}
		if (optionName instanceof RegExp) {
			const toRemove = [];
			for (let i = 0; i < storage.length; i++) {
				const key = storage.key(i);
				if (key && optionName.test(key)) toRemove.push(key);
			}
			toRemove.forEach((key) => storage.removeItem(key));
			return true;
		}
		return false;
	};
	const pull = (name) => {
		const value = get(name);
		if (value) {
			remove(name);
			return value;
		}
		return null;
	};
	const redirect = (url, { name, value, items }) => {
		if (add({
			name,
			value,
			items
		})) window.location.href = url;
	};
	return {
		get,
		add,
		remove,
		change,
		pull,
		redirect
	};
};

//#endregion
//#region src/composables/universal.ts
const isClient = () => typeof document !== "undefined";
let eventResolver;
/**
* Wire how the SSR cookie utils find the current request event. Call once from a
* Nuxt plugin: `setMonoEventResolver(() => useRequestEvent())`. Without it (and
* without an explicit `event` argument) the server utils degrade to empty reads.
*/
function setMonoEventResolver(fn) {
	eventResolver = fn;
}
function resolveEvent(explicit) {
	return explicit ?? eventResolver?.();
}
/** Per-request write overlay: makes read-after-write work; `null` = tombstone. */
const overlay = /* @__PURE__ */ new WeakMap();
function overlayFor(event) {
	let m = overlay.get(event);
	if (!m) {
		m = /* @__PURE__ */ new Map();
		overlay.set(event, m);
	}
	return m;
}
function reqHeaderCookie(event) {
	return event?.node?.req?.headers?.cookie ?? event?.req?.headers?.cookie ?? "";
}
function parseReqCookies(event) {
	const out = {};
	const header = reqHeaderCookie(event);
	if (!header) return out;
	for (const pair of header.split(";")) {
		const eq = pair.indexOf("=");
		if (eq < 0) continue;
		const k = decodeURIComponent(pair.slice(0, eq).trim());
		const v = decodeURIComponent(pair.slice(eq + 1).trim());
		if (k) out[k] = v;
	}
	return out;
}
/** Combined view: request cookies overlaid with this request's writes/tombstones. */
function combinedCookies(event) {
	const map = new Map(Object.entries(parseReqCookies(event)));
	const ov = overlayFor(event);
	for (const [k, v] of ov) if (v == null) map.delete(k);
	else map.set(k, v);
	return map;
}
function serializeCookie(name, value, expires) {
	return [
		`${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
		expires ? `Expires=${expires.toUTCString()}` : "",
		"Path=/"
	].filter(Boolean).join("; ");
}
function appendSetCookie(event, serialized) {
	const res = event?.node?.res ?? event?.res;
	if (!res || typeof res.setHeader !== "function") return;
	const prev = res.getHeader?.("set-cookie");
	const arr = prev == null ? [] : Array.isArray(prev) ? prev.slice() : [prev];
	arr.push(serialized);
	res.setHeader("set-cookie", arr);
}
/** A synchronous `CookieStore` backed by the h3 request event (+ overlay). */
function eventCookieStore(event) {
	if (!event) return {
		read: () => null,
		readAll: () => [],
		write: () => {},
		delete: () => {}
	};
	return {
		read(name) {
			const ov = overlayFor(event);
			if (ov.has(name)) return ov.get(name) ?? null;
			return parseReqCookies(event)[name] ?? null;
		},
		readAll() {
			return [...combinedCookies(event)].map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
		},
		write(name, value, expires) {
			appendSetCookie(event, serializeCookie(name, value, expires));
			overlayFor(event).set(name, value);
		},
		delete(name) {
			appendSetCookie(event, serializeCookie(name, "", /* @__PURE__ */ new Date(0)));
			overlayFor(event).set(name, null);
		}
	};
}
/** Cookie util. Client: document.cookie. Server: the h3 request event (sync). */
function monoCookie(event) {
	if (isClient()) return useMyCookie();
	return createCookie(eventCookieStore(resolveEvent(event)));
}
/** Token util. Client: document.cookie. Server: the h3 request event (sync). */
function monoToken(options, event) {
	if (isClient()) return useMyToken(options);
	return createToken({
		cookie: monoCookie(event),
		isJwt,
		decode: decodeJwt,
		fetch: useMyFetch
	}, options);
}
/** JWT util. `cookieDecode({ cookie })` reads via the isomorphic cookie util. */
function monoJwt(event) {
	if (isClient()) return useMyJwt();
	const cookieDecode = ({ cookie, token, splitCookie }) => {
		if (cookie) {
			const decoded = decodeJwt(monoCookie(event).get(cookie, Boolean(splitCookie)));
			if (decoded) return decoded;
		}
		return decodeJwt(token);
	};
	return {
		isJwt,
		cookieDecode
	};
}
/** Storage util. Client: localStorage/sessionStorage. Server: safe no-op. */
function monoStorage(options) {
	if (isClient()) return useMyStorage(options);
	return {
		get: () => null,
		add: (_) => null,
		remove: (_) => false,
		change: (_) => null,
		pull: (_) => null,
		redirect: () => {}
	};
}

//#endregion
export { setMonoEventResolver as a, useMyToken as c, monoToken as i, useMyFetch as l, monoJwt as n, useMyStorage as o, monoStorage as r, useMyCookie as s, monoCookie as t, useMyJwt as u };