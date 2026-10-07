import { J as loadSkillsEnv, K as isGenericAppName, O as resolveRemote, R as redactUrl, S as SkillsAccessError, U as ALLOWED_FLAGS, Y as resolveSkillTarget, _ as stagingRoot, b as resolveAppId, i as runSearch, n as runCheck, o as buildSavePlan, p as listSessions, q as loadSkillConfig, r as runRead, s as runSave, t as runSessionShow, w as ensureRepo, x as detectActor } from "./session-Bk985AIM.js";
import fs from "node:fs";
import path from "node:path";
import { defineCommand, runMain } from "citty";

//#region pkg/cli/skills/_shared.ts
/** Print a single JSON object to stdout (pretty, machine-parseable). */
function printJson(value) {
	process.stdout.write(JSON.stringify(value, null, 2) + "\n");
}
/** Print a failure payload and exit 1. Use for every error exit. */
function fail(error, extra = {}) {
	printJson({
		success: false,
		error: redactUrl(error),
		...extra
	});
	process.exit(1);
}
/**
* Reject any CLI flag that isn't in the approved allowlist. Scans the RAW args
* so even flags citty would silently accept are caught. Call this first in
* every command's `run`, passing `ctx.rawArgs`.
*/
function guardArgs(rawArgs) {
	for (const arg of rawArgs) {
		if (!arg.startsWith("--")) continue;
		const name = arg.slice(2).split("=")[0];
		if (name === "help" || name === "version") continue;
		if (!ALLOWED_FLAGS.includes(name)) fail(`Disallowed flag '--${name}'. The mono skills CLI accepts only: ${ALLOWED_FLAGS.map((f) => "--" + f).join(", ")}. The repository target comes from \`skill\` in mono.config.ts and cannot be overridden.`);
	}
}
/** Load `.env` so `skill.envToken` can resolve, then return cwd. */
function prelude() {
	const cwd = process.cwd();
	loadSkillsEnv(cwd);
	return cwd;
}
/**
* For commands that touch the repository: read `skill` from mono.config.ts.
* Absent → print the skipped result (NOT an error) and exit 0. Present but
* broken → fail. Returns the parsed config + target when the caller should
* continue. `check` does NOT use this — it always runs and reports the state.
*/
function requireSkillConfig(cwd) {
	let cfg;
	try {
		cfg = loadSkillConfig(cwd);
	} catch (e) {
		return fail(e.message);
	}
	if (!cfg) {
		printJson({
			success: true,
			skipped: true,
			reason: "MONO_SKILLS_NOT_CONFIGURED",
			hint: "Add `skill: { url, envToken? }` to mono.config.ts to enable the skills workflow."
		});
		process.exit(0);
	}
	try {
		return {
			cfg,
			target: resolveSkillTarget(cfg)
		};
	} catch (e) {
		return fail(e.message);
	}
}
/**
* Reach the repository (git first, token second) and make sure the local clone
* exists / is fresh enough. Access failures become a JSON failure carrying the
* classified cause; the message is already redacted.
*/
function connect(cwd, target, refresh) {
	let remote;
	try {
		remote = resolveRemote({ target });
	} catch (e) {
		if (e instanceof SkillsAccessError) return fail(e.message, {
			kind: e.kind,
			why: e.why ?? null,
			transportTried: e.transportTried
		});
		return fail(e.message);
	}
	try {
		return {
			remote,
			repo: ensureRepo({
				cwd,
				remote,
				refresh
			})
		};
	} catch (e) {
		return fail(e.message, { repository: redactUrl(target.remoteUrl) });
	}
}
/**
* For `save` / `retry`: if the resolved app id is still a default/generic
* template name, print a skipped result (NOT an error) and exit 0. This stops
* session history from being filed under a placeholder app id — the user must
* rename the app first (Template Rule 1). Other commands are unaffected.
*/
function skipIfGenericApp(appId) {
	if (isGenericAppName(appId)) {
		printJson({
			success: true,
			skipped: true,
			reason: "MONO_SKILLS_GENERIC_APP_NAME",
			app: appId,
			hint: `App '${appId}' still uses a default template name, so skills are not generated. Rename the app in mono.config.ts (and package.json) to a project-specific name first — see Template Rule 1.`
		});
		process.exit(0);
	}
}
/** `<repo>@<ref>[/<dir>]` for human-facing stderr lines. */
function describeRemote(remote) {
	const base = `${redactUrl(remote.target.remoteUrl)}@${remote.ref}`;
	return remote.dir ? `${base}/${remote.dir}` : base;
}

