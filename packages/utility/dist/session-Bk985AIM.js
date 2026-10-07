import { i as extractSkill, n as extractConfig } from "./mono-alias-DNDm-jB_.js";
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

//#region src/skills/config.ts
/**
* Built-in behavioural defaults. Users never configure these — they only set
* `skill.url` / `skill.envToken`.
*/
const SKILLS_DEFAULTS = Object.freeze({
	/** Local staging + clone directory (under the already-gitignored `.mono/`). */
	stagingDir: ".mono/skills",
	/** Subfolder of `stagingDir` holding the working clone of the skills repo. */
	repoDir: "repo",
	/** Conversation chunk size before splitting into `part-NNNN.jsonl`. 750 KB. */
	chunkSizeBytes: 750 * 1024,
	/** Remove the local staging dir after a successful upload. */
	cleanupAfterSuccess: true,
	/** Move a failed session from `pending/` to `failed/`. */
	moveFailedSessions: true,
	/** `read`/`search` re-fetch the clone when its last fetch is older than this. */
	refreshTtlMs: 600 * 1e3,
	/** How many times a rejected (non-fast-forward) push is replayed on a fresh tip. */
	pushAttempts: 3,
	/** Timeout for a single remote git operation (probe, fetch, push). */
	gitTimeoutMs: 120 * 1e3
});
/**
* The ONLY CLI flags any `mono skills` subcommand may accept. The argument guard
* rejects everything else — in particular `--token`, `--owner`, `--repo`,
* `--branch`, `--url`, `--destination`, etc. — so the AI can never (accidentally
* or otherwise) retarget the repo or leak a token via argv.
*/
const ALLOWED_FLAGS = Object.freeze([
	"app",
	"dir",
	"type",
	"path",
	"query",
	"limit",
	"session-id",
	"dry-run"
]);
/**
* Default/generic template app names. While an app still carries one of these
* placeholder names, `save`/`retry` are skipped — we don't want session history
* filed under a non-specific id. The user is expected to rename the app first
* (see Template Rule 1 — "confirm the app name"). Comparison is case-insensitive
* against the normalized app id.
*/
const GENERIC_APP_NAMES = Object.freeze([
	"mono-host",
	"mono-vue",
	"mono-vue-host",
	"mono-nuxt-host",
	"mono-vue-remote"
]);
/** True when `id` is still a default/generic template name. */
function isGenericAppName(id) {
	return GENERIC_APP_NAMES.includes(String(id).trim().toLowerCase());
}
/**
* Load `.env` (and `.env.dev` if present) from `cwd` into `process.env` without
* overriding values already set in the real environment, so `skill.envToken`
* can name a variable kept in a dotenv file — exactly like `apps[].envToken`
* for `mono sync`. Missing files are ignored silently.
*/
function loadSkillsEnv(cwd = process.cwd()) {
	for (const name of [".env", ".env.dev"]) {
		const file = path.resolve(cwd, name);
		if (fs.existsSync(file)) config({
			path: file,
			override: false,
			quiet: true
		});
	}
}
/**
* Read `skill` from the `mono.config.ts` in `cwd`. `null` = not configured (the
* feature is off). Throws when the key is present but malformed.
*/
function loadSkillConfig(cwd = process.cwd()) {
	return extractSkill(cwd);
}
const RE_SCP_SSH = /^([A-Za-z0-9_.-]+)@([^:/]+):(.+)$/;
/**
* Parse `skill.url` into a {@link SkillTarget}. Throws `Invalid skill.url: …`
* for anything that is not a repository (`/blob/` file links, an owner with no
* repo, garbage).
*/
function resolveSkillTarget(cfg) {
	const raw = String(cfg.url ?? "").trim();
	const tokenEnv = cfg.envToken?.trim() || void 0;
	const bad = (why) => {
		throw new Error(`Invalid skill.url '${raw}': ${why}`);
	};
	if (!raw) bad("empty");
	const scp = RE_SCP_SSH.exec(raw);
	if (scp) return {
		kind: "ssh",
		remoteUrl: raw,
		host: scp[2],
		ref: null,
		refAndDir: null,
		dir: "",
		tokenEnv,
		tokenSupported: false
	};
	if (/^([A-Za-z]:[\\/]|\/)/.test(raw)) return {
		kind: "local",
		remoteUrl: raw,
		host: null,
		ref: null,
		refAndDir: null,
		dir: "",
		tokenEnv,
		tokenSupported: false
	};
	let u;
	try {
		u = new URL(raw);
	} catch {
		return bad("not a URL (expected https://…, ssh://…, git@host:…, or file://…)");
	}
	if (u.protocol === "file:") return {
		kind: "local",
		remoteUrl: raw,
		host: null,
		ref: null,
		refAndDir: null,
		dir: "",
		tokenEnv,
		tokenSupported: false
	};
	if (u.protocol === "ssh:" || u.protocol === "git:") return {
		kind: "ssh",
		remoteUrl: raw,
		host: u.hostname,
		ref: null,
		refAndDir: null,
		dir: "",
		tokenEnv,
		tokenSupported: false
	};
	if (u.protocol !== "https:" && u.protocol !== "http:") return bad(`unsupported protocol '${u.protocol}'`);
	if (u.username || u.password) bad("must not embed credentials — use `envToken` instead");
	const parts = u.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
	if (u.hostname.toLowerCase() === "github.com") {
		if (parts.length < 2) return bad("expected https://github.com/<owner>/<repo>");
		const owner = parts[0];
		const repo = parts[1].replace(/\.git$/i, "");
		if (!repo) return bad("missing repository name");
		let refAndDir = null;
		if (parts.length > 2) {
			if (parts[2] !== "tree" || parts.length < 4) return bad("only `/tree/<ref>[/<dir>]` deep URLs are supported (not /blob/, /commit/, …)");
			refAndDir = parts.slice(3).join("/");
		}
		return {
			kind: "github",
			remoteUrl: `https://github.com/${owner}/${repo}.git`,
			host: "github.com",
			owner,
			repo,
			ref: null,
			refAndDir,
			dir: "",
			tokenEnv,
			tokenSupported: true
		};
	}
	if (parts.length < 1) return bad("missing repository path");
	return {
		kind: "https",
		remoteUrl: `${u.protocol}//${u.host}${u.pathname.replace(/\/+$/g, "")}`,
		host: u.hostname,
		ref: null,
		refAndDir: null,
		dir: "",
		tokenEnv,
		tokenSupported: true
	};
}

