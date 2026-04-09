/**
 * TFA Washington OKR Dashboard — Apps Script backend
 *
 * Deploy:
 * 1. Open the Google Sheet → Extensions → Apps Script
 * 2. Paste this file as Code.gs
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone with the link
 * 4. Copy the /exec URL and paste into index.html APPS_SCRIPT_URL
 *
 * Endpoints:
 *   GET  ?mode=data      → returns full JSON for dashboard (org, functions, flags, config)
 *   POST { flag }         → appends a row to the Flags tab
 *   POST { upvote: id }   → increments upvote on a flag
 *   POST { snapshot: 1 }  → append monthly snapshot rows (run via trigger on 1st of month)
 */

const SHEET_ID = ''; // optional — leave blank to use the bound sheet

function ss(){ return SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActive(); }

function doGet(e){
  const mode = (e && e.parameter && e.parameter.mode) || 'data';
  if(mode === 'data') return json(buildData());
  return json({error:'unknown mode'});
}

function doPost(e){
  const body = JSON.parse(e.postData.contents || '{}');
  if(body.flag || body.text){ return json(appendFlag(body)); }
  if(body.upvote){ return json(upvoteFlag(body.upvote)); }
  if(body.snapshot){ return json(snapshot()); }
  return json({error:'unknown payload'});
}

function json(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function rows(tab){
  const sh = ss().getSheetByName(tab);
  if(!sh) return [];
  const values = sh.getDataRange().getValues();
  if(values.length < 2) return [];
  const headers = values[0].map(h => String(h).trim());
  return values.slice(1).filter(r => r[0] !== '').map(r => {
    const o = {}; headers.forEach((h,i)=> o[h] = r[i]); return o;
  });
}

function buildData(){
  const config = {};
  rows('Review Config').forEach(r => { config[r.key] = r.value; });
  const org = rows('Org OKRs').map(normalizeOkr);
  const functions = rows('Function OKRs').map(normalizeOkr);
  const flags = rows('Flags').map(r => ({
    id: r.flag_id, okr_id: r.okr_id, author: r.author_name,
    type: r.type, text: r.text, upvotes: Number(r.upvotes)||0,
    created_at: String(r.created_at).slice(0,10)
  }));
  // compute trends from snapshots
  const snaps = rows('Monthly Snapshots');
  const trendByOkr = {};
  snaps.forEach(s => {
    trendByOkr[s.okr_id] = trendByOkr[s.okr_id] || [];
    trendByOkr[s.okr_id].push(Number(s.current_value)||0);
  });
  [...org, ...functions].forEach(o => { o.trend = trendByOkr[o.id] || [o.current]; });

  return { config, org_okrs: org, function_okrs: functions, flags };
}

function normalizeOkr(r){
  return {
    id: r.id,
    function: r.function || '',
    objective: r.objective,
    key_result: r.key_result,
    owner: r.owner,
    current: Number(r.current)||0,
    target: Number(r.target)||0,
    unit: r.unit,
    status: r.status || 'on_track',
    rolls_up_to: r.rolls_up_to || '',
    next_step: r.next_step || ''
  };
}

function appendFlag(f){
  const sh = ss().getSheetByName('Flags');
  const id = f.id || Utilities.getUuid();
  sh.appendRow([id, new Date(), f.okr_id, f.author||'', '', f.type||'challenge', f.text||'', 1, false, '']);
  return {ok:true, id};
}

function upvoteFlag(id){
  const sh = ss().getSheetByName('Flags');
  const values = sh.getDataRange().getValues();
  for(let i=1;i<values.length;i++){
    if(values[i][0]===id){
      sh.getRange(i+1, 8).setValue((Number(values[i][7])||0)+1);
      return {ok:true};
    }
  }
  return {ok:false,error:'not found'};
}

function snapshot(){
  const sh = ss().getSheetByName('Monthly Snapshots');
  const today = new Date();
  [...rows('Org OKRs'), ...rows('Function OKRs')].forEach(o => {
    sh.appendRow([today, o.id, o.current, o.status || '', '']);
  });
  return {ok:true};
}
