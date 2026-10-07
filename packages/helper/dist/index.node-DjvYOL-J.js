import "./mono-data-grid-Db80FzdZ.js";
import "./mono-ui-CPV7rrdo.js";
import "./mono-data-chart-ChU4Ii3p.js";
import "./mono-data-dropdown-BAUl58kW.js";
import "./tooltip-CysgRgBi.js";
//#endregion
//#region src/data/theme/presets.ts
var raw = {
	$comment: [
		"Source of truth for the colour presets: `one` (the default) and `basecoat` (Basecoat's own neutral palette). `scripts/theme-build.mjs` turns this into",
		"generated/tokens.css, generated/presets.css and generated/legacy.css (run `pnpm theme:build`).",
		"",
		"Token names are Basecoat / shadcn's (camelCased): background, foreground, card, popover,",
		"primary, secondary, muted, accent, destructive, border, input, ring, chart1-5, sidebar*,",
		"plus mono's extension roles: success, warning, info, teal, purple, neutral, dark.",
		"Colours are hex (or rgba() for translucent borders); the generator emits OKLCH.",
		"",
		"Missing keys are derived: *Foreground by WCAG contrast (white vs 87% black), card/popover",
		"from surface, secondary/accent from muted, input from border, sidebar-* from card/primary,",
		"chart1-5 as a lightness ramp on the primary hue. A missing `dark` block is derived with",
		"Basecoat's own light->dark deltas and is marked for review in ui/color.md; `\"dark\": false` means the",
		"preset has NO dark mode — under html.dark it keeps its light values (and light mode tokens).",
		"",
		"`legacy` holds the preset's pre-Basecoat `--theme-*` declarations VERBATIM. They ship in",
		"generated/legacy.css until 3.0 so un-ported components and consumer CSS render exactly as",
		"before. Do not edit them; they are history."
	],
	one: {
		"displayName": "ONE",
		"$comment": "EJI ONE design system v1.0 — light only: the guide defines no dark palette, so `dark: false` keeps ONE light under html.dark. See the legacy block's history in git for the WCAG notes.",
		"light": {
			"background": "#f4f6fb",
			"foreground": "#1f2937",
			"card": "#ffffff",
			"muted": "#f7f8fc",
			"mutedForeground": "#6b7280",
			"border": "#e4e7ef",
			"ring": "#1f2664",
			"primary": "#1f2664",
			"primaryForeground": "#ffffff",
			"destructive": "#dc2626",
			"success": "#15803d",
			"warning": "#b45309",
			"warningForeground": "#ffffff",
			"info": "#375ba3",
			"teal": "#0f7b6c",
			"purple": "#1d3184",
			"neutral": "#64748b",
			"neutralForeground": "#ffffff",
			"dark": "#0f172a",
			"input": "#d7dbe5",
			"accent": "#f0f3fd",
			"chart1": "#1f2664",
			"chart2": "#7c93d6",
			"chart3": "#e0a030",
			"chart4": "#e4e7ef"
		},
		"dark": false,
		"legacy": {
			"--theme-primary": "#1f2664",
			"--theme-secondary": "#375ba3",
			"--theme-accent": "#1f2664",
			"--theme-background": "#f4f6fb",
			"--theme-text": "#1f2937",
			"--theme-border": "#e4e7ef",
			"--theme-success": "#15803d",
			"--theme-danger": "#dc2626",
			"--theme-warning": "#b45309",
			"--theme-info": "#375ba3",
			"--theme-teal": "#0f7b6c",
			"--theme-purple": "#1d3184",
			"--theme-neutral": "#64748b",
			"--theme-dark": "#0f172a",
			"--theme-surface": "#ffffff",
			"--theme-surface-soft": "#f7f8fc",
			"--theme-primary-rgb": "31, 38, 100",
			"--theme-secondary-rgb": "55, 91, 163",
			"--theme-accent-rgb": "31, 38, 100",
			"--theme-background-rgb": "244, 246, 251",
			"--theme-text-rgb": "31, 41, 55",
			"--theme-border-rgb": "228, 231, 239",
			"--theme-success-rgb": "21, 128, 61",
			"--theme-danger-rgb": "220, 38, 38",
			"--theme-warning-rgb": "180, 83, 9",
			"--theme-info-rgb": "55, 91, 163",
			"--theme-teal-rgb": "15, 123, 108",
			"--theme-purple-rgb": "29, 49, 132",
			"--theme-neutral-rgb": "100, 116, 139",
			"--theme-dark-rgb": "15, 23, 42",
			"--theme-primary-light": "#3f5cc4",
			"--theme-primary-dark": "#171d52",
			"--theme-primary-contrast": "#ffffff",
			"--theme-secondary-light": "#7288dd",
			"--theme-secondary-dark": "#1d3184",
			"--theme-secondary-contrast": "#ffffff",
			"--theme-text-primary": "#1f2937",
			"--theme-text-secondary": "#6b7280",
			"--theme-text-disabled": "#8695ac",
			"--theme-placeholder": "#68768c",
			"--theme-background-default": "#f4f6fb",
			"--theme-divider": "#e4e7ef",
			"--theme-action-hover": "rgba(15, 23, 42, 0.04)",
			"--theme-action-selected": "rgba(var(--theme-primary-rgb), 0.06)",
			"--theme-success-dark": "#166534",
			"--theme-danger-dark": "#b91c1c",
			"--theme-warning-dark": "#92400e",
			"--theme-warning-contrast": "#ffffff",
			"--theme-teal-contrast": "#ffffff",
			"--theme-neutral-contrast": "#ffffff",
			"--theme-pillar-commercial": "#152568",
			"--theme-pillar-operasional": "#2a44a8",
			"--theme-pillar-fat": "#0f7b6c",
			"--theme-pillar-budgeting": "#b7791f",
			"--theme-pillar-distributor": "#1d3184"
		}
	},
	basecoat: {
		"displayName": "Basecoat (neutral)",
		"$comment": "Basecoat's own :root/.dark values, read VERBATIM from vendor/basecoat/base/base.css at build time; only the extension roles are authored here.",
		"vendor": true,
		"light": {
			"success": "#16a34a",
			"warning": "#ca8a04",
			"warningForeground": "rgba(0, 0, 0, 0.87)",
			"info": "#2563eb",
			"teal": "#0d9488",
			"purple": "#7c3aed",
			"neutral": "#737373",
			"dark": "#171717"
		},
		"dark": {
			"success": "#4ade80",
			"warning": "#facc15",
			"info": "#60a5fa",
			"teal": "#2dd4bf",
			"purple": "#a78bfa",
			"neutral": "#808080",
			"neutralForeground": "#ffffff",
			"dark": "#d4d4d4",
			"darkForeground": "#171717"
		},
		"legacy": {}
	}
};
function pick(name) {
	const p = raw[name];
	return {
		displayName: p.displayName,
		light: p.light,
		dark: p.dark
	};
}
var themePresets = {
	one: pick("one"),
	basecoat: pick("basecoat")
};
var DEFAULT_THEME = "one";
var DEFAULT_FLAVOR = "one";
var flavorPresets = {
	one: {
		displayName: "ONE",
		summary: "EJI ONE design system: Poppins, 40px controls, 8px control radius, semibold sentence-case labels, soft shadows.",
		controlHeights: [
			1.75,
			2.25,
			2.5,
			2.75,
			3,
			3.25
		]
	},
	vega: {
		displayName: "Vega",
		summary: "The Basecoat default: rounded-md, h-9 controls.",
		vendor: "vega",
		controlHeights: [
			1.5,
			2,
			2.25,
			2.5,
			2.75,
			3
		]
	},
	nova: {
		displayName: "Nova",
		summary: "Compact, rounded-lg, h-8 controls.",
		vendor: "nova",
		controlHeights: [
			1.5,
			1.75,
			2,
			2.25,
			2.5,
			2.75
		]
	},
	maia: {
		displayName: "Maia",
		summary: "Pill-shaped, roomy padding, tinted outline surfaces.",
		vendor: "maia",
		controlHeights: [
			1.5,
			2,
			2.25,
			2.5,
			2.75,
			3
		]
	},
	lyra: {
		displayName: "Lyra",
		summary: "Square corners, small type, 1px focus ring.",
		vendor: "lyra",
		controlHeights: [
			1.5,
			1.75,
			2,
			2.25,
			2.5,
			2.75
		]
	},
	mira: {
		displayName: "Mira",
		summary: "Dense: h-7 controls, text-xs, tight padding.",
		vendor: "mira",
		controlHeights: [
			1.25,
			1.5,
			1.75,
			2,
			2.25,
			2.5
		]
	},
	luma: {
		displayName: "Luma",
		summary: "Pill-shaped and soft, 30% focus ring.",
		vendor: "luma",
		controlHeights: [
			1.5,
			2,
			2.25,
			2.5,
			2.75,
			3
		]
	},
	sera: {
		displayName: "Sera",
		summary: "Editorial: square, uppercase, h-10 controls, wide padding.",
		vendor: "sera",
		controlHeights: [
			1.75,
			2.25,
			2.5,
			2.75,
			3,
			3.25
		]
	},
	rhea: {
		displayName: "Rhea",
		summary: "Compact, rounded-2xl, 30% focus ring.",
		vendor: "rhea",
		controlHeights: [
			1.5,
			1.75,
			2,
			2.25,
			2.5,
			2.75
		]
	}
};
//#endregion
//#region src/data/theme/index.ts
var themes = Object.fromEntries(Object.keys(themePresets).map((name) => [name, {
	name,
	displayName: themePresets[name].displayName
}]));
var flavors = Object.fromEntries(Object.keys(flavorPresets).map((name) => [name, {
	name,
	displayName: flavorPresets[name].displayName
}]));
var COLOR_CLASS_PREFIX = "theme-color-";
var COLOR_CLASSES = Object.keys(themes).map((name) => `${COLOR_CLASS_PREFIX}${name}`);
var STRUCTURE_CLASS_PREFIX = "theme-";
var STRUCTURE_CLASSES = Object.keys(flavors).filter((name) => name !== "one").map((name) => `${STRUCTURE_CLASS_PREFIX}${name}`);
function getThemeTarget() {
	return document.body || document.documentElement;
}
function setColorClass(themeName) {
	if (!themes[themeName]) {
		console.warn(`Theme color "${themeName}" not found`);
		return false;
	}
	const target = getThemeTarget();
	target.classList.remove(...COLOR_CLASSES);
	target.classList.add(`${COLOR_CLASS_PREFIX}${themeName}`);
	document.documentElement.setAttribute("data-theme-color", themeName);
	return true;
}
function setFlavorClass(flavorName) {
	if (!flavors[flavorName]) {
		console.warn(`Theme "${flavorName}" not found`);
		return false;
	}
	const target = getThemeTarget();
	target.classList.remove(...STRUCTURE_CLASSES);
	if (flavorName !== "one") target.classList.add(`${STRUCTURE_CLASS_PREFIX}${flavorName}`);
	document.documentElement.setAttribute("data-theme", flavorName);
	return true;
}
function dispatchThemeChanged() {
	const color = getCurrentTheme();
	const flavor = getCurrentFlavor();
	window.dispatchEvent(new CustomEvent("theme-changed", {
		detail: {
			theme: color,
			themeData: themes[color],
			color,
			flavor,
			flavorData: flavors[flavor]
		},
		bubbles: true,
		composed: true
	}));
}
function applyTheme(input) {
	let changed = false;
	if (typeof input === "string") changed = setColorClass(input) || changed;
	else {
		if (input.color !== void 0) changed = setColorClass(input.color) || changed;
		if (input.flavor !== void 0) changed = setFlavorClass(input.flavor) || changed;
	}
	if (changed) dispatchThemeChanged();
}
function applyFlavor(flavorName) {
	if (setFlavorClass(flavorName)) dispatchThemeChanged();
}
function getCurrentTheme() {
	const target = getThemeTarget();
	for (const themeName of Object.keys(themes)) if (target.classList.contains(`${COLOR_CLASS_PREFIX}${themeName}`)) return themeName;
	const dataColor = document.documentElement.getAttribute("data-theme-color");
	if (dataColor && isValidTheme(dataColor)) return dataColor;
	return "one";
}
function getCurrentFlavor() {
	const target = getThemeTarget();
	for (const flavorName of Object.keys(flavors)) {
		if (flavorName === "one") continue;
		if (target.classList.contains(`${STRUCTURE_CLASS_PREFIX}${flavorName}`)) return flavorName;
	}
	const dataTheme = document.documentElement.getAttribute("data-theme");
	if (dataTheme && isValidFlavor(dataTheme)) return dataTheme;
	return "one";
}
function getThemeData(themeName) {
	return themes[themeName];
}
function getFlavorData(flavorName) {
	return flavors[flavorName];
}
function getAllThemes() {
	return Object.values(themes);
}
function getAllFlavors() {
	return Object.values(flavors);
}
function isValidTheme(themeName) {
	return themeName in themes;
}
function isValidFlavor(flavorName) {
	return flavorName in flavors;
}
function resetTheme() {
	applyTheme({
		color: "one",
		flavor: "one"
	});
}
function resetFlavor() {
	applyFlavor("one");
}
function createThemeClass(themeName) {
	return `${COLOR_CLASS_PREFIX}${themeName}`;
}
/** Structure class for a flavor — empty for `one` (the default, no class). */
function createFlavorClass(flavorName) {
	return flavorName === "one" ? "" : `${STRUCTURE_CLASS_PREFIX}${flavorName}`;
}
//#endregion
export { DEFAULT_FLAVOR as _, flavors as a, themePresets as b, getCurrentFlavor as c, getThemeData as d, isValidFlavor as f, themes as g, resetTheme as h, createThemeClass as i, getCurrentTheme as l, resetFlavor as m, applyTheme as n, getAllFlavors as o, isValidTheme as p, createFlavorClass as r, getAllThemes as s, applyFlavor as t, getFlavorData as u, DEFAULT_THEME as v, flavorPresets as y };