//#endregion
//#region src/skills/git.ts
/**
* Applied to EVERY git invocation (same list as `mono sync`, same reasons):
* stop Git Credential Manager from popping a dialog, keep LF so the tree is
* byte-identical across machines, no symlinks/submodules, long paths, no gc.
*/
const BASE_ARGS = [
	"-c",
	"credential.interactive=false",
	"-c",
	"credential.guiPrompt=false",
	"-c",
	"core.longpaths=true",
	"-c",
	"core.autocrlf=false",
	"-c",
	"core.eol=lf",
	"-c",
	"core.symlinks=false",
	"-c",
	"submodule.recurse=false",
	"-c",
	"gc.auto=0",
	"-c",
	"advice.detachedHead=false",
	"--no-pager"
];
/** Environment for every git child process. */
function gitEnv(extra = {}) {
	return {
		...process.env,
		GIT_TERMINAL_PROMPT: "0",
		GCM_INTERACTIVE: "never",
		GIT_LFS_SKIP_SMUDGE: "1",
		...extra
	};
}
/**
* Run git. NEVER throws — returns a record for the caller to classify.
* `shell: false` so a path like `C:\Program Files\…` needs no quoting.
*/
function runGit(args, { cwd, timeoutMs = 2e4, env } = {}) {
	const res = spawnSync("git", [...BASE_ARGS, ...args], {
		cwd,
		env: gitEnv(env),
		encoding: "utf8",
		shell: false,
		windowsHide: true,
		timeout: timeoutMs,
		killSignal: "SIGKILL",
		maxBuffer: 32 * 1024 * 1024,
		stdio: [
			"ignore",
			"pipe",
			"pipe"
		]
	});
	const timedOut = res.error?.code === "ETIMEDOUT" || res.signal === "SIGKILL";
	return {
		ok: res.status === 0 && !timedOut,
		code: res.status,
		signal: res.signal,
		stdout: res.stdout || "",
		stderr: res.stderr || "",
		error: res.error,
		timedOut
	};
}
const RE_NETWORK = /Could not resolve host|Failed to connect|Connection (timed out|refused|reset)|Operation timed out|network is unreachable|unable to access '[^']*': (Proxy|SSL|OpenSSL|GnuTLS|Recv failure|send failure)|SSL certificate problem/i;
const RE_NOTFOUND = /remote: Repository not found|repository '[^']*' not found|remote: Not Found|does not appear to be a git repository/i;
const RE_BADCRED = /Authentication failed|Invalid username or (password|token)|Support for password authentication|The requested URL returned error: 40[13]|403 Forbidden|Permission (to [^ ]+ )?denied/i;
const RE_NOCRED = /could not read (Username|Password)|unable to get (password|username) from user|terminal prompts disabled|no supported authentication methods/i;
/** First `fatal:`/`error:`/`remote:` line of stderr, tag stripped — and redacted. */
function firstFatal(stderr) {
	const lines = String(stderr).split("\n").map((s) => s.trim());
	return redactUrl((lines.find((s) => /^(fatal|error|remote):/i.test(s)) || lines.find(Boolean) || "").replace(/^(fatal|error|remote):\s*/i, ""));
}
/**
* Turn a `runGit` result into an actionable cause. The `not-invited` vs
* `bad-credential` split matters: GitHub answers 404 for private repos you
* cannot see, but a STALE cached credential answers "Authentication failed".
*/
function classifyGitFailure(res) {
	if (res?.error?.code === "ENOENT") return { kind: "no-git" };
	if (res?.timedOut) return { kind: "timeout" };
	const err = res?.stderr || "";
	if (res?.code === 2 && !err.trim()) return { kind: "ref-missing" };
	if (RE_NETWORK.test(err)) return {
		kind: "network",
		detail: firstFatal(err)
	};
	if (RE_NOTFOUND.test(err)) return {
		kind: "no-access",
		why: "not-invited",
		detail: firstFatal(err)
	};
	if (RE_BADCRED.test(err)) return {
		kind: "no-access",
		why: "bad-credential",
		detail: firstFatal(err)
	};
	if (RE_NOCRED.test(err)) return {
		kind: "no-access",
		why: "no-credential",
		detail: firstFatal(err)
	};
	return {
		kind: "unknown",
		detail: firstFatal(err) || `git exited ${res?.code}`
	};
}
/** Strip any embedded credential before a URL (or a line containing one) reaches a log or an error. */
function redactUrl(text) {
	return String(text).replace(/(\w+:)?\/\/[^/@\s]*@/g, "$1//***@");
}
/**
* Put a token on an https clone URL for ONE fetch/push. GitHub authenticates a
* PAT as user `x-access-token`; GitLab-style hosts as `oauth2`; Azure DevOps
* accepts any user name with a PAT password. Never store the result — pass it
* as the positional remote argument only, so `.git/config` stays clean.
*/
function tokenRemote(remoteUrl, token) {
	let u;
	try {
		u = new URL(remoteUrl);
	} catch {
		throw new Error(`A token can only be used with an https URL (${redactUrl(remoteUrl)})`);
	}
	if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error(`A token can only be used with an https URL (${redactUrl(remoteUrl)})`);
	u.username = u.hostname.toLowerCase() === "github.com" ? "x-access-token" : "oauth2";
	u.password = token;
	return u.toString();
}
/**
* Every legal split of a `/tree/<refAndDir>` URL remainder into ref + folder,
* longest ref first — `release/v2/app` may be branch `release/v2` + `app` or
* branch `release` + `v2/app`. Only the remote can tell, so the caller probes
* each candidate in this order. (Ported from `bin/mono-git.mjs`.)
*/
function refDirCandidates(refAndDir) {
	const segs = String(refAndDir).split("/").filter(Boolean);
	const out = [];
	for (let i = segs.length; i >= 1; i--) out.push({
		ref: segs.slice(0, i).join("/"),
		dir: segs.slice(i).join("/")
	});
	return out;
}
/** Refs to ask `ls-remote` about for a branch-or-tag name. */
function refPatterns(ref) {
	return [
		`refs/heads/${ref}`,
		`refs/tags/${ref}`,
		`refs/tags/${ref}^{}`
	];
}
/** Pick the SHA for `ref` out of `ls-remote` output. Branch beats tag. */
function parseLsRemote(stdout, ref) {
	const rows = String(stdout).split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
		const [sha, name] = l.split("	");
		return {
			sha,
			name
		};
	});
	const pick = (name) => rows.find((r) => r.name === name)?.sha || null;
	return pick(`refs/heads/${ref}`) ?? pick(`refs/tags/${ref}^{}`) ?? pick(`refs/tags/${ref}`) ?? null;
}
/**
* The default branch from `git ls-remote --symref <url> HEAD`:
* `ref: refs/heads/main\tHEAD` → `main`. `null` for an empty (unborn) remote.
*/
function parseSymref(stdout) {
	const m = /^ref:\s*refs\/heads\/(\S+)\s+HEAD/m.exec(String(stdout));
	return m ? m[1] : null;
}
/** The SHA that `ls-remote … HEAD` reports (second line of a `--symref` answer). */
function parseHeadSha(stdout) {
	const m = /^([0-9a-f]{40})\s+HEAD$/m.exec(String(stdout));
	return m ? m[1] : null;
}
/** Did a push get rejected because the remote moved on (someone else pushed first)? */
function isNonFastForward(stderr) {
	return /rejected\][^\n]*\((fetch first|non-fast-forward|stale info)\)|Updates were rejected/i.test(String(stderr));
}