//#endregion
//#region pkg/cli/skills/commands/check.ts
/**
* `mono skills check` — diagnostic. Always runs (even when `skill` is not
* configured) so it can report the state. Never prints a token.
*/
const checkCommand = defineCommand({
	meta: {
		name: "check",
		description: "Verify MONO Skills setup: `skill` config, repository access (git credentials, then envToken), branch/folder, push permission, local clone, and git identity. Never prints a token."
	},
	async run({ rawArgs }) {
		guardArgs(rawArgs);
		const cwd = prelude();
		try {
			printJson({
				success: true,
				...runCheck({ cwd })
			});
		} catch (e) {
			fail(e.message);
		}
	}
});

//#endregion
//#region pkg/cli/skills/commands/whoami.ts
/**
* `mono skills whoami` — print the effective local git identity used for
* attribution: `{ name, email, actorFolder }`. The identity is detected, never
* supplied by the caller. Local-only, so it runs whether or not `skill` is set.
*/
const whoamiCommand = defineCommand({
	meta: {
		name: "whoami",
		description: "Show the local git identity used for attribution (name, email, actorFolder)."
	},
	async run({ rawArgs }) {
		guardArgs(rawArgs);
		printJson({
			success: true,
			...detectActor(prelude())
		});
	}
});

//#endregion
//#region pkg/cli/skills/commands/read.ts
/**
* `mono skills read` — read centralized knowledge or skills for an app, or a
* single safe file via `--path`, from the local clone (refreshed when stale).
* Path traversal (`../`) is rejected.
*/
const readCommand = defineCommand({
	meta: {
		name: "read",
		description: "Read centralized knowledge/skills for an app (--type), or one file (--path)."
	},
	args: {
		app: {
			type: "string",
			description: "App id (defaults to the current app)."
		},
		type: {
			type: "string",
			description: "'knowledge' or 'skills'."
		},
		path: {
			type: "string",
			description: "A specific safe file under the app, e.g. knowledge/business-rules.md."
		}
	},
	async run({ args, rawArgs }) {
		guardArgs(rawArgs);
		const cwd = prelude();
		const { target } = requireSkillConfig(cwd);
		const { remote } = connect(cwd, target, "if-stale");
		try {
			const type = args.type === "knowledge" || args.type === "skills" ? args.type : void 0;
			printJson({
				success: true,
				...runRead({
					cwd,
					app: args.app,
					type,
					path: args.path,
					remote
				})
			});
		} catch (e) {
			fail(e.message);
		}
	}
});

//#endregion
//#region pkg/cli/skills/commands/search.ts
/**
* `mono skills search` — find relevant knowledge/skills/history for a query in
* the local clone. Returns ranked snippets; never bulk-loads all conversations.
*/
const searchCommand = defineCommand({
	meta: {
		name: "search",
		description: "Search an app's knowledge, skills, and history summaries for relevant matches."
	},
	args: {
		app: {
			type: "string",
			description: "App id (defaults to the current app)."
		},
		query: {
			type: "string",
			description: "Search text."
		},
		limit: {
			type: "string",
			description: "Max results (default 10)."
		}
	},
	async run({ args, rawArgs }) {
		guardArgs(rawArgs);
		const cwd = prelude();
		if (!args.query) fail("--query is required.");
		const { target } = requireSkillConfig(cwd);
		const { remote } = connect(cwd, target, "if-stale");
		const limit = args.limit ? Math.max(1, parseInt(args.limit, 10) || 10) : 10;
		try {
			printJson({
				success: true,
				...runSearch({
					cwd,
					app: args.app,
					query: args.query,
					limit,
					remote
				})
			});
		} catch (e) {
			fail(e.message);
		}
	}
});

