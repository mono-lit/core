#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import os from "node:os";
import { execSync } from "node:child_process";
import dotenv from "dotenv";
import {
  runGit,
  materializeGitTree,
  swapIntoPlace,
  sweepStrayStages,
  stagePathFor,
  parseGithubUrl,
  resolveTransport,
  resolveGitMethod,
  parseSyncArgv,
  accessCacheGet,
  accessCacheSet,
  isShortSha,
  ago,
  refDirCandidates,
  validateAppEntry,
  resolveAppSource,
  resolveRefDir,
  pickSubtree,
  MONO_APPS_DIR,
  orphanAppDirs,
  appDirToPrune,
  staleCacheKeys,
  staleAccessKeys,
  pruneMonoTsconfigPaths,
  resolvePrune,
} from "./mono-git.mjs";

dotenv.config();

const argv = parseSyncArgv(process.argv.slice(2));

function findMonoConfigFile(cwd = process.cwd()) {
  const names = [
    'mono.config.ts',
    'mono.config.js',
    'mono.config.mjs',
    'mono.config.cjs',
  ];

  for (const name of names) {
    const file = path.resolve(cwd, name);

    if (exists(file)) {
      return file;
    }
  }

  throw new Error(
    `Cannot find mono config file. Expected one of: ${names.join(', ')}`
  );
}

function stripCommentsSafe(code) {
  let out = ''
  let quote = null
  let escaped = false
  let inLineComment = false
  let inBlockComment = false

  for (let i = 0; i < code.length; i++) {
    const ch = code[i]
    const next = code[i + 1]

    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false
        out += ch
      }
      continue
    }

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false
        i++
      }
      continue
    }

    if (quote) {
      out += ch

      if (escaped) {
        escaped = false
        continue
      }

      if (ch === '\\') {
        escaped = true
        continue
      }

      if (ch === quote) {
        quote = null
      }

      continue
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch
      out += ch
      continue
    }

    if (ch === '/' && next === '/') {
      inLineComment = true
      i++
      continue
    }

    if (ch === '/' && next === '*') {
      inBlockComment = true
      i++
      continue
    }

    out += ch
  }

  return out
}

function findMatchingBracket(code, startIndex, openChar, closeChar) {
  let depth = 0
  let quote = null
  let escaped = false

  for (let i = startIndex; i < code.length; i++) {
    const ch = code[i]

    if (quote) {
      if (escaped) {
        escaped = false
        continue
      }

      if (ch === '\\') {
        escaped = true
        continue
      }

      if (ch === quote) {
        quote = null
      }

      continue
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch
      continue
    }

    if (ch === openChar) {
      depth++
    }

    if (ch === closeChar) {
      depth--

      if (depth === 0) {
        return i
      }
    }
  }

  return -1
}

function extractAppsArrayText(code) {
  const clean = stripCommentsSafe(code)

  const appsMatch = /\bapps\s*:/.exec(clean)

  if (!appsMatch) {
    return null
  }

  const afterApps = appsMatch.index + appsMatch[0].length
  const arrayStart = clean.indexOf('[', afterApps)

  if (arrayStart === -1) {
    throw new Error(`Found "apps:" but value is not an array literal.`)
  }

  const arrayEnd = findMatchingBracket(clean, arrayStart, '[', ']')

  if (arrayEnd === -1) {
    throw new Error(`Cannot find closing "]" for apps array.`)
  }

  return clean.slice(arrayStart, arrayEnd + 1)
}

function parseAppsArray(arrayText) {
  /**
   * This evaluates only the extracted apps array, not the whole mono.config.ts.
   *
   * It supports JS object syntax:
   * - single quotes
   * - trailing commas
   * - unquoted object keys
   *
   * Keep apps static. Do not use variables or functions inside apps.
   */
  const apps = Function(`"use strict"; return (${arrayText});`)();

  if (!Array.isArray(apps)) {
    throw new Error(`mono config "apps" must be an array.`);
  }

  for (const app of apps) {
    const problem = validateAppEntry(app);
    if (problem) {
      throw new Error(
        `Every mono app needs "name" and at least one of "url" / "path" (${problem}). Invalid item: ${JSON.stringify(app)}`
      );
    }
  }

  return apps;
}

