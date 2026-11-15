/// <reference types="astro/client" />
// Client-side state for the inspection checklist. Everything is persisted in localStorage.

type Status = 'ok' | 'ng' | 'na';
type StatusFilter = 'all' | 'todo' | Status;

interface ItemState {
  s?: Status;
  n?: string;
}

interface VehicleInfo {
  name: string;
  year: string;
  make: string;
  model: string;
  vin: string;
  mileage: string;
  price: string;
  seller: string;
  location: string;
  notes: string;
}

interface Vehicle {
  id: string;
  info: VehicleInfo;
  items: Record<string, ItemState>;
  createdAt: number;
  updatedAt: number;
}

interface UiState {
  section: string;
  status: StatusFilter;
  critical: boolean;
  q: string;
  collapsed: Record<string, boolean>;
}

interface AppState {
  version: 1;
  activeId: string;
  vehicles: Record<string, Vehicle>;
  ui: UiState;
}

const STORAGE_KEY = 'touge-inspect:v1';

const emptyInfo = (): VehicleInfo => ({
  name: '', year: '', make: '', model: '', vin: '', mileage: '', price: '', seller: '', location: '', notes: '',
});

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const newVehicle = (name = ''): Vehicle => {
  const now = Date.now();
  return { id: uid(), info: { ...emptyInfo(), name }, items: {}, createdAt: now, updatedAt: now };
};

const defaultUi = (): UiState => ({ section: 'all', status: 'all', critical: false, q: '', collapsed: {} });

function freshState(): AppState {
  const v = newVehicle('Car #1');
  return { version: 1, activeId: v.id, vehicles: { [v.id]: v }, ui: defaultUi() };
}

// ---------- validation ----------
// Saved data and imported files are untrusted: normalize every field so one bad
// value can never crash rendering (and, because we save right after, brick the app).

const STATUSES = new Set<Status>(['ok', 'ng', 'na']);
const STATUS_FILTERS = new Set<StatusFilter>(['all', 'todo', 'ok', 'ng', 'na']);
const SAFE_KEY = /^[A-Za-z0-9_-]{1,80}$/; // also rules out __proto__ / constructor
const NOTE_MAX = 2000;
const IMPORT_MAX_BYTES = 5 * 1024 * 1024;

const isObj = (x: unknown): x is Record<string, unknown> => Boolean(x) && typeof x === 'object' && !Array.isArray(x);
const str = (x: unknown, max: number) =>
  (typeof x === 'string' ? x : typeof x === 'number' && Number.isFinite(x) ? String(x) : '').slice(0, max);
const num = (x: unknown, fallback: number) => (typeof x === 'number' && Number.isFinite(x) ? x : fallback);

const INFO_MAX: Record<keyof VehicleInfo, number> = {
  name: 80, year: 4, make: 40, model: 60, vin: 17, mileage: 12, price: 20, seller: 120, location: 120, notes: NOTE_MAX,
};

function normalizeVehicle(id: string, raw: unknown): Vehicle | null {
  if (!isObj(raw)) return null;
  const rawInfo = isObj(raw.info) ? raw.info : {};
  const info = emptyInfo();
  for (const k of Object.keys(info) as (keyof VehicleInfo)[]) info[k] = str(rawInfo[k], INFO_MAX[k]);

  const items: Record<string, ItemState> = {};
  if (isObj(raw.items)) {
    for (const [itemId, v] of Object.entries(raw.items)) {
      if (!SAFE_KEY.test(itemId) || !isObj(v)) continue;
      const st: ItemState = {};
      if (STATUSES.has(v.s as Status)) st.s = v.s as Status;
      const n = str(v.n, NOTE_MAX);
      if (n.trim()) st.n = n;
      if (st.s || st.n) items[itemId] = st;
    }
  }
  const now = Date.now();
  const createdAt = num(raw.createdAt, now);
  return { id, info, items, createdAt, updatedAt: num(raw.updatedAt, createdAt) };
}

function normalizeUi(raw: unknown): UiState {
  const ui = defaultUi();
  if (!isObj(raw)) return ui;
  if (typeof raw.section === 'string' && (raw.section === 'all' || SAFE_KEY.test(raw.section))) ui.section = raw.section;
  if (STATUS_FILTERS.has(raw.status as StatusFilter)) ui.status = raw.status as StatusFilter;
  ui.critical = raw.critical === true;
  ui.q = str(raw.q, 100);
  if (isObj(raw.collapsed)) {
    for (const [k, v] of Object.entries(raw.collapsed)) if (SAFE_KEY.test(k) && v === true) ui.collapsed[k] = true;
  }
  return ui;
}

