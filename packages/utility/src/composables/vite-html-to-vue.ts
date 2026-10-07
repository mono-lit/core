import fs from 'node:fs/promises'
import path from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'
import type { useScript } from '@unhead/vue'
import fsSync from 'node:fs'



type ScriptWarmupStrategy =
    | 'preload'
    | 'prefetch'
    | 'preconnect'
    | 'dns-prefetch'
    | false
    | undefined

type LocalScriptEntry = {
    sourceAbs: string
    type?: string
    warmupStrategy?: ScriptWarmupStrategy
}

type RemoteScriptUse = {
    expr: string
    as?: string
}

type RemoteScriptEntry = {
    input: UseScriptObjectInput
    use?: RemoteScriptUse
}

type LocalJsImportRef = {
    clause?: string
    sourceAbs: string
}

type ExternalScriptAnalysis = {
    pageImportLines: string[]
    injectedNames: string[]
    body: string
    localStyles: string[]
    localJsImports: LocalJsImportRef[]
}

type GeneratedScriptModuleRef = {
    sourceAbs: string
    outPath: string
    globalFnName: string
    localStyles: string[]
    staticPageImportLines: string[]
    localPageImports: Array<{
        clause?: string
        outPath: string
    }>
    injectedNames: string[]
    hasBody: boolean
}
type GeneratedStyleAssetRef = {
    sourceAbs: string
    outPath: string
}
type UseScriptInput = Parameters<typeof useScript>[0]
type UseScriptObjectInput = Exclude<UseScriptInput, string>
type HeadLink = Record<string, unknown>

type HtmlToVueOptions = {
    overridePath?: string
    components?: {
        path: string
        outDir?: string
    }
    pages: {
        list: Array<{
            html: string
            pagePath?: string
        }>
    }
}

type BuildContext = {
    root: string
    componentRootAbs: string
    componentOutDir: string
    overridePath?: string
    projectNameCamel: string
    pages: NormalizedPage[]
}
type NormalizedPage = {
    htmlAbs: string
    pagePath: string
}

type HtmlAssetDetection = {
    localScripts: LocalScriptEntry[]
    localStyles: string[]
    remoteScripts: RemoteScriptEntry[]
    remoteStyleLinks: HeadLink[]
}

type ScriptAnalysis = {
    importLines: string[]
    bodyBlocks: string[]
    localStyles: string[]
}

type GeneratedComponentRef = {
    name: string
    outPath: string
}

type HeadScript = Record<string, unknown>

type SfcParts = {
    template: string
    style: string
    scriptBody: string
    importLines: string[]
    setupLines: string[]
    loadedLines: string[]
    remoteScripts: RemoteScriptEntry[]
    activeRemoteScriptIndexes: number[]
    remoteStyleLinks: HeadLink[]
    inlineHeadScripts: HeadScript[]
}

type ScriptCrossOrigin = '' | 'anonymous' | 'use-credentials'
type ScriptReferrerPolicy =
    | ''
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url'

function buildRunCallLine(importName: string, injectedNames: string[]) {
    if (!injectedNames.length) return `${importName}()`
    return `${importName}({ ${injectedNames.join(', ')} })`
}

function normalizeScriptType(value: string | undefined) {
    const v = value?.trim().toLowerCase()
    return v || undefined
}

function normalizeScriptWarmupStrategy(value: string | null): ScriptWarmupStrategy {
    const v = value?.trim().toLowerCase()

    switch (v) {
        case 'preload':
        case 'prefetch':
        case 'preconnect':
        case 'dns-prefetch':
            return v
        case 'false':
            return false
        default:
            return undefined
    }
}


function stripJsComments(code: string) {
    return code
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
}
function buildInlineHeadScriptKey(
    projectNameCamel: string,
    root: string,
    htmlAbs: string,
    index: number
) {
    const rel = path.relative(root, htmlAbs).replace(/\\/g, '/')
    const safeRel = rel.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    return `${projectNameCamel}-${safeRel}-inline-${index}`
}

function normalizeExecutableBody(code: string) {
    return stripJsComments(removeImports(code)).trim()
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function hasExecutableReference(code: string, ref: string) {
    if (!code.trim() || !ref.trim()) return false

    const re = new RegExp(
        `(?<![A-Za-z0-9_$])${escapeRegExp(ref)}(?![A-Za-z0-9_$])`
    )

    return re.test(code)
}

function isRemoteScriptActivelyUsed(
    item: RemoteScriptEntry,
    executableBodies: string[]
) {
    if (!item.use) return false

    const refs = uniq(
        [item.use.expr, item.use.as].filter((v): v is string => !!v)
    )

    return refs.some((ref) =>
        executableBodies.some((body) => hasExecutableReference(body, ref))
    )
}
function splitImportClause(clause: string) {
    const parts: string[] = []
    let current = ''
    let depth = 0

    for (const ch of clause) {
        if (ch === '{') depth++
        if (ch === '}') depth--

        if (ch === ',' && depth === 0) {
            if (current.trim()) parts.push(current.trim())
            current = ''
            continue
        }

        current += ch
    }

    if (current.trim()) parts.push(current.trim())

    return parts
}

function parseUseExpression(value: string | null): RemoteScriptUse | undefined {
    if (!value) return undefined

    const raw = value.trim()
    if (!raw) return undefined

    const match = raw.match(/^(.*?)\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*)$/)
    if (match) {
        const expr = match[1]?.trim()
        const as = match[2]?.trim()
        if (!expr) return undefined
        return { expr, as }
    }

    return { expr: raw }
}
function renderUseScriptCall(item: RemoteScriptEntry) {
    if (!item.use) {
        return `useScript(${toCode(item.input)})`
    }

    return `useScript(${toCode(item.input)}, { use: () => ${item.use.expr} })`
}
function extractImportBindings(clause?: string) {
    if (!clause) return []

    const out: string[] = []

    for (const part of splitImportClause(clause.trim())) {
        const item = part.replace(/^type\s+/, '').trim()
        if (!item) continue

        const nsMatch = item.match(/^\*\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*)$/)
        if (nsMatch) {
            out.push(nsMatch[1])
            continue
        }

        if (item.startsWith('{') && item.endsWith('}')) {
            const inner = item.slice(1, -1).trim()
            if (!inner) continue

            for (const raw of inner.split(',')) {
                const named = raw.replace(/^type\s+/, '').trim()
                if (!named) continue

                const asMatch = named.match(
                    /^([A-Za-z_$][A-Za-z0-9_$]*)\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*)$/
                )
                if (asMatch) {
                    out.push(asMatch[2])
                    continue
                }

                const plainMatch = named.match(/^([A-Za-z_$][A-Za-z0-9_$]*)$/)
                if (plainMatch) {
                    out.push(plainMatch[1])
                }
            }

            continue
        }

        const defaultMatch = item.match(/^([A-Za-z_$][A-Za-z0-9_$]*)$/)
        if (defaultMatch) {
            out.push(defaultMatch[1])
        }
    }

    return uniq(out)
}