function readAppsFromMonoConfig() {
  const configFile = findMonoConfigFile();
  const code = fs.readFileSync(configFile, 'utf8');

  const appsText = extractAppsArrayText(code);

  // `found` is NOT `apps.length > 0`. An absent `apps:` key and an explicit
  // `apps: []` look identical downstream but mean opposite things to the prune:
  // "I could not read a list" must never delete every clone, while "the list is
  // empty" legitimately does. Only the second sets `found`.
  if (!appsText) {
    console.log(`No apps array found in ${configFile}.`);
    return { apps: [], found: false };
  }

  const apps = parseAppsArray(appsText);

  console.log(`📦 Loaded ${apps.length} app(s) from ${path.basename(configFile)}`);

  return { apps, found: true };
}

// const apps = JSON.parse(fs.readFileSync("mono.apps.json", "utf8"));

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}
function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}
function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * A cloned app ships a `tsconfig.json` whose `extends`/`references` point at
 * GENERATED tsconfigs that only exist locally and are gitignored, so the clone's
 * GitHub archive never contains them:
 *   - `.nuxt/tsconfig.*.json` (created by `nuxi prepare`)
 *   - `.mono/tsconfig.json`   (created by `mono prepare`)
 * In a cloned mono app those don't exist, so loading the clone's `.vue`/`.ts`/
 * `mono.config.ts` fails with "Tsconfig not found" (vite/plugin-vue & jiti resolve
 * the nearest tsconfig per file). Strip the `.nuxt`/`.mono`-pointing
 * `extends`/`references` so the clone's tsconfig is harmless to any host; editor
 * `paths` etc. are kept.
 */
function sanitizeClonedTsconfig(dir) {
  const file = path.join(dir, "tsconfig.json");
  if (!exists(file)) return;

  let json;
  try {
    json = JSON.parse(stripCommentsSafe(fs.readFileSync(file, "utf8")));
  } catch {
    return; // non-JSON / JSONC with trailing commas — leave it untouched
  }

  // Matches refs to generated, gitignored tsconfigs that won't exist in a clone.
  const pointsToGenerated = (v) => {
    const s = String(v ?? "").replace(/\\/g, "/");
    return s.includes(".nuxt") || s.includes(".mono");
  };
  let changed = false;

  if (Array.isArray(json.references)) {
    const kept = json.references.filter((r) => !pointsToGenerated(r?.path));
    if (kept.length !== json.references.length) {
      if (kept.length) json.references = kept;
      else delete json.references;
      changed = true;
    }
  }

  if (typeof json.extends === "string" && pointsToGenerated(json.extends)) {
    delete json.extends;
    changed = true;
  } else if (Array.isArray(json.extends)) {
    const kept = json.extends.filter((e) => !pointsToGenerated(e));
    if (kept.length !== json.extends.length) {
      if (kept.length) json.extends = kept;
      else delete json.extends;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, JSON.stringify(json, null, 2), "utf8");
    console.log(`🧹 Sanitized cloned tsconfig (.nuxt/.mono refs) in ${path.basename(dir)}/tsconfig.json`);
  }
}

const { apps, found: appsDeclared } = readAppsFromMonoConfig();

// NOTE: no early exit on an empty list. `apps: []` is a valid statement — "this
// host federates nothing" — and the prune below is what acts on it. Bailing here
// (as this did) meant emptying `apps[]` left every clone on disk forever.


const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 6,
});

