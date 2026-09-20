# Daggerheart Character Sheet Printable — CLAUDE.md

Read `start-here.md` first every session. Backlog: `long-term-to-do.md`. Plan: `Docs/plan.md`.
Deferred/placeholder work: `Docs/deferred-queue.md`. Do not duplicate their contents here.

# Collaboration Playbook

## 1. Session start and handoff

- `start-here.md` (project root): current series, current step, what is done, what is unverified, the very next action. Update as steps finish. This file only points to it.
- `long-term-to-do.md`: anything out of scope goes here, not into the current step.
- `Docs/deferred-queue.md`: whenever something ships as a placeholder, add a row (what, where used, current placeholder, format notes). Move to Done with the final path when the real thing lands.
- Work in **series**: `Docs/plan.md` holds numbered steps. Finished series move to `Docs/archive/`.

## 2. Token economy

- Grep/Glob first, then read a line range, not whole files.
- Don't re-read a file after editing it.
- Don't re-derive facts settled in the conversation or memory.
- Prefer one script that does a whole round of work and prints a short summary over many chatty tool calls.
- Keep large outputs on disk; report paths and a summary.
- Don't open images to judge them when the owner can. Owner judges visuals (answers by tile number); Claude handles prompts, technical checks, file promotion.
- Put stable knowledge in memory or docs once.
- Use subagents only when explicitly asked.
- Batch independent tool calls in one turn.

## 3. Testing harness (set up on day one)

- One folder for all tests (`tests/`), governed by `TestPolicy/test-master-list.csv`, rows `Namespace.Class.Method,<flag>`.
  **Flag polarity: 1 = run, 0 = skip.**
- Every test class carries a governance attribute; the sync script fails on ungoverned fixtures. New tests default to run.
- `Run-All-Tests.bat` resyncs the list, runs the suite, opens an HTML report at `TestArtifacts/<run-id>/report.html`, styled like the product.
- When a series is archived, flip that series' own tests to skip (deliberate manual edit; sync preserves flags). Evergreen tests keep running. Re-enable for troubleshooting.
- Split runtime and editor code into separate assemblies/modules early.
- If the engine/tool needs exclusive access for batch runs, check for the lock file and ask the owner first.

## 4. Commits and git

- Commit **once at the end of a series**, only when asked. Mark steps complete in docs as you go. No "just in case" commits.
- Never skip hooks. Prefer new commits to amending.

## 5. Communication style

- **Bullets** for information; **numbers** only when the owner must answer each item.
- Every numbered decision is yes/no or lettered: "Should I (A) do X or (B) do Y?" so the reply can be "3. A".
- Lead with the result. Report failures plainly with output. Say what was skipped.
- One recommendation, not a survey.
- Say what the owner can now see or try, and what is still unchecked live.

## 6. Pipelines: automate, then fold in

- When a manual process works, script it, then fold it into the one-run pipeline; no parallel routes.
- Prefer placeholder tokens in a saved workflow + external prompt files + a fill script. JSON-escape substituted text; validate that the result parses.
- Deterministic generate-then-post-process beats fighting a generator with prompt wording.
- Seeded reruns reproduce exactly; write each run to a dated, gitignored folder with a numbered contact sheet and `run.json`.
- Note tool gotchas in docs the moment you hit them.
- Install models and custom nodes through the app's own manager.

## 7. Design decisions

- Data-driven content as plain JSON: diffable, hand-editable. Loader work gets its own step.
- Derive values from the data instead of duplicating by hand.
- Log metrics to a CSV per run; set ratios after real playtests.
- Record validated approaches in memory with the *why*.

## 8. Memory hygiene

- One fact per memory file, with **Why** and **How to apply**. Save corrections and confirmed approaches, not code structure or history the repo records.
- `MEMORY.md` is a one-line-per-entry index. Update rather than duplicate; delete wrong ones.
- Periodically run a consolidation pass.