function renderWindowRunModule(globalFnName: string, injectedNames: string[], body: string) {
    const fnHeader = injectedNames.length
        ? `window.${globalFnName} = function ({ ${injectedNames.join(', ')} } = {}) {`
        : `window.${globalFnName} = function () {`

    return [
        fnHeader,
        indent(body.trim(), 2),
        '}',
    ]
        .filter(Boolean)
        .join('\n')
}

function buildGlobalRunnerName(projectNameCamel: string, scriptAbs: string) {
    const base = pascalCase(fileBaseStem(scriptAbs))
    return `${projectNameCamel}Run${base}Fn`
}

function fileStemFromAbs(root: string, abs: string) {
    const rel = path.relative(root, abs).replace(/\\/g, '/')
    const noExt = rel.replace(/\.[^.]+$/, '')
    return noExt
        .split('/')
        .filter(Boolean)
        .join('-')
}

function normalizeVueJsOutPath(value: string) {
    let next = value.replace(/\\/g, '/').trim()
    next = next.replace(/^\.\/+/, '')
    next = next.replace(/^\/+/, '')
    if (!next.endsWith('.js')) next += '.js'
    return next
}

function normalizeCssOutPath(value: string) {
    let next = value.replace(/\\/g, '/').trim()
    next = next.replace(/^\.\/+/, '')
    next = next.replace(/^\/+/, '')
    if (!next.endsWith('.css')) next += '.css'
    return next
}
function normalizeOverridePath(value?: string) {
    if (!value) return undefined
    return value.replace(/\/+$/, '').trim()
}

function toGeneratedImportSpecifier(
    ctx: BuildContext,
    fromOutPath: string,
    toOutPath: string
) {
    const normalizedTo = toOutPath.replace(/\\/g, '/')

    if (ctx.overridePath) {
        return `${ctx.overridePath}/${normalizedTo}`
    }

    return toVueRelativeImport(fromOutPath, normalizedTo)
}

function readProjectNameCamel(root: string) {
    const pkgPath = findNearestPackageJson(root)
    if (!pkgPath) return 'app'

    try {
        const pkg = JSON.parse(fsSync.readFileSync(pkgPath, 'utf8'))
        const raw = String(pkg.name || path.basename(root)).split('/').pop() || 'app'
        return toCamelCase(raw)
    } catch {
        return 'app'
    }
}

function findNearestPackageJson(start: string) {
    let dir = start

    while (true) {
        const candidate = path.join(dir, 'package.json')
        if (fsSync.existsSync(candidate) && fsSync.statSync(candidate).isFile()) {
            return candidate
        }

        const parent = path.dirname(dir)
        if (parent === dir) return null
        dir = parent
    }
}

function toCamelCase(value: string) {
    const parts = value
        .replace(/^@/, '')
        .split(/[\/\-_]+/)
        .filter(Boolean)

    if (!parts.length) return 'app'

    return parts
        .map((part, index) =>
            index === 0
                ? part.charAt(0).toLowerCase() + part.slice(1)
                : part.charAt(0).toUpperCase() + part.slice(1)
        )
        .join('')
}

export default function htmlToVue(options: HtmlToVueOptions): Plugin {
    const ctx: BuildContext = {
        root: process.cwd(),
        componentRootAbs: '',
        componentOutDir: 'components',
        overridePath: undefined,
        projectNameCamel: 'app',
        pages: [],
    }

    return {
        name: 'html-to-vue',
        apply: 'build',

        configResolved(config: ResolvedConfig) {
            ctx.root = config.root
            ctx.componentRootAbs = resolveFromRoot(
                ctx.root,
                options.components?.path ?? './components'
            )
            ctx.componentOutDir = normalizeDirPath(
                options.components?.outDir ?? 'components'
            )
            ctx.overridePath = normalizeOverridePath(options.overridePath)
            ctx.projectNameCamel = readProjectNameCamel(ctx.root)
            ctx.pages = (options.pages?.list ?? []).map((page) => ({
                htmlAbs: resolveFromRoot(ctx.root, page.html),
                pagePath: normalizeVueOutPath(
                    page.pagePath ?? defaultPagePath(page.html)
                ),
            }))
        },

        async generateBundle() {
            const emitted = new Map<string, string>()
            const componentCache = new Map<string, GeneratedComponentRef>()
            const scriptCache = new Map<string, GeneratedScriptModuleRef>()
            const plainScriptCache = new Map<string, GeneratedPlainScriptModuleRef>()
            const styleCache = new Map<string, GeneratedStyleAssetRef>()

            for (const page of ctx.pages) {
                const sfc = await compileHtmlFile({
                    ctx,
                    htmlAbs: page.htmlAbs,
                    outPath: page.pagePath,
                    emitted,
                    componentCache,
                    scriptCache,
                    plainScriptCache,
                    styleCache,
                })

                emitted.set(page.pagePath, sfc)
            }

            for (const [outPath, source] of emitted) {
                this.emitFile({
                    type: 'asset',
                    fileName: `vue/src/${outPath}`,
                    source,
                })
            }
        },
    }
}

