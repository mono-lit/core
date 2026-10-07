Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
let devextreme_data_data_source = require("devextreme/data/data_source");
devextreme_data_data_source = __toESM(devextreme_data_data_source, 1);
let devextreme_data_custom_store = require("devextreme/data/custom_store");
devextreme_data_custom_store = __toESM(devextreme_data_custom_store, 1);
let devextreme_data_odata_store = require("devextreme/data/odata/store");
devextreme_data_odata_store = __toESM(devextreme_data_odata_store, 1);
let devextreme_data_array_store = require("devextreme/data/array_store");
devextreme_data_array_store = __toESM(devextreme_data_array_store, 1);
let devextreme_core_config = require("devextreme/core/config");
devextreme_core_config = __toESM(devextreme_core_config, 1);

//#region pkg/license-check.ts
const LICENSE_CHECK_FLAG = Symbol.for("@mono-lit/devextreme.licenseCheck");
async function runLicenseCheck() {
	try {
		const candidate = (await import("devextreme/ui/load_indicator")).default;
		new (typeof candidate?.prototype?.dispose === "function" ? candidate : candidate?.default)(document.createElement("div")).dispose();
	} catch {}
}
function scheduleDevExtremeLicenseCheck() {
	try {
		if (typeof window === "undefined" || typeof document === "undefined") return;
		const g = globalThis;
		if (g[LICENSE_CHECK_FLAG]) return;
		g[LICENSE_CHECK_FLAG] = true;
		const run = () => {
			setTimeout(() => {
				runLicenseCheck();
			}, 0);
		};
		if (document.readyState === "complete") run();
		else window.addEventListener("load", run, { once: true });
	} catch {}
}

//#endregion
//#region pkg/index.ts
scheduleDevExtremeLicenseCheck();

//#endregion
Object.defineProperty(exports, 'ArrayStore', {
  enumerable: true,
  get: function () {
    return devextreme_data_array_store.default;
  }
});
Object.defineProperty(exports, 'CustomStore', {
  enumerable: true,
  get: function () {
    return devextreme_data_custom_store.default;
  }
});
Object.defineProperty(exports, 'DataSource', {
  enumerable: true,
  get: function () {
    return devextreme_data_data_source.default;
  }
});
Object.defineProperty(exports, 'ODataStore', {
  enumerable: true,
  get: function () {
    return devextreme_data_odata_store.default;
  }
});
Object.defineProperty(exports, 'config', {
  enumerable: true,
  get: function () {
    return devextreme_core_config.default;
  }
});