# Clean up Mono-Repo Getting Started doc

## Context

`demo/vitepress/docs/repo/getting-started.md` is the only page under the **Mono-Repo** sidebar section. The current draft has the right idea (Vue conventions, Host vs Remote split, links to both template repos) but reads as a rough first pass — typos (`builing`, `font-end`, `ecosyetem`, `structute`, `folowing`), inconsistent heading levels (a second `#` instead of `##`), prose that repeats itself, and no folder-structure visual to anchor the "Host owns the shell, Remote adds modules" idea.

The goal: keep the page as simple as the original draft — same voice, same scope, no new sections — just cleaner writing plus a folder-structure tree for both Host and Remote.

## User-confirmed decisions

- Folder tree is **conceptual** (generic Vue-style layout), not scraped from the GitHub templates.
- Show **two trees** — one for Host, one for Remote.
- **Keep current scope** — no quick-start, no comparison table, no new sections.

## Critical files

- `demo/vitepress/docs/repo/getting-started.md` — single file rewrite.
- `demo/vitepress/docs/.vitepress/config.ts:62-64` — sidebar already links here (`/repo/getting-started`); no config change needed.

Reference for tone/format (to match, not copy): `demo/vitepress/docs/ui/getting-started.md` — uses `##` subheadings, short paragraphs, fenced code blocks. Matching its style keeps the two getting-started pages visually consistent.

## What changed vs. the previous draft

| Before | After |
|---|---|
| `# Getting Started` then second `# Concept` (two H1s) | One `# Getting Started`, then `## Concept`, `## Folder structure`, `## Templates` |
| `builing`, `font-end`, `ecosyetem`, `structute`, `folowing` | Fixed spelling |
| `/src/pages (as routing)` / `/src/layouts (as layout)` as inline lines | Bullet list with backticks; same content |
| "The only purpose for 'Remote' is to make the module inside the Host. Remote do not need to create Login, Logout, etc, that completely handle in the Host, all of the generic things." | One short paragraph saying the same thing |
| Raw URLs on their own lines | Bullet list under a `## Templates` heading |
| No folder visual | Two ASCII trees (Host + Remote) |

Voice and length stay close to the original (~30 lines, same plain-spoken tone). No new sections added.

## Verification

1. `pnpm --filter ./demo/vitepress dev` (or whichever script runs the VitePress docs site).
2. Open `/repo/getting-started` in the browser.
3. Confirm:
   - Single H1, three H2s in the right-hand outline.
   - Both ASCII trees render inside fenced code blocks (no markdown bleed).
   - Sidebar entry **Mono-Repo → Getting Started** still links here (no config change required).
   - Both GitHub links resolve.
4. Spot-check that no other doc page links into the old `# Concept` anchor — a grep for `repo/getting-started#concept` should return nothing surprising.