async function compileHtmlFile(args: {
    ctx: BuildContext
    htmlAbs: string
    outPath: string
    emitted: Map<string, string>
    componentCache: Map<string, GeneratedComponentRef>
    scriptCache: Map<string, GeneratedScriptModuleRef>
    plainScriptCache: Map<string, GeneratedPlainScriptModuleRef>
    styleCache: Map<string, GeneratedStyleAssetRef>
}) {
    const {
        ctx,
        htmlAbs,
        outPath,
        emitted,
        componentCache,
        scriptCache,
        plainScriptCache,
        styleCache,
    } = args

    const htmlSource = await fs.readFile(htmlAbs, 'utf8')

    const templateRaw = extractTemplateRaw(htmlSource)
    const componentResult = await replaceLoadTagsWithComponents({
        ctx,
        template: templateRaw,
        ownerHtmlAbs: htmlAbs,
        ownerOutPath: outPath,
        emitted,
        componentCache,
        scriptCache,
        plainScriptCache,
        styleCache,
    })

    const detected = await detectAssetsFromHtmlWithSiblings(ctx, htmlAbs, htmlSource)
    const remoteInjectedNames = uniq(
        detected.remoteScripts
            .map((item) => item.use?.as)
            .filter((value): value is string => !!value)
    )
    const inlineScripts = analyzeInlineScripts(ctx, htmlAbs, htmlSource)

    const inlineExecutableBodies = inlineScripts.mountedBodies
        .map((body) => stripJsComments(body).trim())
        .filter(Boolean)

    const localScriptExecutableBodies = (
        await Promise.all(
            detected.localScripts.map(async (scriptEntry) => {
                try {
                    const code = await fs.readFile(scriptEntry.sourceAbs, 'utf8')
                    return analyzeExternalScript(ctx.root, scriptEntry.sourceAbs, code).body
                } catch {
                    return ''
                }
            })
        )
    ).filter(Boolean)

    const executableBodies = [
        ...inlineExecutableBodies,
        ...localScriptExecutableBodies,
    ]

    const activeRemoteScriptIndexes = detected.remoteScripts
        .map((item, index) =>
            isRemoteScriptActivelyUsed(item, executableBodies) ? index : -1
        )
        .filter((index) => index >= 0)

    const activeRemoteInjectedNames = uniq(
        activeRemoteScriptIndexes
            .map((index) => detected.remoteScripts[index]?.use?.as)
            .filter((value): value is string => !!value)
    )




    const scriptUrlImportLines: string[] = []
    const scriptPageImportLines: string[] = []
    const scriptSetupLines: string[] = []
    const scriptLoadedLines: string[] = []
    const extraStyleFiles: string[] = []
    for (const scriptEntry of detected.localScripts) {
        try {
            const mod = await ensureScriptModule({
                ctx,
                root: ctx.root,
                scriptEntry,
                ownerOutPath: outPath,
                emitted,
                scriptCache,
                plainScriptCache,
                styleCache,
                extraInjectedNames: activeRemoteInjectedNames,
            })

            scriptPageImportLines.push(...mod.pageImportLines)
            scriptUrlImportLines.push(mod.scriptUrlImportLine)
            scriptSetupLines.push(mod.setupLine)
            if (mod.loadedLine) scriptLoadedLines.push(mod.loadedLine)


            extraStyleFiles.push(...mod.ref.localStyles)
        } catch {
            // ignore missing/unreadable script file
        }
    }

    const styleImportLines: string[] = []
    const allStyleFiles = uniq([
        ...detected.localStyles,
        ...extraStyleFiles,
    ])

    for (const styleAbs of allStyleFiles) {
        try {
            const line = await ensureStyleAsset({
                ctx,
                root: ctx.root,
                styleAbs,
                ownerOutPath: outPath,
                emitted,
                styleCache,
            })
            styleImportLines.push(line)
        } catch {
            // ignore missing/unreadable style file
        }
    }

    const parts: SfcParts = {
        template: stripTemplateAssets(componentResult.template),
        style: extractAllStyleBlocks(htmlSource),
        scriptBody: joinNonEmpty([
            ...inlineScripts.mountedBodies,
        ]),
        importLines: uniq([
            ...styleImportLines,
            ...componentResult.importLines,
            ...inlineScripts.importLines,
            ...scriptPageImportLines,
            ...scriptUrlImportLines,
        ]),
        setupLines: uniq(scriptSetupLines),
        loadedLines: uniq(scriptLoadedLines),
        remoteScripts: uniqObjects(detected.remoteScripts),
        activeRemoteScriptIndexes,
        remoteStyleLinks: uniqObjects(detected.remoteStyleLinks),
        inlineHeadScripts: uniqObjects(inlineScripts.headScripts),
    }
    return renderVueSfc(parts)
}

async function replaceLoadTagsWithComponents(args: {
    ctx: BuildContext
    template: string
    ownerHtmlAbs: string
    ownerOutPath: string
    emitted: Map<string, string>
    componentCache: Map<string, GeneratedComponentRef>
    scriptCache: Map<string, GeneratedScriptModuleRef>
    plainScriptCache: Map<string, GeneratedPlainScriptModuleRef>
    styleCache: Map<string, GeneratedStyleAssetRef>
}) {
    const {
        ctx,
        template,
        ownerHtmlAbs,
        ownerOutPath,
        emitted,
        componentCache,
        scriptCache,
        plainScriptCache,
        styleCache,
    } = args
    const importLines: string[] = []

    const nextTemplate = await replaceAsync(
        template,
        /<load\b([^>]*?)(?:\/>|>\s*<\/load>)/gi,
        async (_full, rawAttrs) => {
            const src = getAttr(rawAttrs ?? '', 'src')
            if (!src) return ''

            const childAbs = resolveHtmlAssetPath(
                ctx.root,
                path.dirname(ownerHtmlAbs),
                src
            )

            if (!childAbs || !childAbs.toLowerCase().endsWith('.html')) {
                return ''
            }

            const childRef = await ensureComponent({
                ctx,
                htmlAbs: childAbs,
                emitted,
                componentCache,
                scriptCache,
                plainScriptCache,
                styleCache,
            })

            const importPath = toGeneratedImportSpecifier(ctx, ownerOutPath, childRef.outPath)
            importLines.push(
                `import ${childRef.name} from ${JSON.stringify(importPath)}`
            )
            return `<${childRef.name} />`
        }
    )

    return {
        template: nextTemplate,
        importLines: uniq(importLines),
    }
}

function buildWindowRunCallLine(
    onLoadedVar: string,
    globalFnName: string,
    injectedNames: string[]
) {
    const call = injectedNames.length
        ? `window.${globalFnName}?.({ ${injectedNames.join(', ')} })`
        : `window.${globalFnName}?.()`

    return `${onLoadedVar}(() => { ${call} })`
}


