import { a as setMonoEventResolver } from "./universal-BNTo_83u.js";
import { createStorage, defineDriver } from "unstorage";
import { deleteCookie, getCookie, parseCookies, setCookie } from "h3";

//#region src/nuxt/ssr-cookie.ts
const isClient = () => typeof document !== "undefined";
function clientReadCookie(name) {
	const nameEQ = encodeURIComponent(name) + "=";
	for (const c of document.cookie.split(";").map((s) => s.trim())) if (c.startsWith(nameEQ)) return decodeURIComponent(c.substring(nameEQ.length));
	return null;
}
function clientWriteCookie(name, value, expires) {
	const parts = [
		`${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
		expires ? `expires=${expires.toUTCString()}` : "",
		"path=/"
	].filter(Boolean);
	document.cookie = parts.join("; ");
}
function clientDeleteCookie(name) {
	document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}
function clientCookieKeys() {
	return document.cookie.split(";").map((s) => s.trim()).filter(Boolean).map((c) => decodeURIComponent(c.split("=")[0]));
}
/**
* Per-request write overlay. On the server, h3 `setCookie` writes to the RESPONSE,
* so `getCookie` (request) can't see a just-written value within the same render.
* We mirror writes into an overlay keyed by the request event; `null` = tombstone.
*/
const serverOverlay = /* @__PURE__ */ new WeakMap();
function overlayFor(event) {
	let m = serverOverlay.get(event);
	if (!m) {
		m = /* @__PURE__ */ new Map();
		serverOverlay.set(event, m);
	}
	return m;
}
/**
* unstorage cookie driver. Values are plain strings; expiry is passed through the
* transaction options as `{ expires: Date }` on `setItem`.
*/
const monoCookieDriver = defineDriver((opts = {}) => {
	const event = opts.event;
	const onServer = () => Boolean(event) && !isClient();
	const serverGet = (key) => {
		const ov = overlayFor(event);
		if (ov.has(key)) return ov.get(key) ?? null;
		return getCookie(event, key) ?? null;
	};
	return {
		name: "mono-cookie",
		options: opts,
		hasItem(key) {
			if (onServer()) return serverGet(key) != null;
			return isClient() ? clientReadCookie(key) != null : false;
		},
		getItem(key) {
			if (onServer()) return serverGet(key);
			return isClient() ? clientReadCookie(key) : null;
		},
		setItem(key, value, tOptions) {
			const expires = tOptions?.expires;
			if (onServer()) {
				setCookie(event, key, String(value), {
					path: "/",
					expires
				});
				overlayFor(event).set(key, String(value));
				return;
			}
			if (isClient()) clientWriteCookie(key, String(value), expires);
		},
		removeItem(key) {
			if (onServer()) {
				deleteCookie(event, key, { path: "/" });
				overlayFor(event).set(key, null);
				return;
			}
			if (isClient()) clientDeleteCookie(key);
		},
		getKeys() {
			if (onServer()) {
				const ov = overlayFor(event);
				const keys = new Set(Object.keys(parseCookies(event)));
				for (const [k, v] of ov) if (v == null) keys.delete(k);
				else keys.add(k);
				return [...keys];
			}
			return isClient() ? clientCookieKeys() : [];
		},
		clear() {}
	};
});
/** A unstorage Storage bound to the cookie driver (server event or client). */
function monoCookieStorage(event) {
	return createStorage({ driver: monoCookieDriver({ event }) });
}

//#endregion
export { monoCookieDriver, monoCookieStorage, setMonoEventResolver };