# Our Adventure — training site

Live site: https://bryan-sullivan.github.io/recipes/training/

## Source of truth

For **November 3–30, 2026**, the workout plan is derived from `Health Journey/Plan.md` in the user's Health Journey Obsidian vault, using the **November 1, 2026** project export (`Health_Journey_Oura_Recovery_Instructions_PATCH.zip`). This snapshot is reproduced in `plan-november-2026.json`. The site loads this JSON at runtime (no redeployment of HTML required to edit dates/classes).

**It is not a live integration to Obsidian.** The local daily note generator reads the vault's `Plan.md` and creates daily notes; the ChatGPT `Health Journey Tuesday Reset` automation is a conversational weekly check-in and does not write to the vault. A subsequent adjustment to either source does **not** automatically update this GitHub file.

To reconcile a changed plan:
1. Review the latest **actual** Obsidian `Health Journey/Plan.md` or a newly supplied/exported copy.
2. Update the dated structured workout entries in `plan-november-2026.json`, preserving session keys when the activity is the same and preserving historical completion records.
3. Review that session lengths, current weekly Tread intervals, easier versions, optional activities, and rest days match `Plan.md`.
4. Commit to `main`, verify GitHub Pages deployment, and verify the phone site loads the current plan.
5. Do not overwrite existing `Daily/` notes, `## Tasks`, `## Tomorrow's Reminders`, manually checked boxes, or recovery fields.

For future months, publish similar dated JSON exports and modify the site to consume them. December and later currently use **provisional website planning rules**, not a confirmed Obsidian import.

## Completion tracking

The site shares the recipes project's Supabase household sign-in and RLS. It stores date/session/person checkoffs with the existing `training-v1:` prefix in `recipe_preferences`. Previously completed sessions are not deleted when the schedule changes.

Optional workouts (Bike, stretch, mobility, meditation, Saturday recovery) can be checked off for either person, but **do not reduce completion percentages when skipped**. Daily recovery modifications have priority over fixed website workouts; do not interpret a lower completion percentage as a training failure.

The `.ics` calendar export is a snapshot, not live Google Calendar sync. Don't put private health, WeightWatchers, Oura, or medical data in this public repository.