function buildGeneratedScriptUseScriptLine(args: {
    scriptVar: string
    onLoadedVar: string
    scriptEntry: LocalScriptEntry
}) {
    const { scriptVar, onLoadedVar, scriptEntry } = args

    const input = {
        src: scriptVar,
        ...(scriptEntry.type ? { type: scriptEntry.type } : {}),
    }

    const options = {
        trigger: 'client',
        ...(scriptEntry.warmupStrategy !== undefined
            ? { warmupStrategy: scriptEntry.warmupStrategy }
            : {}),
    }

    return `const { onLoaded: ${onLoadedVar} } = useScript(${toCode(input)}, ${toCode(options)})`
}
async function ensureScriptModule(args: {
    ctx: BuildContext
    root: string
    scriptEntry: LocalScriptEntry
    ownerOutPath: string
    emitted: Map<string, string>
    scriptCache: Map<string, GeneratedScriptModuleRef>
    plainScriptCache: Map<string, GeneratedPlainScriptModuleRef>
    styleCache: Map<string, GeneratedStyleAssetRef>
    extraInjectedNames: string[]
}) {
    const {
        ctx,
        root,
        scriptEntry,
        ownerOutPath,
        emitted,
        scriptCache,
        plainScriptCache,
        styleCache,
        extraInjectedNames,
    } = args

    const scriptAbs = scriptEntry.sourceAbs

    const mergedInjectedNames = uniq([
        ...extraInjectedNames,
    ])

    const scriptCacheKey = `${scriptAbs}::${mergedInjectedNames.slice().sort().join(',')}`
    const cached = scriptCache.get(scriptCacheKey)

    if (cached) {
        const pageImportLines = [
            ...cached.staticPageImportLines,
            ...cached.localPageImports.map((item) =>
                item.clause
                    ? `import ${item.clause} from ${JSON.stringify(
                        toGeneratedImportSpecifier(ctx, ownerOutPath, item.outPath)
                    )}`
                    : `import ${JSON.stringify(
                        toGeneratedImportSpecifier(ctx, ownerOutPath, item.outPath)
                    )}`
            ),
        ]

        const scriptVar = `__scriptUrl${pascalCase(fileBaseStem(scriptAbs))}`
        const onLoadedVar = `__onLoaded${pascalCase(fileBaseStem(scriptAbs))}`

        return {
            ref: cached,
            pageImportLines: uniq(pageImportLines),
            scriptUrlImportLine: `import ${scriptVar} from ${JSON.stringify(
                `${toGeneratedImportSpecifier(ctx, ownerOutPath, cached.outPath)}?url`
            )}`,
            setupLine: buildGeneratedScriptUseScriptLine({
                scriptVar,
                onLoadedVar,
                scriptEntry,
            }),
            loadedLine: cached.hasBody
                ? buildWindowRunCallLine(onLoadedVar, cached.globalFnName, cached.injectedNames)
                : '',
        }
    }

    const code = await fs.readFile(scriptAbs, 'utf8')
    const analyzed = analyzeExternalScript(root, scriptAbs, code)

    const fileStem = fileStemFromAbs(root, scriptAbs)
    const outPath = normalizeVueJsOutPath(`script/${fileStem}.js`)
    const globalFnName = buildGlobalRunnerName(ctx.projectNameCamel, scriptAbs)

    const localPageImports: Array<{ clause?: string; outPath: string }> = []

    for (const item of analyzed.localJsImports) {
        const depStem = `${fileStem}-${fileBaseStem(item.sourceAbs)}`
        const depRef = await ensurePlainScriptModule({
            root,
            sourceAbs: item.sourceAbs,
            outStem: depStem,
            emitted,
            plainScriptCache,
            styleCache,
        })

        localPageImports.push({
            clause: item.clause,
            outPath: depRef.outPath,
        })
    }

    const finalInjectedNames = uniq([
        ...analyzed.injectedNames,
        ...extraInjectedNames,
    ])

    const moduleSource = renderWindowRunModule(globalFnName, finalInjectedNames, analyzed.body)
    const ref: GeneratedScriptModuleRef = {
        sourceAbs: scriptAbs,
        outPath,
        globalFnName,
        localStyles: analyzed.localStyles,
        staticPageImportLines: analyzed.pageImportLines,
        localPageImports,
        injectedNames: finalInjectedNames,
        hasBody: !!analyzed.body,
    }

    scriptCache.set(scriptCacheKey, ref)
    emitted.set(outPath, moduleSource)

    const pageImportLines = [
        ...ref.staticPageImportLines,
        ...ref.localPageImports.map((item) =>
            item.clause
                ? `import ${item.clause} from ${JSON.stringify(
                    toGeneratedImportSpecifier(ctx, ownerOutPath, item.outPath)
                )}`
                : `import ${JSON.stringify(
                    toGeneratedImportSpecifier(ctx, ownerOutPath, item.outPath)
                )}`
        ),
    ]

    const scriptVar = `__scriptUrl${pascalCase(fileBaseStem(scriptAbs))}`
    const onLoadedVar = `__onLoaded${pascalCase(fileBaseStem(scriptAbs))}`

    return {
        ref,
        pageImportLines: uniq(pageImportLines),
        scriptUrlImportLine: `import ${scriptVar} from ${JSON.stringify(
            `${toGeneratedImportSpecifier(ctx, ownerOutPath, outPath)}?url`
        )}`,
        setupLine: buildGeneratedScriptUseScriptLine({
            scriptVar,
            onLoadedVar,
            scriptEntry,
        }),
        loadedLine: ref.hasBody
            ? buildWindowRunCallLine(onLoadedVar, ref.globalFnName, ref.injectedNames)
            : '',
    }
}

function fileBaseStem(abs: string) {
    return path.basename(abs, path.extname(abs))
}