//#endregion
//#region src/skills/repo.ts
/** The remote could not be reached with any transport we were allowed to try. */
var SkillsAccessError = class extends Error {
	kind;
	why;
	transportTried;
	constructor(message, failure, transportTried) {
		super(message);
		this.name = "SkillsAccessError";
		this.kind = failure.kind;
		this.why = failure.why;
		this.transportTried = transportTried;
	}
};
/** One `ls-remote` round-trip (or a few, for a deep URL) against one URL. */
function probe(target, url, run, timeoutMs) {
	if (target.refAndDir) {
		const candidates = refDirCandidates(target.refAndDir);
		let sawRepo = false;
		for (const c of candidates) {
			const real = run([
				"ls-remote",
				"--exit-code",
				url,
				...refPatterns(c.ref)
			], { timeoutMs });
			if (real.ok) {
				const sha = parseLsRemote(real.stdout, c.ref);
				if (sha) return {
					ok: true,
					ref: c.ref,
					dir: c.dir,
					headSha: sha,
					emptyRemote: false
				};
			}
			const failure = classifyGitFailure(real);
			if (failure.kind !== "ref-missing") return {
				ok: false,
				failure
			};
			sawRepo = true;
		}
		if (sawRepo) {
			const head = run([
				"ls-remote",
				"--symref",
				url,
				"HEAD"
			], { timeoutMs });
			if (head.ok && !head.stdout.trim()) {
				const first = candidates[candidates.length - 1];
				return {
					ok: true,
					ref: first.ref,
					dir: first.dir,
					headSha: null,
					emptyRemote: true
				};
			}
		}
		return {
			ok: false,
			failure: {
				kind: "ref-missing",
				detail: `none of these branches exist on the remote: ${candidates.map((c) => c.ref).join(", ")}`
			}
		};
	}
	if (target.ref) {
		const res = run([
			"ls-remote",
			"--exit-code",
			url,
			...refPatterns(target.ref)
		], { timeoutMs });
		if (res.ok) {
			const sha = parseLsRemote(res.stdout, target.ref);
			if (sha) return {
				ok: true,
				ref: target.ref,
				dir: target.dir,
				headSha: sha,
				emptyRemote: false
			};
		}
		return {
			ok: false,
			failure: classifyGitFailure(res)
		};
	}
	const res = run([
		"ls-remote",
		"--symref",
		url,
		"HEAD"
	], { timeoutMs });
	if (!res.ok) return {
		ok: false,
		failure: classifyGitFailure(res)
	};
	const ref = parseSymref(res.stdout);
	if (!ref) return {
		ok: true,
		ref: "main",
		dir: target.dir,
		headSha: null,
		emptyRemote: true
	};
	return {
		ok: true,
		ref,
		dir: target.dir,
		headSha: parseHeadSha(res.stdout),
		emptyRemote: false
	};
}
/**
* Work out how to reach `skill.url` and what branch/folder it names.
* Throws {@link SkillsAccessError} (message already redacted) when neither the
* machine's credentials nor the configured token get through.
*/
function resolveRemote({ target, env = process.env, run = runGit, timeoutMs = SKILLS_DEFAULTS.gitTimeoutMs }) {
	const token = target.tokenEnv ? env[target.tokenEnv]?.trim() || void 0 : void 0;
	const attempts = [{
		transport: "git",
		url: target.remoteUrl
	}];
	if (token && target.tokenSupported) attempts.push({
		transport: "token",
		url: tokenRemote(target.remoteUrl, token)
	});
	const tried = [];
	let last = { kind: "unknown" };
	for (const attempt of attempts) {
		tried.push(attempt.transport);
		const res = probe(target, attempt.url, run, timeoutMs);
		if (res.ok) return {
			target,
			transport: attempt.transport,
			fetchUrl: attempt.url,
			ref: res.ref,
			dir: res.dir,
			headSha: res.headSha,
			emptyRemote: res.emptyRemote
		};
		last = res.failure;
		if (last.kind !== "no-access") break;
	}
	throw new SkillsAccessError(describeFailure(target, last, tried, !!token), last, tried);
}
function describeFailure(target, f, tried, hadToken) {
	const url = redactUrl(target.remoteUrl);
	const detail = f.detail ? ` (${f.detail})` : "";
	switch (f.kind) {
		case "no-git": return "git is not installed or not on PATH — mono skills needs git.";
		case "timeout": return `Timed out reaching ${url}${detail}.`;
		case "network": return `Cannot reach ${url} — network/proxy/TLS problem${detail}.`;
		case "ref-missing": return `${url}: ${f.detail ?? "branch not found"}.`;
		case "no-access": return `No access to ${url}: ${f.why === "not-invited" ? "this machine is not a collaborator on the repository" : f.why === "bad-credential" ? "the stored git credential was rejected" : "git found no credential for the host"}${detail}. ${tried.includes("token") ? `The token in ${target.tokenEnv} was rejected too — check its scope / SSO authorization.` : target.tokenEnv ? hadToken ? `A token can only be used with an https URL.` : `Set ${target.tokenEnv} (a PAT with read/write access) to fall back to token access.` : `Ask for access, or add \`envToken\` to \`skill\` in mono.config.ts and set that variable.`}`;
		default: return `git failed against ${url}${detail}.`;
	}
}
/** Absolute path of the working clone: `<cwd>/.mono/skills/repo`. */
function repoDir(cwd = process.cwd()) {
	return path.resolve(cwd, SKILLS_DEFAULTS.stagingDir, SKILLS_DEFAULTS.repoDir);
}
function fetchHeadAge(dir) {
	try {
		return Date.now() - fs.statSync(path.join(dir, ".git", "FETCH_HEAD")).mtimeMs;
	} catch {
		return null;
	}
}
function localHead(dir, run) {
	const r = run([
		"rev-parse",
		"--verify",
		"-q",
		"HEAD"
	], {
		cwd: dir,
		timeoutMs: 15e3
	});
	return r.ok ? r.stdout.trim() : null;
}
/** `fetch` the branch and hard-reset the working tree onto it. Returns the failure line, or null. */
function refreshClone(dir, remote, run, timeoutMs) {
	const spec = `+refs/heads/${remote.ref}:refs/remotes/origin/${remote.ref}`;
	const f = run([
		"fetch",
		"--quiet",
		"--no-tags",
		"--no-recurse-submodules",
		remote.fetchUrl,
		spec
	], {
		cwd: dir,
		timeoutMs
	});
	if (!f.ok) return firstFatal(f.stderr) || f.error?.message || `fetch exited ${f.code}`;
	const r = run([
		"reset",
		"--quiet",
		"--hard",
		`refs/remotes/origin/${remote.ref}`
	], {
		cwd: dir,
		timeoutMs: 6e4
	});
	if (!r.ok) return firstFatal(r.stderr) || `reset exited ${r.code}`;
	run([
		"clean",
		"--quiet",
		"-fdx"
	], {
		cwd: dir,
		timeoutMs: 6e4
	});
	return null;
}
/**
* Make `.mono/skills/repo` a valid clone of the resolved remote on `ref`, and
* bring it up to date according to `refresh`:
*
* - `always`   — fetch now (before a save).
* - `if-stale` — fetch when the last fetch is older than `refreshTtlMs`, or the
*                branch was never fetched (before a read).
* - `never`    — serve whatever is there (diagnostics), fetching only if the
*                branch has never been fetched at all.
*
* A failed refresh of an EXISTING clone degrades to `stale: true` — offline
* reads still work. A failed FIRST fetch throws, since there is nothing to serve.
*/
function ensureRepo({ cwd = process.cwd(), remote, refresh, run = runGit, timeoutMs = SKILLS_DEFAULTS.gitTimeoutMs }) {
	const dir = repoDir(cwd);
	const plainUrl = remote.target.remoteUrl;
	if (!(fs.existsSync(path.join(dir, ".git")) && run(["rev-parse", "--git-dir"], {
		cwd: dir,
		timeoutMs: 15e3
	}).ok)) {
		fs.rmSync(dir, {
			recursive: true,
			force: true
		});
		fs.mkdirSync(dir, { recursive: true });
		const step = (args, what) => {
			const r = run(args, {
				cwd: dir,
				timeoutMs: 3e4
			});
			if (!r.ok) throw new Error(`git ${what} failed: ${firstFatal(r.stderr) || r.error?.message || r.code}`);
		};
		step(["init", "--quiet"], "init");
		step([
			"symbolic-ref",
			"HEAD",
			`refs/heads/${remote.ref}`
		], "symbolic-ref");
		step([
			"remote",
			"add",
			"origin",
			plainUrl
		], "remote add");
	} else {
		const cur = run([
			"remote",
			"get-url",
			"origin"
		], {
			cwd: dir,
			timeoutMs: 15e3
		});
		if (!cur.ok || cur.stdout.trim() !== plainUrl) run(cur.ok ? [
			"remote",
			"set-url",
			"origin",
			plainUrl
		] : [
			"remote",
			"add",
			"origin",
			plainUrl
		], {
			cwd: dir,
			timeoutMs: 15e3
		});
		const head = run([
			"symbolic-ref",
			"-q",
			"HEAD"
		], {
			cwd: dir,
			timeoutMs: 15e3
		});
		if (!head.ok || head.stdout.trim() !== `refs/heads/${remote.ref}`) run([
			"symbolic-ref",
			"HEAD",
			`refs/heads/${remote.ref}`
		], {
			cwd: dir,
			timeoutMs: 15e3
		});
	}
	if (remote.emptyRemote) {
		if (localHead(dir, run)) run([
			"update-ref",
			"-d",
			`refs/heads/${remote.ref}`
		], {
			cwd: dir,
			timeoutMs: 15e3
		});
		run([
			"clean",
			"--quiet",
			"-fdx"
		], {
			cwd: dir,
			timeoutMs: 6e4
		});
		return {
			repoDir: dir,
			refreshed: false,
			stale: false,
			headSha: null,
			lastFetchMs: null
		};
	}
	const hasTip = run([
		"rev-parse",
		"--verify",
		"-q",
		`refs/remotes/origin/${remote.ref}`
	], {
		cwd: dir,
		timeoutMs: 15e3
	}).ok;
	const age = fetchHeadAge(dir);
	const isStale = age == null || age > SKILLS_DEFAULTS.refreshTtlMs;
	if (!(!hasTip || refresh === "always" || refresh === "if-stale" && isStale)) return {
		repoDir: dir,
		refreshed: false,
		stale: false,
		headSha: localHead(dir, run),
		lastFetchMs: age
	};
	const failed = refreshClone(dir, remote, run, timeoutMs);
	if (failed) {
		if (!hasTip) throw new Error(`Cannot fetch ${redactUrl(plainUrl)}: ${failed}`);
		return {
			repoDir: dir,
			refreshed: false,
			stale: true,
			headSha: localHead(dir, run),
			lastFetchMs: age
		};
	}
	return {
		repoDir: dir,
		refreshed: true,
		stale: false,
		headSha: localHead(dir, run),
		lastFetchMs: 0
	};
}
/**
* Write files (via `apply`), commit them as `actor`, push to `ref`. On a
* non-fast-forward rejection: fetch, hard-reset to the new remote tip, run
* `apply` again (it re-checks immutability on the fresh tree), commit, push —
* up to `attempts` times.
*/
function commitAndPush({ repoDir: dir, remote, actor, message, apply, attempts = SKILLS_DEFAULTS.pushAttempts, run = runGit, timeoutMs = SKILLS_DEFAULTS.gitTimeoutMs }) {
	const identity = [
		"-c",
		`user.name=${actor.name}`,
		"-c",
		`user.email=${actor.email}`,
		"-c",
		"commit.gpgsign=false"
	];
	let lastReject = "";
	for (let attempt = 1; attempt <= attempts; attempt++) {
		apply(dir);
		const add = run([
			"add",
			"-A",
			"--",
			"."
		], {
			cwd: dir,
			timeoutMs: 6e4
		});
		if (!add.ok) throw new Error(`git add failed: ${firstFatal(add.stderr) || add.code}`);
		const commit = run([
			...identity,
			"commit",
			"--quiet",
			"--no-verify",
			"-m",
			message
		], {
			cwd: dir,
			timeoutMs: 6e4
		});
		if (!commit.ok) {
			const why = firstFatal(commit.stderr) || commit.stdout.trim() || `exit ${commit.code}`;
			throw new Error(`git commit failed: ${why}`);
		}
		const push = run([
			"push",
			"--quiet",
			remote.fetchUrl,
			`HEAD:refs/heads/${remote.ref}`
		], {
			cwd: dir,
			timeoutMs
		});
		if (push.ok) {
			const sha = localHead(dir, run) ?? "";
			run([
				"update-ref",
				`refs/remotes/origin/${remote.ref}`,
				"HEAD"
			], {
				cwd: dir,
				timeoutMs: 15e3
			});
			return {
				sha,
				attempts: attempt
			};
		}
		if (!isNonFastForward(push.stderr) || attempt === attempts) {
			const cls = classifyGitFailure(push);
			const why = cls.kind === "no-access" ? `no push access (${cls.detail ?? cls.why})` : firstFatal(push.stderr) || `exit ${push.code}`;
			throw new Error(`git push to ${redactUrl(remote.target.remoteUrl)} failed: ${why}`);
		}
		lastReject = firstFatal(push.stderr);
		const failed = refreshClone(dir, remote, run, timeoutMs);
		if (failed) throw new Error(`git push was rejected (${lastReject}) and re-fetch failed: ${failed}`);
	}
	throw new Error(`git push kept being rejected after ${attempts} attempts (${lastReject})`);
}
/** Guard a repo-relative path: no absolute, no `..`, no NUL. */
function assertInside(rel) {
	const norm = String(rel).replace(/\\/g, "/");
	if (norm.startsWith("/") || /^[A-Za-z]:/.test(norm) || norm.split("/").includes("..") || norm.includes("\0")) throw new Error(`Unsafe path '${rel}': path traversal is not allowed`);
}
/** Absolute path of the skills root inside the clone (`repoDir/<dir>`). */
function skillsRoot(dir, sub) {
	if (sub) assertInside(sub);
	return sub ? path.join(dir, sub) : dir;
}
/** Read one file under `<repoDir>/<dir>/<rel>`; `null` when absent or a directory. */
function readRepoFile(dir, sub, rel) {
	assertInside(rel);
	const file = path.join(skillsRoot(dir, sub), rel);
	try {
		return fs.statSync(file).isFile() ? fs.readFileSync(file, "utf8") : null;
	} catch {
		return null;
	}
}
/**
* List files under `<repoDir>/<dir>/<prefix>` recursively, as forward-slash
* paths relative to `<repoDir>/<dir>`. `.git` is never entered.
*/
function listRepoFiles(dir, sub, prefix = "") {
	if (prefix) assertInside(prefix);
	const root = skillsRoot(dir, sub);
	const start = prefix ? path.join(root, prefix) : root;
	const out = [];
	const walk = (abs) => {
		let entries;
		try {
			entries = fs.readdirSync(abs, { withFileTypes: true });
		} catch {
			return;
		}
		for (const e of entries) {
			if (e.name === ".git") continue;
			const full = path.join(abs, e.name);
			if (e.isDirectory()) walk(full);
			else if (e.isFile()) out.push(path.relative(root, full).split(path.sep).join("/"));
		}
	};
	walk(start);
	return out.sort();
}

//#endregion
//#region src/skills/actor.ts
/** Read one `git config --get <key>`; returns '' if unset or git is unavailable. */
function gitConfig(key, cwd) {
	try {
		return execFileSync("git", [
			"config",
			"--get",
			key
		], {
			cwd,
			encoding: "utf8",
			stdio: [
				"ignore",
				"pipe",
				"ignore"
			]
		}).trim();
	} catch {
		return "";
	}
}
/**
* Slugify a display name into a filesystem-safe folder fragment:
* lowercase, non-alphanumerics → `_`, collapsed, trimmed.
*/
function slugifyName(name) {
	return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "unknown";
}
/**
* Resolve the actor from `git config user.name` / `user.email`.
*
* `actorFolder` = `<name-slug>__<6 hex>` where the 6 hex come from a sha256 of
* the email (stable per identity, so the same person always maps to the same
* folder). Example: `John Doe` / `john.doe@company.com` -> `john_doe__8f219a`.
*/
function detectActor(cwd = process.cwd()) {
	const name = gitConfig("user.name", cwd) || "unknown";
	const email = gitConfig("user.email", cwd) || "unknown@unknown";
	const hash = createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 6);
	return {
		name,
		email,
		actorFolder: `${slugifyName(name)}__${hash}`
	};
}

//#endregion
//#region src/skills/appid.ts
/**
* Normalize an app id: lowercase, keep only `[a-z0-9_-]`, collapse the rest to
* `-`, trim separators. Rejects path-traversal / separators outright.
*/
function normalizeAppId(raw) {
	if (/[\\/]|\.\./.test(raw)) throw new Error(`Invalid app id '${raw}': must not contain '..', '/', or '\\'`);
	const id = raw.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^[-_]+|[-_]+$/g, "");
	if (!id) throw new Error(`Invalid app id '${raw}': empty after normalization`);
	return id;
}
/** If `cwd` is inside a `.mono/apps/<name>/...` tree, return `<name>`. */
function appNameFromMonoApps(cwd) {
	const parts = cwd.replace(/\\/g, "/").split("/");
	const i = parts.lastIndexOf("apps");
	if (i > 0 && parts[i - 1] === ".mono" && parts[i + 1]) return parts[i + 1];
	return null;
}
/**
* Resolve the effective app id for a command. `app` is the explicit `--app`
* value (if any); `cwd` is the working directory.
*/
function resolveAppId({ app, cwd = process.cwd() }) {
	if (app && app.trim()) return normalizeAppId(app);
	const sub = appNameFromMonoApps(cwd);
	if (sub) return normalizeAppId(sub);
	return normalizeAppId(extractConfig(cwd).name || path.basename(cwd) || "mono-host");
}

//#endregion
//#region src/skills/validate.ts
/** Canonical enums, mirrored from `types.ts` (SessionStatus / ChangedFile.operation). */
const STATUSES = [
	"completed",
	"partial",
	"failed"
];
const OPERATIONS = [
	"added",
	"modified",
	"deleted",
	"renamed"
];
const isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
const isStringArray = (v) => Array.isArray(v) && v.every((x) => typeof x === "string");
function readIfExists$1(dir, name) {
	const f = path.join(dir, name);
	return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null;
}
/** Collect metadata.json shape problems. */
function checkMetadata(metadata, errors) {
	const m = metadata;
	if (!isObject(m)) {
		errors.push("metadata.json: expected a JSON object");
		return;
	}
	if (typeof m.schemaVersion !== "number") errors.push("metadata.json: `schemaVersion` must be a number");
	if (!isNonEmptyString(m.sessionId)) errors.push("metadata.json: `sessionId` must be a non-empty string");
	if (!STATUSES.includes(m.status)) errors.push(`metadata.json: \`status\` must be one of ${STATUSES.join(" | ")}`);
	for (const key of ["startedAt", "finishedAt"]) if (m[key] !== void 0 && typeof m[key] !== "string") errors.push(`metadata.json: \`${key}\` must be an ISO 8601 string when present`);
	for (const key of [
		"topics",
		"userRequests",
		"commandsRun"
	]) if (m[key] !== void 0 && !isStringArray(m[key])) errors.push(`metadata.json: \`${key}\` must be a string[] when present`);
	if (m.validation !== void 0 && !isObject(m.validation)) errors.push("metadata.json: `validation` must be an object when present");
	if (m.outcome !== void 0 && !isObject(m.outcome)) errors.push("metadata.json: `outcome` must be an object when present");
}
/** Parse a sidecar JSON file, pushing a clear error and returning null on failure. */
function parseSidecar(dir, name, errors) {
	const text = readIfExists$1(dir, name);
	if (text == null) return void 0;
	try {
		return JSON.parse(text);
	} catch (e) {
		errors.push(`${name}: invalid JSON (${e.message})`);
		return null;
	}
}
/** Collect decisions.json shape problems (optional file). */
function checkDecisions(dir, errors) {
	const data = parseSidecar(dir, "decisions.json", errors);
	if (data === void 0 || data === null) return;
	if (!isObject(data) || !Array.isArray(data.decisions)) {
		errors.push("decisions.json: expected `{ \"decisions\": [ { title, decision, reason } ] }`");
		return;
	}
	data.decisions.forEach((d, i) => {
		if (!isObject(d)) {
			errors.push(`decisions.json: decisions[${i}] must be an object`);
			return;
		}
		if (!isNonEmptyString(d.title)) errors.push(`decisions.json: decisions[${i}].title is required (non-empty string)`);
		if (!isNonEmptyString(d.decision)) errors.push(`decisions.json: decisions[${i}].decision is required (non-empty string)`);
		if (d.reason !== void 0 && typeof d.reason !== "string") errors.push(`decisions.json: decisions[${i}].reason must be a string when present`);
	});
}
/** Collect files-changed.json shape problems (optional file). */
function checkFilesChanged(dir, errors) {
	const data = parseSidecar(dir, "files-changed.json", errors);
	if (data === void 0 || data === null) return;
	if (!isObject(data) || !Array.isArray(data.files)) {
		errors.push("files-changed.json: expected `{ \"files\": [ { path, operation, note? } ] }`");
		return;
	}
	data.files.forEach((f, i) => {
		if (!isObject(f)) {
			errors.push(`files-changed.json: files[${i}] must be an object`);
			return;
		}
		if (!isNonEmptyString(f.path)) errors.push(`files-changed.json: files[${i}].path is required (non-empty string)`);
		if (!OPERATIONS.includes(f.operation)) errors.push(`files-changed.json: files[${i}].operation must be one of ${OPERATIONS.join(" | ")}`);
		if (f.note !== void 0 && typeof f.note !== "string") errors.push(`files-changed.json: files[${i}].note must be a string when present`);
	});
}
/** Collect conversation.jsonl problems (optional file): every non-blank line must be a JSON object. */
function checkConversation(dir, errors) {
	const text = readIfExists$1(dir, "conversation.jsonl");
	if (text == null) return;
	const lines = text.split(/\r?\n/);
	let reported = 0;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;
		if (reported >= 5) {
			errors.push("conversation.jsonl: …more invalid lines (showing first 5)");
			break;
		}
		let parsed;
		try {
			parsed = JSON.parse(line);
		} catch (e) {
			errors.push(`conversation.jsonl: line ${i + 1} is not valid JSON (${e.message})`);
			reported++;
			continue;
		}
		if (!isObject(parsed)) {
			errors.push(`conversation.jsonl: line ${i + 1} must be a JSON object`);
			reported++;
		}
	}
}
/**
* Validate a staged session's files against the template standard. Throws a
* single error listing every problem when the session doesn't conform, so
* `save`/`retry` refuse to upload it. A conforming session returns silently.
*/
function validateStagedSession(dir, metadata) {
	const errors = [];
	checkMetadata(metadata, errors);
	checkDecisions(dir, errors);
	checkFilesChanged(dir, errors);
	checkConversation(dir, errors);
	if (errors.length > 0) throw new Error(`Staged session '${dir}' does not match the template standard:\n` + errors.map((e) => `  - ${e}`).join("\n") + `\nRun \`mono skills template\` to see the expected file shapes. Nothing was uploaded.`);
}