//#endregion
//#region pkg/cli/skills/commands/save.ts
/** Human-facing report on stderr so stdout stays pure JSON. Shared with `retry`. */
function reportSaved(result, remote) {
	process.stderr.write(`\nSession history saved to ${describeRemote(remote)}:\n\n${result.repoPath}\n` + (result.pushAttempts > 1 ? `(replayed after a concurrent save — ${result.pushAttempts} attempts)\n` : ""));
}
/** Failure report for `save`/`retry`: JSON to stdout, one honest line to stderr, exit 1. */
function reportNotSaved(e, repository, sessionId) {
	printJson({
		success: false,
		error: redactUrl(e.message),
		repository: redactUrl(repository)
	});
	process.stderr.write(`\nSession history was NOT saved to ${redactUrl(repository)}.\nLocal staging data was preserved${sessionId ? ` under .mono/skills/failed/${sessionId}` : ""} — fix the cause and run \`mono skills retry\`.\n`);
	process.exit(1);
}
/**
* `mono skills save` — the primary command. Commits a completed, staged session
* to the repository configured in `skill` (one commit, pushed). With `--dry-run`
* it validates + redacts + reports the planned immutable path WITHOUT touching
* the network. On failure the local staging directory is preserved (moved to
* `failed/`) and the error is reported honestly.
*/
const saveCommand = defineCommand({
	meta: {
		name: "save",
		description: "Save a staged session (from .mono/skills/pending/<id>) to the configured skills repository. Use --dry-run to validate without pushing."
	},
	args: {
		app: {
			type: "string",
			description: "App id (defaults to the current app)."
		},
		dir: {
			type: "string",
			description: "Staging directory, e.g. .mono/skills/pending/<session-id>."
		},
		"dry-run": {
			type: "boolean",
			description: "Validate and report the planned path without pushing."
		}
	},
	async run({ args, rawArgs }) {
		guardArgs(rawArgs);
		const cwd = prelude();
		const { target } = requireSkillConfig(cwd);
		const dir = args.dir;
		if (!dir) fail("--dir is required (path to the staged session under .mono/skills/pending/).");
		const app = args.app;
		skipIfGenericApp(resolveAppId({
			app,
			cwd
		}));
		if (args["dry-run"]) {
			try {
				const plan = buildSavePlan({
					cwd,
					app,
					dir,
					target
				});
				printJson({
					success: true,
					dryRun: true,
					repository: redactUrl(plan.repository),
					appId: plan.appId,
					sessionId: plan.sessionId,
					savedPath: plan.savedPath,
					filesPlanned: plan.files.length,
					files: plan.files.map((f) => f.repoPath)
				});
			} catch (e) {
				fail(e.message);
			}
			return;
		}
		const { remote } = connect(cwd, target, "always");
		try {
			const result = runSave({
				cwd,
				app,
				dir,
				remote
			});
			printJson(result);
			reportSaved(result, remote);
		} catch (e) {
			reportNotSaved(e, target.remoteUrl, e?.sessionId);
		}
	}
});

//#endregion
//#region pkg/cli/skills/commands/retry.ts
/**
* `mono skills retry` — re-save a previously failed session from
* `.mono/skills/failed/<id>`. Same path as `save`; on success the local copy is
* cleaned up, on failure it is preserved.
*/
const retryCommand = defineCommand({
	meta: {
		name: "retry",
		description: "Retry saving a failed session from .mono/skills/failed/<session-id>."
	},
	args: {
		app: {
			type: "string",
			description: "App id (defaults to the current app)."
		},
		dir: {
			type: "string",
			description: "Failed staging directory, e.g. .mono/skills/failed/<session-id>."
		}
	},
	async run({ args, rawArgs }) {
		guardArgs(rawArgs);
		const cwd = prelude();
		const { target } = requireSkillConfig(cwd);
		const dir = args.dir;
		if (!dir) fail("--dir is required (path to the failed session under .mono/skills/failed/).");
		skipIfGenericApp(resolveAppId({
			app: args.app,
			cwd
		}));
		const { remote } = connect(cwd, target, "always");
		try {
			const result = runSave({
				cwd,
				app: args.app,
				dir,
				remote
			});
			printJson(result);
			reportSaved(result, remote);
		} catch (e) {
			reportNotSaved(e, target.remoteUrl, e?.sessionId);
		}
	}
});

//#endregion
//#region pkg/cli/skills/commands/pending.ts
/** `mono skills pending` — list locally-staged sessions awaiting upload. Local-only. */
const pendingCommand = defineCommand({
	meta: {
		name: "pending",
		description: "List staged sessions in .mono/skills/pending/."
	},
	args: { app: {
		type: "string",
		description: "App id (defaults to the current app)."
	} },
	async run({ args, rawArgs }) {
		guardArgs(rawArgs);
		const cwd = prelude();
		printJson({
			success: true,
			app: resolveAppId({
				app: args.app,
				cwd
			}),
			kind: "pending",
			sessions: listSessions(cwd, "pending")
		});
	}
});

