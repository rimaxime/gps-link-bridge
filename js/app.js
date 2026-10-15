import { wgsToGcj, gcjToWgs, outsideChina } from "./convert.js";
import { parseCoords, valid } from "./parse.js";
import { buildLinks, f6 } from "./links.js";

const EXAMPLE = "39.9042, 116.4074";
const STORAGE_KEY = "gps-link-bridge";

const $ = (s) => document.querySelector(s);
const coordsEl = $("#coords");
const nameEl = $("#name");
const statusEl = $("#status");
const exampleTag = $("#exTag");
const appEl = $("#app");
const state = { isExample: true, swapped: false };

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function checked(name) {
  const input = document.querySelector('input[name="' + name + '"]:checked');
  return input ? input.value : undefined;
}

async function copyText(text, button) {
  const label = button.textContent;
  let done = false;
  try {
    await navigator.clipboard.writeText(text);
    done = true;
  } catch { /* fall through to the legacy path */ }
  if (!done) {
    try {
      const ta = el("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.append(ta);
      ta.select();
      done = document.execCommand("copy");
      ta.remove();
    } catch { /* nothing else to try */ }
  }
  button.textContent = done ? "Copied" : "Select the text above";
  setTimeout(() => { button.textContent = label; }, 1600);
}

function setStatus(result, failed) {
  statusEl.replaceChildren();
  statusEl.classList.toggle("err", Boolean(failed));
  if (failed) {
    statusEl.textContent = coordsEl.value.trim()
      ? "No coordinates recognized. Try “39.9042, 116.4074”, a map link or degrees-minutes-seconds."
      : "Paste coordinates to generate links.";
    return;
  }
  statusEl.append(el("span", "ok-dot"), el("span", "coords", f6(result.lat) + ", " + f6(result.lon)));
  statusEl.append(el("span", "meta", result.format + (result.notes.length ? " · " + result.notes.join(" · ") : "")));
  const swap = el("button", "btn small", "Swap lat / lon");
  swap.type = "button";
  swap.addEventListener("click", () => { state.swapped = !state.swapped; render(); });
  statusEl.append(swap);
}

function showResult(item) {
  const has = Boolean(item);
  const urlEl = $("#resultUrl");
  const tag = $("#resultTag");
  const open = $("#openBtn");
  const copy = $("#copyBtn");

  urlEl.hidden = !has;
  $("#acts").hidden = !has;
  $("#resultTitle").hidden = !has;
  $("#emptyMsg").hidden = has;
  if (!has) { tag.hidden = true; return; }

  $("#resultTitle").textContent = item.title;
  tag.textContent = item.tag;
  tag.hidden = false;
  urlEl.textContent = item.url;
  $("#acts").classList.toggle("single", !item.nav);
  open.hidden = !item.nav;
  if (item.nav) open.href = item.url;
  copy.className = item.nav ? "btn" : "btn primary";
  copy.onclick = () => copyText(item.url, copy);
}

function render() {
  exampleTag.hidden = !state.isExample;

  let result = parseCoords(coordsEl.value);
  if (result && state.swapped) {
    const swapped = { lat: result.lon, lon: result.lat };
    result = valid(swapped.lat, swapped.lon)
      ? { ...result, ...swapped, notes: result.notes.concat("swapped by hand") }
      : null;
  }
  if (!result) {
    setStatus(null, true);
    showResult(null);
    return;
  }
  setStatus(result, false);

  let wgs, gcj, shifted;
  const datum = result.datumHint || checked("datum") || "wgs";
  if (datum === "wgs") {
    wgs = { lat: result.lat, lon: result.lon };
    const g = wgsToGcj(result.lon, result.lat);
    gcj = { lat: g.lat, lon: g.lon };
    shifted = g.shifted;
  } else {
    gcj = { lat: result.lat, lon: result.lon };
    const w = gcjToWgs(result.lon, result.lat);
    wgs = { lat: w.lat, lon: w.lon };
    shifted = !outsideChina(result.lon, result.lat);
  }
  const links = buildLinks(wgs, gcj, shifted, nameEl.value, checked("mode") || "car");
  showResult(links[appEl.value] || links.amapNav);
}

/* Per-visitor preferences, stored in this browser only (optional) */
function loadPrefs() {
  try {
    const prefs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    for (const key of ["mode", "datum"]) {
      const input = prefs[key] && document.querySelector('input[name="' + key + '"][value="' + prefs[key] + '"]');
      if (input) input.checked = true;
    }
    if (prefs.app && appEl.querySelector('option[value="' + prefs.app + '"]')) appEl.value = prefs.app;
  } catch { /* storage unavailable */ }
}

function savePrefs() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      mode: checked("mode"),
      datum: checked("datum"),
      app: appEl.value,
    }));
  } catch { /* storage unavailable */ }
}

coordsEl.addEventListener("input", () => { state.isExample = false; state.swapped = false; render(); });
coordsEl.addEventListener("focus", () => { if (state.isExample) coordsEl.select(); });
nameEl.addEventListener("input", render);
appEl.addEventListener("change", () => { savePrefs(); render(); });
for (const radio of document.querySelectorAll('input[name="mode"], input[name="datum"]')) {
  radio.addEventListener("change", () => { savePrefs(); render(); });
}

loadPrefs();
coordsEl.value = EXAMPLE;
render();