async function ensurePlainScriptModule(args: {
    root: string
    sourceAbs: string
    outStem: string
    emitted: Map<string, string>
    plainScriptCache: Map<string, GeneratedPlainScriptModuleRef>
    styleCache: Map<string, GeneratedStyleAssetRef>
}) {
    const {
        root,
        sourceAbs,
        outStem,
        emitted,
        plainScriptCache,
        styleCache,
    } = args

    const cacheKey = `${sourceAbs}::${outStem}`
    const cached = plainScriptCache.get(cacheKey)
    if (cached) return cached

    const outPath = normalizeVueJsOutPath(`script/${outStem}.js`)
    const fileDir = path.dirname(sourceAbs)
    const code = await fs.readFile(sourceAbs, 'utf8')

    const nextCode = await replaceAsync(
        code,
        /^\s*import\s+(?:(.*?)\s+from\s+)?['"]([^'"]+)['"]\s*;?\s*$/gm,
        async (full, clauseRaw, specRaw) => {
            const clause = clauseRaw?.trim()
            const spec = specRaw?.trim()
            if (!spec) return full.trim()

            if (isRemoteUrl(spec) || isBareImport(spec)) {
                return full.trim()
            }

            const resolved = resolveJsImportPath(root, fileDir, spec)
            if (!resolved) return full.trim()

            if (resolved.endsWith('.css')) {
                const cssOutPath = await ensureStyleAssetOutPath({
                    root,
                    styleAbs: resolved,
                    emitted,
                    styleCache,
                })

                return `import ${JSON.stringify(
                    toVueRelativeImport(outPath, cssOutPath)
                )}`
            }

            const childStem = `${outStem}-${fileBaseStem(resolved)}`
            const childRef = await ensurePlainScriptModule({
                root,
                sourceAbs: resolved,
                outStem: childStem,
                emitted,
                plainScriptCache,
                styleCache,
            })

            const nextSpec = toVueRelativeImport(outPath, childRef.outPath)

            return clause
                ? `import ${clause} from ${JSON.stringify(nextSpec)}`
                : `import ${JSON.stringify(nextSpec)}`
        }
    )

    const ref: GeneratedPlainScriptModuleRef = {
        sourceAbs,
        outPath,
    }

    plainScriptCache.set(cacheKey, ref)
    emitted.set(outPath, nextCode)

    return ref
}

async function ensureStyleAsset(args: {
    ctx: BuildContext
    root: string
    styleAbs: string
    ownerOutPath: string
    emitted: Map<string, string>
    styleCache: Map<string, GeneratedStyleAssetRef>
}) {
    const { ctx, root, styleAbs, ownerOutPath, emitted, styleCache } = args

    const outPath = await ensureStyleAssetOutPath({
        root,
        styleAbs,
        emitted,
        styleCache,
    })

    return `import ${JSON.stringify(
        toGeneratedImportSpecifier(ctx, ownerOutPath, outPath)
    )}`
}

async function ensureComponent(args: {
    ctx: BuildContext
    htmlAbs: string
    emitted: Map<string, string>
    componentCache: Map<string, GeneratedComponentRef>
    scriptCache: Map<string, GeneratedScriptModuleRef>
    plainScriptCache: Map<string, GeneratedPlainScriptModuleRef>
    styleCache: Map<string, GeneratedStyleAssetRef>
}) {
    const {
        ctx,
        htmlAbs,
        emitted,
        componentCache,
        scriptCache,
        plainScriptCache,
        styleCache,
    } = args

    const cached = componentCache.get(htmlAbs)
    if (cached) return cached

    const name = componentNameFromPath(ctx.componentRootAbs, ctx.root, htmlAbs)
    const outPath = normalizeVueOutPath(`${ctx.componentOutDir}/${name}.vue`)
    const ref: GeneratedComponentRef = { name, outPath }

    componentCache.set(htmlAbs, ref)

    const sfc = await compileHtmlFile({
        ctx,
        htmlAbs,
        outPath,
        emitted,
        componentCache,
        scriptCache,
        plainScriptCache,
        styleCache,
    })

    emitted.set(outPath, sfc)
    return ref
}

async function detectAssetsFromHtmlWithSiblings(
    ctx: BuildContext,
    htmlAbs: string,
    htmlSource: string
): Promise<HtmlAssetDetection> {
    const detected = detectAssetsFromHtml(ctx.root, htmlAbs, htmlSource)
    const sibling = await detectSiblingAssets(htmlAbs)

    return {
        localScripts: uniqObjects([...detected.localScripts, ...sibling.localScripts]),
        localStyles: uniq([...detected.localStyles, ...sibling.localStyles]),
        remoteScripts: uniqObjects(detected.remoteScripts),
        remoteStyleLinks: uniqObjects(detected.remoteStyleLinks),
    }
}

function detectAssetsFromHtml(
    root: string,
    htmlFile: string,
    htmlSource: string
): HtmlAssetDetection {
    const htmlDir = path.dirname(resolveFromRoot(root, htmlFile))

    const localScripts: LocalScriptEntry[] = []
    const localStyles: string[] = []
    const remoteScripts: RemoteScriptEntry[] = []
    const remoteStyleLinks: HeadLink[] = []

    for (const match of htmlSource.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
        const attrs = match[1] ?? ''
        const type = getAttr(attrs, 'type')?.toLowerCase()
        if (type === 'importmap') continue

        const src = getAttr(attrs, 'src')
        if (!src) continue

        if (isRemoteUrl(src)) {
            remoteScripts.push(scriptAttrsToRemoteScriptEntry(src, attrs))
            continue
        }

        if (isIgnoredHtmlAsset(src)) continue

        const resolved = resolveHtmlAssetPath(root, htmlDir, src)
        if (resolved) {
            localScripts.push({
                sourceAbs: resolved,
                type: normalizeScriptType(type),
                warmupStrategy: normalizeScriptWarmupStrategy(getAttr(attrs, 'rel')),
            })
        }
    }

    for (const match of htmlSource.matchAll(/<link\b([^>]*?)>/gi)) {
        const attrs = match[1] ?? ''
        const rel = getAttr(attrs, 'rel')?.toLowerCase()
        if (rel !== 'stylesheet') continue

        const href = getAttr(attrs, 'href')
        if (!href) continue

        if (isRemoteUrl(href)) {
            remoteStyleLinks.push(linkAttrsToHeadLink(href, attrs))
            continue
        }

        if (isIgnoredHtmlAsset(href)) continue

        const resolved = resolveHtmlAssetPath(root, htmlDir, href)
        if (resolved) localStyles.push(resolved)
    }

    return {
        localScripts: uniqObjects(localScripts),
        localStyles: uniq(localStyles),
        remoteScripts,
        remoteStyleLinks,
    }
}
async function detectSiblingAssets(htmlAbs: string) {
    const base = htmlAbs.replace(/\.html$/i, '')
    const localScripts: LocalScriptEntry[] = []
    const localStyles: string[] = []

    if (await fileExists(`${base}.js`)) {
        localScripts.push({
            sourceAbs: `${base}.js`,
            type: 'module',
            warmupStrategy: undefined,
        })
    }

    if (await fileExists(`${base}.css`)) {
        localStyles.push(`${base}.css`)
    }

    return { localScripts, localStyles }
}