//#endregion
//#region src/skills/staging.ts
/** Absolute `.mono/skills` for a given project root. */
function stagingRoot(cwd = process.cwd()) {
	return path.resolve(cwd, SKILLS_DEFAULTS.stagingDir);
}
const REQUIRED_FILES = ["metadata.json", "summary.md"];
function readJson(file) {
	return JSON.parse(fs.readFileSync(file, "utf8"));
}
/**
* Load + validate a staged session directory. Throws a clear error when a
* required file is missing, `metadata.json` is malformed, or any staged file
* doesn't match the template standard — so the caller (save/retry) refuses to
* upload a session that doesn't conform, and nothing reaches GitHub.
*/
function loadStagedSession(dir) {
	const abs = path.resolve(dir);
	if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) throw new Error(`Staging directory not found: ${dir}`);
	for (const req of REQUIRED_FILES) if (!fs.existsSync(path.join(abs, req))) throw new Error(`Staging directory '${dir}' is missing required file '${req}'`);
	let metadata;
	try {
		metadata = readJson(path.join(abs, "metadata.json"));
	} catch (e) {
		throw new Error(`Invalid metadata.json in '${dir}': ${e.message}`);
	}
	validateStagedSession(abs, metadata);
	return {
		sessionId: String(metadata.sessionId || path.basename(abs)),
		dir: abs,
		files: fs.readdirSync(abs, { withFileTypes: true }).filter((d) => d.isFile()).map((d) => d.name),
		metadata
	};
}
/** List session ids under `pending/` (or `failed/`). */
function listSessions(cwd, kind) {
	const base = path.join(stagingRoot(cwd), kind);
	if (!fs.existsSync(base)) return [];
	return fs.readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
}
/** Move a session directory from `pending/` to `failed/` (spec §22). Returns the new path. */
function moveToFailed(cwd, sessionId) {
	const from = path.join(stagingRoot(cwd), "pending", sessionId);
	const to = path.join(stagingRoot(cwd), "failed", sessionId);
	fs.mkdirSync(path.dirname(to), { recursive: true });
	if (fs.existsSync(to)) fs.rmSync(to, {
		recursive: true,
		force: true
	});
	if (fs.existsSync(from)) fs.renameSync(from, to);
	return to;
}
/** Remove a staged session directory after a successful upload (spec §20 cleanup). */
function removeSession(dir) {
	fs.rmSync(path.resolve(dir), {
		recursive: true,
		force: true
	});
}
/** Cache directory for remote reads (`knowledge` / `skills` / `search`). */
function cacheDir(cwd, kind) {
	const dir = path.join(stagingRoot(cwd), "cache", kind);
	fs.mkdirSync(dir, { recursive: true });
	return dir;
}