/** Returns a fully-shaped state, or null if there is not a single usable vehicle in it. */
function normalizeState(raw: unknown): AppState | null {
  if (!isObj(raw) || raw.version !== 1 || !isObj(raw.vehicles)) return null;
  const vehicles: Record<string, Vehicle> = {};
  for (const [id, v] of Object.entries(raw.vehicles)) {
    if (!SAFE_KEY.test(id)) continue;
    const nv = normalizeVehicle(id, v);
    if (nv) vehicles[id] = nv;
  }
  const ids = Object.keys(vehicles);
  if (!ids.length) return null;
  const activeId = typeof raw.activeId === 'string' && vehicles[raw.activeId] ? raw.activeId : ids[0];
  return { version: 1, activeId, vehicles, ui: normalizeUi(raw.ui) };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = normalizeState(JSON.parse(raw));
      if (parsed) return parsed;
    }
  } catch {
    /* storage unavailable or corrupt — start fresh */
  }
  return freshState();
}

let state = load();
let storageOk = true;

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (!storageOk) {
      storageOk = true;
      renderStorageWarning();
    }
  } catch (err) {
    if (storageOk) {
      const full = err instanceof DOMException && /quota/i.test(err.name);
      toast(full ? 'Storage full — changes are not being saved.' : 'This browser is blocking storage — changes are not being saved.', 'error');
      storageOk = false;
      renderStorageWarning();
    }
  }
}

const active = () => state.vehicles[state.activeId];

function touch(v: Vehicle = active()) {
  v.updatedAt = Date.now();
  save();
  renderBackup();
}

// ---------- DOM refs ----------
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as T;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll(sel)) as T[];

const itemEls = $$<HTMLLIElement>('.item');
const sectionEls = $$<HTMLElement>('.section');
const vehicleSelect = $<HTMLSelectElement>('#vehicleSelect');
const dialog = $<HTMLDialogElement>('#vehicleDialog');
const form = $<HTMLFormElement>('#vehicleForm');
const searchInput = $<HTMLInputElement>('#searchInput');
const criticalOnly = $<HTMLInputElement>('#criticalOnly');

// ---------- toast ----------
let toastTimer: number | undefined;
/** Errors get the red plate and stay up long enough to read the file name / fix. */
function toast(msg: string, kind: 'info' | 'error' = 'info') {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.toggle('error', kind === 'error');
  el.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('show'), kind === 'error' ? 5000 : 2400);
}