type GeneratedPlainScriptModuleRef = {
    sourceAbs: string
    outPath: string
}

async function ensureStyleAssetOutPath(args: {
    root: string
    styleAbs: string
    emitted: Map<string, string>
    styleCache: Map<string, GeneratedStyleAssetRef>
}) {
    const { root, styleAbs, emitted, styleCache } = args

    const cached = styleCache.get(styleAbs)
    if (cached) return cached.outPath

    const css = await fs.readFile(styleAbs, 'utf8')
    const fileStem = fileStemFromAbs(root, styleAbs)
    const outPath = normalizeCssOutPath(`style/${fileStem}.css`)

    const ref: GeneratedStyleAssetRef = {
        sourceAbs: styleAbs,
        outPath,
    }

    styleCache.set(styleAbs, ref)
    emitted.set(outPath, css)

    return outPath
}



function analyzeExternalScript(
    root: string,
    filePath: string,
    code: string
): ExternalScriptAnalysis {
    const pageImportLines: string[] = []
    const injectedNames: string[] = []
    const localStyles: string[] = []
    const localJsImports: LocalJsImportRef[] = []
    const fileDir = path.dirname(filePath)

    const importRe =
        /^\s*import\s+(?:(.*?)\s+from\s+)?['"]([^'"]+)['"]\s*;?\s*$/gm

    let match: RegExpExecArray | null
    while ((match = importRe.exec(code))) {
        const clause = match[1]?.trim()
        const spec = match[2]?.trim()
        if (!spec) continue

        if (isRemoteUrl(spec) || isBareImport(spec)) {
            pageImportLines.push(match[0].trim())
            injectedNames.push(...extractImportBindings(clause))
            continue
        }

        const resolved = resolveJsImportPath(root, fileDir, spec)
        if (!resolved) continue

        if (resolved.endsWith('.css')) {
            localStyles.push(resolved)
            continue
        }

        localJsImports.push({
            clause,
            sourceAbs: resolved,
        })

        injectedNames.push(...extractImportBindings(clause))
    }

    const executableBody = normalizeExecutableBody(code)

    return {
        pageImportLines: uniq(pageImportLines),
        injectedNames: uniq(injectedNames),
        localStyles: uniq(localStyles),
        localJsImports,
        body: executableBody,
    }
}

function analyzeSingleScript(root: string, filePath: string, code: string) {
    const importLines: string[] = []
    const localStyles: string[] = []
    const fileDir = path.dirname(filePath)

    const importRe =
        /^\s*import\s+(?:(.*?)\s+from\s+)?['"]([^'"]+)['"]\s*;?\s*$/gm

    let match: RegExpExecArray | null
    while ((match = importRe.exec(code))) {
        const clause = match[1]?.trim()
        const spec = match[2]?.trim()
        if (!spec) continue

        if (isRemoteUrl(spec) || isBareImport(spec)) {
            importLines.push(match[0].trim())
            continue
        }

        const resolved = resolveJsImportPath(root, fileDir, spec)
        if (!resolved) continue

        if (resolved.endsWith('.css')) {
            localStyles.push(resolved)
            continue
        }

        const runtimeSpec = toRootRelativeSpecifier(root, resolved)
        importLines.push(
            clause
                ? `import ${clause} from ${JSON.stringify(runtimeSpec)}`
                : `import ${JSON.stringify(runtimeSpec)}`
        )
    }

    return {
        importLines,
        localStyles,
        body: removeImports(code),
    }
}


function buildScriptSetup(
    scriptBody: string,
    importLines: string[],
    setupLines: string[],
    loadedLines: string[],
    remoteScripts: RemoteScriptEntry[],
    activeRemoteScriptIndexes: number[],
    remoteStyleLinks: HeadLink[],
    inlineHeadScripts: HeadScript[]
) {
    const activeIndexSet = new Set(activeRemoteScriptIndexes)

    const scriptSetupLines = remoteScripts.map((item, index) => {
        const isActive = activeIndexSet.has(index)

        if (item.use && isActive) {
            const varName = `__onLoaded${index}`
            return `const { onLoaded: ${varName} } = ${renderUseScriptCall(item)}`
        }

        return renderUseScriptCall(item)
    })

    const useWrappedScripts = remoteScripts
        .map((item, index) => ({ item, index }))
        .filter(({ item, index }) => !!item.use && activeIndexSet.has(index))

    const plainBody = scriptBody.trim()

    const topLevelLoadedBlocks = useWrappedScripts.map(({ item, index }) => {
        const cbArg = item.use?.as ? item.use.as : ''
        const callbackHead = cbArg ? `(${cbArg}) => {` : `() => {`

        return [
            `__onLoaded${index}(${callbackHead}`,
            indent(plainBody, 2),
            `})`,
        ].join('\n')
    })

    const mountedBlock =
        plainBody && !useWrappedScripts.length
            ? [
                'onMounted(() => {',
                indent(plainBody, 2),
                '})',
            ].join('\n')
            : ''

    const headConfigParts: string[] = []

    if (remoteStyleLinks.length) {
        headConfigParts.push(`link: ${toCode(remoteStyleLinks)}`)
    }

    if (inlineHeadScripts.length) {
        headConfigParts.push(`script: ${toCode(inlineHeadScripts)}`)
    }

    const headLine =
        headConfigParts.length
            ? `useHead({ ${headConfigParts.join(', ')} })`
            : ''

    return [
        '<script setup>',
        ...(mountedBlock ? [`import { onMounted } from 'vue'`] : []),
        ...((remoteScripts.length || setupLines.length || loadedLines.length)
            ? [`import { useScript } from '@unhead/vue'`]
            : []),
        ...((remoteStyleLinks.length || inlineHeadScripts.length)
            ? [`import { useHead } from '@unhead/vue'`]
            : []),
        ...importLines,
        '',
        ...(headLine ? [headLine, ''] : []),
        ...scriptSetupLines,
        ...setupLines,
        ...((scriptSetupLines.length || setupLines.length) ? [''] : []),
        ...topLevelLoadedBlocks,
        ...loadedLines,
        ...((topLevelLoadedBlocks.length || loadedLines.length) ? [''] : []),
        mountedBlock,
        '</script>',
    ]
        .filter(Boolean)
        .join('\n')
}