async function withRetry(fn, { retries = 4, baseDelayMs = 800, label = "request" } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (e) {
      lastErr = e;
      const code = e?.code || "";
      const isRetryable =
        code === "ETIMEDOUT" ||
        code === "ECONNRESET" ||
        code === "EAI_AGAIN" ||
        code === "ENOTFOUND";

      if (!isRetryable || attempt === retries) break;

      const delay = baseDelayMs * Math.pow(2, attempt);
      console.log(`⚠️  ${label} failed (${code || e.message}). Retry in ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

function httpGetJson(url, token, { timeoutMs = 20000 } = {}) {
  return withRetry(
    () =>
      new Promise((resolve, reject) => {
        const req = https.get(
          url,
          {
            agent,
            headers: {
              "User-Agent": "vite-app-downloader",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              Accept: "application/vnd.github+json",
            },
          },
          (res) => {
            // follow redirect
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              res.resume();
              return resolve(httpGetJson(res.headers.location, token, { timeoutMs }));
            }

            let data = "";
            res.setEncoding("utf8");
            res.on("data", (c) => (data += c));
            res.on("end", () => {
              if (res.statusCode !== 200) {
                return reject(
                  new Error(`GitHub API failed ${res.statusCode} ${res.statusMessage}: ${data}`)
                );
              }
              try {
                resolve(JSON.parse(data));
              } catch (e) {
                reject(e);
              }
            });
          }
        );

        req.setTimeout(timeoutMs, () => req.destroy(Object.assign(new Error("timeout"), { code: "ETIMEDOUT" })));
        req.on("error", reject);
      }),
    { label: "GitHub API" }
  );
}

async function getLatestCommitSha(owner, repo, ref, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits/${encodeURIComponent(ref)}`;
  const json = await httpGetJson(url, token);
  if (!json?.sha) throw new Error(`Cannot read commit sha for ${owner}/${repo}@${ref}`);
  return json.sha;
}

// ---------------------------------------------------------------------------
// Transport selection.
//
// Prefer the machine's OWN git credentials over the shared PAT. A collaborator
// who has been invited to the repo can `git ls-remote` it with no token, and
// that single call also hands us the head SHA — so the git path makes ZERO
// GitHub REST requests and burns no rate limit. Everyone else falls back to the
// existing token + archive-ZIP path, with a warning telling them what to ask for.
// ---------------------------------------------------------------------------
const ACCESS_TTL_MS = Number(process.env.MONO_SYNC_ACCESS_TTL_MS) || 6 * 60 * 60 * 1000;
const RECHECK_ACCESS = process.env.MONO_SYNC_RECHECK_ACCESS === "1" || argv.recheckAccess === true;
// Generous on purpose. This is a hang cap, NOT a latency budget: the flags in
// mono-git.mjs are what actually stop a Git Credential Manager dialog blocking
// forever. Measured on a real (slow) link, a SUCCESSFUL probe took ~22s — 10s of
// that is plain round-trip to github.com and ~5s is the `gh` credential helper —
// so anything near 20s would reject working collaborators and silently push them
// back onto the token.
const PROBE_TIMEOUT_MS = Number(process.env.MONO_SYNC_PROBE_TIMEOUT_MS) || 60000;
const FETCH_TIMEOUT_MS = Number(process.env.MONO_SYNC_FETCH_TIMEOUT_MS) || 180000;

// 'auto' = shallow `clone`, falling back to `init`+`fetch`. See materializeGitTree
// for the measurements; only override this for a git setup that mishandles one.
const GIT_METHOD = resolveGitMethod({ argv });

let _gitInstalled;
function gitInstalled() {
  if (_gitInstalled === undefined) _gitInstalled = runGit(["--version"], { timeoutMs: 10000 }).ok;
  return _gitInstalled;
}

const warnedOnce = new Set();
function warnOnce(key, msg) {
  if (warnedOnce.has(key)) return;
  warnedOnce.add(key);
  console.log(msg);
}

/**
 * @returns {{sha: string, remoteUrl: string, ref: string, dir: string} | null}
 *   `null` means "use the token transport". Throws when there is nothing to fall
 *   back to (`transport: 'git'`, or no token configured), or when the ref itself
 *   does not exist. `ref`/`dir` are the RESOLVED split of the deep URL — the ref
 *   git must actually fetch, and the folder to extract from the clone.
 */
function tryGitTransport({ app, owner, repo, refAndDir, mode, token }) {
  const slug = `${owner}/${repo}`;
  const hasToken = Boolean(token);

  // Either hand back `null` (caller uses the token) or fail the app loudly.
  const giveUp = (reason) => {
    if (mode === "git") throw new Error(`${reason} (transport: 'git' — no token fallback)`);
    if (!hasToken) {
      throw new Error(
        `${reason}, and no token to fall back to` +
        (app.envToken ? ` (${app.envToken} is empty)` : ` (no "envToken" configured)`)
      );
    }
    return null;
  };

  if (!gitInstalled()) {
    warnOnce("no-git", `⚠️  git is not on PATH — cannot sync without a token.`);
    return giveUp("git is not installed");
  }

  // A short (7..39 hex) ref resolves via REST but is not fetchable by git. Any
  // candidate may be the real one, so bail to REST if any could be a short sha.
  const candidates = refDirCandidates(refAndDir);
  if (candidates.some((c) => isShortSha(c.ref))) {
    warnOnce(`short-sha:${slug}`, `⚠️  Ref "${refAndDir}" contains a short sha — git cannot fetch it.`);
    return giveUp(`ref "${refAndDir}" contains a short sha`);
  }

  if (!RECHECK_ACCESS) {
    const hit = accessCacheGet(accessCache, slug, { ttlMs: ACCESS_TTL_MS });
    if (hit) {
      const then = mode === "git" ? "" : hasToken ? " Using the token." : "";
      console.log(`↪️  No git access to ${slug} (checked ${ago(hit.checkedAt)}).${then}`);
      console.log(`   Set MONO_SYNC_RECHECK_ACCESS=1 to probe again.`);
      needsInvite.add(slug);
      return giveUp(`no git access to ${slug}`);
    }
  }

  const probe = resolveRefDir({ owner, repo, refAndDir, timeoutMs: PROBE_TIMEOUT_MS });

  if (probe.ok) {
    // Access restored (an invite landed) — drop the stale negative immediately.
    if (accessCache[slug]) {
      delete accessCache[slug];
      saveAccessCache();
    }
    console.log(`🔑 Git access OK — no token needed.`);
    return { sha: probe.sha, remoteUrl: probe.remoteUrl, ref: probe.ref, dir: probe.dir };
  }

  if (probe.kind === "ref-missing") {
    // We can reach the repo; the ref is simply wrong. The token path would 404
    // on it too, so fail fast with the useful message instead — naming every
    // split tried, so a deep-URL typo says which folder/ref was the problem.
    throw new Error(
      `Ref "${refAndDir}" not found in ${slug} (tried as branch/tag: ${probe.tried.join(", ")}).`
    );
  }

  if (probe.kind === "network" || probe.kind === "timeout") {
    // Transient. Never cache this, or one flaky moment pins a collaborator to
    // the token for the whole TTL.
    console.log(`⚠️  Cannot reach github.com over git (${probe.detail || "timed out"}). Falling back to the token.`);
    return giveUp(`cannot reach ${slug} over git`);
  }

  if (probe.kind === "no-access") {
    if (probe.why === "bad-credential") {
      console.log(`⚠️  Your saved git credential for github.com was rejected (${probe.detail}).`);
      console.log(`   Re-authenticate — \`gh auth login\`, or update the github.com entry in Windows Credential Manager.`);
    } else if (probe.why === "no-credential") {
      console.log(`⚠️  No git credential for github.com on this machine.`);
      console.log(`   Sign in once (\`gh auth login\`) and ask the owner of ${slug} to invite you as a collaborator,`);
      console.log(`   then \`mono sync\` needs no token at all.`);
    } else {
      console.log(`⚠️  You are not invited to "${slug}" — no git access to this repo.`);
      console.log(`   To get access without a token, ask the owner to invite you as a collaborator,`);
      console.log(`   then you can sync without a token.`);
    }

    accessCacheSet(accessCache, slug, { why: probe.why, detail: probe.detail });
    saveAccessCache();
    needsInvite.add(slug);

    if (hasToken && mode !== "git") console.log(`   Falling back to the token in ${app.envToken}.`);
    return giveUp(`no git access to ${slug}`);
  }

  console.log(`⚠️  git probe of ${slug} failed (${probe.detail || probe.kind}). Falling back to the token.`);
  return giveUp(`git probe of ${slug} failed`);
}

function downloadToFile(url, destZip, token, { timeoutMs = 30000 } = {}) {
  return withRetry(
    () =>
      new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destZip);
        const req = https.get(
          url,
          {
            agent,
            headers: {
              "User-Agent": "vite-app-downloader",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              Accept: "application/vnd.github+json",
            },
          },
          (res) => {
            // follow redirect (GitHub archive redirects often)
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              res.resume();
              file.close();
              return resolve(downloadToFile(res.headers.location, destZip, token, { timeoutMs }));
            }

            if (res.statusCode !== 200) {
              res.resume();
              file.close();
              return reject(new Error(`Download failed ${res.statusCode} ${res.statusMessage}`));
            }

            res.pipe(file);
            file.on("finish", () => file.close(resolve));
          }
        );

        req.setTimeout(timeoutMs, () => req.destroy(Object.assign(new Error("timeout"), { code: "ETIMEDOUT" })));
        req.on("error", (err) => {
          file.close(() => {
            try { fs.unlinkSync(destZip); } catch { }
            reject(err);
          });
        });
      }),
    { label: "ZIP download" }
  );
}