const footerNote = $('#footerNote');
const footerNoteDefault = footerNote.textContent;
function renderStorageWarning() {
  footerNote.classList.toggle('warn', !storageOk);
  footerNote.textContent = storageOk
    ? footerNoteDefault
    : 'Not saving: this browser is blocking or out of storage (private window?). Use Export JSON before you close this tab.';
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// ---------- rendering ----------
function vehicleLabel(v: Vehicle) {
  const ymm = [v.info.year, v.info.make, v.info.model].filter(Boolean).join(' ');
  return v.info.name || ymm || 'Unnamed car';
}

function renderVehicles() {
  const list = Object.values(state.vehicles).sort((a, b) => a.createdAt - b.createdAt);
  vehicleSelect.innerHTML = '';
  for (const v of list) {
    const opt = document.createElement('option');
    opt.value = v.id;
    opt.textContent = vehicleLabel(v);
    opt.selected = v.id === state.activeId;
    vehicleSelect.append(opt);
  }
  const info = active().info;
  const bits = [
    [info.year, info.make, info.model].filter(Boolean).join(' '),
    info.mileage && `${info.mileage} mi/km`,
    info.price && `Asking ${info.price}`,
    info.vin && `VIN ${info.vin}`,
    info.location,
  ].filter(Boolean);
  $('#vehicleSummary').textContent = bits.length ? bits.join('  ·  ') : 'Add the year, make, model and VIN with "Edit details".';
}

function renderItems() {
  const items = active().items;
  for (const li of itemEls) {
    const id = li.dataset.item!;
    const st = items[id] || {};
    li.dataset.status = st.s || '';
    for (const b of $$<HTMLButtonElement>('[data-set]', li)) {
      b.setAttribute('aria-pressed', String(b.dataset.set === st.s));
    }
    const ta = $<HTMLTextAreaElement>('[data-note]', li);
    if (document.activeElement !== ta) ta.value = st.n || '';
    const note = (st.n || '').trim();
    li.classList.toggle('has-note', Boolean(note));
    $('[data-note-print]', li).textContent = note;
  }
}

function renderStats() {
  const items = active().items;
  let ok = 0, ng = 0, na = 0, crit = 0;
  const perSection: Record<string, { done: number; total: number }> = {};
  for (const li of itemEls) {
    const sec = li.dataset.sectionId!;
    perSection[sec] ??= { done: 0, total: 0 };
    perSection[sec].total++;
    const s = items[li.dataset.item!]?.s;
    if (!s) continue;
    perSection[sec].done++;
    if (s === 'ok') ok++;
    else if (s === 'na') na++;
    else {
      ng++;
      if (li.dataset.critical === 'true') crit++;
    }
  }
  const total = itemEls.length;
  const done = ok + ng + na;
  const pct = total ? Math.round((done / total) * 100) : 0;

  $('#countOk').textContent = String(ok);
  $('#countNg').textContent = String(ng);
  $('#countNa').textContent = String(na);
  $('#countCrit').textContent = String(crit);
  $('#doneCount').textContent = String(done);
  $('#pctReadout').textContent = String(pct);

  const fill = $<SVGPathElement>('#tachFill');
  fill.style.strokeDasharray = `${pct} 200`;
  $('.tach').classList.toggle('started', pct > 0);
  $<SVGGElement>('#tachNeedle').style.transform = `rotate(${-135 + 270 * (pct / 100)}deg)`;
  $('.tach').classList.toggle('redline', pct >= 80);

  const verdict = $('#verdict');
  let v: [string, string, string];
  if (crit > 0) v = ['danger', '撤退', `Walk away — ${crit} deal-breaker${crit > 1 ? 's' : ''}`];
  else if (ng > 0 && done === total) v = ['warn', '交渉', `Negotiate — ${ng} issue${ng > 1 ? 's' : ''} found`];
  else if (ng > 0) v = ['warn', '注意', `${ng} issue${ng > 1 ? 's' : ''} so far`];
  else if (done === total) v = ['go', '合格', 'Passed — looks clean'];
  else if (done === 0) v = ['idle', '待機', 'Ready — start inspecting'];
  else v = ['idle', '点検中', 'In progress — so far so good'];
  verdict.dataset.state = v[0];
  // Verdict is a live region: only touch the text when it actually changes, so
  // screen readers announce "Walk away" once instead of on every tap.
  if ($('#verdictEn').textContent !== v[2]) {
    $('#verdictJp').textContent = v[1];
    $('#verdictEn').textContent = v[2];
  }

  for (const [sec, c] of Object.entries(perSection)) {
    const chip = $(`[data-chip-count="${sec}"]`);
    if (chip) chip.textContent = `${c.done}/${c.total}`;
    const bar = $(`[data-section-bar="${sec}"]`);
    if (bar) bar.style.transform = `scaleX(${c.done / c.total})`;
    const secEl = $(`.section[data-section="${sec}"]`);
    secEl?.classList.toggle('complete', c.done === c.total);
  }
}

function renderFilters() {
  const ui = state.ui;
  if (ui.section !== 'all' && !sectionEls.some((s) => s.dataset.section === ui.section)) ui.section = 'all';
  for (const b of $$<HTMLButtonElement>('[data-section-filter]')) {
    b.setAttribute('aria-pressed', String(b.dataset.sectionFilter === ui.section));
  }
  for (const b of $$<HTMLButtonElement>('[data-status-filter]')) {
    b.setAttribute('aria-pressed', String(b.dataset.statusFilter === ui.status));
  }
  criticalOnly.checked = ui.critical;
  if (document.activeElement !== searchInput) searchInput.value = ui.q;

  const q = ui.q.trim().toLowerCase();
  const items = active().items;
  let visibleTotal = 0;

  for (const secEl of sectionEls) {
    const sec = secEl.dataset.section!;
    const sectionMatch = ui.section === 'all' || ui.section === sec;
    let visible = 0;
    for (const li of $$<HTMLLIElement>('.item', secEl)) {
      const s = items[li.dataset.item!]?.s;
      const statusMatch =
        ui.status === 'all' || (ui.status === 'todo' ? !s : s === ui.status);
      const critMatch = !ui.critical || li.dataset.critical === 'true';
      const textMatch = !q || li.dataset.text!.includes(q);
      const show = sectionMatch && statusMatch && critMatch && textMatch;
      li.hidden = !show;
      if (show) visible++;
    }
    secEl.hidden = !sectionMatch || visible === 0;
    visibleTotal += visible;

    const collapsed = Boolean(ui.collapsed[sec]) && !q; // searching always expands
    secEl.classList.toggle('collapsed', collapsed);
    $(`[data-collapse="${sec}"]`, secEl).setAttribute('aria-expanded', String(!collapsed));
  }
  $('#emptyState').hidden = visibleTotal > 0;

  // Compact bar: the Filter button carries a count of folded-away filters in effect.
  const activeFilters = Number(ui.status !== 'all') + Number(ui.critical) + Number(Boolean(q));
  const count = $('#filterCount');
  count.hidden = activeFilters === 0;
  count.textContent = String(activeFilters);
  $('#filterToggle').setAttribute('aria-label', activeFilters ? `Filters, ${activeFilters} active` : 'Filters');
}

function renderAll() {
  renderVehicles();
  renderItems();
  renderStats();
  renderFilters();
  renderBackup();
}

// ---------- events ----------
function setStatus(itemId: string, s: Status) {
  const items = active().items;
  const cur = items[itemId] || {};
  const next: ItemState = { ...cur, s: cur.s === s ? undefined : s }; // tap again to clear
  if (!next.s && !next.n) delete items[itemId];
  else items[itemId] = next;
  touch();
  renderItems();
  renderStats();
  buzz(next.s, itemId);
  requestPersist();
  // Keep the item visible briefly if it now falls outside the status filter, then re-filter.
  if (state.ui.status !== 'all') window.setTimeout(refilterKeepingFocus, 450);
}

// Haptic confirmation on touch devices (Android; iOS ignores it). Eyes stay on the
// car, not the screen: one tick for a mark, a double knock for a deal-breaker NG.
const coarse = window.matchMedia('(pointer: coarse)');
function buzz(s: Status | undefined, itemId: string) {
  if (!s || !coarse.matches || typeof navigator.vibrate !== 'function') return;
  const critical = $(`[data-item="${itemId}"]`)?.dataset.critical === 'true';
  navigator.vibrate(s === 'ng' && critical ? [18, 60, 18] : 8);
}

/** Re-filter; if the focused item just got hidden, hand focus to the next visible item. */
function refilterKeepingFocus() {
  const focused = document.activeElement as HTMLElement | null;
  const li = focused?.closest<HTMLLIElement>('.item');
  const control = focused?.dataset.set;
  renderFilters();
  const isVisible = (el: HTMLLIElement) => !el.hidden && !el.closest<HTMLElement>('.section')!.hidden;
  if (!li || !control || isVisible(li)) return;
  const idx = itemEls.indexOf(li);
  const next = itemEls.slice(idx + 1).find(isVisible) ?? itemEls.slice(0, idx).reverse().find(isVisible);
  if (next) $<HTMLButtonElement>(`[data-set="${control}"]`, next).focus();
  else $<HTMLElement>('#emptyState').focus();
}

document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;

  const setBtn = t.closest<HTMLButtonElement>('[data-set]');
  if (setBtn) {
    const li = setBtn.closest<HTMLLIElement>('.item')!;
    setStatus(li.dataset.item!, setBtn.dataset.set as Status);
    return;
  }

  const noteBtn = t.closest<HTMLButtonElement>('[data-note-toggle]');
  if (noteBtn) {
    const li = noteBtn.closest<HTMLLIElement>('.item')!;
    const box = $<HTMLDivElement>('.item-note', li);
    box.hidden = !box.hidden;
    noteBtn.setAttribute('aria-expanded', String(!box.hidden));
    if (!box.hidden) $<HTMLTextAreaElement>('textarea', box).focus();
    return;
  }

  const secBtn = t.closest<HTMLButtonElement>('[data-section-filter]');
  if (secBtn) {
    state.ui.section = secBtn.dataset.sectionFilter!;
    save();
    renderFilters();
    if (state.ui.section !== 'all') {
      $(`#sec-${state.ui.section}`)?.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    }
    return;
  }

  const statusBtn = t.closest<HTMLButtonElement>('[data-status-filter]');
  if (statusBtn) {
    state.ui.status = statusBtn.dataset.statusFilter as StatusFilter;
    save();
    renderFilters();
    return;
  }

  const collapseBtn = t.closest<HTMLButtonElement>('[data-collapse]');
  if (collapseBtn) {
    const sec = collapseBtn.dataset.collapse!;
    state.ui.collapsed[sec] = !state.ui.collapsed[sec];
    save();
    renderFilters();
  }
});

