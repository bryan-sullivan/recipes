"""Unit tests use synthetic plans only; no actual Obsidian/private health files."""
import copy
import datetime as dt
import json
import unittest

from export_plan import make_plan, merge_preserving_history, validate_public_plan

SCHEDULE = {
    "Tuesday": ["Tread Walk + Run / Walk — 30–35 min planned", "Peloton Stretch — 5 min optional"],
    "Wednesday": ["Peloton Beginner Strength — 20–25 min planned", "Peloton Mobility / Stretch — 5 min optional"],
    "Thursday": ["Tread Walk + Run / Walk — 30–35 min planned", "Peloton Stretch — 5 min optional"],
    "Friday": ["Optional Peloton Bike Low Impact — 15–20 min", "Optional Peloton Stretch / Meditation — 5 min"],
    "Saturday": ["Recovery: easy dog walk or full rest — no required extra session", "Optional Peloton Mobility / Meditation — 5–10 min"],
    "Sunday": ["Outdoor long walk — current week planned duration", "Optional Peloton Stretch / Mobility — 5–10 min"],
    "Monday": ["Peloton Beginner Full Body — 20–25 min planned", "Peloton Stretch — 5 min optional"],
}


def synthetic_plan(start, weeks=4, first_number=1, changed=False):
    end = start + dt.timedelta(days=weeks*7-1)
    lines = ["---", f"block_start: {start}", f"block_end: {end}", "---",
             "# Synthetic training plan", "", "### Week-by-week Tread prescription", "",
             "| WW week (Tue–Mon) | Tuesday Tread | Thursday Tread | Sunday long outing | Focus |",
             "| --- | --- | --- | --- | --- |"]
    for i in range(weeks):
        a = start + dt.timedelta(days=i*7)
        b = a + dt.timedelta(days=6)
        label = f"{a:%b} {a.day}–{b:%b} {b.day}" if a.month != b.month else f"{a:%b} {a.day}–{b.day}"
        lines.append(f"| {label} ({first_number+i}) | 30 sec easy jog / 2 min walk × 8 | Same | 45-min easy walk | Review first |")
    lines.extend(["", "### Daily workout checklists", ""])
    for weekday, items in SCHEDULE.items():
        lines.append("#### " + weekday)
        for index, item in enumerate(items):
            if changed and weekday == "Wednesday" and index == 0:
                item = item.replace("Peloton Beginner Strength", "Different Past Strength")
            lines.append("- [ ] " + item)
        lines.append("")
    lines.extend(["## Private journal", "weight_lb: fake sensitive field", "oura_sleep_score: fake sensitive field"])
    return "\n".join(lines) + "\n"


class TrainingContractTests(unittest.TestCase):
    def setUp(self):
        self.nov = make_plan(synthetic_plan(dt.date(2026, 11, 3)))

    def test_public_only_data_and_28_days(self):
        self.assertEqual(len(self.nov["days"]), 28)
        validate_public_plan(self.nov)
        exported = json.dumps(self.nov, ensure_ascii=False)
        self.assertNotIn("weight_lb", exported)
        self.assertNotIn("oura_sleep_score", exported)

    def test_append_december_without_losing_november(self):
        dec = make_plan(synthetic_plan(dt.date(2026, 12, 1), first_number=5))
        original = copy.deepcopy(self.nov["days"]["2026-11-04"])
        merged = merge_preserving_history(dec, self.nov)
        self.assertEqual((merged["block_start"], merged["block_end"]), ("2026-11-03", "2026-12-28"))
        self.assertEqual(len(merged["days"]), 56)
        self.assertEqual(len(merged["weeks"]), 8)
        self.assertEqual(merged["days"]["2026-11-04"], original)
        self.assertEqual(len(merged["source_history"]), 1)

    def test_prevent_past_workout_changes(self):
        changed = make_plan(synthetic_plan(dt.date(2026, 11, 3), changed=True))
        with self.assertRaisesRegex(ValueError, "Historical workout changed"):
            merge_preserving_history(changed, self.nov)

    def test_prevent_rollback_to_older_block(self):
        dec = make_plan(synthetic_plan(dt.date(2026, 12, 1), first_number=5))
        merged = merge_preserving_history(dec, self.nov)
        with self.assertRaisesRegex(ValueError, "older than"):
            merge_preserving_history(copy.deepcopy(self.nov), merged)

    def test_reject_unknown_private_field(self):
        leaked = copy.deepcopy(self.nov)
        leaked["weight_lb"] = 200
        with self.assertRaisesRegex(ValueError, "Unexpected public plan fields"):
            validate_public_plan(leaked)

    def test_cross_year_week(self):
        cross = make_plan(synthetic_plan(dt.date(2026, 12, 29), weeks=1, first_number=9))
        self.assertEqual((cross["block_start"], cross["block_end"]), ("2026-12-29", "2027-01-04"))

    def test_same_source_preserves_publication_date(self):
        earlier = copy.deepcopy(self.nov)
        earlier["source"]["source_snapshot"] = "2026-11-01"
        same = merge_preserving_history(copy.deepcopy(self.nov), earlier)
        self.assertEqual(same["source"]["source_snapshot"], "2026-11-01")
        self.assertNotIn("source_history", same)


if __name__ == "__main__":
    unittest.main()