//#endregion
//#region pkg/cli/skills/commands/failed.ts
/** `mono skills failed` — list sessions whose upload failed (kept for retry). Local-only. */
const failedCommand = defineCommand({
	meta: {
		name: "failed",
		description: "List failed sessions in .mono/skills/failed/."
	},
	args: { app: {
		type: "string",
		description: "App id (defaults to the current app)."
	} },
	async run({ args, rawArgs }) {
		guardArgs(rawArgs);
		const cwd = prelude();
		printJson({
			success: true,
			app: resolveAppId({
				app: args.app,
				cwd
			}),
			kind: "failed",
			sessions: listSessions(cwd, "failed")
		});
	}
});

//#endregion
//#region pkg/cli/skills/commands/session.ts
/** `mono skills session show --app <id> --session-id <id>` */
const showCommand = defineCommand({
	meta: {
		name: "show",
		description: "Show a saved session's metadata + summary (no conversation)."
	},
	args: {
		app: {
			type: "string",
			description: "App id (defaults to the current app)."
		},
		"session-id": {
			type: "string",
			description: "The session id to display."
		}
	},
	async run({ args, rawArgs }) {
		guardArgs(rawArgs);
		const cwd = prelude();
		const sessionId = args["session-id"];
		if (!sessionId) fail("--session-id is required.");
		const { target } = requireSkillConfig(cwd);
		const { remote } = connect(cwd, target, "if-stale");
		try {
			printJson({
				success: true,
				...runSessionShow({
					cwd,
					app: args.app,
					sessionId,
					remote
				})
			});
		} catch (e) {
			fail(e.message);
		}
	}
});
/** `mono skills session <subcommand>` — currently just `show`. */
const sessionCommand = defineCommand({
	meta: {
		name: "session",
		description: "Inspect saved sessions."
	},
	subCommands: { show: showCommand }
});

