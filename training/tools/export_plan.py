#!/usr/bin/env python3
"""Export the public workout schedule from the canonical Obsidian Health Journey/Plan.md.

This exports planned sessions only. It never reads Daily/, medical measurements,
WeightWatchers outcomes, sleep/recovery observations, tasks, or checkoffs.

Usage:
  python3 export_plan.py "/path/to/Health Journey/Plan.md" --output training/plan.json
  python3 export_plan.py "/path/to/Health Journey/Plan.md" --check training/plan.json

You must review changes and commit/push the JSON to the recipes repo; this script
never changes the Obsidian vault or sends data to GitHub by itself.
"""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
import re
import sys

DAY_ORDER = ("Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Monday")
SESSION_IDS = {
    "Tuesday": [("steady", "Tread", "30–35 min", "10–15 min comfortable Tread walk", False),
                ("tue-stretch", "Mobility", "5 min", "Optional", True)],
    "Wednesday": [("strength-wed", "Strength", "20–25 min", "10 min beginner strength", False),
                  ("wed-mobility", "Mobility", "5 min", "Optional", True)],
    "Thursday": [("intervals", "Tread", "30–35 min", "10–15 min comfortable walk", False),
                 ("thu-stretch", "Mobility", "5 min", "Optional", True)],
    "Friday": [("bike", "Bike", "15–20 min", "Dog walk or full rest", True),
               ("fri-stretch", "Mobility", "5 min", "Optional", True)],
    "Saturday": [("sat-recovery", "Recovery", "As needed", "Rest", True),
                 ("sat-mobility", "Mobility", "5–10 min", "Optional", True)],
    "Sunday": [("long-walk-nov", "Long", "From weekly plan", "20–30 min easy walk", False),
               ("sun-stretch", "Mobility", "5–10 min", "Optional", True)],
    "Monday": [("mon-strength", "Strength", "20–25 min", "10 min light strength or mobility", False),
               ("mon-stretch", "Mobility", "5 min", "Optional", True)],
}


def iso_date(day: dt.date) -> str:
    return day.isoformat()


def extract_checklists(markdown: str) -> dict[str, list[str]]:
    match = re.search(r"(?ms)^### Daily workout checklists.*?\n(.*?)(?=^## |\Z)", markdown)
    if not match:
        raise ValueError("Missing Plan.md daily workout checklists section")
    result: dict[str, list[str]] = {}
    current = None
    for line in match.group(1).splitlines():
        day = re.match(r"^#### (Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Monday)\s*$", line)
        if day:
            current = day.group(1)
            result[current] = []
        elif re.match(r"^- \[ \] ", line):
            if current is None:
                raise ValueError("Workout checkbox outside a day heading")
            result[current].append(re.sub(r"^- \[ \] ", "", line).strip())
    if tuple(result) != DAY_ORDER:
        raise ValueError(f"Expected seven ordered day headings, found {tuple(result)}")
    if any(len(result[day]) != len(SESSION_IDS[day]) for day in DAY_ORDER):
        raise ValueError("Unexpected day checkbox count; inspect Plan.md before publishing")
    return result


def extract_weeks(markdown: str, block_start: dt.date, block_end: dt.date) -> list[dict]:
    match = re.search(r"(?ms)^### Week-by-week Tread prescription\s*\n(.*?)(?=^## |\Z)", markdown)
    if not match:
        raise ValueError("Missing Plan.md week-by-week Tread prescription")
    result = []
    for line in match.group(1).splitlines():
        if not line.startswith("| Nov "):
            continue
        parts = [p.strip() for p in line.strip().strip("|").split("|")]
        if len(parts) != 5:
            raise ValueError("Weekly table has changed; inspect before publishing")
        row = re.match(r"^Nov\s+(\d+)[–-](\d+)\s+\((\d+)\)$", parts[0])
        if not row:
            raise ValueError(f"Unrecognized weekly date range: {parts[0]}")
        a, b, number = map(int, row.groups())
        begin, end = dt.date(2026, 11, a), dt.date(2026, 11, b)
        if begin.weekday() != 1 or end.weekday() != 0 or (end-begin).days != 6:
            raise ValueError("WeightWatchers weeks must be Tuesday to Monday")
        duration = re.sub(r"(?<=\d)[–-]min\b", " min", parts[3])
        if not re.search(r"\d+", duration):
            raise ValueError(f"Missing Sunday duration: {duration}")
        result.append({
            "number": number,
            "start": iso_date(begin),
            "end": iso_date(end),
            "tuesday_intervals": parts[1],
            "thursday_intervals": parts[2],
            "long_outing": duration,
            "focus": parts[4],
        })
    if len(result) != 4 or [x["number"] for x in result] != [1, 2, 3, 4] or result[0]["start"] != iso_date(block_start) or result[-1]["end"] != iso_date(block_end):
        raise ValueError("Weekly block length or dates changed; update parser before publishing")
    return result


