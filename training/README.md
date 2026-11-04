# Our Adventure — consolidated Health Journey training

- Live website: https://bryan-sullivan.github.io/recipes/training/
- Published workout schedule: [plan.json](plan.json)
- Obsidian publisher: [tools/export_plan.py](tools/export_plan.py)
- ChatGPT project instructions: [PROJECT_INSTRUCTIONS.md](PROJECT_INSTRUCTIONS.md)
- Main recipes website: https://bryan-sullivan.github.io/recipes/

## One owner per responsibility

| Responsibility | Authoritative owner | Other systems |
| --- | --- | --- |
| Future workout prescriptions (exercise, intervals, duration, minimum) | **Obsidian `Health Journey/Plan.md`** | Exported as public workout-only `training/plan.json`; read-only on website |
| Daily personal journal, recovery values, work/family tasks | **Local Obsidian Daily notes** | Never uploaded to the public repository |
| WeightWatchers tracking and Points | **WeightWatchers** | Optional high-level check-in; never invent targets |
| Oura measurements | **Oura + individual's own notes** | Never infer the wife's data from Bryan's |
| Completed workouts for each person | **Shared household Supabase data** | Private family checkboxes in the website |
| Weekly review and proposed plan adjustments | **ChatGPT Tuesday Health Journey Reset** | Proposals only; never silently overwrite the local plan or day notes |

### What is retired

The website's **independent workout generator** is no longer used. Dates absent from `plan.json` display **Plan pending**, *not* an invented workout or assumed rest day. The Tuesday task should not create a second, conflicting schedule. Do not delete the old daily Obsidian workflow or historical logs.

### What is currently live

The website reads **only** `plan.json`, a published November 1, 2026 snapshot of the active November 3–30 block. The established Shamrock Half Marathon target is March 21, 2027; Iceland dates are **TBD**, not booked. The website's longer-range calendar is intentionally blank until a revised active plan is approved and published.

`plan-november-2026.json` is a **superseded archive**, not an active data source. Retained for provenance during transition.

## Update sequence — safe, repeatable, not yet automatic

1. Work out the next week's progression in your existing Health Journey ChatGPT project, using feedback and the actual Obsidian plan. Proposals must be individualized for both people.
2. Approve changes and update **Obsidian `Health Journey/Plan.md`** (not old daily notes). Preserve its date structure and historic entries.
3. Export workout-only JSON with the tool below. The current parser supports the **existing November 2026 Plan.md format** and fails closed if block dates or structures change; extending it for December is intentional work, not automatic invention.
4. Review generated changes, especially stable session keys. Avoid reusing a key for a different activity on an already-completed date.
5. Commit `plan.json` to the `main` branch of this repository; GitHub Pages then publishes the updated workouts, with the same shared checkoffs.
6. Verify GitHub deployment and compare one full Tuesday–Monday week in the website against `Plan.md`.

From a local checkout of the recipes repository:

```bash
python3 training/tools/export_plan.py "/path/to/Obsidian vault/Health Journey/Plan.md" --check training/plan.json
# If --check says out of sync, inspect and publish a deliberately approved update:
python3 training/tools/export_plan.py "/path/to/Obsidian vault/Health Journey/Plan.md" --output training/plan.json
git diff -- training/plan.json
git add training/plan.json
git commit -m "Publish reviewed Health Journey training plan"
git push origin main
```

**Important:** The tool never reads `Daily/`, medical notes or general tasks and never connects to Supabase. It generates output locally, but **does not publish** until someone explicitly commits and pushes it. A later local automation could handle this after a dry-run and diff review, but it is not configured yet.

For December and subsequent blocks, update the exporter to accept the new month and append new dates without deleting approved past sessions. Do not reuse the November-only parser without reviewing those changes.

## Existing household synchronization

Bryan and Desiree can check off sessions independently. The site reuses the recipes grocery-list Supabase household authentication and row-level security. It stores date/session/person checks with the `training-v1:` prefix inside the existing `recipe_preferences` table. The **same session IDs** were maintained during reconciliation. Optional activities do not lower completion percentages when skipped.

When disconnected, checkoffs are saved only to local browser storage until the device joins the household. The household invite code grants shared editing access, so keep it private.

A downloaded `.ics` calendar is a static snapshot, not a live Calendar subscription. The CSV includes completion statuses visible on that connected device. Do not upload Oura, WeightWatchers, weight, health history or other sensitive personal information to this public repository.

## Obsidian and ChatGPT limitations

The daily Obsidian generator is a **local** automation. It must continue protecting `## Tasks`, `## Tomorrow's Reminders`, existing Workout checkboxes, YAML, and prior notes. An existing daily note may only have its explicitly bounded recovery guidance updated under its current safety instructions.

The ChatGPT Tuesday task does **not** have automatic access to this local vault or to private Supabase checkoffs. It should read the current published workout schedule if accessible, request individual completion/recovery summaries, and make *proposals* rather than claim to have automatically synchronized anything.

To change the existing ChatGPT project instructions, copy [PROJECT_INSTRUCTIONS.md](PROJECT_INSTRUCTIONS.md) into the project's instruction settings. There is no automatic project-settings update in this GitHub deployment.