//#endregion
//#region src/skills/redact.ts
const REDACTED = "[REDACTED]";
/**
* Ordered list of (pattern -> replacement) rules. Each pattern is global so all
* occurrences on every line are replaced.
*/
const RULES = [
	{
		re: /\bghp_[A-Za-z0-9]{20,}\b/g,
		replace: REDACTED
	},
	{
		re: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
		replace: REDACTED
	},
	{
		re: /\b(gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/g,
		replace: REDACTED
	},
	{
		re: /\bAKIA[0-9A-Z]{16}\b/g,
		replace: REDACTED
	},
	{
		re: /\b(Authorization|authorization)\s*:\s*(Bearer|Basic|token)\s+[A-Za-z0-9._\-+/=]+/g,
		replace: `$1: $2 ${REDACTED}`
	},
	{
		re: /\b(Set-Cookie|Cookie)\s*:\s*[^\r\n]+/gi,
		replace: `$1: ${REDACTED}`
	},
	{
		re: /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z ]+ )?PRIVATE KEY-----/g,
		replace: REDACTED
	},
	{
		re: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/]+:[^\s:@/]+@[^\s/]+/gi,
		replace: REDACTED
	},
	{
		re: /\b([A-Za-z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|APIKEY|API_KEY|PRIVATE_KEY|ACCESS_KEY|CLIENT_SECRET|AUTH)[A-Za-z0-9_]*)\s*[:=]\s*("?)([^\s"'#]+)\2/gi,
		replace: `$1=${REDACTED}`
	}
];
/**
* Redact a string. Returns the cleaned text. Safe to run on any text content
* (summaries, conversation lines, decisions, metadata serialized to JSON).
*/
function redact(input) {
	let out = input;
	for (const { re, replace } of RULES) out = out.replace(re, replace);
	return out;
}
/**
* Redact a Buffer (e.g. a conversation chunk before upload) by round-tripping
* through UTF-8. Returns a new Buffer.
*/
function redactBuffer(buf) {
	return Buffer.from(redact(buf.toString("utf8")), "utf8");
}

