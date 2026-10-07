# Prompting Guide

This project is built to be driven by an AI assistant (Claude). How well that goes
depends almost entirely on **how you prompt it**. A vague ask ("add budgeting") sends
the assistant guessing; a precise one ("in `@src/stores/use-budget.ts`, add a
`transferToProject()` action that…") gets you the right change the first time.

This page is the short version of how to ask well in this repo.

## Step 1 — Point the AI at the docs index first

Before anything else, point the assistant at the **mono docs index** — a small,
machine-readable map of the whole documentation:

```text
https://mono-libs.netlify.app/llms.txt
```

This is the single most effective thing you can do. `llms.txt` is a minimal index: a
short project blurb plus a per-page link list, including `.md` redirect links like
`- [Data Fetching](https://mono-libs.netlify.app/repo/data-fetching.md)`. The assistant
reads this small file first, then follows **only the specific doc link(s)** the task
needs — so it's grounded in the actual conventions (Template Rules, the alias system,
fetching, UI) instead of its assumptions, while spending far fewer tokens than reading
everything.

::: tip Start every non-trivial task with this
> _"Read https://mono-libs.netlify.app/llms.txt first, then open the specific doc link
> you need for this task."_

Need an exhaustive read of the whole documentation in one file? The full flattened dump
still exists at `https://mono-libs.netlify.app/llms-full.txt` — but prefer the index above
and follow its links unless you genuinely need everything at once.

For a single external library (Vue, Vite, odata2ts, …), the per-project
`llms-full.txt` links are in [Reference LLMs](./ref-llms) — ask the assistant to read
the relevant one before changing code that touches it.
:::

## Step 2 — (optional) Use Mono Skills for shared knowledge

If you want the assistant to **reuse what past sessions learned** — and contribute back
— enable [Mono Skills](./skills) by pointing the app at a git repository you own:

```ts
// mono.config.ts
skill: { url: 'https://github.com/my-org/app-knowledge.git', envToken: 'APP_KNOWLEDGE_TOKEN' }
```

Then, for non-trivial work, ask it to:

```text
mono skills read --app <id> --type knowledge   # before it starts
mono skills save --app <id> --dir .mono/skills/pending/<id>   # after it finishes
```

You don't have to spell out the commands. Just **mention "mono skills"** in your prompt
and the assistant runs the whole workflow on its own (read knowledge first, save the
session after):

```text
Make a budgeting history popup when the user clicks the detail button. Write the mono skills.
```

Or hand it a **specific command** when you want an exact step:

```text
Make a budgeting history popup when the user clicks the detail button.
When you're done, run: mono skills save --app budgeting --dir .mono/skills/pending/<id>
```

