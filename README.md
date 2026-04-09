# TFA Washington OKR Dashboard

A TFA-branded, GitHub-hosted dashboard that reads live from a Google Sheet and lets function leads raise flags before the monthly review. Sheet = source of truth. Site = beautiful read layer + write-back.

## What's in this folder

```
okr-dashboard/
├── index.html          ← the site (single file, TFA-branded)
├── data.sample.json    ← placeholder data so the site renders before wiring
├── apps-script.gs      ← Google Apps Script backend (paste into the Sheet)
├── sheet-structure.md  ← exact tab + column spec for the Sheet
└── README.md           ← this file
```

## How it works

```
┌──────────────┐    read    ┌──────────────┐    read    ┌──────────┐
│ Google Sheet │ ─────────▶ │ Apps Script  │ ─────────▶ │ index.html│
│ (Org OKRs,   │            │ web app      │            │ (GH Pages)│
│  Functions,  │ ◀────────  │ (doGet/doPost│ ◀────────  │           │
│  Flags,      │   write    │              │   flag     │           │
│  Snapshots)  │            └──────────────┘            └──────────┘
└──────────────┘
```

- Team members open the site before the monthly review
- They see org OKRs up top, function OKRs bucketed by Attention Needed / Watch / Humming
- They click **+ Add a Flag** on any OKR — challenge, question, or proposed next step
- Flags write back to the Sheet via Apps Script
- Top upvoted flags auto-populate the "Proposed Agenda" sidebar

## Setup (30 min end-to-end)

### 1. Prep the Sheet

Open the existing OKR sheet. Create these tabs (see `sheet-structure.md` for full columns):

- `Org OKRs`
- `Function OKRs`  (flatten the current per-function tabs into this one)
- `Monthly Snapshots`
- `Flags`
- `Review Config`

### 2. Wire the backend

1. In the Sheet: **Extensions → Apps Script**
2. Delete the default `Code.gs` content; paste in everything from `apps-script.gs`
3. Save
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone with the link** (the URL is unguessable; OK for internal use)
5. Copy the deployment URL (ends in `/exec`)
6. In `index.html`, set `APPS_SCRIPT_URL = 'https://script.google.com/...'`
7. Also set `DATA_URL` to the same URL + `?mode=data` (replacing the sample JSON)

### 3. Set up monthly snapshots (optional but recommended)

In Apps Script → **Triggers** → Add trigger:
- Function: `snapshot`
- Event source: Time-driven
- Type: Month timer, 1st of month

This gives you sparklines automatically over time.

### 4. Host the site on GitHub Pages

```bash
cd okr-dashboard
git init && git add . && git commit -m "init"
gh repo create tfa-washington-okrs --public --source=. --push
```

Then: repo → Settings → Pages → Deploy from branch `main` → `/` root. Your site is live at `https://<you>.github.io/tfa-washington-okrs/`.

## Customization

**Colors and branding** — all TFA 35th Anniversary brand tokens live in CSS variables at the top of `index.html`:

```css
:root{
  --blue:#76CEE1;   /* Breakthrough Blue */
  --navy:#00225A;   /* Deep Navy */
  --red:#EF322D;    /* Power Red */
  --maroon:#4B0000; /* Dark Maroon */
  --cream:#FFEED4;  /* Warm Cream */
}
```

**Status thresholds** — change the `status_auto` formula in the Sheet or set `status_override` manually per OKR.

**Agenda size** — adjust `top_flags_on_agenda` in `Review Config`.

## What still needs to happen

- [ ] Swap `data.sample.json` for real OKRs from the Sheet (blocked on Chrome extension reconnection so I can read the sheet)
- [ ] Draft 3 org-level OKRs rolled up from the function leads' OKRs
- [ ] Deploy Apps Script + wire URLs
- [ ] Create the GitHub repo + turn on Pages
- [ ] First monthly review → iterate
