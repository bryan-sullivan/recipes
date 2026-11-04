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
from zoneinfo import ZoneInfo

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
    """Read a reviewed Tuesday–Monday table; fail if labels disagree with YAML dates.

    Supports labels such as "Dec 29–Jan 4 (9)". Week numbers may continue
    across blocks, but dates must agree with the frontmatter.
    """
    match = re.search(r"(?ms)^### Week-by-week Tread prescription\s*\n(.*?)(?=^## |\Z)", markdown)
    if not match:
        raise ValueError("Missing Plan.md week-by-week Tread prescription")
    if block_start.weekday() != 1 or block_end.weekday() != 0:
        raise ValueError("Training block must run Tuesday–Monday")
    days = (block_end - block_start).days + 1
    if days < 7 or days > 112 or days % 7:
        raise ValueError("Training block must contain 1–16 complete Tuesday–Monday weeks")
    expected_count = days // 7
    result = []
    for line in match.group(1).splitlines():
        if not line.lstrip().startswith("|"):
            continue
        parts = [p.strip() for p in line.strip().strip("|").split("|")]
        if not parts or parts[0].lower().startswith("ww week") or parts[0].startswith("---"):
            continue
        if len(parts) != 5:
            raise ValueError("Weekly table has changed; inspect before publishing")
        row = re.fullmatch(r"([A-Za-z]{3})\s+(\d{1,2})\s*[–-]\s*(?:([A-Za-z]{3})\s+)?(\d{1,2})\s+\((\d+)\)", parts[0])
        if not row:
            raise ValueError(f"Unrecognized weekly date range: {parts[0]}")
        month_a, day_a, month_b, day_b, number = row.groups()
        begin = block_start + dt.timedelta(days=len(result)*7)
        end = begin + dt.timedelta(days=6)
        if (month_a.lower(), int(day_a), (month_b or month_a).lower(), int(day_b)) != \
           (begin.strftime("%b").lower(), begin.day, end.strftime("%b").lower(), end.day):
            raise ValueError(f"Weekly label {parts[0]!r} does not match {begin} through {end}")
        if result and int(number) != result[-1]["number"] + 1:
            raise ValueError("Weekly numbers must increment by one")
        duration = re.sub(r"(?<=\d)[–-]min\b", " min", parts[3])
        if not re.search(r"\d+", duration) or not all(parts[i] for i in (1, 2, 4)):
            raise ValueError(f"Incomplete training prescription for {parts[0]}")
        result.append({
            "number": int(number),
            "start": iso_date(begin),
            "end": iso_date(end),
            "tuesday_intervals": parts[1],
            "thursday_intervals": parts[2],
            "long_outing": duration,
            "focus": parts[4],
        })
    if len(result) != expected_count:
        raise ValueError(f"Expected {expected_count} weekly rows, found {len(result)}")
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
            "source_snapshot": dt.datetime.now(ZoneInfo("America/New_York")).date().isoformat(),
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


PUBLIC_TOP_LEVEL = {"schema_version", "program", "source", "source_history", "block_start", "block_end", "timezone", "week_start", "goals", "weeks", "days", "notice"}
PUBLIC_SESSION_KEYS = {"key", "title", "type", "duration", "detail", "minimum", "optional", "source_checklist"}


