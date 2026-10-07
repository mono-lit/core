import { o as setMonoEventResolver, t as MonoRequestEvent } from "./universal-B2eD9xho.js";
import { Driver, Storage } from "unstorage";
import { H3Event } from "h3";

//#region src/nuxt/ssr-cookie.d.ts
interface MonoCookieDriverOptions {
  /** h3 request event (server). When absent, the driver uses document.cookie (client). */
  event?: H3Event;
}
/**
 * unstorage cookie driver. Values are plain strings; expiry is passed through the
 * transaction options as `{ expires: Date }` on `setItem`.
 */
declare const monoCookieDriver: (opts: MonoCookieDriverOptions | undefined) => Driver<MonoCookieDriverOptions | undefined, any>;
/** A unstorage Storage bound to the cookie driver (server event or client). */
declare function monoCookieStorage(event?: H3Event): Storage;
//#endregion
export { type MonoCookieDriverOptions, type MonoRequestEvent, monoCookieDriver, monoCookieStorage, setMonoEventResolver };