//#endregion
//#region pkg/cli/skills/standard.ts
/** Example `metadata.json` (required). Typed, so it can't drift from `SessionMetadata`. */
const METADATA_EXAMPLE = {
	schemaVersion: 1,
	sessionId: "gallery-image-lightbox",
	status: "completed",
	startedAt: "2026-07-02T15:40:00.000Z",
	finishedAt: "2026-07-02T15:53:00.000Z",
	title: "gallery-apps: image-only lightbox on the Picsum gallery",
	topics: [
		"image lightbox",
		"gallery",
		"Picsum"
	],
	userRequests: ["Clicking a thumbnail should open an image-only popup…"],
	commandsRun: [
		"mono skills check",
		"npx vue-tsc --noEmit",
		"npm run dev"
	],
	validation: {
		testsRun: false,
		testsPassed: null,
		buildRun: true,
		buildPassed: true
	},
	outcome: {
		result: "shipped",
		notes: "Added GalleryLightbox.vue; vue-tsc clean."
	}
};
/** Example `files-changed.json` (optional). The reader also honours an optional `note` per file. */
const FILES_CHANGED_EXAMPLE = { files: [{
	path: "src/components/GalleryLightbox.vue",
	operation: "added"
}, {
	path: "src/pages/gallery/index.vue",
	operation: "modified"
}] };
/** Example `decisions.json` (optional). */
const DECISIONS_EXAMPLE = { decisions: [{
	title: "Custom Teleport lightbox over mono-modal",
	decision: "Built a custom Teleport overlay component instead of reusing mono-modal.",
	reason: "mono-modal always renders a padded card; the design needed an edge-to-edge image-only view."
}] };
/**
* The canonical staged-session file standard. Frozen so callers can print it but
* never mutate it. Mirrors the narrative reference in the VitePress docs
* (`docs/ai/skills.md` → "Session file formats").
*/
const SESSION_FILE_STANDARD = Object.freeze({
	version: 1,
	layout: "<app>/history/<actor>/YYYY-MM-DD/HH-mm-ss_<sessionId>/",
	stagingDir: ".mono/skills/pending/<id>/",
	required: ["metadata.json", "summary.md"],
	files: {
		"metadata.json": {
			required: true,
			description: "Session metadata. `finishedAt` drives the destination HH-mm-ss (local time), else save time. The uploaded copy is augmented by the CLI (see `generated.metadataAugmentedWith`).",
			fields: [
				"schemaVersion: number",
				"sessionId: string",
				"status: \"completed\" | \"partial\" | \"failed\"",
				"startedAt?: string (ISO 8601)",
				"finishedAt?: string (ISO 8601)",
				"topics?: string[]",
				"userRequests?: string[]",
				"commandsRun?: string[]",
				"validation?: { testsRun?, testsPassed?, buildRun?, buildPassed? }",
				"outcome?: { result?: string, notes?: string }",
				"title?: string (read by the history browser)"
			],
			example: METADATA_EXAMPLE
		},
		"summary.md": {
			required: true,
			description: "A concise, reusable \"what changed and why\" — the highest-value artifact for the next session.",
			format: "markdown"
		},
		"files-changed.json": {
			required: false,
			description: "Path + operation metadata only (never file contents). Wrapper object `{ files: [...] }`; operation ∈ added | modified | deleted | renamed; an optional `note` per file is honoured by the reader.",
			example: FILES_CHANGED_EXAMPLE
		},
		"decisions.json": {
			required: false,
			description: "Technical/business decisions. Wrapper object `{ decisions: [...] }`; element `{ title, decision, reason }`.",
			example: DECISIONS_EXAMPLE
		},
		"conversation.jsonl": {
			required: false,
			description: "One JSON object per line (user / assistant / tool). Stage a single file; the CLI redacts secrets and chunks it into conversation/part-0001.jsonl, part-0002.jsonl, … (≤ 750 KB per part, never splitting a line). Do not pre-chunk."
		}
	},
	generated: {
		description: "Written by the CLI — never stage these.",
		"index.json": { example: {
			schemaVersion: 1,
			sessionId: "gallery-image-lightbox",
			format: "jsonl",
			files: [
				"metadata.json",
				"summary.md",
				"files-changed.json",
				"decisions.json"
			]
		} },
		"app.json": { example: {
			schemaVersion: 1,
			app: "<appId>",
			createdAt: "<ISO>"
		} },
		"user.json": { example: {
			name: "<git user.name>",
			email: "<git user.email>",
			actorFolder: "<slug>__<6-hex>"
		} },
		metadataAugmentedWith: [
			"app",
			"actor",
			"actorFolder",
			"repository",
			"savedPath",
			"uploadedAt"
		]
	},
	notes: [
		"Only metadata.json + summary.md are required; the sidecars are optional. `mono skills init --session-id <id>` writes a skeleton that already passes validation.",
		"save/retry validate every staged file against this standard BEFORE committing — a mismatch (bad status, wrong decisions/files-changed shape, invalid conversation line) fails in the CLI and nothing is pushed. --dry-run runs the same checks.",
		"The destination is the git repository configured as `skill` in mono.config.ts (optionally a branch + subfolder via a GitHub /tree/<ref>/<dir> URL). The layout above sits under that folder.",
		"One session = ONE git commit (`feat(<app>): session <id>`), pushed to the configured branch. A concurrent save by someone else is handled by replaying onto their tip — the folder-per-user/session layout can never conflict.",
		"finishedAt drives the destination HH-mm-ss (local time), else save time.",
		"Saves are immutable — a save refuses to overwrite an existing session folder.",
		"The uploaded metadata.json `repository` field is the plain configured URL — never a token.",
		"The date and time_session are two separate path segments; GitHub collapses single-child date folders in its tree view (cosmetic, not a merged folder)."
	]
});

//#endregion
//#region pkg/cli/skills/commands/template.ts
/**
* `mono skills template` — print the canonical staged-session file JSON standard
* (schemas + examples). Pure reference: needs no config, no repo, no env.
*/
const templateCommand = defineCommand({
	meta: {
		name: "template",
		description: "Print the canonical staged-session file JSON standard (schemas + examples)."
	},
	async run({ rawArgs }) {
		guardArgs(rawArgs);
		printJson({
			success: true,
			standard: SESSION_FILE_STANDARD
		});
	}
});