//#endregion
//#region src/skills/chunk.ts
/**
* Chunk newline-delimited `jsonl` text into parts. Blank lines are dropped.
* Returns `[]` for empty input.
*/
function chunkConversation(jsonl, chunkSizeBytes = SKILLS_DEFAULTS.chunkSizeBytes) {
	const lines = jsonl.split(/\r?\n/).filter((l) => l.trim().length > 0);
	if (lines.length === 0) return [];
	const parts = [];
	let current = [];
	let currentBytes = 0;
	const flush = () => {
		if (current.length === 0) return;
		const name = `part-${String(parts.length + 1).padStart(4, "0")}.jsonl`;
		parts.push({
			name,
			content: Buffer.from(current.join("\n") + "\n", "utf8")
		});
		current = [];
		currentBytes = 0;
	};
	for (const line of lines) {
		const lineBytes = Buffer.byteLength(line, "utf8") + 1;
		if (currentBytes > 0 && currentBytes + lineBytes > chunkSizeBytes) flush();
		current.push(line);
		currentBytes += lineBytes;
	}
	flush();
	return parts;
}

//#endregion
//#region src/skills/save.ts
/** Two-digit zero pad. */
const p2 = (n) => String(n).padStart(2, "0");
/** `YYYY-MM-DD` + `HH-mm-ss` in LOCAL time from a Date. */
function dateParts(d) {
	return {
		date: `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`,
		time: `${p2(d.getHours())}-${p2(d.getMinutes())}-${p2(d.getSeconds())}`
	};
}
function readIfExists(dir, name) {
	const f = path.join(dir, name);
	return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null;
}
/** `skill` from mono.config.ts, or a clear error when it is absent. */
function requireTarget(cwd, target) {
	if (target) return target;
	const cfg = loadSkillConfig(cwd);
	if (!cfg) throw new Error("`skill` is not configured in mono.config.ts");
	return resolveSkillTarget(cfg);
}
/**
* Build the full upload plan from a staged session WITHOUT touching the network.
* `--dry-run` returns exactly this. Everything textual is redacted here.
*/
function buildSavePlan({ cwd = process.cwd(), app, dir, target }) {
	const resolvedTarget = requireTarget(cwd, target);
	const appId = resolveAppId({
		app,
		cwd
	});
	const actor = detectActor(cwd);
	const session = loadStagedSession(dir);
	const sessionId = session.sessionId;
	const when = session.metadata.finishedAt ? new Date(session.metadata.finishedAt) : /* @__PURE__ */ new Date();
	const { date, time } = dateParts(isNaN(when.getTime()) ? /* @__PURE__ */ new Date() : when);
	const sessionFolder = `${time}_${sessionId}`;
	const savedPath = `${appId}/history/${actor.actorFolder}/${date}/${sessionFolder}`;
	const files = [];
	const uploadedNames = [];
	const put = (repoRel, text) => {
		files.push({
			repoPath: `${savedPath}/${repoRel}`,
			content: Buffer.from(redact(text), "utf8")
		});
		uploadedNames.push(repoRel);
	};
	const augmented = {
		...session.metadata,
		app: appId,
		actor: {
			name: actor.name,
			email: actor.email
		},
		actorFolder: actor.actorFolder,
		repository: resolvedTarget.remoteUrl,
		savedPath,
		uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
	put("metadata.json", JSON.stringify(augmented, null, 2));
	put("summary.md", readIfExists(session.dir, "summary.md") ?? "");
	for (const opt of ["files-changed.json", "decisions.json"]) {
		const text = readIfExists(session.dir, opt);
		if (text != null) put(opt, text);
	}
	const convo = readIfExists(session.dir, "conversation.jsonl");
	if (convo != null) {
		const parts = chunkConversation(redact(convo), SKILLS_DEFAULTS.chunkSizeBytes);
		for (const part of parts) {
			files.push({
				repoPath: `${savedPath}/conversation/${part.name}`,
				content: part.content
			});
			uploadedNames.push(`conversation/${part.name}`);
		}
	}
	const index = {
		schemaVersion: 1,
		sessionId,
		format: "jsonl",
		files: uploadedNames
	};
	files.push({
		repoPath: `${savedPath}/index.json`,
		content: Buffer.from(JSON.stringify(index, null, 2), "utf8")
	});
	return {
		appId,
		actor,
		sessionId,
		repository: resolvedTarget.remoteUrl,
		savedPath,
		files
	};
}
function writeFileEnsured(file, content) {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, content);
}
/**
* Write the plan into the clone. Runs inside `commitAndPush`, so it may run
* more than once (after a replay onto a newer tip) — every step is idempotent:
* `app.json` / `user.json` are created once and never overwritten (so human
* edits to them survive), and an existing session folder is REFUSED (sessions
* are immutable).
*/
function applyPlan(plan, root) {
	if (fs.existsSync(path.join(root, plan.savedPath, "metadata.json"))) throw new Error(`Refusing to overwrite an existing session at ${plan.savedPath}`);
	const appJson = path.join(root, plan.appId, "app.json");
	if (!fs.existsSync(appJson)) writeFileEnsured(appJson, JSON.stringify({
		schemaVersion: 1,
		app: plan.appId,
		createdAt: (/* @__PURE__ */ new Date()).toISOString()
	}, null, 2) + "\n");
	const userJson = path.join(root, plan.appId, "history", plan.actor.actorFolder, "user.json");
	if (!fs.existsSync(userJson)) writeFileEnsured(userJson, JSON.stringify({
		name: plan.actor.name,
		email: plan.actor.email,
		actorFolder: plan.actor.actorFolder
	}, null, 2) + "\n");
	for (const file of plan.files) writeFileEnsured(path.join(root, file.repoPath), file.content);
}
/**
* Execute a save: resolve the remote, refresh the clone, apply, commit, push.
* On any failure the local staging dir is preserved / moved to `failed/` and
* the error is rethrown (already redacted).
*/
function runSave({ cwd = process.cwd(), app, dir, target, remote, env = process.env, run }) {
	const resolvedTarget = requireTarget(cwd, target ?? remote?.target);
	const plan = buildSavePlan({
		cwd,
		app,
		dir,
		target: resolvedTarget
	});
	try {
		const resolved = remote ?? resolveRemote({
			target: resolvedTarget,
			env,
			run
		});
		const repo = ensureRepo({
			cwd,
			remote: resolved,
			refresh: "always",
			run
		});
		const root = skillsRoot(repo.repoDir, resolved.dir);
		const pushed = commitAndPush({
			repoDir: repo.repoDir,
			remote: resolved,
			actor: plan.actor,
			message: `feat(${plan.appId}): session ${plan.sessionId}`,
			apply: () => applyPlan(plan, root),
			run
		});
		if (SKILLS_DEFAULTS.cleanupAfterSuccess) removeSession(dir);
		return {
			success: true,
			sessionId: plan.sessionId,
			repository: resolvedTarget.remoteUrl,
			ref: resolved.ref,
			dir: resolved.dir,
			transport: resolved.transport,
			savedPath: plan.savedPath,
			repoPath: resolved.dir ? `${resolved.dir}/${plan.savedPath}` : plan.savedPath,
			commit: pushed.sha,
			pushAttempts: pushed.attempts,
			filesUploaded: plan.files.length,
			localCleanup: SKILLS_DEFAULTS.cleanupAfterSuccess
		};
	} catch (e) {
		if (SKILLS_DEFAULTS.moveFailedSessions) try {
			moveToFailed(cwd, plan.sessionId);
		} catch {}
		if (e && typeof e === "object") e.sessionId = plan.sessionId;
		throw e;
	}
}

