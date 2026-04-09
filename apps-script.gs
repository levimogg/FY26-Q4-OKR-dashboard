/**
 * TFA Washington OKR Dashboard — Apps Script Web App
 *
 * Responsibilities:
 *   - Serve objectives + KRs data to the dashboard as JSON (doGet)
 *   - Accept inline edits from the dashboard and write them back to the sheet (doPost)
 *   - Maintain an append-only audit log of every write
 *   - Accept flags from the dashboard
 *
 * Deploy as: Web app, Execute as "Me", Access "Anyone"
 * When redeploying after code changes: use "Manage deployments" → edit existing deployment
 * to keep the URL stable. If the URL changes, update APPS_SCRIPT_URL in index.html.
 *
 * Sheet layout: see sheet-structure.md. Primary tab is "OKRs". Audit tab is created
 * automatically on first write.
 */

const OKRS_TAB = 'OKRs';
const AUDIT_TAB = 'Audit';
const FLAGS_TAB = 'Flags';
const CONFIG_TAB = 'Config';

// ------------ entrypoints ------------

function doGet(e) {
  const mode = (e && e.parameter && e.parameter.mode) || 'data';
  try {
    if (mode === 'data') return json(loadData());
    return json({ error: 'unknown mode: ' + mode });
  } catch (err) {
    return json({ error: String(err) });
  }
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false, error: 'bad json: ' + err });
  }
  try {
    if (body.action === 'update') return json(handleUpdate(body));
    if (body.action === 'flag')   return json(handleFlag(body));
    return json({ ok: false, error: 'unknown action: ' + body.action });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ------------ read ------------

function loadData() {
  const sheet = getSheet(OKRS_TAB);
  if (!sheet) throw new Error('Missing sheet tab: ' + OKRS_TAB);
  const values = sheet.getDataRange().getValues();
  if (!values.length) return { config: loadConfig(), objectives: [], flags: loadFlags() };

  const headers = values.shift();
  const idx = headerIndex(headers);

  const order = [];
  const map = {};

  values.forEach(row => {
    const objId = String(row[idx.objective_id] || '').trim();
    if (!objId) return;
    if (!map[objId]) {
      map[objId] = {
        id: objId,
        objective: row[idx.objective] || '',
        status: row[idx.obj_status] || 'on_track',
        status_note: row[idx.obj_status_note] || '',
        next_step: row[idx.obj_next_step] || '',
        krs: []
      };
      order.push(objId);
    }
    const krId = String(row[idx.kr_id] || '').trim();
    if (krId) {
      map[objId].krs.push({
        id: krId,
        key_result: row[idx.key_result] || '',
        owner: row[idx.owner] || '',
        target: Number(row[idx.target]) || 0,
        current: Number(row[idx.current]) || 0,
        unit: row[idx.unit] || '',
        status_override: row[idx.kr_status_override] || '',
        status_auto: row[idx.kr_status_auto] || 'on_track',
        note: row[idx.kr_note] || '',
        next_step: row[idx.kr_next_step] || ''
      });
    }
  });

  return {
    config: loadConfig(),
    objectives: order.map(id => map[id]),
    flags: loadFlags()
  };
}

function loadConfig() {
  const sheet = getSheet(CONFIG_TAB);
  const fallback = { org_name: 'TFA Washington', next_review_date: '', top_flags_on_agenda: 5 };
  if (!sheet) return fallback;
  const rows = sheet.getDataRange().getValues();
  const cfg = Object.assign({}, fallback);
  rows.forEach(r => {
    const k = String(r[0] || '').trim();
    if (!k) return;
    let v = r[1];
    if (v instanceof Date) v = Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    cfg[k] = v;
  });
  return cfg;
}

function loadFlags() {
  const sheet = getSheet(FLAGS_TAB);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values.shift();
  return values.filter(r => r[0]).map(r => {
    const o = {};
    headers.forEach((h, i) => { o[h] = r[i]; });
    return o;
  });
}

// ------------ write ------------

function handleUpdate(body) {
  const { level, id, field, value, editor } = body;
  if (!level || !id || !field) throw new Error('missing level/id/field');

  const sheet = getSheet(OKRS_TAB);
  if (!sheet) throw new Error('Missing sheet tab: ' + OKRS_TAB);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idx = headerIndex(headers);

  // Map dashboard field → sheet column
  let colKey;
  if (level === 'objective') {
    colKey = ({ status: 'obj_status', status_note: 'obj_status_note', next_step: 'obj_next_step' })[field];
  } else if (level === 'kr') {
    colKey = ({ status_override: 'kr_status_override', note: 'kr_note', next_step: 'kr_next_step', current: 'current' })[field];
  } else {
    throw new Error('bad level: ' + level);
  }
  if (!colKey) throw new Error('bad field for level ' + level + ': ' + field);
  if (idx[colKey] == null) throw new Error('missing column in sheet: ' + colKey);

  // Find the row
  let rowNum = -1;
  for (let i = 1; i < values.length; i++) {
    if (level === 'objective') {
      if (String(values[i][idx.objective_id] || '').trim() === id) { rowNum = i + 1; break; }
    } else {
      if (String(values[i][idx.kr_id] || '').trim() === id) { rowNum = i + 1; break; }
    }
  }
  if (rowNum < 0) throw new Error('id not found: ' + id);

  const col = idx[colKey] + 1;
  const oldValue = sheet.getRange(rowNum, col).getValue();

  // Type coercion
  let newValue = value;
  if (colKey === 'current') newValue = Number(value) || 0;
  if (newValue == null) newValue = '';

  sheet.getRange(rowNum, col).setValue(newValue);

  // Stamp metadata
  if (idx.last_updated != null) sheet.getRange(rowNum, idx.last_updated + 1).setValue(new Date());
  if (idx.edited_by != null)    sheet.getRange(rowNum, idx.edited_by + 1).setValue(editor || '');

  appendAudit({ editor: editor || '', level, id, field, old_value: oldValue, new_value: newValue });

  return { ok: true, old_value: oldValue, new_value: newValue };
}

function handleFlag(body) {
  const flag = body.flag || {};
  let sheet = getSheet(FLAGS_TAB);
  if (!sheet) {
    sheet = SpreadsheetApp.getActive().insertSheet(FLAGS_TAB);
    sheet.appendRow(['id', 'created_at', 'okr_id', 'author', 'type', 'text', 'upvotes', 'resolved']);
  }
  sheet.appendRow([
    flag.id || ('f' + Date.now()),
    flag.created_at || new Date().toISOString().slice(0, 10),
    flag.okr_id || '',
    flag.author || '',
    flag.type || '',
    flag.text || '',
    Number(flag.upvotes) || 1,
    false
  ]);
  return { ok: true };
}

function appendAudit(entry) {
  let sheet = getSheet(AUDIT_TAB);
  if (!sheet) {
    sheet = SpreadsheetApp.getActive().insertSheet(AUDIT_TAB);
    sheet.appendRow(['timestamp', 'editor', 'level', 'id', 'field', 'old_value', 'new_value']);
  }
  sheet.appendRow([new Date(), entry.editor, entry.level, entry.id, entry.field, entry.old_value, entry.new_value]);
}

// ------------ helpers ------------

function getSheet(name) {
  return SpreadsheetApp.getActive().getSheetByName(name);
}

function headerIndex(headers) {
  const idx = {};
  headers.forEach((h, i) => { idx[String(h).trim()] = i; });
  return idx;
}