//#endregion
//#region pkg/cli/skills/commands/init.ts
/** A session id usable as a folder name: `[a-z0-9._-]`, no traversal. */
function assertSessionId(id) {
	if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id) || id.includes("..")) fail(`Invalid --session-id '${id}': use letters, digits, '.', '_' or '-' (e.g. gallery-image-lightbox).`);
}
/**
* `mono skills init --session-id <id>` — seed `.mono/skills/pending/<id>/` with
* a skeleton that already passes validation, so a human can fill in
* `summary.md` (and optionally `decisions.json` / `files-changed.json`) and run
* `mono skills save`. Refuses to touch an existing directory. Local-only.
*/
const initCommand = defineCommand({
	meta: {
		name: "init",
		description: "Create a staged-session skeleton under .mono/skills/pending/<session-id>/ for manual editing."
	},
	args: {
		app: {
			type: "string",
			description: "App id (defaults to the current app)."
		},
		"session-id": {
			type: "string",
			description: "Folder name + metadata.sessionId, e.g. fix-login-redirect."
		}
	},
	async run({ args, rawArgs }) {
		guardArgs(rawArgs);
		const cwd = prelude();
		const sessionId = args["session-id"];
		if (!sessionId) fail("--session-id is required (e.g. --session-id fix-login-redirect).");
		assertSessionId(sessionId);
		const app = resolveAppId({
			app: args.app,
			cwd
		});
		const dir = path.join(stagingRoot(cwd), "pending", sessionId);
		if (fs.existsSync(dir)) fail(`Staging directory already exists: ${dir}`);
		const now = (/* @__PURE__ */ new Date()).toISOString();
		const metadata = {
			schemaVersion: 1,
			sessionId,
			status: "completed",
			startedAt: now,
			finishedAt: now,
			title: "",
			topics: [],
			userRequests: [],
			commandsRun: [],
			validation: {
				testsRun: false,
				testsPassed: null,
				buildRun: false,
				buildPassed: null
			},
			outcome: {
				result: "",
				notes: ""
			}
		};
		const summary = [
			`# ${sessionId}`,
			"",
			"## What changed",
			"",
			"- ",
			"",
			"## Why",
			"",
			"- ",
			"",
			"## What the next session should know",
			"",
			"- ",
			""
		].join("\n");
		fs.mkdirSync(dir, { recursive: true });
		const files = {
			"metadata.json": JSON.stringify(metadata, null, 2) + "\n",
			"summary.md": summary,
			"decisions.json": JSON.stringify({ decisions: [] }, null, 2) + "\n",
			"files-changed.json": JSON.stringify({ files: [] }, null, 2) + "\n"
		};
		for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), text);
		const rel = (path.relative(cwd, dir) || dir).split(path.sep).join("/");
		printJson({
			success: true,
			app,
			sessionId,
			dir,
			files: Object.keys(files),
			next: [
				`Edit ${rel}/summary.md (required) and ${rel}/metadata.json (title, topics, finishedAt).`,
				"Optionally fill decisions.json / files-changed.json, or delete them.",
				`mono skills save --dir ${rel} --dry-run`,
				`mono skills save --dir ${rel}`
			]
		});
		process.stderr.write(`\nStaged session skeleton created at ${dir}\n`);
	}
});

//#endregion
//#region pkg/cli/skills/commands/sync.ts
/**
* `mono skills sync` — fetch the configured repository into the local clone
* (`.mono/skills/repo/`) right now, regardless of staleness. `read`/`search`
* refresh on their own when stale; this is for a human who wants to browse the
* clone, or to verify access end-to-end.
*/
const syncCommand = defineCommand({
	meta: {
		name: "sync",
		description: "Refresh the local clone of the skills repository (.mono/skills/repo/) now."
	},
	async run({ rawArgs }) {
		guardArgs(rawArgs);
		const cwd = prelude();
		const { target } = requireSkillConfig(cwd);
		const { remote, repo } = connect(cwd, target, "always");
		printJson({
			success: true,
			repository: redactUrl(target.remoteUrl),
			ref: remote.ref,
			dir: remote.dir,
			transport: remote.transport,
			emptyRemote: remote.emptyRemote,
			headSha: repo.headSha,
			path: repo.repoDir,
			refreshed: repo.refreshed,
			stale: repo.stale
		});
		process.stderr.write(`\nSkills repo ${repo.refreshed ? "refreshed" : repo.stale ? "NOT refreshed (serving the stale clone)" : "up to date"}: ${describeRemote(remote)}${repo.headSha ? ` @ ${repo.headSha.slice(0, 7)}` : " (empty)"}\n${repo.repoDir}\n`);
	}
});

//#endregion
//#region pkg/cli/skills/index.ts
runMain(defineCommand({
	meta: {
		name: "skills",
		description: "MONO Skills: read app knowledge/skills and save AI session history to the git repository configured as `skill` in mono.config.ts. Off unless `skill` is set; git credentials first, `envToken` as fallback."
	},
	subCommands: {
		check: checkCommand,
		whoami: whoamiCommand,
		init: initCommand,
		read: readCommand,
		search: searchCommand,
		save: saveCommand,
		retry: retryCommand,
		pending: pendingCommand,
		failed: failedCommand,
		session: sessionCommand,
		sync: syncCommand,
		template: templateCommand
	}
}));

//#endregion