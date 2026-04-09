# TFA Washington OKR Dashboard — Sheet Structure

The Google Sheet is the source of truth. The dashboard reads and writes via the Apps Script web app. Structural data (objective text, KR text, owners, targets) is edited in the sheet. Review-time data (status, notes, next steps, current values) is edited directly in the dashboard.

## Design principles

- **One primary tab.** Everything for objectives and KRs lives in one flat tab. No multi-tab sprawl.
- **Objective-level fields on the first row of each group.** The dashboard and Apps Script treat the first row per `objective_id` as the home for objective status/note/next_step.
- **Two levels of status.** KR status is auto-calculated from progress (with manual override). Objective status is always a judgment call by the team, set from the dashboard.
- **Every write is audited.** The Apps Script appends to the `Audit` tab automatically — timestamp, editor name, field, old value, new value.

## Tabs

### 1. `OKRs` (primary)

One row per KR. Objectives span multiple rows (one per KR) and share an `objective_id`. Objective-level fields (`obj_status`, `obj_status_note`, `obj_next_step`) are only filled on the **first row of each objective group**.

| Column | Type | Notes |
|---|---|---|
| objective_id | text | Stable key: `o1`, `o2`… Repeated across all rows of the group. |
| objective | text | Objective statement. Repeated across all rows of the group. |
| obj_status | text | `on_track` / `at_risk` / `off_track`. **First row of group only.** Judgment call. Updated from the dashboard. |
| obj_status_note | text | Why the objective is where it is. **First row of group only.** |
| obj_next_step | text | What's the move. **First row of group only.** |
| kr_id | text | Stable key: `o1-kr1`, `o1-kr2`… |
| key_result | text | KR statement. |
| owner | text | KR owner (individual or small group). |
| target | number | Goal number. |
| current | number | Current value. Updated from the dashboard inline. |
| unit | text | `%`, `#`, `$`. |
| kr_status_override | text | Optional: `on_track` / `at_risk` / `off_track` / blank. Blank = use `kr_status_auto`. |
| kr_status_auto | formula | See formula below. |
| kr_note | text | KR-level note. |
| kr_next_step | text | KR-level next step. |
| last_updated | datetime | Auto-written by Apps Script on every update. |
| edited_by | text | Auto-written by Apps Script on every update. Name from the dashboard's one-time prompt. |

**`kr_status_auto` formula** (assuming `target` in column I, `current` in column J; adjust column letters if columns move):
```
=IF(I2=0,"on_track",IF(J2/I2>=0.85,"on_track",IF(J2/I2>=0.6,"at_risk","off_track")))
```

Apply to every data row in the column. You can tighten this to be time-aware (progress vs. quarter elapsed) if you want — current version just uses raw ratio.

### 2. `Audit` (managed automatically)

Append-only log of every dashboard write. Apps Script creates this tab on first write if it doesn't exist.

| Column |
|---|
| timestamp |
| editor |
| level (`objective` / `kr`) |
| id |
| field |
| old_value |
| new_value |

### 3. `Flags` (managed automatically)

Written by the dashboard via Apps Script when someone raises a flag.

| Column |
|---|
| id |
| created_at |
| okr_id |
| author |
| type (`challenge` / `question` / `next_step`) |
| text |
| upvotes |
| resolved |

### 4. `Config`

Key-value rows. Read by the dashboard.

| key | value (example) |
|---|---|
| org_name | TFA Washington |
| next_review_date | 2026-05-07 |
| top_flags_on_agenda | 5 |

## What's editable from the dashboard vs. the sheet

| Field | Dashboard | Sheet |
|---|---|---|
| Objective text | ❌ | ✅ |
| Objective status | ✅ | ✅ |
| Objective status note | ✅ | ✅ |
| Objective next step | ✅ | ✅ |
| KR text | ❌ | ✅ |
| KR owner | ❌ | ✅ |
| KR target / unit | ❌ | ✅ |
| KR current value | ✅ | ✅ |
| KR status override | ✅ | ✅ |
| KR note | ✅ | ✅ |
| KR next step | ✅ | ✅ |

**Rule of thumb:** structural things (what we're measuring, who owns it, what the goal is) are edited in the sheet. Review-time things (where we are, what we think, what we're doing about it) are edited on the dashboard.

## Adding or retiring KRs mid-quarter

Objectives are durable commitments. KRs are instruments — add or retire them as context changes.

**To add a KR:** add a new row in `OKRs` with the same `objective_id` as its parent, a new unique `kr_id`, and the KR fields filled in. Leave the `obj_*` columns blank (they live on the first row of the group). Refresh the dashboard.

**To retire a KR:** delete the row, or add a `retired` flag column and filter in Apps Script. For now, just delete.