def validate_public_plan(plan: dict) -> None:
    """Fail closed on unknown fields, so private daily values cannot leak by mistake."""
    extra = set(plan) - PUBLIC_TOP_LEVEL
    if extra:
        raise ValueError(f"Unexpected public plan fields: {sorted(extra)}")
    if plan.get("schema_version") != 2 or plan.get("timezone") != "America/New_York":
        raise ValueError("Unsupported public plan schema or timezone")
    if not isinstance(plan.get("days"), dict) or not plan["days"]:
        raise ValueError("Missing dated workout sessions")
    first, last = min(plan["days"]), max(plan["days"])
    if (first, last) != (plan.get("block_start"), plan.get("block_end")):
        raise ValueError("Published date range does not match sessions")
    if not isinstance(plan.get("weeks"), list):
        raise ValueError("Missing Tuesday–Monday week definitions")
    for date, sessions in plan["days"].items():
        dt.date.fromisoformat(date)
        if not isinstance(sessions, list):
            raise ValueError(f"Invalid sessions for {date}")
        keys = []
        for session in sessions:
            if set(session) != PUBLIC_SESSION_KEYS:
                raise ValueError(f"Missing or unexpected session fields on {date}: {set(session) ^ PUBLIC_SESSION_KEYS}")
            if any(not isinstance(session[k], str) or not session[k].strip() for k in PUBLIC_SESSION_KEYS - {"optional"}):
                raise ValueError(f"Empty session field on {date}")
            if not isinstance(session["optional"], bool):
                raise ValueError(f"Invalid optional flag on {date}")
            keys.append(session["key"])
        if len(keys) != len(set(keys)):
            raise ValueError(f"Duplicate workout IDs on {date}")


def merge_preserving_history(new: dict, prior: dict) -> dict:
    """Never delete previously approved dates or silently revise past sessions."""
    validate_public_plan(new)
    validate_public_plan(prior)
    if new["program"] != prior["program"] or new["timezone"] != prior["timezone"]:
        raise ValueError("Cannot merge distinct training programs")
    if new["block_end"] < prior["block_end"] and new["source"]["source_sha256"] != prior["source"]["source_sha256"]:
        raise ValueError("The supplied Plan.md is older than the already published block; refusing to roll back")
    today = dt.datetime.now(ZoneInfo("America/New_York")).date().isoformat()
    previous_days = prior["days"]
    for date in set(previous_days) & set(new["days"]):
        if date <= today and previous_days[date] != new["days"][date]:
            raise ValueError(f"Historical workout changed for {date}; protect past X checkoffs and review explicitly")
    history = list(prior.get("source_history", []))
    if prior["source"]["source_sha256"] == new["source"]["source_sha256"]:
        # A re-export of an unchanged vault plan should not alter its publication date.
        new["source"] = prior["source"]
    elif prior["source"] not in history:
        history.append(prior["source"])
    if history:
        new["source_history"] = history
    new["days"] = dict(sorted({**previous_days, **new["days"]}.items()))
    new["weeks"] = sorted({x["start"]: x for x in [*prior["weeks"], *new["weeks"]]}.values(), key=lambda x: x["start"])
    new["block_start"] = min(new["block_start"], prior["block_start"])
    new["block_end"] = max(new["block_end"], prior["block_end"])
    validate_public_plan(new)
    return new


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Path to Obsidian Health Journey/Plan.md")
    actions = parser.add_mutually_exclusive_group(required=True)
    actions.add_argument("--output", type=Path, help="Generate a public workout-only JSON file for review")
    actions.add_argument("--check", type=Path, help="Check source against the existing published plan")
    args = parser.parse_args()
    source = args.source.read_text(encoding="utf-8")
    obj = make_plan(source)
    target = args.output or args.check
    if target.exists():
        try:
            existing = json.loads(target.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise ValueError(f"Existing published JSON is invalid: {exc}") from exc
        obj = merge_preserving_history(obj, existing)
    else:
        validate_public_plan(obj)
    encoded = json.dumps(obj, ensure_ascii=False, indent=2) + "\n"
    if args.check:
        if not target.exists() or target.read_text(encoding="utf-8") != encoded:
            print("TRAINING PLAN OUT OF SYNC. Review exported changes before publishing; no files changed.", file=sys.stderr)
            return 1
        print("Training plan is in sync with the supplied Obsidian Plan.md.")
        return 0
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists() and target.read_text(encoding="utf-8") == encoded:
        print("No changes: published training plan already matches Plan.md.")
        return 0
    target.write_text(encoded, encoding="utf-8")
    print(f"Staged {len(obj['days'])} dated training days to {target}; prior dates and checkoff IDs preserved.")
    print("REVIEW git diff and approve any GitHub publication separately. Nothing has been pushed.")
    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, OSError) as exc:
        print(f"Cannot export plan: {exc}", file=sys.stderr)
        raise SystemExit(2)