/**
 * Token transport: download the archive ZIP and unpack it into `destDir`.
 *
 * Unchanged behaviour, just pointed at a staging dir instead of straight at
 * `outDir`. Note this still needs a POSIX `unzip` on PATH — the git transport
 * above does not, so on Windows this path only works for people who are NOT
 * collaborators, which is precisely the case we now try hardest to avoid.
 *
 * `dir` (deep /tree/ URLs) picks the subfolder out of the extracted archive
 * instead of the repo root, so both transports land the same tree.
 *
 * @returns {Promise<string>} the sha that was downloaded
 */
async function materializeZipTree({ owner, repo, sha, token, destDir, dir = "" }) {
  const zipUrl = `https://github.com/${owner}/${repo}/archive/${sha}.zip`;
  const tmpWorkDir = fs.mkdtempSync(path.join(os.tmpdir(), `repo-dl-${repo}-`));
  const zipFile = path.join(tmpWorkDir, `archive.zip`);
  const extractDir = path.join(tmpWorkDir, `extract`);

  try {
    await downloadToFile(zipUrl, zipFile, token);
    mkdirp(extractDir);
    execSync(`unzip -q "${zipFile}" -d "${extractDir}"`, { stdio: "inherit" });

    const [top] = fs.readdirSync(extractDir);
    if (!top) throw new Error("Zip extraction failed");

    const src = dir
      ? path.join(extractDir, top, ...dir.split("/").filter(Boolean))
      : path.join(extractDir, top);
    if (dir && !exists(src)) {
      throw new Error(
        `Folder "${dir}" not found in ${owner}/${repo}@${sha.slice(0, 7)} (from the /tree/ URL).`
      );
    }

    mkdirp(destDir);
    fs.cpSync(src, destDir, { recursive: true });

    return sha;
  } finally {
    rmrf(tmpWorkDir);
  }
}