// Notes — debounced save. The target car is captured at keystroke time so switching
// cars mid-debounce can never write the note into the wrong checklist.
let noteTimer: number | undefined;
let pendingNote: (() => void) | null = null;

function flushNote() {
  window.clearTimeout(noteTimer);
  const run = pendingNote;
  pendingNote = null;
  run?.();
}

document.addEventListener('input', (e) => {
  const ta = (e.target as HTMLElement).closest<HTMLTextAreaElement>('[data-note]');
  if (!ta) return;
  const li = ta.closest<HTMLLIElement>('.item')!;
  const id = li.dataset.item!;
  const vehicleId = state.activeId;
  const n = ta.value.slice(0, NOTE_MAX);
  window.clearTimeout(noteTimer);
  pendingNote = () => {
    const v = state.vehicles[vehicleId];
    if (!v) return; // car was deleted (here or in another tab)
    const cur = v.items[id] || {};
    if (!cur.s && !n.trim()) delete v.items[id];
    else v.items[id] = { ...cur, n };
    if (vehicleId === state.activeId) {
      li.classList.toggle('has-note', Boolean(n.trim()));
      $('[data-note-print]', li).textContent = n.trim();
    }
    touch(v);
  };
  noteTimer = window.setTimeout(flushNote, 300);
});
document.addEventListener('focusout', (e) => {
  if ((e.target as HTMLElement).matches?.('[data-note]')) flushNote();
});