function renderVueSfc(parts: SfcParts) {
    return [
        `<template>\n${parts.template}\n</template>`,
        buildScriptSetup(
            parts.scriptBody,
            parts.importLines,
            parts.setupLines,
            parts.loadedLines,
            parts.remoteScripts,
            parts.activeRemoteScriptIndexes,
            parts.remoteStyleLinks,
            parts.inlineHeadScripts
        ),
        `<style>\n${parts.style}\n</style>`,
    ].join('\n\n')
}


function analyzeInlineModuleScript(code: string) {
    const importLines: string[] = []

    const importRe =
        /^\s*import\s+(?:(.*?)\s+from\s+)?['"]([^'"]+)['"]\s*;?\s*$/gm

    let match: RegExpExecArray | null
    while ((match = importRe.exec(code))) {
        importLines.push(match[0].trim())
    }

    return {
        importLines: uniq(importLines),
        body: normalizeExecutableBody(code),
    }
}
type InlineScriptAnalysis = {
    importLines: string[]
    mountedBodies: string[]
    headScripts: HeadScript[]
}

function analyzeInlineScripts(
    ctx: BuildContext,
    htmlAbs: string,
    html: string
): InlineScriptAnalysis {
    const importLines: string[] = []
    const mountedBodies: string[] = []
    const headScripts: HeadScript[] = []

    let inlineIndex = 0

    for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
        const attrs = match[1] ?? ''
        const content = (match[2] ?? '').trim()
        const src = getAttr(attrs, 'src')
        const type = getAttr(attrs, 'type')?.toLowerCase()

        if (src) continue
        if (type === 'importmap') continue
        if (!content) continue

        const key = buildInlineHeadScriptKey(
            ctx.projectNameCamel,
            ctx.root,
            htmlAbs,
            inlineIndex++
        )

        if (type === 'module') {
            const analyzed = analyzeInlineModuleScript(content)
            importLines.push(...analyzed.importLines)

            if (analyzed.body.trim()) {
                mountedBodies.push(analyzed.body.trim())
            }

            continue
        }

        headScripts.push({
            key,
            textContent: content,
            tagPosition: 'bodyClose',
        })
    }

    return {
        importLines: uniq(importLines),
        mountedBodies,
        headScripts: uniqObjects(headScripts),
    }
}

function extractTemplateRaw(html: string) {
    const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)
    if (bodyMatch) return bodyMatch[1].trim()

    return html
        .replace(/<!doctype[\s\S]*?>/gi, '')
        .replace(/<html\b[^>]*>/gi, '')
        .replace(/<\/html>/gi, '')
        .replace(/<head\b[\s\S]*?<\/head>/gi, '')
        .trim()
}

function stripTemplateAssets(template: string) {
    return template
        .replace(/<script\b[\s\S]*?<\/script>/gi, '')
        .replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, '')
        .replace(/<style\b[\s\S]*?<\/style>/gi, '')
        .trim()
}

function extractAllStyleBlocks(html: string) {
    return [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
        .map((m) => m[1].trim())
        .filter(Boolean)
        .join('\n\n')
}

function componentNameFromPath(
    componentRootAbs: string,
    root: string,
    htmlAbs: string
) {
    const base =
        isInsideDir(componentRootAbs, htmlAbs)
            ? path.relative(componentRootAbs, htmlAbs)
            : path.relative(root, htmlAbs)

    const noExt = base.replace(/\.html$/i, '').replace(/\\/g, '/')
    return noExt
        .split('/')
        .filter(Boolean)
        .map(pascalCase)
        .join('')
}

function scriptAttrsToRemoteScriptEntry(
    src: string,
    attrs: string
): RemoteScriptEntry {
    const crossorigin = normalizeCrossorigin(getAttr(attrs, 'crossorigin'))
    const referrerpolicy = normalizeReferrerPolicy(getAttr(attrs, 'referrerpolicy'))
    const integrity = getAttr(attrs, 'integrity')
    const use = parseUseExpression(getAttr(attrs, 'use'))

    return {
        input: {
            src,
            ...(hasBooleanAttr(attrs, 'async') ? { async: true as const } : {}),
            ...(hasBooleanAttr(attrs, 'defer') ? { defer: true as const } : {}),
            ...(crossorigin !== undefined ? { crossorigin } : {}),
            ...(referrerpolicy !== undefined ? { referrerpolicy } : {}),
            ...(integrity ? { integrity } : {}),
        },
        ...(use ? { use } : {}),
    }
}

function linkAttrsToHeadLink(href: string, attrs: string): HeadLink {
    return {
        rel: 'stylesheet',
        href,
        ...(getAttr(attrs, 'media') ? { media: getAttr(attrs, 'media') } : {}),
        ...(getAttr(attrs, 'crossorigin')
            ? { crossorigin: getAttr(attrs, 'crossorigin') }
            : {}),
        ...(getAttr(attrs, 'referrerpolicy')
            ? { referrerpolicy: getAttr(attrs, 'referrerpolicy') }
            : {}),
        ...(getAttr(attrs, 'integrity')
            ? { integrity: getAttr(attrs, 'integrity') }
            : {}),
    }
}

function getAttr(attrs: string, name: string) {
    const re = new RegExp(
        `\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`,
        'i'
    )
    const match = attrs.match(re)
    return match?.[2] ?? match?.[3] ?? match?.[4] ?? null
}

function hasBooleanAttr(attrs: string, name: string) {
    return new RegExp(`\\b${name}(?=\\s|>|$)`, 'i').test(attrs)
}

function isRemoteUrl(value: string) {
    return /^https?:\/\//i.test(value)
}

function isBareImport(spec: string) {
    return (
        !spec.startsWith('/') &&
        !spec.startsWith('./') &&
        !spec.startsWith('../') &&
        !isRemoteUrl(spec)
    )
}

function isIgnoredHtmlAsset(value: string) {
    const v = value.replace(/\\/g, '/')
    return (
        v.startsWith('/_virtual/') ||
        v.startsWith('/@') ||
        v.includes('/node_modules/') ||
        v.endsWith('.html.js') ||
        isBareImport(v)
    )
}

function resolveHtmlAssetPath(root: string, htmlDir: string, value: string) {
    const clean = stripQueryHash(value)
    return clean.startsWith('/')
        ? path.resolve(root, `.${clean}`)
        : path.resolve(htmlDir, clean)
}

function resolveExistingModulePath(base: string) {
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
        path.join(base, 'index.js'),
        path.join(base, 'index.mjs'),
        path.join(base, 'index.cjs'),
        path.join(base, 'index.ts'),
        path.join(base, 'index.mts'),
        path.join(base, 'index.cts'),
        path.join(base, 'index.jsx'),
        path.join(base, 'index.tsx'),
    ])

    for (const file of candidates) {
        if (fsSync.existsSync(file) && fsSync.statSync(file).isFile()) {
            return file
        }
    }

    return null
}