/**
 * Token-transport deep-URL resolution: same candidate order as the git probe
 * (`refDirCandidates`), but each split is tried against REST `/commits/<ref>`
 * instead of `ls-remote`. A 404 means "this split is not a ref" — try the next.
 * Anything else (rate limit, auth) is real and must surface.
 */
async function resolveRefDirViaRest(owner, repo, refAndDir, token) {
  let lastErr;
  for (const c of refDirCandidates(refAndDir)) {
    try {
      return { ref: c.ref, dir: c.dir, sha: await getLatestCommitSha(owner, repo, c.ref, token) };
    } catch (e) {
      if (!/404|No commit found/i.test(String(e?.message || ""))) throw e;
      lastErr = e;
    }
  }
  throw new Error(
    `Ref "${refAndDir}" not found in ${owner}/${repo} (${lastErr?.message || "no such branch or tag"}).`
  );
}

// --- lock + commit cache (ONLY sha stored) ---
// Kept under `.mono/` alongside the generated tsconfig so all mono-managed
// artifacts live in one place (was `.cache/`).
const cacheDir = path.resolve(".mono");
mkdirp(cacheDir);

const lockFile = path.join(cacheDir, "clone.lock");
let lockFd;
try {
  lockFd = fs.openSync(lockFile, "wx"); // fails if exists
  fs.writeFileSync(lockFd, String(process.pid));
} catch (e) {
  if (e.code === "EEXIST") {
    console.log(`⛔ Another sync is running (lock: ${lockFile}). Skipping.`);
    process.exit(0);
  }
  throw e;
}
process.on("exit", () => {
  try { if (lockFd) fs.closeSync(lockFd); } catch { }
  try { fs.unlinkSync(lockFile); } catch { }
});
process.on("SIGINT", () => process.exit(130));
process.on("SIGTERM", () => process.exit(143));