$('#clearFilters').addEventListener('click', () => {
  state.ui = { ...defaultUi(), collapsed: state.ui.collapsed };
  searchInput.value = '';
  save();
  renderFilters();
  $<HTMLElement>('#checklist').focus({ preventScroll: true });
});

criticalOnly.addEventListener('change', () => {
  state.ui.critical = criticalOnly.checked;
  save();
  renderFilters();
});

let searchTimer: number | undefined;
searchInput.addEventListener('input', () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    state.ui.q = searchInput.value;
    save();
    renderFilters();
  }, 120);
});

// Compact filter bar (phones): fold status / deal-breaker / search behind one button.
const filtersEl = $('.filters');
const filterToggle = $<HTMLButtonElement>('#filterToggle');
function setFilterPanel(open: boolean) {
  filtersEl.classList.toggle('open', open);
  filterToggle.setAttribute('aria-expanded', String(open));
}
filterToggle.addEventListener('click', () => setFilterPanel(!filtersEl.classList.contains('open')));
filtersEl.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && filtersEl.classList.contains('open') && getComputedStyle(filterToggle).display !== 'none') {
    setFilterPanel(false);
    filterToggle.focus();
  }
});

// Keep scroll-padding in step with the real sticky-bar height (it wraps / folds).
new ResizeObserver(([entry]) => {
  document.documentElement.style.setProperty('--sticky-h', `${Math.ceil(entry.borderBoxSize?.[0]?.blockSize ?? filtersEl.offsetHeight)}px`);
}).observe(filtersEl);

// 夜 / 昼 display mode — a per-device preference, deliberately not part of the exported data.
const MODE_KEY = 'touge-inspect:mode';
const themeMeta = $<HTMLMetaElement>('meta[name="theme-color"]');
function applyMode(mode: 'night' | 'day', persist: boolean) {
  const root = document.documentElement;
  if (mode === 'day') root.dataset.mode = 'day';
  else delete root.dataset.mode;
  themeMeta.content = mode === 'day' ? '#f6f5f0' : '#0b0b10';
  for (const b of $$<HTMLButtonElement>('.mode-switch [data-mode]')) {
    b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
  }
  if (persist) {
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      /* preference just won't stick; the mode still applies */
    }
  }
}
applyMode(document.documentElement.dataset.mode === 'day' ? 'day' : 'night', false);
for (const b of $$<HTMLButtonElement>('.mode-switch [data-mode]')) {
  b.addEventListener('click', () => applyMode(b.dataset.mode === 'day' ? 'day' : 'night', true));
}