//#endregion
//#region src/skills/read.ts
/** Reject path traversal in a `--path` value. */
function assertSafeRelPath(rel) {
	const norm = rel.replace(/\\/g, "/");
	if (norm.startsWith("/") || norm.includes("../") || norm.includes("..\\") || norm.includes("\0")) throw new Error(`Unsafe path '${rel}': path traversal is not allowed`);
}
/** Refresh-if-stale, then hand back the clone root + `dir` + provenance. */
function openRepo({ cwd = process.cwd(), remote, run }) {
	const repo = ensureRepo({
		cwd,
		remote,
		refresh: "if-stale",
		run
	});
	const source = {
		source: "local-clone",
		stale: repo.stale,
		ref: remote.ref,
		dir: remote.dir
	};
	return {
		repoDir: repo.repoDir,
		dir: remote.dir,
		source
	};
}
/**
* Read either a whole `--type knowledge|skills` folder for an app, or a single
* safe `--path` under that app. Returns the matched files' text.
*/
function runRead({ cwd = process.cwd(), app, type, path: relPath, remote, run }) {
	const appId = app ? normalizeAppId(app) : resolveAppId({ cwd });
	const { repoDir, dir, source } = openRepo({
		cwd,
		remote,
		run
	});
	if (relPath) {
		assertSafeRelPath(relPath);
		const full = `${appId}/${relPath}`;
		const text = readRepoFile(repoDir, dir, full);
		if (text == null) throw new Error(`Not found: ${full}`);
		return {
			...source,
			app: appId,
			files: [{
				path: full,
				text
			}]
		};
	}
	if (type !== "knowledge" && type !== "skills") throw new Error(`--type must be 'knowledge' or 'skills' (or pass --path)`);
	const files = [];
	for (const p of listRepoFiles(repoDir, dir, `${appId}/${type}`)) {
		const text = readRepoFile(repoDir, dir, p);
		if (text != null) files.push({
			path: p,
			text
		});
	}
	return {
		...source,
		app: appId,
		type,
		files
	};
}
/** Lowercase word tokens for naive relevance scoring. */
function terms(q) {
	return q.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1);
}
function scoreText(text, queryTerms) {
	const lower = text.toLowerCase();
	let score = 0;
	for (const t of queryTerms) {
		let idx = lower.indexOf(t);
		while (idx !== -1) {
			score++;
			idx = lower.indexOf(t, idx + t.length);
		}
	}
	return score;
}
function makeSnippet(text, queryTerms) {
	const lower = text.toLowerCase();
	let at = -1;
	for (const t of queryTerms) {
		const i = lower.indexOf(t);
		if (i !== -1 && (at === -1 || i < at)) at = i;
	}
	if (at === -1) at = 0;
	const start = Math.max(0, at - 80);
	return text.slice(start, start + 240).replace(/\s+/g, " ").trim();
}
/**
* Search an app's knowledge/skills + history summaries/decisions/index for a
* query. Returns the top `limit` matches with snippets. Conversation chunks are
* intentionally excluded from the scan (too large / low signal).
*/
function runSearch({ cwd = process.cwd(), app, query, limit = 10, remote, run }) {
	const appId = app ? normalizeAppId(app) : resolveAppId({ cwd });
	const queryTerms = terms(query);
	if (queryTerms.length === 0) throw new Error("Empty --query");
	const { repoDir, dir, source } = openRepo({
		cwd,
		remote,
		run
	});
	const candidates = listRepoFiles(repoDir, dir, appId).filter((p) => p.startsWith(`${appId}/knowledge/`) || p.startsWith(`${appId}/skills/`) || /\/(summary\.md|decisions\.json|index\.json|metadata\.json)$/.test(p));
	const hits = [];
	for (const p of candidates) {
		const text = readRepoFile(repoDir, dir, p);
		if (text == null) continue;
		const score = scoreText(text, queryTerms);
		if (score > 0) hits.push({
			path: p,
			score,
			snippet: makeSnippet(text, queryTerms)
		});
	}
	hits.sort((a, b) => b.score - a.score);
	return {
		...source,
		app: appId,
		query,
		hits: hits.slice(0, Math.max(1, limit))
	};
}