const cacheFile = path.join(cacheDir, "apps-commit-cache.json");
let commitCache = {};
if (exists(cacheFile)) {
  try {
    commitCache = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
  } catch {
    commitCache = {};
  }
}

// --- access cache (ONLY negative results; see mono-git.mjs accessCacheGet) ---
// Separate file from the commit cache so nothing reading that one has to migrate.
// Keyed by `owner/repo` — access is repo-level, not ref-level.
const accessCacheFile = path.join(cacheDir, "apps-access-cache.json");
let accessCache = {};
if (exists(accessCacheFile)) {
  try {
    accessCache = JSON.parse(fs.readFileSync(accessCacheFile, "utf8"));
  } catch {
    accessCache = {};
  }
}
function saveAccessCache() {
  try {
    fs.writeFileSync(accessCacheFile, JSON.stringify(accessCache, null, 2), "utf8");
  } catch { }
}

/** Repos that still needed the PAT because this machine has no git access. */
const needsInvite = new Set();

// Every clone lives here. Deliberately NOT per-app configurable: the alias/
// ecosystem scanners in src/ all hardcode `.mono/apps`, and pointing the prune
// below at an arbitrary directory would let it delete a tree mono never created.
const appsDir = path.resolve(MONO_APPS_DIR);

// Clear staging dirs left by a crashed run. Safe: the lock above guarantees we
// are the only sync in flight.
sweepStrayStages(appsDir);

// --- prune apps that left mono.config ---------------------------------------
// Runs BEFORE the sync loop and touches no network, so a removed app disappears
// even when a surviving app fails to download.
const pruned = [];

if (appsDeclared && resolvePrune({ argv })) {
  const keepNames = apps.map((a) => a.name);
  const keepKeys = new Set();
  const keepSlugs = new Set();

  for (const app of apps) {
    // A path-only app has no cache entries to keep. Its NAME still protects a
    // stale clone under .mono/apps (`keepNames`), which is shadowed by the
    // path, never read, and deliberately never deleted here.
    if (!app.url) continue;
    try {
      const { owner, repo, ref } = parseGithubUrl(app.url);
      keepSlugs.add(`${owner}/${repo}`);
      keepKeys.add(`${owner}/${repo}@${ref}`);
    } catch {
      // A malformed url only costs this app its cache entries (they get rebuilt
      // on the next successful sync). Directory pruning keys off `name`, never
      // the url, so a typo here can never delete a tree.
    }
  }

  for (const name of orphanAppDirs(appsDir, keepNames)) {
    // Not `path.join`: `appDirToPrune` re-derives the path and refuses anything
    // that escapes `.mono/apps`. Belt to the name-keyed braces above.
    const dir = appDirToPrune(appsDir, name);
    try {
      rmrf(dir);
      pruned.push(name);
      console.log(`🧹 Removed app "${name}" (${path.relative(process.cwd(), dir) || dir})`);
    } catch (e) {
      console.log(`⚠️  Could not remove ${dir}: ${e.message}`);
    }
  }

  const droppedCache = staleCacheKeys(commitCache, keepKeys);
  if (droppedCache.length) {
    for (const key of droppedCache) delete commitCache[key];
    fs.writeFileSync(cacheFile, JSON.stringify(commitCache, null, 2), "utf8");
    console.log(`   ↳ dropped ${droppedCache.length} commit-cache entr${droppedCache.length === 1 ? "y" : "ies"} (${droppedCache.join(", ")})`);
  }

  const droppedAccess = staleAccessKeys(accessCache, keepSlugs);
  if (droppedAccess.length) {
    for (const slug of droppedAccess) delete accessCache[slug];
    saveAccessCache();
    console.log(`   ↳ dropped ${droppedAccess.length} access-cache entr${droppedAccess.length === 1 ? "y" : "ies"} (${droppedAccess.join(", ")})`);
  }

  // The generated tsconfig still maps `@<name>/*` at a directory that is now
  // gone. `mono prepare` rebuilds this file from the directory scan, so this
  // only covers the gap until it next runs — but a mapping to a missing folder
  // is worse than no mapping.
  if (pruned.length) {
    const aliases = pruneMonoTsconfigPaths(path.join(cacheDir, "tsconfig.json"), pruned);
    if (aliases.length) console.log(`   ↳ dropped ${aliases.length} tsconfig alias(es) (${aliases.join(", ")})`);
  }
}