// Vehicles
vehicleSelect.addEventListener('change', () => {
  flushNote();
  if (!state.vehicles[vehicleSelect.value]) return renderVehicles();
  state.activeId = vehicleSelect.value;
  save();
  closeAllNotes();
  renderAll();
});

function closeAllNotes() {
  for (const box of $$<HTMLDivElement>('.item-note')) box.hidden = true;
  for (const b of $$('[data-note-toggle]')) b.setAttribute('aria-expanded', 'false');
}

let dialogIsNew = false;
function openDialog(isNew: boolean) {
  dialogIsNew = isNew;
  const info = isNew ? emptyInfo() : active().info;
  for (const [k, v] of Object.entries(info)) {
    const field = form.elements.namedItem(k) as HTMLInputElement | HTMLTextAreaElement | null;
    if (field) field.value = v;
  }
  dialog.showModal();
  (form.elements.namedItem(isNew ? 'name' : 'year') as HTMLInputElement).focus();
}

$('#editVehicle').addEventListener('click', () => openDialog(false));
$('#newVehicle').addEventListener('click', () => openDialog(true));
$('#vehicleCancel').addEventListener('click', () => dialog.close());

form.addEventListener('submit', () => {
  flushNote();
  const data = new FormData(form);
  const info = emptyInfo();
  for (const k of Object.keys(info) as (keyof VehicleInfo)[]) info[k] = str(data.get(k), INFO_MAX[k]).trim();
  if (dialogIsNew) {
    const v = newVehicle();
    v.info = info;
    if (!v.info.name && !v.info.make) v.info.name = `Car #${Object.keys(state.vehicles).length + 1}`;
    state.vehicles[v.id] = v;
    state.activeId = v.id;
    closeAllNotes();
    toast('New car added — fresh checklist.');
  } else {
    active().info = info;
    toast('Vehicle details saved.');
  }
  touch();
  renderAll();
});

// Export / import
function exportBackup() {
  flushNote();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  a.href = URL.createObjectURL(blob);
  a.download = `touge-inspect-${date}.json`;
  document.body.append(a); // Firefox needs the link in the document
  a.click();
  a.remove();
  // Revoking synchronously can cancel the download in some browsers.
  window.setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  writePref(BACKUP_KEY, String(Date.now()));
  renderBackup();
}
$('#exportBtn').addEventListener('click', exportBackup);
$('#backupExport').addEventListener('click', exportBackup);

// ---------- durability: backup status, persistent storage, iOS install hint ----------
// localStorage is the only copy. Browsers may evict it (Safari: after 7 days without a
// visit, unless installed to the Home Screen), so make the backup state visible and
// one tap away, and ask for persistent storage once there's something worth keeping.

const BACKUP_KEY = 'touge-inspect:backup';
const IOS_HINT_KEY = 'touge-inspect:ios-hint';
const STALE_MS = 3 * 24 * 60 * 60 * 1000; // well inside Safari's 7-day window
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function readPref(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writePref(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* storage blocked: footer already warns */ }
}

function ago(ts: number) {
  const s = (ts - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [unit, sec] of units) if (Math.abs(s) >= sec) return rtf.format(Math.round(s / sec), unit);
  return 'just now';
}

const vehiclesWithData = () =>
  Object.values(state.vehicles).filter((v) => Object.keys(v.items).length || Object.values(v.info).some((x) => x.trim()));

