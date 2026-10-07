import { n as mergeEcosystem, r as monoEcosystem } from "./merge-file-CtyKTu5L.js";
import fs from "node:fs";
import path, { resolve } from "node:path";
import fs$1 from "node:fs/promises";

//#region src/composables/vite-html-to-vue.ts
function normalizeScriptType(value) {
	return value?.trim().toLowerCase() || void 0;
}
function normalizeScriptWarmupStrategy(value) {
	const v = value?.trim().toLowerCase();
	switch (v) {
		case "preload":
		case "prefetch":
		case "preconnect":
		case "dns-prefetch": return v;
		case "false": return false;
		default: return;
	}
}
function stripJsComments(code) {
	return code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}
function buildInlineHeadScriptKey(projectNameCamel, root, htmlAbs, index) {
	return `${projectNameCamel}-${path.relative(root, htmlAbs).replace(/\\/g, "/").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}-inline-${index}`;
}
function normalizeExecutableBody(code) {
	return stripJsComments(removeImports(code)).trim();
}
function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function hasExecutableReference(code, ref) {
	if (!code.trim() || !ref.trim()) return false;
	return new RegExp(`(?<![A-Za-z0-9_$])${escapeRegExp(ref)}(?![A-Za-z0-9_$])`).test(code);
}
function isRemoteScriptActivelyUsed(item, executableBodies) {
	if (!item.use) return false;
	return uniq([item.use.expr, item.use.as].filter((v) => !!v)).some((ref) => executableBodies.some((body) => hasExecutableReference(body, ref)));
}
function splitImportClause(clause) {
	const parts = [];
	let current = "";
	let depth = 0;
	for (const ch of clause) {
		if (ch === "{") depth++;
		if (ch === "}") depth--;
		if (ch === "," && depth === 0) {
			if (current.trim()) parts.push(current.trim());
			current = "";
			continue;
		}
		current += ch;
	}
	if (current.trim()) parts.push(current.trim());
	return parts;
}
function parseUseExpression(value) {
	if (!value) return void 0;
	const raw = value.trim();
	if (!raw) return void 0;
	const match = raw.match(/^(.*?)\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*)$/);
	if (match) {
		const expr = match[1]?.trim();
		const as = match[2]?.trim();
		if (!expr) return void 0;
		return {
			expr,
			as
		};
	}
	return { expr: raw };
}
function renderUseScriptCall(item) {
	if (!item.use) return `useScript(${toCode(item.input)})`;
	return `useScript(${toCode(item.input)}, { use: () => ${item.use.expr} })`;
}
function extractImportBindings(clause) {
	if (!clause) return [];
	const out = [];
	for (const part of splitImportClause(clause.trim())) {
		const item = part.replace(/^type\s+/, "").trim();
		if (!item) continue;
		const nsMatch = item.match(/^\*\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*)$/);
		if (nsMatch) {
			out.push(nsMatch[1]);
			continue;
		}
		if (item.startsWith("{") && item.endsWith("}")) {
			const inner = item.slice(1, -1).trim();
			if (!inner) continue;
			for (const raw of inner.split(",")) {
				const named = raw.replace(/^type\s+/, "").trim();
				if (!named) continue;
				const asMatch = named.match(/^([A-Za-z_$][A-Za-z0-9_$]*)\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*)$/);
				if (asMatch) {
					out.push(asMatch[2]);
					continue;
				}
				const plainMatch = named.match(/^([A-Za-z_$][A-Za-z0-9_$]*)$/);
				if (plainMatch) out.push(plainMatch[1]);
			}
			continue;
		}
		const defaultMatch = item.match(/^([A-Za-z_$][A-Za-z0-9_$]*)$/);
		if (defaultMatch) out.push(defaultMatch[1]);
	}
	return uniq(out);
}
function renderWindowRunModule(globalFnName, injectedNames, body) {
	return [
		injectedNames.length ? `window.${globalFnName} = function ({ ${injectedNames.join(", ")} } = {}) {` : `window.${globalFnName} = function () {`,
		indent(body.trim(), 2),
		"}"
	].filter(Boolean).join("\n");
}
function buildGlobalRunnerName(projectNameCamel, scriptAbs) {
	return `${projectNameCamel}Run${pascalCase(fileBaseStem(scriptAbs))}Fn`;
}
function fileStemFromAbs(root, abs) {
	return path.relative(root, abs).replace(/\\/g, "/").replace(/\.[^.]+$/, "").split("/").filter(Boolean).join("-");
}
function normalizeVueJsOutPath(value) {
	let next = value.replace(/\\/g, "/").trim();
	next = next.replace(/^\.\/+/, "");
	next = next.replace(/^\/+/, "");
	if (!next.endsWith(".js")) next += ".js";
	return next;
}
function normalizeCssOutPath(value) {
	let next = value.replace(/\\/g, "/").trim();
	next = next.replace(/^\.\/+/, "");
	next = next.replace(/^\/+/, "");
	if (!next.endsWith(".css")) next += ".css";
	return next;
}
function normalizeOverridePath(value) {
	if (!value) return void 0;
	return value.replace(/\/+$/, "").trim();
}
function toGeneratedImportSpecifier(ctx, fromOutPath, toOutPath) {
	const normalizedTo = toOutPath.replace(/\\/g, "/");
	if (ctx.overridePath) return `${ctx.overridePath}/${normalizedTo}`;
	return toVueRelativeImport(fromOutPath, normalizedTo);
}
function readProjectNameCamel(root) {
	const pkgPath = findNearestPackageJson(root);
	if (!pkgPath) return "app";
	try {
		const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
		return toCamelCase(String(pkg.name || path.basename(root)).split("/").pop() || "app");
	} catch {
		return "app";
	}
}
function findNearestPackageJson(start) {
	let dir = start;
	while (true) {
		const candidate = path.join(dir, "package.json");
		if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
		const parent = path.dirname(dir);
		if (parent === dir) return null;
		dir = parent;
	}
}
function toCamelCase(value) {
	const parts = value.replace(/^@/, "").split(/[\/\-_]+/).filter(Boolean);
	if (!parts.length) return "app";
	return parts.map((part, index) => index === 0 ? part.charAt(0).toLowerCase() + part.slice(1) : part.charAt(0).toUpperCase() + part.slice(1)).join("");
}
function htmlToVue(options) {
	const ctx = {
		root: process.cwd(),
		componentRootAbs: "",
		componentOutDir: "components",
		overridePath: void 0,
		projectNameCamel: "app",
		pages: []
	};
	return {
		name: "html-to-vue",
		apply: "build",
		configResolved(config) {
			ctx.root = config.root;
			ctx.componentRootAbs = resolveFromRoot(ctx.root, options.components?.path ?? "./components");
			ctx.componentOutDir = normalizeDirPath(options.components?.outDir ?? "components");
			ctx.overridePath = normalizeOverridePath(options.overridePath);
			ctx.projectNameCamel = readProjectNameCamel(ctx.root);
			ctx.pages = (options.pages?.list ?? []).map((page) => ({
				htmlAbs: resolveFromRoot(ctx.root, page.html),
				pagePath: normalizeVueOutPath(page.pagePath ?? defaultPagePath(page.html))
			}));
		},
		async generateBundle() {
			const emitted = /* @__PURE__ */ new Map();
			const componentCache = /* @__PURE__ */ new Map();
			const scriptCache = /* @__PURE__ */ new Map();
			const plainScriptCache = /* @__PURE__ */ new Map();
			const styleCache = /* @__PURE__ */ new Map();
			for (const page of ctx.pages) {
				const sfc = await compileHtmlFile({
					ctx,
					htmlAbs: page.htmlAbs,
					outPath: page.pagePath,
					emitted,
					componentCache,
					scriptCache,
					plainScriptCache,
					styleCache
				});
				emitted.set(page.pagePath, sfc);
			}
			for (const [outPath, source] of emitted) this.emitFile({
				type: "asset",
				fileName: `vue/src/${outPath}`,
				source
			});
		}
	};
}
async function compileHtmlFile(args) {
	const { ctx, htmlAbs, outPath, emitted, componentCache, scriptCache, plainScriptCache, styleCache } = args;
	const htmlSource = await fs$1.readFile(htmlAbs, "utf8");
	const componentResult = await replaceLoadTagsWithComponents({
		ctx,
		template: extractTemplateRaw(htmlSource),
		ownerHtmlAbs: htmlAbs,
		ownerOutPath: outPath,
		emitted,
		componentCache,
		scriptCache,
		plainScriptCache,
		styleCache
	});
	const detected = await detectAssetsFromHtmlWithSiblings(ctx, htmlAbs, htmlSource);
	uniq(detected.remoteScripts.map((item) => item.use?.as).filter((value) => !!value));
	const inlineScripts = analyzeInlineScripts(ctx, htmlAbs, htmlSource);
	const inlineExecutableBodies = inlineScripts.mountedBodies.map((body) => stripJsComments(body).trim()).filter(Boolean);
	const localScriptExecutableBodies = (await Promise.all(detected.localScripts.map(async (scriptEntry) => {
		try {
			const code = await fs$1.readFile(scriptEntry.sourceAbs, "utf8");
			return analyzeExternalScript(ctx.root, scriptEntry.sourceAbs, code).body;
		} catch {
			return "";
		}
	}))).filter(Boolean);
	const executableBodies = [...inlineExecutableBodies, ...localScriptExecutableBodies];
	const activeRemoteScriptIndexes = detected.remoteScripts.map((item, index) => isRemoteScriptActivelyUsed(item, executableBodies) ? index : -1).filter((index) => index >= 0);
	const activeRemoteInjectedNames = uniq(activeRemoteScriptIndexes.map((index) => detected.remoteScripts[index]?.use?.as).filter((value) => !!value));
	const scriptUrlImportLines = [];
	const scriptPageImportLines = [];
	const scriptSetupLines = [];
	const scriptLoadedLines = [];
	const extraStyleFiles = [];
	for (const scriptEntry of detected.localScripts) try {
		const mod = await ensureScriptModule({
			ctx,
			root: ctx.root,
			scriptEntry,
			ownerOutPath: outPath,
			emitted,
			scriptCache,
			plainScriptCache,
			styleCache,
			extraInjectedNames: activeRemoteInjectedNames
		});
		scriptPageImportLines.push(...mod.pageImportLines);
		scriptUrlImportLines.push(mod.scriptUrlImportLine);
		scriptSetupLines.push(mod.setupLine);
		if (mod.loadedLine) scriptLoadedLines.push(mod.loadedLine);
		extraStyleFiles.push(...mod.ref.localStyles);
	} catch {}
	const styleImportLines = [];
	const allStyleFiles = uniq([...detected.localStyles, ...extraStyleFiles]);
	for (const styleAbs of allStyleFiles) try {
		const line = await ensureStyleAsset({
			ctx,
			root: ctx.root,
			styleAbs,
			ownerOutPath: outPath,
			emitted,
			styleCache
		});
		styleImportLines.push(line);
	} catch {}
	return renderVueSfc({
		template: stripTemplateAssets(componentResult.template),
		style: extractAllStyleBlocks(htmlSource),
		scriptBody: joinNonEmpty([...inlineScripts.mountedBodies]),
		importLines: uniq([
			...styleImportLines,
			...componentResult.importLines,
			...inlineScripts.importLines,
			...scriptPageImportLines,
			...scriptUrlImportLines
		]),
		setupLines: uniq(scriptSetupLines),
		loadedLines: uniq(scriptLoadedLines),
		remoteScripts: uniqObjects(detected.remoteScripts),
		activeRemoteScriptIndexes,
		remoteStyleLinks: uniqObjects(detected.remoteStyleLinks),
		inlineHeadScripts: uniqObjects(inlineScripts.headScripts)
	});
}
async function replaceLoadTagsWithComponents(args) {
	const { ctx, template, ownerHtmlAbs, ownerOutPath, emitted, componentCache, scriptCache, plainScriptCache, styleCache } = args;
	const importLines = [];
	return {
		template: await replaceAsync(template, /<load\b([^>]*?)(?:\/>|>\s*<\/load>)/gi, async (_full, rawAttrs) => {
			const src = getAttr(rawAttrs ?? "", "src");
			if (!src) return "";
			const childAbs = resolveHtmlAssetPath(ctx.root, path.dirname(ownerHtmlAbs), src);
			if (!childAbs || !childAbs.toLowerCase().endsWith(".html")) return "";
			const childRef = await ensureComponent({
				ctx,
				htmlAbs: childAbs,
				emitted,
				componentCache,
				scriptCache,
				plainScriptCache,
				styleCache
			});
			const importPath = toGeneratedImportSpecifier(ctx, ownerOutPath, childRef.outPath);
			importLines.push(`import ${childRef.name} from ${JSON.stringify(importPath)}`);
			return `<${childRef.name} />`;
		}),
		importLines: uniq(importLines)
	};
}
function buildWindowRunCallLine(onLoadedVar, globalFnName, injectedNames) {
	return `${onLoadedVar}(() => { ${injectedNames.length ? `window.${globalFnName}?.({ ${injectedNames.join(", ")} })` : `window.${globalFnName}?.()`} })`;
}
function buildGeneratedScriptUseScriptLine(args) {
	const { scriptVar, onLoadedVar, scriptEntry } = args;
	const input = {
		src: scriptVar,
		...scriptEntry.type ? { type: scriptEntry.type } : {}
	};
	const options = {
		trigger: "client",
		...scriptEntry.warmupStrategy !== void 0 ? { warmupStrategy: scriptEntry.warmupStrategy } : {}
	};
	return `const { onLoaded: ${onLoadedVar} } = useScript(${toCode(input)}, ${toCode(options)})`;
}
async function ensureScriptModule(args) {
	const { ctx, root, scriptEntry, ownerOutPath, emitted, scriptCache, plainScriptCache, styleCache, extraInjectedNames } = args;
	const scriptAbs = scriptEntry.sourceAbs;
	const scriptCacheKey = `${scriptAbs}::${uniq([...extraInjectedNames]).slice().sort().join(",")}`;
	const cached = scriptCache.get(scriptCacheKey);
	if (cached) {
		const pageImportLines = [...cached.staticPageImportLines, ...cached.localPageImports.map((item) => item.clause ? `import ${item.clause} from ${JSON.stringify(toGeneratedImportSpecifier(ctx, ownerOutPath, item.outPath))}` : `import ${JSON.stringify(toGeneratedImportSpecifier(ctx, ownerOutPath, item.outPath))}`)];
		const scriptVar = `__scriptUrl${pascalCase(fileBaseStem(scriptAbs))}`;
		const onLoadedVar = `__onLoaded${pascalCase(fileBaseStem(scriptAbs))}`;
		return {
			ref: cached,
			pageImportLines: uniq(pageImportLines),
			scriptUrlImportLine: `import ${scriptVar} from ${JSON.stringify(`${toGeneratedImportSpecifier(ctx, ownerOutPath, cached.outPath)}?url`)}`,
			setupLine: buildGeneratedScriptUseScriptLine({
				scriptVar,
				onLoadedVar,
				scriptEntry
			}),
			loadedLine: cached.hasBody ? buildWindowRunCallLine(onLoadedVar, cached.globalFnName, cached.injectedNames) : ""
		};
	}
	const analyzed = analyzeExternalScript(root, scriptAbs, await fs$1.readFile(scriptAbs, "utf8"));
	const fileStem = fileStemFromAbs(root, scriptAbs);
	const outPath = normalizeVueJsOutPath(`script/${fileStem}.js`);
	const globalFnName = buildGlobalRunnerName(ctx.projectNameCamel, scriptAbs);
	const localPageImports = [];
	for (const item of analyzed.localJsImports) {
		const depStem = `${fileStem}-${fileBaseStem(item.sourceAbs)}`;
		const depRef = await ensurePlainScriptModule({
			root,
			sourceAbs: item.sourceAbs,
			outStem: depStem,
			emitted,
			plainScriptCache,
			styleCache
		});
		localPageImports.push({
			clause: item.clause,
			outPath: depRef.outPath
		});
	}
	const finalInjectedNames = uniq([...analyzed.injectedNames, ...extraInjectedNames]);
	const moduleSource = renderWindowRunModule(globalFnName, finalInjectedNames, analyzed.body);
	const ref = {
		sourceAbs: scriptAbs,
		outPath,
		globalFnName,
		localStyles: analyzed.localStyles,
		staticPageImportLines: analyzed.pageImportLines,
		localPageImports,
		injectedNames: finalInjectedNames,
		hasBody: !!analyzed.body
	};
	scriptCache.set(scriptCacheKey, ref);
	emitted.set(outPath, moduleSource);
	const pageImportLines = [...ref.staticPageImportLines, ...ref.localPageImports.map((item) => item.clause ? `import ${item.clause} from ${JSON.stringify(toGeneratedImportSpecifier(ctx, ownerOutPath, item.outPath))}` : `import ${JSON.stringify(toGeneratedImportSpecifier(ctx, ownerOutPath, item.outPath))}`)];
	const scriptVar = `__scriptUrl${pascalCase(fileBaseStem(scriptAbs))}`;
	const onLoadedVar = `__onLoaded${pascalCase(fileBaseStem(scriptAbs))}`;
	return {
		ref,
		pageImportLines: uniq(pageImportLines),
		scriptUrlImportLine: `import ${scriptVar} from ${JSON.stringify(`${toGeneratedImportSpecifier(ctx, ownerOutPath, outPath)}?url`)}`,
		setupLine: buildGeneratedScriptUseScriptLine({
			scriptVar,
			onLoadedVar,
			scriptEntry
		}),
		loadedLine: ref.hasBody ? buildWindowRunCallLine(onLoadedVar, ref.globalFnName, ref.injectedNames) : ""
	};
}
function fileBaseStem(abs) {
	return path.basename(abs, path.extname(abs));
}
async function ensurePlainScriptModule(args) {
	const { root, sourceAbs, outStem, emitted, plainScriptCache, styleCache } = args;
	const cacheKey = `${sourceAbs}::${outStem}`;
	const cached = plainScriptCache.get(cacheKey);
	if (cached) return cached;
	const outPath = normalizeVueJsOutPath(`script/${outStem}.js`);
	const fileDir = path.dirname(sourceAbs);
	const nextCode = await replaceAsync(await fs$1.readFile(sourceAbs, "utf8"), /^\s*import\s+(?:(.*?)\s+from\s+)?['"]([^'"]+)['"]\s*;?\s*$/gm, async (full, clauseRaw, specRaw) => {
		const clause = clauseRaw?.trim();
		const spec = specRaw?.trim();
		if (!spec) return full.trim();
		if (isRemoteUrl(spec) || isBareImport(spec)) return full.trim();
		const resolved = resolveJsImportPath(root, fileDir, spec);
		if (!resolved) return full.trim();
		if (resolved.endsWith(".css")) {
			const cssOutPath = await ensureStyleAssetOutPath({
				root,
				styleAbs: resolved,
				emitted,
				styleCache
			});
			return `import ${JSON.stringify(toVueRelativeImport(outPath, cssOutPath))}`;
		}
		const nextSpec = toVueRelativeImport(outPath, (await ensurePlainScriptModule({
			root,
			sourceAbs: resolved,
			outStem: `${outStem}-${fileBaseStem(resolved)}`,
			emitted,
			plainScriptCache,
			styleCache
		})).outPath);
		return clause ? `import ${clause} from ${JSON.stringify(nextSpec)}` : `import ${JSON.stringify(nextSpec)}`;
	});
	const ref = {
		sourceAbs,
		outPath
	};
	plainScriptCache.set(cacheKey, ref);
	emitted.set(outPath, nextCode);
	return ref;
}
async function ensureStyleAsset(args) {
	const { ctx, root, styleAbs, ownerOutPath, emitted, styleCache } = args;
	const outPath = await ensureStyleAssetOutPath({
		root,
		styleAbs,
		emitted,
		styleCache
	});
	return `import ${JSON.stringify(toGeneratedImportSpecifier(ctx, ownerOutPath, outPath))}`;
}
async function ensureComponent(args) {
	const { ctx, htmlAbs, emitted, componentCache, scriptCache, plainScriptCache, styleCache } = args;
	const cached = componentCache.get(htmlAbs);
	if (cached) return cached;
	const name = componentNameFromPath(ctx.componentRootAbs, ctx.root, htmlAbs);
	const outPath = normalizeVueOutPath(`${ctx.componentOutDir}/${name}.vue`);
	const ref = {
		name,
		outPath
	};
	componentCache.set(htmlAbs, ref);
	const sfc = await compileHtmlFile({
		ctx,
		htmlAbs,
		outPath,
		emitted,
		componentCache,
		scriptCache,
		plainScriptCache,
		styleCache
	});
	emitted.set(outPath, sfc);
	return ref;
}
async function detectAssetsFromHtmlWithSiblings(ctx, htmlAbs, htmlSource) {
	const detected = detectAssetsFromHtml(ctx.root, htmlAbs, htmlSource);
	const sibling = await detectSiblingAssets(htmlAbs);
	return {
		localScripts: uniqObjects([...detected.localScripts, ...sibling.localScripts]),
		localStyles: uniq([...detected.localStyles, ...sibling.localStyles]),
		remoteScripts: uniqObjects(detected.remoteScripts),
		remoteStyleLinks: uniqObjects(detected.remoteStyleLinks)
	};
}
function detectAssetsFromHtml(root, htmlFile, htmlSource) {
	const htmlDir = path.dirname(resolveFromRoot(root, htmlFile));
	const localScripts = [];
	const localStyles = [];
	const remoteScripts = [];
	const remoteStyleLinks = [];
	for (const match of htmlSource.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
		const attrs = match[1] ?? "";
		const type = getAttr(attrs, "type")?.toLowerCase();
		if (type === "importmap") continue;
		const src = getAttr(attrs, "src");
		if (!src) continue;
		if (isRemoteUrl(src)) {
			remoteScripts.push(scriptAttrsToRemoteScriptEntry(src, attrs));
			continue;
		}
		if (isIgnoredHtmlAsset(src)) continue;
		const resolved = resolveHtmlAssetPath(root, htmlDir, src);
		if (resolved) localScripts.push({
			sourceAbs: resolved,
			type: normalizeScriptType(type),
			warmupStrategy: normalizeScriptWarmupStrategy(getAttr(attrs, "rel"))
		});
	}
	for (const match of htmlSource.matchAll(/<link\b([^>]*?)>/gi)) {
		const attrs = match[1] ?? "";
		if (getAttr(attrs, "rel")?.toLowerCase() !== "stylesheet") continue;
		const href = getAttr(attrs, "href");
		if (!href) continue;
		if (isRemoteUrl(href)) {
			remoteStyleLinks.push(linkAttrsToHeadLink(href, attrs));
			continue;
		}
		if (isIgnoredHtmlAsset(href)) continue;
		const resolved = resolveHtmlAssetPath(root, htmlDir, href);
		if (resolved) localStyles.push(resolved);
	}
	return {
		localScripts: uniqObjects(localScripts),
		localStyles: uniq(localStyles),
		remoteScripts,
		remoteStyleLinks
	};
}
async function detectSiblingAssets(htmlAbs) {
	const base = htmlAbs.replace(/\.html$/i, "");
	const localScripts = [];
	const localStyles = [];
	if (await fileExists(`${base}.js`)) localScripts.push({
		sourceAbs: `${base}.js`,
		type: "module",
		warmupStrategy: void 0
	});
	if (await fileExists(`${base}.css`)) localStyles.push(`${base}.css`);
	return {
		localScripts,
		localStyles
	};
}
async function ensureStyleAssetOutPath(args) {
	const { root, styleAbs, emitted, styleCache } = args;
	const cached = styleCache.get(styleAbs);
	if (cached) return cached.outPath;
	const css = await fs$1.readFile(styleAbs, "utf8");
	const outPath = normalizeCssOutPath(`style/${fileStemFromAbs(root, styleAbs)}.css`);
	const ref = {
		sourceAbs: styleAbs,
		outPath
	};
	styleCache.set(styleAbs, ref);
	emitted.set(outPath, css);
	return outPath;
}
function analyzeExternalScript(root, filePath, code) {
	const pageImportLines = [];
	const injectedNames = [];
	const localStyles = [];
	const localJsImports = [];
	const fileDir = path.dirname(filePath);
	const importRe = /^\s*import\s+(?:(.*?)\s+from\s+)?['"]([^'"]+)['"]\s*;?\s*$/gm;
	let match;
	while (match = importRe.exec(code)) {
		const clause = match[1]?.trim();
		const spec = match[2]?.trim();
		if (!spec) continue;
		if (isRemoteUrl(spec) || isBareImport(spec)) {
			pageImportLines.push(match[0].trim());
			injectedNames.push(...extractImportBindings(clause));
			continue;
		}
		const resolved = resolveJsImportPath(root, fileDir, spec);
		if (!resolved) continue;
		if (resolved.endsWith(".css")) {
			localStyles.push(resolved);
			continue;
		}
		localJsImports.push({
			clause,
			sourceAbs: resolved
		});
		injectedNames.push(...extractImportBindings(clause));
	}
	const executableBody = normalizeExecutableBody(code);
	return {
		pageImportLines: uniq(pageImportLines),
		injectedNames: uniq(injectedNames),
		localStyles: uniq(localStyles),
		localJsImports,
		body: executableBody
	};
}
function buildScriptSetup(scriptBody, importLines, setupLines, loadedLines, remoteScripts, activeRemoteScriptIndexes, remoteStyleLinks, inlineHeadScripts) {
	const activeIndexSet = new Set(activeRemoteScriptIndexes);
	const scriptSetupLines = remoteScripts.map((item, index) => {
		const isActive = activeIndexSet.has(index);
		if (item.use && isActive) return `const { onLoaded: ${`__onLoaded${index}`} } = ${renderUseScriptCall(item)}`;
		return renderUseScriptCall(item);
	});
	const useWrappedScripts = remoteScripts.map((item, index) => ({
		item,
		index
	})).filter(({ item, index }) => !!item.use && activeIndexSet.has(index));
	const plainBody = scriptBody.trim();
	const topLevelLoadedBlocks = useWrappedScripts.map(({ item, index }) => {
		const cbArg = item.use?.as ? item.use.as : "";
		return [
			`__onLoaded${index}(${cbArg ? `(${cbArg}) => {` : `() => {`}`,
			indent(plainBody, 2),
			`})`
		].join("\n");
	});
	const mountedBlock = plainBody && !useWrappedScripts.length ? [
		"onMounted(() => {",
		indent(plainBody, 2),
		"})"
	].join("\n") : "";
	const headConfigParts = [];
	if (remoteStyleLinks.length) headConfigParts.push(`link: ${toCode(remoteStyleLinks)}`);
	if (inlineHeadScripts.length) headConfigParts.push(`script: ${toCode(inlineHeadScripts)}`);
	const headLine = headConfigParts.length ? `useHead({ ${headConfigParts.join(", ")} })` : "";
	return [
		"<script setup>",
		...mountedBlock ? [`import { onMounted } from 'vue'`] : [],
		...remoteScripts.length || setupLines.length || loadedLines.length ? [`import { useScript } from '@unhead/vue'`] : [],
		...remoteStyleLinks.length || inlineHeadScripts.length ? [`import { useHead } from '@unhead/vue'`] : [],
		...importLines,
		"",
		...headLine ? [headLine, ""] : [],
		...scriptSetupLines,
		...setupLines,
		...scriptSetupLines.length || setupLines.length ? [""] : [],
		...topLevelLoadedBlocks,
		...loadedLines,
		...topLevelLoadedBlocks.length || loadedLines.length ? [""] : [],
		mountedBlock,
		"<\/script>"
	].filter(Boolean).join("\n");
}
function renderVueSfc(parts) {
	return [
		`<template>\n${parts.template}\n</template>`,
		buildScriptSetup(parts.scriptBody, parts.importLines, parts.setupLines, parts.loadedLines, parts.remoteScripts, parts.activeRemoteScriptIndexes, parts.remoteStyleLinks, parts.inlineHeadScripts),
		`<style>\n${parts.style}\n</style>`
	].join("\n\n");
}
function analyzeInlineModuleScript(code) {
	const importLines = [];
	const importRe = /^\s*import\s+(?:(.*?)\s+from\s+)?['"]([^'"]+)['"]\s*;?\s*$/gm;
	let match;
	while (match = importRe.exec(code)) importLines.push(match[0].trim());
	return {
		importLines: uniq(importLines),
		body: normalizeExecutableBody(code)
	};
}
function analyzeInlineScripts(ctx, htmlAbs, html) {
	const importLines = [];
	const mountedBodies = [];
	const headScripts = [];
	let inlineIndex = 0;
	for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
		const attrs = match[1] ?? "";
		const content = (match[2] ?? "").trim();
		const src = getAttr(attrs, "src");
		const type = getAttr(attrs, "type")?.toLowerCase();
		if (src) continue;
		if (type === "importmap") continue;
		if (!content) continue;
		const key = buildInlineHeadScriptKey(ctx.projectNameCamel, ctx.root, htmlAbs, inlineIndex++);
		if (type === "module") {
			const analyzed = analyzeInlineModuleScript(content);
			importLines.push(...analyzed.importLines);
			if (analyzed.body.trim()) mountedBodies.push(analyzed.body.trim());
			continue;
		}
		headScripts.push({
			key,
			textContent: content,
			tagPosition: "bodyClose"
		});
	}
	return {
		importLines: uniq(importLines),
		mountedBodies,
		headScripts: uniqObjects(headScripts)
	};
}
function extractTemplateRaw(html) {
	const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
	if (bodyMatch) return bodyMatch[1].trim();
	return html.replace(/<!doctype[\s\S]*?>/gi, "").replace(/<html\b[^>]*>/gi, "").replace(/<\/html>/gi, "").replace(/<head\b[\s\S]*?<\/head>/gi, "").trim();
}
function stripTemplateAssets(template) {
	return template.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, "").replace(/<style\b[\s\S]*?<\/style>/gi, "").trim();
}
function extractAllStyleBlocks(html) {
	return [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1].trim()).filter(Boolean).join("\n\n");
}
function componentNameFromPath(componentRootAbs, root, htmlAbs) {
	return (isInsideDir(componentRootAbs, htmlAbs) ? path.relative(componentRootAbs, htmlAbs) : path.relative(root, htmlAbs)).replace(/\.html$/i, "").replace(/\\/g, "/").split("/").filter(Boolean).map(pascalCase).join("");
}
function scriptAttrsToRemoteScriptEntry(src, attrs) {
	const crossorigin = normalizeCrossorigin(getAttr(attrs, "crossorigin"));
	const referrerpolicy = normalizeReferrerPolicy(getAttr(attrs, "referrerpolicy"));
	const integrity = getAttr(attrs, "integrity");
	const use = parseUseExpression(getAttr(attrs, "use"));
	return {
		input: {
			src,
			...hasBooleanAttr(attrs, "async") ? { async: true } : {},
			...hasBooleanAttr(attrs, "defer") ? { defer: true } : {},
			...crossorigin !== void 0 ? { crossorigin } : {},
			...referrerpolicy !== void 0 ? { referrerpolicy } : {},
			...integrity ? { integrity } : {}
		},
		...use ? { use } : {}
	};
}
function linkAttrsToHeadLink(href, attrs) {
	return {
		rel: "stylesheet",
		href,
		...getAttr(attrs, "media") ? { media: getAttr(attrs, "media") } : {},
		...getAttr(attrs, "crossorigin") ? { crossorigin: getAttr(attrs, "crossorigin") } : {},
		...getAttr(attrs, "referrerpolicy") ? { referrerpolicy: getAttr(attrs, "referrerpolicy") } : {},
		...getAttr(attrs, "integrity") ? { integrity: getAttr(attrs, "integrity") } : {}
	};
}
function getAttr(attrs, name) {
	const re = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
	const match = attrs.match(re);
	return match?.[2] ?? match?.[3] ?? match?.[4] ?? null;
}
function hasBooleanAttr(attrs, name) {
	return new RegExp(`\\b${name}(?=\\s|>|$)`, "i").test(attrs);
}
function isRemoteUrl(value) {
	return /^https?:\/\//i.test(value);
}
function isBareImport(spec) {
	return !spec.startsWith("/") && !spec.startsWith("./") && !spec.startsWith("../") && !isRemoteUrl(spec);
}
function isIgnoredHtmlAsset(value) {
	const v = value.replace(/\\/g, "/");
	return v.startsWith("/_virtual/") || v.startsWith("/@") || v.includes("/node_modules/") || v.endsWith(".html.js") || isBareImport(v);
}
function resolveHtmlAssetPath(root, htmlDir, value) {
	const clean = stripQueryHash(value);
	return clean.startsWith("/") ? path.resolve(root, `.${clean}`) : path.resolve(htmlDir, clean);
}
function resolveExistingModulePath(base) {
	const candidates = uniq([
		base,
		`${base}.js`,
		`${base}.mjs`,
		`${base}.cjs`,
		`${base}.ts`,
		`${base}.mts`,
		`${base}.cts`,
		`${base}.jsx`,
		`${base}.tsx`,
		path.join(base, "index.js"),
		path.join(base, "index.mjs"),
		path.join(base, "index.cjs"),
		path.join(base, "index.ts"),
		path.join(base, "index.mts"),
		path.join(base, "index.cts"),
		path.join(base, "index.jsx"),
		path.join(base, "index.tsx")
	]);
	for (const file of candidates) if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
	return null;
}
function resolveJsImportPath(root, fileDir, spec) {
	const clean = stripQueryHash(spec);
	let base = null;
	if (clean.startsWith("/")) base = path.resolve(root, `.${clean}`);
	else if (clean.startsWith("./") || clean.startsWith("../")) base = path.resolve(fileDir, clean);
	if (!base) return null;
	return resolveExistingModulePath(base);
}
function normalizeCrossorigin(value) {
	if (value == null) return void 0;
	const v = value.trim().toLowerCase();
	if (v === "") return "";
	if (v === "anonymous") return "anonymous";
	if (v === "use-credentials") return "use-credentials";
}
function normalizeReferrerPolicy(value) {
	if (value == null) return void 0;
	const v = value.trim().toLowerCase();
	switch (v) {
		case "":
		case "no-referrer":
		case "no-referrer-when-downgrade":
		case "origin":
		case "origin-when-cross-origin":
		case "same-origin":
		case "strict-origin":
		case "strict-origin-when-cross-origin":
		case "unsafe-url": return v;
		default: return;
	}
}
function normalizeVueOutPath(value) {
	let next = value.replace(/\\/g, "/").trim();
	next = next.replace(/^\.\/+/, "");
	next = next.replace(/^\/+/, "");
	if (!next.endsWith(".vue")) next += ".vue";
	return next;
}
function normalizeDirPath(value) {
	let next = value.replace(/\\/g, "/").trim();
	next = next.replace(/^\.\/+/, "");
	next = next.replace(/^\/+/, "");
	next = next.replace(/\/+$/, "");
	return next;
}
function defaultPagePath(htmlPath) {
	return `pages/${path.basename(htmlPath, path.extname(htmlPath))}.vue`;
}
function toVueRelativeImport(fromOutPath, toOutPath) {
	const fromDir = path.posix.dirname(fromOutPath.replace(/\\/g, "/"));
	const to = toOutPath.replace(/\\/g, "/");
	let rel = path.posix.relative(fromDir, to);
	if (!rel.startsWith(".")) rel = `./${rel}`;
	return rel;
}
function resolveFromRoot(root, filePath) {
	return path.isAbsolute(filePath) ? filePath : path.resolve(root, filePath);
}
function stripQueryHash(value) {
	return value.split("?")[0].split("#")[0];
}
function pascalCase(value) {
	return value.split(/[^A-Za-z0-9]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
}
function removeImports(code) {
	return code.replace(/^\s*import[\s\S]*?from\s+['"][^'"]+['"]\s*;?\s*$/gm, "").replace(/^\s*import\s+['"][^'"]+['"]\s*;?\s*$/gm, "").trim();
}
async function fileExists(file) {
	try {
		await fs$1.access(file);
		return true;
	} catch {
		return false;
	}
}
async function replaceAsync(input, re, replacer) {
	const matches = [...input.matchAll(re)];
	if (!matches.length) return input;
	let out = "";
	let lastIndex = 0;
	for (const match of matches) {
		const index = match.index ?? 0;
		out += input.slice(lastIndex, index);
		out += await replacer(...match);
		lastIndex = index + match[0].length;
	}
	out += input.slice(lastIndex);
	return out;
}
function joinNonEmpty(parts) {
	return parts.filter(Boolean).join("\n\n");
}
function uniq(arr) {
	return Array.from(new Set(arr));
}
function uniqObjects(arr) {
	const seen = /* @__PURE__ */ new Set();
	return arr.filter((item) => {
		const key = JSON.stringify(item);
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}
function isInsideDir(parent, child) {
	const rel = path.relative(parent, child);
	return !!rel && !rel.startsWith("..") && !path.isAbsolute(rel);
}
function toCode(value) {
	if (value === null) return "null";
	if (value === void 0) return "undefined";
	const type = typeof value;
	if (type === "string") return JSON.stringify(value);
	if (type === "number" || type === "boolean" || type === "bigint") return String(value);
	if (Array.isArray(value)) return `[${value.map((item) => toCode(item)).join(", ")}]`;
	if (type === "object") return `{ ${Object.entries(value).filter(([, v]) => v !== void 0).map(([key, val]) => {
		return `${isValidIdentifier(key) ? key : JSON.stringify(key)}: ${toCode(val)}`;
	}).join(", ")} }`;
	return JSON.stringify(value);
}
function isValidIdentifier(key) {
	return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key);
}
function indent(code, spaces) {
	const pad = " ".repeat(spaces);
	return code.split("\n").map((line) => line ? pad + line : line).join("\n");
}

//#endregion
//#region src/composables/html-path.ts
function htmlPath({ dir, dirname }) {
	const absDir = resolve(dirname, dir);
	const entries = {};
	for (const name of fs.readdirSync(absDir)) {
		if (!name.endsWith(".html")) continue;
		const full = path.join(absDir, name);
		const key = name.replace(/\.html$/, "");
		entries[key] = full;
	}
	return entries;
}

//#endregion
export { htmlPath, htmlToVue, mergeEcosystem, monoEcosystem };