if (!apps.length) {
  console.log(appsDeclared ? "mono.config declares no apps — nothing to sync." : "No apps found in mono.config.");
  process.exit(0);
}

const succeeded = [];
const failed = [];
const linked = [];

for (const app of apps) {
  try {
    const outDir = path.join(appsDir, app.name);

    // Read in place? Then there is nothing to clone — decided before any
    // network call, and the commit cache is left untouched.
    const source = resolveAppSource(app);
    if (source.kind === "path") {
      const rel = path.relative(process.cwd(), source.dir) || source.dir;
      console.log(`\n🔗 ${app.name}: linked to ${rel} — nothing to clone.`);
      if (fs.existsSync(outDir)) {
        console.log(`   ℹ️  a stale clone sits at ${path.relative(process.cwd(), outDir)}; it is shadowed by path and left alone — delete it if you want.`);
      }
      linked.push({ name: app.name, dir: rel });
      continue;
    }
    if (source.kind === "path-missing") {
      if (!app.url) {
        throw new Error(`path '${app.path}' not found (looked in ${source.dir}) and no url is declared — nothing to fall back to.`);
      }
      console.log(`\n⚠️  ${app.name}: path '${app.path}' not found (looked in ${source.dir}) — syncing from GitHub instead.`);
    }
    const token = app.envToken ? process.env[app.envToken] : undefined;

    // `ref` here is the RAW /tree/ remainder ("main/nuxt-remote") — kept whole
    // for the cache key so it stays stable without a network round-trip in the
    // prune pass. The ref/dir split of it is resolved per transport below.
    const { owner, repo, ref: refAndDir } = parseGithubUrl(app.url);
    const cacheKey = `${owner}/${repo}@${refAndDir}`;

    console.log(`\n==> Check ${app.name} (${cacheKey})`);

    const mode = resolveTransport({ app, argv });
    const git = mode === "token" ? null : tryGitTransport({ app, owner, repo, refAndDir, mode, token });

    let latestSha;
    // The folder half of the resolved deep URL ('' for a whole-repo app).
    let subDir = git?.dir || "";
    if (git) {
      // `ls-remote` already told us — no REST call, no rate limit spent.
      latestSha = git.sha;
    } else {
      try {
        const rest = await resolveRefDirViaRest(owner, repo, refAndDir, token);
        latestSha = rest.sha;
        subDir = rest.dir;
      } catch (e) {
        throw new Error(`Cannot resolve ${cacheKey}: ${e.code || e.message}`);
      }
    }

    const lastSha = commitCache[cacheKey];
    let via = git ? "git" : "token";

    if (lastSha === latestSha && exists(outDir)) {
      console.log(`↪️  No changes (${latestSha.slice(0, 7)}). Skip download.`);
      succeeded.push({ name: app.name, cacheKey, sha: latestSha, via });
      continue;
    }

    console.log(
      lastSha
        ? `🧩 Changed ${String(lastSha).slice(0, 7)} -> ${latestSha.slice(0, 7)}. Downloading...`
        : `🆕 First time download (${latestSha.slice(0, 7)}).`
    );

    // Build into a staging dir on the SAME volume as outDir, then swap. The old
    // tree survives until the new one is complete, so a failed download no
    // longer leaves the app directory deleted.
    mkdirp(appsDir);
    const stage = stagePathFor(appsDir, app.name);
    // A deep URL clones the WHOLE repo into a second staging dir first, then the
    // folder moves out of it; a whole-repo URL clones straight into the stage.
    const repoStage = subDir ? stagePathFor(appsDir, `${app.name}-repo`) : stage;

    try {
      let finalSha;
      if (git) {
        console.log(
          subDir
            ? `📥 Downloading via git (depth 1, folder "${subDir}")...`
            : `📥 Downloading via git (depth 1)...`
        );
        const got = materializeGitTree({
          remoteUrl: git.remoteUrl,
          ref: git.ref,
          sha: latestSha,
          destDir: repoStage,
          timeoutMs: FETCH_TIMEOUT_MS,
          method: GIT_METHOD,
        });
        finalSha = got.sha;
        // Which of the two git methods actually served it. `clone` is the fast
        // path; seeing `fetch` here means either a pinned commit sha or a clone
        // that failed and was retried.
        via = `git (${got.method})`;
        if (subDir) pickSubtree(repoStage, subDir, stage);
        if (finalSha !== latestSha) {
          console.log(`🧩 Ref moved during download -> ${finalSha.slice(0, 7)}.`);
        }
      } else {
        finalSha = await materializeZipTree({ owner, repo, sha: latestSha, token, destDir: stage, dir: subDir });
      }

      // Strip repo plumbing BEFORE the swap, so outDir is never momentarily a
      // nested git repo (the git transport really does create a .git dir).
      rmrf(path.join(stage, ".git"));
      rmrf(path.join(stage, ".github"));

      swapIntoPlace(stage, outDir);

      // Make a cloned Nuxt app's tsconfig harmless to a Vite host (drop `.nuxt`
      // refs that don't exist without `nuxi prepare`). After the swap, so its
      // log line names the real app dir rather than the staging dir.
      sanitizeClonedTsconfig(outDir);

      commitCache[cacheKey] = finalSha;
      fs.writeFileSync(cacheFile, JSON.stringify(commitCache, null, 2), "utf8");

      console.log(`✅ Stored in ${outDir}`);
      succeeded.push({ name: app.name, cacheKey, sha: finalSha, via });
    } finally {
      rmrf(stage);
      if (repoStage !== stage) rmrf(repoStage);
    }
  } catch (e) {
    console.log(`❌ ${app.name}: ${e.message}`);
    failed.push({ name: app.name, url: app.url, reason: e.message });
  }
}

console.log(`\n===== Summary =====`);
console.log(`✅ Success (${succeeded.length}):`);
for (const s of succeeded) console.log(`   • ${s.name} (${s.cacheKey} @ ${s.sha.slice(0, 7)}) via ${s.via}`);
console.log(`❌ Failed (${failed.length}):`);
for (const f of failed) console.log(`   • ${f.name}: ${f.reason}`);
if (linked.length) {
  console.log(`🔗 Linked (${linked.length}):`);
  for (const l of linked) console.log(`   • ${l.name} (${l.dir}, read in place)`);
}
if (pruned.length) {
  console.log(`🧹 Pruned (${pruned.length}):`);
  for (const name of pruned) console.log(`   • ${name} (removed from mono.config)`);
}

if (needsInvite.size) {
  console.log(`\n💡 ${needsInvite.size} repo(s) still need a token on this machine.`);
  console.log(`   Ask the owner to invite you as a collaborator, then sync works with no token:`);
  for (const slug of needsInvite) console.log(`   • https://github.com/${slug}/settings/access`);
}

if (failed.length) process.exitCode = 1;
