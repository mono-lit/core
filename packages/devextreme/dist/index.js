import DataSource from "devextreme/data/data_source";
import CustomStore from "devextreme/data/custom_store";
import ODataStore from "devextreme/data/odata/store";
import ArrayStore from "devextreme/data/array_store";
import config from "devextreme/core/config";

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
export { ArrayStore, CustomStore, DataSource, ODataStore, config };