//#endregion
//#region src/skills/check.ts
/**
* Run every check that is possible given the current config. Never throws:
* an absent `skill` reports `configured: false`; an unreachable remote reports
* `null`s plus a note.
*/
function runCheck({ cwd = process.cwd(), env = process.env, run = runGit } = {}) {
	const actor = detectActor(cwd);
	const gitIdentityConfigured = actor.name !== "unknown" && actor.email !== "unknown@unknown";
	let currentApp = null;
	try {
		currentApp = resolveAppId({ cwd });
	} catch {
		currentApp = null;
	}
	const genericAppName = currentApp != null && isGenericAppName(currentApp);
	const clonePath = repoDir(cwd);
	const report = {
		configured: false,
		url: null,
		kind: null,
		ref: null,
		dir: null,
		tokenEnv: null,
		tokenPresent: false,
		tokenSupported: false,
		transport: null,
		canRead: null,
		canPush: null,
		remoteHead: null,
		emptyRemote: null,
		localClone: {
			path: clonePath,
			exists: fs.existsSync(path.join(clonePath, ".git")),
			headSha: null,
			lastFetchAt: null
		},
		currentApp,
		genericAppName,
		actor,
		gitIdentityConfigured,
		notes: []
	};
	if (genericAppName) report.notes.push(`App '${currentApp}' still uses a default template name — save/retry are skipped until you rename it (Template Rule 1).`);
	if (!gitIdentityConfigured) report.notes.push("git user.name / user.email are not set — attribution will be \"unknown\".");
	let target;
	try {
		const cfg = loadSkillConfig(cwd);
		if (!cfg) {
			report.notes.push("`skill` is not configured in mono.config.ts — the workflow is a no-op.");
			return report;
		}
		target = resolveSkillTarget(cfg);
	} catch (e) {
		report.notes.push(`Invalid \`skill\` in mono.config.ts: ${e.message}`);
		return report;
	}
	report.configured = true;
	report.url = redactUrl(target.remoteUrl);
	report.kind = target.kind;
	report.dir = target.dir;
	report.tokenEnv = target.tokenEnv ?? null;
	report.tokenSupported = target.tokenSupported;
	report.tokenPresent = !!(target.tokenEnv && env[target.tokenEnv]?.trim());
	if (target.tokenEnv && !report.tokenPresent) report.notes.push(`${target.tokenEnv} is not set — only this machine's own git credentials will be tried.`);
	if (target.tokenEnv && !target.tokenSupported) report.notes.push(`envToken is ignored for ${target.kind} URLs — a token can only ride an https URL.`);
	let remote;
	try {
		remote = resolveRemote({
			target,
			env,
			run
		});
	} catch (e) {
		report.canRead = false;
		report.canPush = false;
		if (e instanceof SkillsAccessError) report.transport = e.transportTried[e.transportTried.length - 1] ?? null;
		report.notes.push(e.message);
		return report;
	}
	report.transport = remote.transport;
	report.ref = remote.ref;
	report.dir = remote.dir;
	report.canRead = true;
	report.remoteHead = remote.headSha;
	report.emptyRemote = remote.emptyRemote;
	try {
		const repo = ensureRepo({
			cwd,
			remote,
			refresh: "never",
			run
		});
		report.localClone = {
			path: repo.repoDir,
			exists: true,
			headSha: repo.headSha,
			lastFetchAt: repo.lastFetchMs == null ? null : new Date(Date.now() - repo.lastFetchMs).toISOString()
		};
		if (repo.stale) report.notes.push("The local clone could not be refreshed — reads may be behind the remote.");
		if (remote.emptyRemote || !repo.headSha) {
			report.canPush = null;
			report.notes.push("Remote is empty — push access is verified on the first save.");
		} else {
			const dry = run([
				"push",
				"--dry-run",
				"--quiet",
				remote.fetchUrl,
				`HEAD:refs/heads/${remote.ref}`
			], {
				cwd: repo.repoDir,
				timeoutMs: SKILLS_DEFAULTS.gitTimeoutMs
			});
			if (dry.ok) report.canPush = true;
			else {
				const cls = classifyGitFailure(dry);
				report.canPush = cls.kind === "no-access" ? false : null;
				report.notes.push(cls.kind === "no-access" ? `Can read but NOT push (${cls.detail ?? cls.why}) — saves will fail until write access is granted.` : `Push check inconclusive: ${firstFatal(dry.stderr) || cls.kind}.`);
			}
		}
	} catch (e) {
		report.notes.push(`Local clone check failed: ${redactUrl(e.message)}`);
	}
	return report;
}

//#endregion
//#region src/skills/session.ts
/**
* Locate `<app>/history/**​/HH-mm-ss_<sessionId>/` in the clone, then return its
* `metadata.json` + `summary.md`. Returns nulls when the session isn't found.
*/
function runSessionShow({ cwd = process.cwd(), app, sessionId, remote, run }) {
	const appId = app ? normalizeAppId(app) : resolveAppId({ cwd });
	const repo = ensureRepo({
		cwd,
		remote,
		refresh: "if-stale",
		run
	});
	const source = {
		source: "local-clone",
		stale: repo.stale,
		ref: remote.ref,
		dir: remote.dir
	};
	const suffix = `_${sessionId}/metadata.json`;
	const metaPath = listRepoFiles(repo.repoDir, remote.dir, `${appId}/history`).find((p) => p.endsWith(suffix));
	if (!metaPath) return {
		...source,
		app: appId,
		sessionId,
		path: null,
		metadata: null,
		summary: null
	};
	const folder = metaPath.replace(/\/metadata\.json$/, "");
	const metaText = readRepoFile(repo.repoDir, remote.dir, metaPath);
	const summary = readRepoFile(repo.repoDir, remote.dir, `${folder}/summary.md`);
	let metadata = null;
	try {
		metadata = metaText ? JSON.parse(metaText) : null;
	} catch {
		metadata = null;
	}
	return {
		...source,
		app: appId,
		sessionId,
		path: folder,
		metadata,
		summary
	};
}

//#endregion
export { BASE_ARGS as A, refPatterns as B, commitAndPush as C, repoDir as D, readRepoFile as E, parseHeadSha as F, SKILLS_DEFAULTS as G, tokenRemote as H, parseLsRemote as I, loadSkillsEnv as J, isGenericAppName as K, parseSymref as L, firstFatal as M, gitEnv as N, resolveRemote as O, isNonFastForward as P, redactUrl as R, SkillsAccessError as S, listRepoFiles as T, ALLOWED_FLAGS as U, runGit as V, GENERIC_APP_NAMES as W, resolveSkillTarget as Y, stagingRoot as _, applyPlan as a, resolveAppId as b, chunkConversation as c, REQUIRED_FILES as d, cacheDir as f, removeSession as g, moveToFailed as h, runSearch as i, classifyGitFailure as j, skillsRoot as k, redact as l, loadStagedSession as m, runCheck as n, buildSavePlan as o, listSessions as p, loadSkillConfig as q, runRead as r, runSave as s, runSessionShow as t, redactBuffer as u, validateStagedSession as v, ensureRepo as w, detectActor as x, normalizeAppId as y, refDirCandidates as z };