function resolveJsImportPath(root: string, fileDir: string, spec: string) {
    const clean = stripQueryHash(spec)

    let base: string | null = null

    if (clean.startsWith('/')) {
        base = path.resolve(root, `.${clean}`)
    } else if (clean.startsWith('./') || clean.startsWith('../')) {
        base = path.resolve(fileDir, clean)
    }

    if (!base) return null
    return resolveExistingModulePath(base)
}

function normalizeCrossorigin(
    value: string | null
): ScriptCrossOrigin | undefined {
    if (value == null) return undefined
    const v = value.trim().toLowerCase()
    if (v === '') return ''
    if (v === 'anonymous') return 'anonymous'
    if (v === 'use-credentials') return 'use-credentials'
    return undefined
}

function normalizeReferrerPolicy(
    value: string | null
): ScriptReferrerPolicy | undefined {
    if (value == null) return undefined
    const v = value.trim().toLowerCase()

    switch (v) {
        case '':
        case 'no-referrer':
        case 'no-referrer-when-downgrade':
        case 'origin':
        case 'origin-when-cross-origin':
        case 'same-origin':
        case 'strict-origin':
        case 'strict-origin-when-cross-origin':
        case 'unsafe-url':
            return v
        default:
            return undefined
    }
}

function normalizeVueOutPath(value: string) {
    let next = value.replace(/\\/g, '/').trim()
    next = next.replace(/^\.\/+/, '')
    next = next.replace(/^\/+/, '')
    if (!next.endsWith('.vue')) next += '.vue'
    return next
}

function normalizeDirPath(value: string) {
    let next = value.replace(/\\/g, '/').trim()
    next = next.replace(/^\.\/+/, '')
    next = next.replace(/^\/+/, '')
    next = next.replace(/\/+$/, '')
    return next
}

function defaultPagePath(htmlPath: string) {
    const base = path.basename(htmlPath, path.extname(htmlPath))
    return `pages/${base}.vue`
}

function toVueRelativeImport(fromOutPath: string, toOutPath: string) {
    const fromDir = path.posix.dirname(fromOutPath.replace(/\\/g, '/'))
    const to = toOutPath.replace(/\\/g, '/')
    let rel = path.posix.relative(fromDir, to)
    if (!rel.startsWith('.')) rel = `./${rel}`
    return rel
}

function toRootRelativeSpecifier(root: string, abs: string) {
    return `/${path.relative(root, abs).replace(/\\/g, '/')}`
}

function resolveFromRoot(root: string, filePath: string) {
    return path.isAbsolute(filePath)
        ? filePath
        : path.resolve(root, filePath)
}

function stripQueryHash(value: string) {
    return value.split('?')[0].split('#')[0]
}

function pascalCase(value: string) {
    return value
        .split(/[^A-Za-z0-9]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('')
}

function removeImports(code: string) {
    return code
        .replace(/^\s*import[\s\S]*?from\s+['"][^'"]+['"]\s*;?\s*$/gm, '')
        .replace(/^\s*import\s+['"][^'"]+['"]\s*;?\s*$/gm, '')
        .trim()
}

async function readExistingFiles(files: string[]) {
    const contents = await Promise.all(
        files.map(async (file) => {
            try {
                return await fs.readFile(file, 'utf8')
            } catch {
                return ''
            }
        })
    )

    return contents.filter(Boolean)
}

async function fileExists(file: string) {
    try {
        await fs.access(file)
        return true
    } catch {
        return false
    }
}

async function replaceAsync(
    input: string,
    re: RegExp,
    replacer: (...args: any[]) => Promise<string>
) {
    const matches = [...input.matchAll(re)]
    if (!matches.length) return input

    let out = ''
    let lastIndex = 0

    for (const match of matches) {
        const index = match.index ?? 0
        out += input.slice(lastIndex, index)
        out += await replacer(...match)
        lastIndex = index + match[0].length
    }

    out += input.slice(lastIndex)
    return out
}

function joinNonEmpty(parts: string[]) {
    return parts.filter(Boolean).join('\n\n')
}

function uniq<T>(arr: T[]) {
    return Array.from(new Set(arr))
}

function uniqObjects<T>(arr: T[]) {
    const seen = new Set<string>()
    return arr.filter((item) => {
        const key = JSON.stringify(item)
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

function isInsideDir(parent: string, child: string) {
    const rel = path.relative(parent, child)
    return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel)
}

function toCode(value: unknown): string {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'

    const type = typeof value

    if (type === 'string') return JSON.stringify(value)
    if (type === 'number' || type === 'boolean' || type === 'bigint') {
        return String(value)
    }

    if (Array.isArray(value)) {
        return `[${value.map((item) => toCode(item)).join(', ')}]`
    }

    if (type === 'object') {
        const entries = Object.entries(value as Record<string, unknown>)
            .filter(([, v]) => v !== undefined)
            .map(([key, val]) => {
                const safeKey = isValidIdentifier(key) ? key : JSON.stringify(key)
                return `${safeKey}: ${toCode(val)}`
            })

        return `{ ${entries.join(', ')} }`
    }

    return JSON.stringify(value)
}

function isValidIdentifier(key: string) {
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
}

function indent(code: string, spaces: number) {
    const pad = ' '.repeat(spaces)
    return code
        .split('\n')
        .map((line) => (line ? pad + line : line))
        .join('\n')
}