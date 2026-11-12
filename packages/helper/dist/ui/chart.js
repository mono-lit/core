import { i as composeApply, n as buildChartApply, r as buildChartOdataRequest, t as monoChart } from "../mono-data-chart-ChF4J9RT.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import { n as loadChartJs, t as MonoChartCore } from "../chart-core-DV7hD3ZY.js";
import { LitElement } from "lit";

//#region src/components/chart/mono-chart.ts
let MonoChart = class MonoChart extends MonoChartCore(LitElement) {
	createRenderRoot() {
		return this;
	}
	render() {
		return this.renderChart();
	}
};
MonoChart = __decorate([customElement("mono-chart")], MonoChart);

//#endregion
//#region src/components/chart/mono-chart-presets.ts
let MonoChartBar = class MonoChartBar extends MonoChartCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._presetType = "bar";
	}
	createRenderRoot() {
		return this;
	}
	render() {
		return this.renderChart();
	}
};
MonoChartBar = __decorate([customElement("mono-chart-bar")], MonoChartBar);
let MonoChartLine = class MonoChartLine extends MonoChartCore(LitElement) {
	constructor(..._args2) {
		super(..._args2);
		this._presetType = "line";
	}
	createRenderRoot() {
		return this;
	}
	render() {
		return this.renderChart();
	}
};
MonoChartLine = __decorate([customElement("mono-chart-line")], MonoChartLine);
let MonoChartPie = class MonoChartPie extends MonoChartCore(LitElement) {
	constructor(..._args3) {
		super(..._args3);
		this._presetType = "pie";
	}
	createRenderRoot() {
		return this;
	}
	render() {
		return this.renderChart();
	}
};
MonoChartPie = __decorate([customElement("mono-chart-pie")], MonoChartPie);
let MonoChartDoughnut = class MonoChartDoughnut extends MonoChartCore(LitElement) {
	constructor(..._args4) {
		super(..._args4);
		this._presetType = "doughnut";
	}
	createRenderRoot() {
		return this;
	}
	render() {
		return this.renderChart();
	}
};
MonoChartDoughnut = __decorate([customElement("mono-chart-doughnut")], MonoChartDoughnut);

//#endregion
export { MonoChart, MonoChartBar, MonoChartCore, MonoChartDoughnut, MonoChartLine, MonoChartPie, buildChartApply, buildChartOdataRequest, composeApply, monoChart as controlMonoChart, monoChart, loadChartJs };