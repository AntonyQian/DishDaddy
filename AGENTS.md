# Agent guide

Fridge-to-recipe mobile app (Expo app + small TypeScript server) for a 24h hackathon. Accurate ingredient detection from the camera is the top priority.

## Work in your lane's branch

The team splits into four lanes, each with its own long-lived branch. Before writing code, check which lane you are on (`git branch --show-current`) and stay inside it:

| Branch | Lane | Tasks |
|---|---|---|
| `detection` | Gemini detection, test set, accuracy eval | T2, T3, T4 |
| `scan-review` | Capture screen, Review screen, barcode override | T5, T6, T7 |
| `recipes` | Recipe collection build, search endpoints | T8, T9 |
| `app-features` | Recipe screens, Substitutions, Equipment, Staples, Saved Recipes, demo | T10–T14 |

- Commit and push only to your lane's branch. `main` changes only by merging a lane branch in, once a task's **Done when** criterion in `docs/TASKS.md` is met.
- Merge `main` into your branch before merging your branch back into `main`, and resolve conflicts on your branch.
- T0 (scaffold) and T1 (shared contracts) land on `main` first; every lane then merges `main` in.
- `shared/` types are the contract between lanes. Change them in a small, separate merge to `main` and tell the team, so every lane picks the change up together.

## Attribution

Commits, PRs and issues are authored by the human developer alone: plain commit messages, with no `Co-Authored-By` trailers and no "Generated with" footers or any other AI credit, anywhere in this repo.

## Reference

- `GLOSSARY.md`: the project's terms (Scan, Detection, Review, Ingredient, Staple, Recipe Match…). Use these names in code, UI copy and commits.
- `docs/adr/`: read before changing how ingredients are detected or where recipes come from.
- `docs/TASKS.md`: each task's scope and its **Done when** criterion.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues (AntonyQian/HackCamp2026) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