This is opt-in. Skip it if you don't need cross-session/cross-app memory — it never
changes the actual task. To make it **fully automatic** — a `CLAUDE.md` / `AGENTS.md`
snippet so the assistant reads before and saves after without being asked, plus a prompt
per step — see the [Skills Prompting Guide](./skills#prompting-guide).

::: tip You can file a session by hand too
The pipeline isn't AI-only: `mono skills init --session-id <id>` writes a skeleton under
`.mono/skills/pending/`, you fill in `summary.md`, and `mono skills save --dir …` commits and pushes
it exactly as the assistant would. See [Manual usage](./skills#manual-usage-a-human-at-the-keyboard).
:::

## Be specific — point at files, name the function and lines

The biggest lever after Step 1 is **precision**. Tell the assistant exactly *where* and
*what*:

- **Reference the exact file with `@`** — in Claude, `@src/stores/use-budget.ts` pulls
  that file into context. Point at the real file instead of describing it.
- **Name the function / symbol / line** — "in `loadBudget()` around line 42…", not
  "somewhere in the budget code".
- **State the precise need + acceptance** — what should change, the inputs/outputs, and
  the edge cases that count as "done".
- **Cite the relevant rule** when it applies — "follow [Template Rule 11](./template)
  (`@mono-lit/utility/fetching`)" keeps the assistant on the sanctioned path.

::: warning Vague vs specific
**❌ Vague:** _"the budget transfer is broken, fix it."_

**✅ Specific:** _"In `@src/stores/use-budget-transfer.ts`, the `submitTransfer()`
function (~line 60) sends `destinationId` even for a PosBudget-To-PosBudget transfer,
which the API rejects. Only send `destinationId` for Project-To-Project. Don't change
the existing PosBudget path."_

The second prompt names the file, the function, the line, the exact behavior, and the
constraint — so there's nothing to guess.
:::

## Useful keywords for prompting

Short phrases that steer the assistant toward this repo's conventions:

| Keyword / phrase | What it does |
| --- | --- |
| `Read https://mono-libs.netlify.app/llms.txt first` | Grounds the assistant in the docs **index**; it then follows only the specific doc link(s) the task needs (Step 1). |
| `Read https://mono-libs.netlify.app/llms-full.txt` | The full flattened docs in one file — use only when you truly need an exhaustive read; otherwise prefer the index above. |
| `mono skills read` / `mono skills search --query "<topic>"` | What **past sessions** learned for this app, from the repo set as `skill` in `mono.config.ts` (Step 2). |
| `@path/to/file.ts` | Pulls a specific file into context — always prefer this over describing a file. |
| `in <function>() around line <n>` | Pins the change to an exact spot. |
| `follow Template Rule <N>` | Points at a specific rule in [Template Rules](./template) (e.g. Rule 11 fetching, Rule 8 unique store names). |
| `ask before touching infra` | Keeps `vite.config.ts` / `nuxt.config.ts` / aliases read-only unless you approve (Rule 1). |
| `use @mono-lit/utility/fetching` | Forces the sanctioned fetch layer — no axios/ofetch (Rule 11). |
| `generate the OData types` | Use `odata2ts` + `MonoOdataMapTypes`, don't hand-write entity types (Rule 12). |
| `thin page + Pinia store` | Split a feature per Rule 15 (page renders, store thinks). |
| `reuse the DataSource` | Read one row via `store().load({ take: 1 })`, not a 2nd fetcher (Rule 11). |
| `don't change .mono/apps` | The synced copy is read-only — change the other app + re-sync (Rule 3). |
| `confirm the app name first` | Check for a default template name before building (Rule 1). |
| `dry-run first` | Validate before a real action (e.g. `mono skills save --dry-run`). |

## Examples

**Build a new page** (Rules 15, 11, 13):

```text
Read https://mono-libs.netlify.app/llms.txt, then open the docs it links for pages, stores, and fetching.
Build a "brand" page. Make it a thin page + Pinia store per Template Rule 15:
- @src/pages/  -> brand.vue (UI only)
- @src/stores/ -> use-brand.ts (state + fetching via @mono-lit/utility/fetching, Rule 11)
- types in @src/types/brand.d.ts
List the OData URL: https://api.example.com/odata/Brands — generate the types first (Rule 12).
```

**Fix a bug, pinned to the code:**

```text
Read the relevant llms docs first.
In @src/stores/use-budget-transfer.ts, submitTransfer() (~line 60) double-encodes the
filter when `search` is set. Fix only that; keep the existing paging behavior. Show me
the diff before applying.
```

**Consume an OData entity** (Rule 12):

```text
Read https://odata2ts.github.io/llms-full.txt and our @odata/types page.
For the OData service at https://api.example.com/odata, add the `Customer` entity:
configure @odata2ts.config.ts, run the generator, and map it in @src/types/odata.d.ts
with MonoOdataMapTypes. Don't hand-write the interface.
```

---

See also: [Template Rules](./template) (the AI contract), [Reference LLMs](./ref-llms)
(per-library docs), and [Skills](./skills) (shared knowledge + session history).