function renderBackup() {
  const box = document.getElementById('backup');
  if (!box) return;
  const withData = vehiclesWithData();
  box.hidden = withData.length === 0;
  renderInstallHint(withData.length > 0);
  if (!withData.length) return;

  const now = Date.now();
  const last = Number(readPref(BACKUP_KEY)) || 0;
  const latestChange = Math.max(...withData.map((v) => v.updatedAt));
  const oldestUnsaved = last ? last : Math.min(...withData.map((v) => v.createdAt));
  let st: 'none' | 'ok' | 'stale';
  let text: string;
  if (last && latestChange <= last) {
    st = 'ok';
    text = `Backed up ${ago(last)}.`;
  } else {
    st = now - oldestUnsaved > STALE_MS ? 'stale' : 'none';
    text = last ? `Changes since your last backup (${ago(last)}).` : 'Not backed up yet — this device holds the only copy.';
  }
  box.dataset.state = st;
  $('#backupText').textContent = text;
}

const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () =>
  (navigator as Navigator & { standalone?: boolean }).standalone === true || window.matchMedia('(display-mode: standalone)').matches;

function renderInstallHint(hasData: boolean) {
  const hint = document.getElementById('installHint');
  if (hint) hint.hidden = !(isIOS && !isStandalone() && hasData && readPref(IOS_HINT_KEY) !== 'dismissed');
}
$('#installDismiss').addEventListener('click', () => {
  writePref(IOS_HINT_KEY, 'dismissed');
  renderInstallHint(false);
  $('#backupExport').focus();
});

let persistAsked = false;
/** Ask once per session, from a user gesture (Firefox shows a prompt). */
function requestPersist() {
  if (persistAsked || !navigator.storage?.persist) return;
  persistAsked = true;
  navigator.storage.persisted().then((already) => (already ? true : navigator.storage.persist())).catch(() => {});
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') renderBackup(); // refresh "3 days ago"
});
window.addEventListener('offline', () => toast('Offline — everything still saves on this device.'));

const importInput = $<HTMLInputElement>('#importInput');
$('#importBtn').addEventListener('click', () => importInput.click());

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

importInput.addEventListener('change', async () => {
  const file = importInput.files?.[0];
  importInput.value = '';
  if (!file) return;
  if (file.size > IMPORT_MAX_BYTES) {
    toast('That file is too large to be a Touge Inspect export.', 'error');
    return;
  }
  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    toast(`Couldn't read "${file.name}": it isn't valid JSON.`, 'error');
    return;
  }
  const parsed = normalizeState(raw);
  if (!parsed) {
    toast(`No cars found in "${file.name}". Use a file from Export JSON.`, 'error');
    return;
  }
  flushNote();
  // Merge: imported cars are added alongside existing ones (same id = replaced).
  const ids = Object.keys(parsed.vehicles);
  const replaced = ids.filter((id) => state.vehicles[id]).length;
  Object.assign(state.vehicles, parsed.vehicles);
  state.activeId = parsed.activeId;
  closeAllNotes();
  save();
  renderAll();
  toast(`Imported ${plural(ids.length, 'car', 'cars')}${replaced ? ` (${replaced} updated)` : ''}.`);
});

// Print (button or Ctrl+P): commit any half-typed note so it makes the paper copy.
window.addEventListener('beforeprint', flushNote);
$('#printBtn').addEventListener('click', () => window.print());

$('#resetBtn').addEventListener('click', () => {
  flushNote();
  if (!confirm(`Clear all results and notes for "${vehicleLabel(active())}"?`)) return;
  active().items = {};
  closeAllNotes();
  touch();
  renderAll();
  toast('Checklist reset.');
});

$('#deleteBtn').addEventListener('click', () => {
  flushNote();
  const v = active();
  if (!confirm(`Delete "${vehicleLabel(v)}" and its whole checklist? This can't be undone unless you exported it.`)) return;
  closeAllNotes();
  delete state.vehicles[v.id];
  if (Object.keys(state.vehicles).length === 0) {
    const fresh = newVehicle('Car #1');
    state.vehicles[fresh.id] = fresh;
  }
  state.activeId = Object.values(state.vehicles).sort((a, b) => a.createdAt - b.createdAt)[0].id;
  save();
  renderAll();
  toast('Car deleted.');
});

// Keep multiple tabs in sync.
window.addEventListener('storage', (e) => {
  if (e.key !== STORAGE_KEY) return;
  // A pending note (if any) resolves its car by id when it fires, so it lands in the fresh state.
  state = load();
  renderAll();
});

save();
renderAll();
document.documentElement.classList.add('ready');

// Offline support (production builds only — the dev server's modules aren't cacheable).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {
      /* not fatal: the app still works online */
    });
  });
}
