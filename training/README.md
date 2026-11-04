# Our Adventure — consolidated Health Journey training

- Live website: https://bryan-sullivan.github.io/recipes/training/
- Published workout schedule: [plan.json](plan.json)
- Obsidian exporter: [tools/export_plan.py](tools/export_plan.py)
- One-step local review command: [tools/stage_plan.sh](tools/stage_plan.sh)
- Automated GitHub validation: [Validate public training plan](../../.github/workflows/validate-training-plan.yml)
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
3. Export workout-only JSON using the local staging command below. It supports a **1–16-week Tuesday–Monday block** with the existing `Plan.md` weekly-prescription table and seven weekday checkbox sections, including month/year boundaries. It will **reject altered structures** rather than invent workouts. New workout types/checkbox counts require reviewed exporter updates.
4. Review generated changes, especially stable session keys. Avoid reusing a key for a different activity on an already-completed date.
5. Commit `plan.json` to the `main` branch of this repository; GitHub Pages then publishes the updated workouts, with the same shared checkoffs.
6. Verify GitHub deployment and compare one full Tuesday–Monday week in the website against `Plan.md`.

From a **local checkout** of the recipes repository on the same Mac as the Obsidian vault:

```bash
bash training/tools/stage_plan.sh "/path/to/Obsidian vault/Health Journey/Plan.md"
```

If the plan matches, the command exits without changing anything. If the approved `Plan.md` has new sessions, it runs seven synthetic regression tests, validates the public-only JSON, merges dates into `plan.json`, and displays a `git diff` for review. It does **not** change Obsidian, commit, push, or publish.

After reviewing the diff and deciding to publish:

```bash
git add training/plan.json
git commit -m "Publish approved Health Journey training block"
git push origin main
```

GitHub now also **automatically checks** the public plan schema and seven safety/regression tests for changes under `training/` in [Validate public training plan](../../.github/workflows/validate-training-plan.yml). GitHub Pages publishes the site after the commit.

**Safeguards:** The exporter keeps approved past workout dates and session IDs, rejects changes to today/earlier completed-plan dates, refuses older plan snapshots that would roll back an extended schedule, rejects unknown public JSON fields, and copies only workout prescriptions. Future weeks can be appended without losing earlier X calendar marks. A change in the number/type of planned daily sessions requires reviewing/updating the exporter instead of silently publishing a guessed plan.

**Not yet automatic:** The local Obsidian vault is not readable by GitHub Actions or the ChatGPT Tuesday task. A local Codex automation may eventually run the nonpublishing staging command after a *locally approved* `Plan.md` update, but would still require explicit review before the commit and push. No such local automation has been installed by these GitHub changes.

## Existing household synchronization

Bryan and Desiree can check off sessions independently. The site reuses the recipes grocery-list Supabase household authentication and row-level security.

The **Copy weekly check-in** button under the selected Tuesday–Monday training week prepares a plain-text summary of website checkoffs for both people. The button only copies to the local clipboard; it does **not** send completion or health information to ChatGPT or Obsidian. Navigate to the previous week before copying it for the Tuesday Reset review. Unmarked sessions are explicitly described as *unverified*, not necessarily missed. WeightWatchers and recovery information remain separate. It stores date/session/person checks with the `training-v1:` prefix inside the existing `recipe_preferences` table. The **same session IDs** were maintained during reconciliation. Optional activities do not lower completion percentages when skipped.

When disconnected, checkoffs are saved only to local browser storage until the device joins the household. The household invite code grants shared editing access, so keep it private.

A downloaded `.ics` calendar is a static snapshot, not a live Calendar subscription. The CSV includes completion statuses visible on that connected device. Do not upload Oura, WeightWatchers, weight, health history or other sensitive personal information to this public repository.

## Obsidian and ChatGPT limitations

The daily Obsidian generator is a **local** automation. It must continue protecting `## Tasks`, `## Tomorrow's Reminders`, existing Workout checkboxes, YAML, and prior notes. An existing daily note may only have its explicitly bounded recovery guidance updated under its current safety instructions.

The ChatGPT Tuesday task does **not** have automatic access to this local vault or to private Supabase checkoffs. It should read the current published workout schedule if accessible, request individual completion/recovery summaries, and make *proposals* rather than claim to have automatically synchronized anything.

The current local Codex project's **`AGENTS.md`** was updated by the user to include the shared website contract; preserve its stricter daily-note protection. [PROJECT_INSTRUCTIONS.md](PROJECT_INSTRUCTIONS.md) is a reference draft, **not** a second set of instructions to install. The existing Tuesday ChatGPT scheduled check-in has already been updated separately.
