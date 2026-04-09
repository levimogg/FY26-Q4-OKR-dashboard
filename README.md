# TFA Washington OKR Dashboard

A TFA-branded, GitHub-hosted dashboard for the team's FY26 Q4 OKR review. Reads live from a Google Sheet via Apps Script. Team members update status, notes, and current values **directly from the dashboard** — writes go back to the Sheet and are logged in an audit trail.

**Live:** https://levimogg.github.io/FY26-Q4-OKR-dashboard/

## What's in this folder

```
FY26-Q4-OKR-dashboard/
├── index.html          ← the dashboard (single file, TFA-branded)
├── data.json           ← bootstrap snapshot (used when Apps Script is unreachable)
├── apps-script.gs      ← Google Apps Script backend (paste into the Sheet)
├── sheet-structure.md  ← exact tab + column spec for the Sheet
└── README.md           ← this file
```

## How it works

- **One list: Objectives.** 7 objectives for FY26 Q4. Each owns a set of Key Results that can be added, edited, or retired mid-quarter as context changes.
- **Two levels of status.** KR status is auto-calculated from progress. Objective status is a judgment call by the team, set from the dashboard.
- **Inline editing.** Click any status pill, note, next step, or KR current value to update it. Changes save to the sheet and get stamped with who made them.
- **Audit log.** Every write appends to an `Audit` tab so the team has full history.
- **Flags.** Anyone can raise a challenge, question, or proposed next step against an objective or KR. Top flags populate the review agenda.

## One-time setup (needed before inline editing works against the live sheet)

The dashboard will render immediately from `data.json` regardless. To enable live write-back to your Google Sheet, do these three things **once**:

### 1. Update the Sheet structure

Your sheet needs a primary tab named `OKRs` with the columns in `sheet-structure.md`. Quickest path:

1. Open the Google Sheet
2. Rename the existing tab to `OKRs` (or create a new one and delete the old)
3. Paste the header row (copy from `sheet-structure.md`)
4. Either type the 7 objectives + ~24 KRs by hand, or start with everything blank and use the dashboard to fill in status/notes over time (structural KR text will still need to be typed into the sheet)

### 2. Redeploy the Apps Script

1. In the sheet: **Extensions → Apps Script**
2. Delete everything in `Code.gs`
3. Paste the full contents of `apps-script.gs` from this folder
4. Save (⌘+S)
5. **Deploy → Manage deployments** → pencil icon on the existing deployment → **Version: New version** → **Deploy**
   - This keeps the existing URL stable so `index.html` doesn't need updating
   - If the URL does change, paste the new URL into the `APPS_SCRIPT_URL` constant in `index.html` (line ~440), commit, push

### 3. Reload the dashboard

The source tag in the top-right should flip from **"Snapshot · Apps Script not redeployed yet"** to **"Live · Google Sheet"**. You're done.

## Using the dashboard

**First time:** click any editable field. You'll be asked to enter your name once — it's stored in your browser only and used to stamp edits in the audit log.

**Update objective status:** click the status pill next to an objective → pick On Track / At Risk / Off Track.

**Add a status note or next step:** click the placeholder text in the objective card → type → press Enter or click away.

**Update a KR current value:** expand the KR drawer → click the current number → type new value → Enter.

**Update a KR status override:** click the KR status pill in the drawer → pick.

**Raise a flag:** click "Flag this objective" on a card, or "Flag" next to a KR, or "+ Add a Flag" in the sidebar. Top flags populate the agenda.

## What the dashboard edits vs. what the sheet edits

| Field | Dashboard | Sheet |
|---|---|---|
| Objective text | ❌ | ✅ |
| Objective status / note / next step | ✅ | ✅ |
| KR text / owner / target / unit | ❌ | ✅ |
| KR current value | ✅ | ✅ |
| KR status override / note / next step | ✅ | ✅ |
| Add / retire KRs | ❌ | ✅ |

Rule of thumb: structural things (what we're measuring) are edited in the sheet. Review-time things (where we are, what we think, what we're doing about it) are edited on the dashboard.

## Customization

**Colors** — TFA 35th Anniversary brand tokens live in CSS variables at the top of `index.html` (`:root` block).

**Status thresholds** — adjust the `kr_status_auto` formula in the sheet.

**Next review date** — edit the `Config` tab in the sheet, or the `next_review_date` field in `data.json`.

## Development

```bash
cd FY26-Q4-OKR-dashboard
open index.html   # or: ./launch.command
```

For GitHub Pages, just push to `main`. Pages is already configured.
