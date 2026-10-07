//#region ../../node_modules/.pnpm/p-throttle@8.1.0/node_modules/p-throttle/index.js
var states = /* @__PURE__ */ new WeakMap();
var signalThrottleds = /* @__PURE__ */ new WeakMap();
var finalizationRegistry = new FinalizationRegistry(({ signalWeakRef, weakReference }) => {
	const signal = signalWeakRef.deref();
	if (!signal) return;
	const registration = signalThrottleds.get(signal);
	if (registration) {
		registration.throttleds.delete(weakReference);
		if (registration.throttleds.size === 0) {
			signal.removeEventListener("abort", registration.listener);
			signalThrottleds.delete(signal);
		}
	}
});
function pThrottle({ limit, interval, strict, signal, onDelay, weight }) {
	if (!Number.isFinite(limit)) throw new TypeError("Expected `limit` to be a finite number");
	if (!Number.isFinite(interval)) throw new TypeError("Expected `interval` to be a finite number");
	if (limit < 0) throw new TypeError("Expected `limit` to be >= 0");
	if (interval < 0) throw new TypeError("Expected `interval` to be >= 0");
	if (weight !== void 0 && typeof weight !== "function") throw new TypeError("Expected `weight` to be a function");
	if (weight && interval === 0) throw new TypeError("The `weight` option cannot be used with `interval` of 0");
	const state = {
		queue: /* @__PURE__ */ new Map(),
		strictTicks: [],
		currentTick: 0,
		activeWeight: 0
	};
	const strictCapacity = Math.max(limit, 1);
	const insertTickSorted = (tickRecord) => {
		if (state.strictTicks.length === 0 || tickRecord.time >= state.strictTicks.at(-1).time) state.strictTicks.push(tickRecord);
		else {
			const insertIndex = state.strictTicks.findIndex((tick) => tick.time > tickRecord.time);
			state.strictTicks.splice(insertIndex, 0, tickRecord);
		}
	};
	function windowedDelay(requestWeight) {
		const now = Date.now();
		if (now - state.currentTick > interval) {
			state.activeWeight = requestWeight;
			state.currentTick = now;
			return 0;
		}
		if (state.activeWeight + requestWeight <= limit) state.activeWeight += requestWeight;
		else {
			state.currentTick += interval;
			state.activeWeight = requestWeight;
		}
		return state.currentTick - now;
	}
	function strictDelay(requestWeight) {
		const now = Date.now();
		if (state.strictTicks.length > 0 && now - state.strictTicks.at(-1).time > interval) state.strictTicks.length = 0;
		if (weight) {
			while (state.strictTicks.length > 0 && now - state.strictTicks[0].time >= interval) state.strictTicks.shift();
			const weightInWindowAt = (time) => {
				let total = 0;
				for (const tick of state.strictTicks) if (tick.time <= time && time - tick.time < interval) total += tick.weight;
				return total;
			};
			if (weightInWindowAt(now) + requestWeight <= limit) {
				insertTickSorted({
					time: now,
					weight: requestWeight
				});
				return { delay: 0 };
			}
			let nextExecutionTime = now;
			while (weightInWindowAt(nextExecutionTime) + requestWeight > limit) {
				const firstInWindow = state.strictTicks.find((tick) => tick.time <= nextExecutionTime && nextExecutionTime - tick.time < interval);
				if (!firstInWindow) break;
				nextExecutionTime = firstInWindow.time + interval;
			}
			const tickRecord = {
				time: nextExecutionTime,
				weight: requestWeight
			};
			insertTickSorted(tickRecord);
			return {
				delay: Math.max(0, nextExecutionTime - now),
				tickRecord
			};
		}
		if (state.strictTicks.length < strictCapacity) {
			state.strictTicks.push({
				time: now,
				weight: requestWeight
			});
			return { delay: 0 };
		}
		const oldestTime = state.strictTicks[0].time;
		const mostRecentTime = state.strictTicks.at(-1).time;
		const baseTime = oldestTime + interval;
		const minSpacing = interval > 0 ? Math.ceil(interval / strictCapacity) : 0;
		const nextExecutionTime = baseTime <= mostRecentTime ? mostRecentTime + minSpacing : baseTime;
		state.strictTicks.shift();
		const tickRecord = {
			time: nextExecutionTime,
			weight: requestWeight
		};
		state.strictTicks.push(tickRecord);
		return {
			delay: Math.max(0, nextExecutionTime - now),
			tickRecord
		};
	}
	const getDelay = strict ? strictDelay : windowedDelay;
	return (function_) => {
		const throttled = function(...arguments_) {
			if (!throttled.isEnabled) return (async () => function_.apply(this, arguments_))();
			let timeoutId;
			return new Promise((resolve, reject) => {
				let requestWeight = 1;
				if (weight) {
					try {
						requestWeight = weight(...arguments_);
					} catch (error) {
						reject(error);
						return;
					}
					if (!Number.isFinite(requestWeight) || requestWeight < 0) {
						reject(/* @__PURE__ */ new TypeError("Expected `weight` to be a finite non-negative number"));
						return;
					}
					if (requestWeight > limit) {
						reject(/* @__PURE__ */ new TypeError(`Expected \`weight\` (${requestWeight}) to be <= \`limit\` (${limit})`));
						return;
					}
				}
				const delayResult = getDelay(requestWeight);
				const delay = strict ? delayResult.delay : delayResult;
				const tickRecord = strict ? delayResult.tickRecord : void 0;
				const execute = () => {
					if (tickRecord) {
						const actualTime = Date.now();
						if (weight && tickRecord.time !== actualTime) {
							tickRecord.time = actualTime;
							const index = state.strictTicks.indexOf(tickRecord);
							state.strictTicks.splice(index, 1);
							insertTickSorted(tickRecord);
						} else tickRecord.time = actualTime;
					}
					try {
						resolve(function_.apply(this, arguments_));
					} catch (error) {
						reject(error);
					}
					state.queue.delete(timeoutId);
				};
				if (delay > 0) {
					timeoutId = setTimeout(execute, delay);
					state.queue.set(timeoutId, reject);
					try {
						onDelay?.(...arguments_);
					} catch {}
				} else execute();
			});
		};
		signal?.throwIfAborted();
		if (signal) {
			let registration = signalThrottleds.get(signal);
			if (!registration) {
				registration = {
					throttleds: /* @__PURE__ */ new Set(),
					listener: null
				};
				registration.listener = () => {
					for (const weakReference of registration.throttleds) {
						const function_ = weakReference.deref();
						if (!function_) continue;
						const functionState = states.get(function_);
						if (!functionState) continue;
						for (const timeout of functionState.queue.keys()) {
							clearTimeout(timeout);
							functionState.queue.get(timeout)(signal.reason);
						}
						functionState.queue.clear();
						functionState.strictTicks.length = 0;
						functionState.currentTick = 0;
						functionState.activeWeight = 0;
					}
					signalThrottleds.delete(signal);
				};
				signalThrottleds.set(signal, registration);
				signal.addEventListener("abort", registration.listener, { once: true });
			}
			const weakReference = new WeakRef(throttled);
			registration.throttleds.add(weakReference);
			finalizationRegistry.register(throttled, {
				signalWeakRef: new WeakRef(signal),
				weakReference
			});
		}
		throttled.isEnabled = true;
		Object.defineProperty(throttled, "queueSize", { get() {
			return state.queue.size;
		} });
		states.set(throttled, state);
		return throttled;
	};
}
//#endregion
//#region ../../node_modules/.pnpm/p-debounce@5.1.0/node_modules/p-debounce/index.js
var pDebounce = (functionToDebounce, wait, options = {}) => {
	if (!Number.isFinite(wait)) throw new TypeError("Expected `wait` to be a finite number");
	let leadingValue;
	let timeout;
	let promiseHandlers = [];
	const onAbort = () => {
		clearTimeout(timeout);
		timeout = void 0;
		try {
			options.signal?.throwIfAborted();
		} catch (error) {
			for (const { reject } of promiseHandlers) reject(error);
			promiseHandlers = [];
		}
	};
	return function(...arguments_) {
		return new Promise((resolve, reject) => {
			try {
				options.signal?.throwIfAborted();
			} catch (error) {
				reject(error);
				return;
			}
			const shouldCallNow = options.before && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(async () => {
				timeout = void 0;
				const currentHandlers = promiseHandlers;
				promiseHandlers = [];
				try {
					const result = options.before ? leadingValue : await functionToDebounce.apply(this, arguments_);
					for (const { resolve: resolveFunction } of currentHandlers) resolveFunction(result);
				} catch (error) {
					for (const { reject: rejectFunction } of currentHandlers) rejectFunction(error);
				}
				leadingValue = void 0;
				options.signal?.removeEventListener("abort", onAbort);
			}, wait);
			if (shouldCallNow) (async () => {
				try {
					leadingValue = await functionToDebounce.apply(this, arguments_);
					resolve(leadingValue);
				} catch (error) {
					reject(error);
				}
			})();
			else {
				promiseHandlers.push({
					resolve,
					reject
				});
				if (options.signal && promiseHandlers.length === 1) options.signal.addEventListener("abort", onAbort, { once: true });
			}
		});
	};
};
pDebounce.promise = (function_, options = {}) => {
	let currentPromise;
	let queuedCall;
	return async function(...arguments_) {
		if (currentPromise) {
			if (!options.after) return currentPromise;
			queuedCall ??= { resolvers: [] };
			queuedCall.arguments = arguments_;
			queuedCall.context = this;
			return new Promise((resolve, reject) => {
				queuedCall.resolvers.push({
					resolve,
					reject
				});
			});
		}
		currentPromise = (async () => {
			let result;
			let initialError;
			try {
				result = await function_.apply(this, arguments_);
			} catch (error) {
				initialError = error;
			}
			while (queuedCall) {
				const call = queuedCall;
				queuedCall = void 0;
				try {
					const queuedResult = await function_.apply(call.context, call.arguments);
					for (const { resolve } of call.resolvers) resolve(queuedResult);
				} catch (error) {
					for (const { reject } of call.resolvers) reject(error);
				}
			}
			if (initialError) throw initialError;
			return result;
		})();
		try {
			return await currentPromise;
		} finally {
			currentPromise = void 0;
		}
	};
};
//#endregion
//#region src/composables/rate-limit.ts
var DEFAULT_THROTTLE = {
	limit: 1,
	interval: 1e3,
	strict: false
};
var DEFAULT_DEBOUNCE = {
	wait: 300,
	before: false
};
/** Parse the attribute form: `"300"` → `300`, `'{"wait":300}'` → object. */
function parseRateLimitValue(value) {
	if (typeof value !== "string") return value;
	const trimmed = value.trim();
	if (trimmed === "" || trimmed === "true") return true;
	if (trimmed === "false") return false;
	if (trimmed.startsWith("{")) try {
		return JSON.parse(trimmed);
	} catch {
		return;
	}
	const parsed = Number(trimmed);
	return Number.isFinite(parsed) ? parsed : void 0;
}
function toPositiveNumber(value, fallback) {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}
/**
* Normalize a `throttle` prop. A bare number is the *interval*
* (`throttle="1000"` → at most one call per second), which is the reading
* people expect from `throttle={1000}` elsewhere. Returns `null` when
* throttling is off.
*/
function normalizeThrottle(value) {
	const parsed = parseRateLimitValue(value);
	if (parsed === void 0 || parsed === null || parsed === false) return null;
	if (parsed === true) return { ...DEFAULT_THROTTLE };
	if (typeof parsed === "number") return {
		...DEFAULT_THROTTLE,
		interval: toPositiveNumber(parsed, DEFAULT_THROTTLE.interval)
	};
	if (typeof parsed !== "object") return null;
	const config = parsed;
	return {
		limit: Math.max(1, toPositiveNumber(config.limit, DEFAULT_THROTTLE.limit)),
		interval: toPositiveNumber(config.interval, DEFAULT_THROTTLE.interval),
		strict: Boolean(config.strict)
	};
}
/**
* Normalize a `debounce` prop. A bare number is the *wait*
* (`debounce="300"` → 300ms). Returns `null` when debouncing is off.
*/
function normalizeDebounce(value) {
	const parsed = parseRateLimitValue(value);
	if (parsed === void 0 || parsed === null || parsed === false) return null;
	if (parsed === true) return { ...DEFAULT_DEBOUNCE };
	if (typeof parsed === "number") return {
		...DEFAULT_DEBOUNCE,
		wait: toPositiveNumber(parsed, DEFAULT_DEBOUNCE.wait)
	};
	if (typeof parsed !== "object") return null;
	const config = parsed;
	return {
		wait: toPositiveNumber(config.wait, DEFAULT_DEBOUNCE.wait),
		before: Boolean(config.before)
	};
}
/**
* Lit `hasChanged` for a rate-limit prop.
*
* **This is load-bearing.** In a template, `:throttle.prop="{ limit: 1 }"`
* allocates a NEW object on every parent re-render. With Lit's default `!==`
* check the element would see a change each time, rebuild the wrapper, and
* restart the timer — so on a frequently re-rendering parent a debounced call
* could be postponed forever and never fire at all. Comparing by value makes a
* re-created but equivalent config a no-op.
*/
function rateLimitHasChanged(value, old) {
	if (value === old) return false;
	if (typeof value !== "object" || typeof old !== "object") return true;
	if (value === null || old === null) return true;
	const next = value;
	const previous = old;
	const keys = new Set([...Object.keys(next), ...Object.keys(previous)]);
	for (const key of keys) if (next[key] !== previous[key]) return true;
	return false;
}
/**
* Lit attribute converter for a rate-limit prop, so the shorthand attribute
* forms (`debounce="300"`, `throttle`, `debounce='{"wait":300}'`) work in plain
* HTML and SSR without a `.prop` binding.
*/
var rateLimitConverter = {
	fromAttribute(value) {
		if (value === null) return void 0;
		return parseRateLimitValue(value);
	},
	toAttribute(value) {
		if (value === void 0 || value === null || value === false) return null;
		if (value === true) return "";
		if (typeof value === "number" || typeof value === "string") return String(value);
		return JSON.stringify(value);
	}
};
function isAbortError(error) {
	if (error instanceof DOMException && error.name === "AbortError") return true;
	return typeof error === "object" && error !== null && error.name === "AbortError";
}
/**
* Build a limiter around `run`.
*
* The wrapper is created lazily on the first `call()`, so nothing schedules a
* timer at construction time — important for SSR, where a limiter may be
* constructed but never called.
*
* `pending` counts calls that are still *waiting* — not merely unsettled. The
* distinction matters because a debounced burst collapses N calls into one
* execution and the losers only settle after it finishes: counting them as
* waiting would make the limiter report a phantom `pending` tail once the work
* was already done. So waiting is cleared when an execution starts (all of it
* for a debounce, one call for a throttle, whose queue really does keep
* waiting), and force-cleared whenever no call is outstanding at all — an
* invariant that also covers leading-edge debounces, where a trailing call
* settles without ever reaching `run`.
*
* Cancellation goes through an `AbortController`: both libraries take a
* `signal` and reject their pending promises when it fires. A signal is
* one-shot, so `cancel()` also drops the wrapper and the next `call()` rebuilds
* it with a fresh controller.
*/
function createRateLimiter(options) {
	const { kind, config, run, onChange } = options;
	let wrapped = null;
	let controller = null;
	let disposed = false;
	let waiting = 0;
	let running = 0;
	let outstanding = 0;
	const build = () => {
		controller = new AbortController();
		const signal = controller.signal;
		const inner = async (...args) => {
			waiting = kind === "debounce" ? 0 : Math.max(0, waiting - 1);
			running++;
			onChange?.();
			try {
				return await run(...args);
			} finally {
				running--;
				onChange?.();
			}
		};
		if (kind === "throttle") {
			const { limit, interval, strict } = config;
			return pThrottle({
				limit,
				interval,
				strict,
				signal
			})(inner);
		}
		const { wait, before } = config;
		return pDebounce(inner, wait, {
			before,
			signal
		});
	};
	const teardown = () => {
		controller?.abort();
		controller = null;
		wrapped = null;
		waiting = 0;
	};
	return {
		async call(...args) {
			if (disposed) return void 0;
			outstanding++;
			waiting++;
			onChange?.();
			try {
				wrapped ??= build();
				return await wrapped(...args);
			} catch (error) {
				if (isAbortError(error)) return void 0;
				throw error;
			} finally {
				outstanding--;
				if (outstanding === 0) waiting = 0;
				onChange?.();
			}
		},
		cancel() {
			teardown();
		},
		dispose() {
			disposed = true;
			teardown();
		},
		get pending() {
			return waiting;
		},
		get running() {
			return running;
		},
		get phase() {
			if (running > 0) return "running";
			return waiting > 0 ? "pending" : "idle";
		},
		get queueSize() {
			return wrapped?.queueSize ?? 0;
		}
	};
}
//#endregion
export { rateLimitHasChanged as a, rateLimitConverter as i, normalizeDebounce as n, normalizeThrottle as r, createRateLimiter as t };