def checkbox_title(line: str) -> str:
    title = line.split(" — ", 1)[0].strip()
    # For Saturday, the whole description includes the phrase 'no required extra session'.
    return title or line


def make_plan(markdown: str) -> dict:
    start_match = re.search(r"(?m)^block_start:\s*(\d{4}-\d{2}-\d{2})\s*$", markdown)
    end_match = re.search(r"(?m)^block_end:\s*(\d{4}-\d{2}-\d{2})\s*$", markdown)
    if not start_match or not end_match:
        raise ValueError("Missing block_start or block_end in Plan.md frontmatter")
    start, end = dt.date.fromisoformat(start_match.group(1)), dt.date.fromisoformat(end_match.group(1))
    if (start.year, start.month, end.year, end.month) != (2026, 11, 2026, 11):
        raise ValueError("Current exporter is scoped to November 2026; revise and review for a new training block")
    checklists = extract_checklists(markdown)
    weeks = extract_weeks(markdown, start, end)
    days = {}
    for week in weeks:
        week_start = dt.date.fromisoformat(week["start"])
        for day_number, name in enumerate(DAY_ORDER):
            current = week_start + dt.timedelta(days=day_number)
            items = []
            for (key, activity, duration, minimum, optional), raw in zip(SESSION_IDS[name], checklists[name]):
                text = raw
                if name in ("Tuesday", "Thursday") and key in ("steady", "intervals"):
                    prescribed = week["tuesday_intervals"] if name == "Tuesday" else week["thursday_intervals"]
                    text += f" Weekly interval prescription: {prescribed}. 5-min easy walking warm-up and 5-min cooldown; replace jogging with brisk walking if uncomfortable."
                if name == "Sunday" and key == "long-walk-nov":
                    duration = week["long_outing"].replace("easy walk", "").strip()
                    text += f" Current WW week: {week['long_outing']}."
                items.append({
                    "key": key,
                    "title": checkbox_title(raw),
                    "type": activity,
                    "duration": duration,
                    "detail": text,
                    "minimum": minimum,
                    "optional": optional,
                    "source_checklist": raw,
                })
            days[iso_date(current)] = items
    if len(days) != (end - start).days + 1:
        raise ValueError("Incomplete dated workouts")
    return {
        "schema_version": 2,
        "program": "Our Adventure — Health Journey",
        "source": {
            "file": "Health Journey/Plan.md",
            "source_sha256": hashlib.sha256(markdown.encode("utf-8")).hexdigest(),
            "source_snapshot": "2026-11-01",
            "status": "reviewed Obsidian export; not a live connection",
        },
        "block_start": iso_date(start),
        "block_end": iso_date(end),
        "timezone": "America/New_York",
        "week_start": "Tuesday",
        "goals": [
            {"name": "Shamrock Half Marathon", "date": "2027-03-21", "status": "target"},
            {"name": "Iceland hiking", "date": None, "season": "Summer 2027", "status": "dates not confirmed"},
        ],
        "weeks": weeks,
        "days": days,
        "notice": "Published workout schedule only. Future unplanned dates are not rest days. The daily Obsidian record and individual recovery guidance take priority.",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Path to Obsidian Health Journey/Plan.md")
    actions = parser.add_mutually_exclusive_group(required=True)
    actions.add_argument("--output", type=Path, help="Write the reviewed JSON snapshot")
    actions.add_argument("--check", type=Path, help="Compare the reviewed JSON against a published snapshot")
    args = parser.parse_args()
    source = args.source.read_text(encoding="utf-8")
    obj = make_plan(source)
    encoded = json.dumps(obj, ensure_ascii=False, indent=2) + "\n"
    target = args.output or args.check
    if args.check:
        if not target.exists() or target.read_text(encoding="utf-8") != encoded:
            print("TRAINING PLAN OUT OF SYNC. Review & publish the newly exported plan; no files changed.", file=sys.stderr)
            return 1
        print("Training plan is in sync with the supplied Obsidian Plan.md.")
        return 0
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(encoded, encoding="utf-8")
    print(f"Exported {len(obj['days'])} dated training days to {target}; only public workout prescriptions were included.")
    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, OSError) as exc:
        print(f"Cannot export plan: {exc}", file=sys.stderr)
        raise SystemExit(2)