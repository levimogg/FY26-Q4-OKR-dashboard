# TFA Washington OKR Dashboard — Sheet Structure

The Google Sheet is the source of truth. The website reads from published CSVs. Apps Script handles write-back from the site (flags + status updates).

## Tabs

### 1. `Org OKRs`
Top-line objectives for TFA Washington. Max 3–5.

| Column | Type | Notes |
|---|---|---|
| id | text | `org-1`, `org-2`… stable key |
| objective | text | The O in OKR |
| key_result | text | The KR |
| owner | text | Name |
| owner_email | email | For flag notifications |
| target | number | Goal number |
| current | number | Current value (updated monthly) |
| unit | text | `%`, `#`, `$`, etc. |
| quarter | text | `Q4 FY26` |
| status_override | text | `on_track` / `at_risk` / `off_track` / blank (auto) |
| status_auto | formula | See formula below |
| status | formula | `=IF(status_override<>"", status_override, status_auto)` |
| next_step | text | Required if status ≠ on_track |
| last_updated | date | Auto via Apps Script |

**status_auto formula:**
```
=IF(current/target >= (today_in_quarter_pct - 0.05), "on_track",
   IF(current/target >= (today_in_quarter_pct - 0.15), "at_risk", "off_track"))
```

### 2. `Function OKRs`
All function-level OKRs flat in one tab (easier to query than one tab per function).

Same columns as `Org OKRs`, plus:
| Column | Type | Notes |
|---|---|---|
| function | text | `Recruitment`, `Development`, `Program`, `Operations`, etc. |
| rolls_up_to | text | id of the parent Org OKR |

### 3. `Monthly Snapshots`
Append-only log. Apps Script writes one row per OKR on the 1st of every month.

| Column |
|---|
| snapshot_date |
| okr_id |
| current_value |
| status |
| note |

Used for sparklines + "since last month" deltas.

### 4. `Flags`
Challenges, questions, and proposed next steps raised by function leads before the monthly review. Written by the site via Apps Script.

| Column |
|---|
| flag_id (uuid) |
| created_at |
| okr_id |
| author_name |
| author_email |
| type (`challenge` / `question` / `next_step`) |
| text |
| upvotes (int) |
| resolved (bool) |
| decision (text) |

### 5. `Review Config`
Single-row config read by the site.

| Key | Example |
|---|---|
| next_review_date | 2026-05-07 |
| review_cadence | monthly |
| org_name | TFA Washington |
| top_flags_on_agenda | 5 |
