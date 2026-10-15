// Reads coordinates out of free text: decimals, DMS, hemispheres, labeled values, map links.

const NUM = "-?\\d+(?:\\.\\d+)?";

export function valid(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

function found(lat, lon, format, notes) {
  lat = Number(lat);
  lon = Number(lon);
  return valid(lat, lon) ? { lat, lon, format, notes: notes || [] } : null;
}

// Google Maps draws mainland China in GCJ-02, so the coordinates inside its links are GCJ-02 there.
const GOOGLE_LINK = /(?:google\.[a-z.]+\/maps|maps\.google\.|goo\.gl|maps\.app\.goo\.gl)/i;

/**
 * @param {string} raw
 * @returns {{lat:number, lon:number, format:string, notes:string[], datumHint?:"gcj"} | null}
 */
export function parseCoords(raw) {
  const result = parseInner(raw);
  if (result && GOOGLE_LINK.test(String(raw))) {
    result.datumHint = "gcj";
    result.notes.push("Google Maps link, read as GCJ-02");
  }
  return result;
}

function parseInner(raw) {
  let t = String(raw || "").trim();
  if (!t) return null;
  try { t = decodeURIComponent(t); } catch { /* keep the text as is */ }
  t = t
    .replace(/[′’‘]/g, "'")
    .replace(/[″”“]/g, '"')
    .replace(/[º˚]/g, "°")
    .replace(/ /g, " ");

  let m;
  // Links and schemes with a known lat/lon order
  if ((m = t.match(new RegExp("!3d(" + NUM + ")!4d(" + NUM + ")")))) return found(m[1], m[2], "Google Maps link");
  if ((m = t.match(new RegExp("[?&]mlat=(" + NUM + ")&mlon=(" + NUM + ")")))) return found(m[1], m[2], "OpenStreetMap link");
  if ((m = t.match(new RegExp("#(?:map=)?\\d{1,2}(?:\\.\\d+)?/(" + NUM + ")/(" + NUM + ")")))) return found(m[1], m[2], "Map link");
  if ((m = t.match(new RegExp("@(" + NUM + "),(" + NUM + ")")))) return found(m[1], m[2], "Map link");
  if ((m = t.match(new RegExp("\\bgeo:(" + NUM + "),(" + NUM + ")", "i")))) return found(m[1], m[2], "geo: link");
  if ((m = t.match(new RegExp("[?&](?:q|ll|sll|query|destination|daddr|pin|center)=\\+?(" + NUM + ")\\s*[, ]\\s*(" + NUM + ")")))) return found(m[1], m[2], "Map link");

  // Labeled lat / lon values
  const la = t.match(/\blat(?:itude)?\b\s*[:=]?\s*(-?\d+(?:[.,]\d+)?)/i);
  const lo = t.match(/\b(?:lon|lng|long|longitude)\b\s*[:=]?\s*(-?\d+(?:[.,]\d+)?)/i);
  if (la && lo) return found(la[1].replace(",", "."), lo[1].replace(",", "."), "Labeled values");

  // Decimal comma: "39,9042 116,4074"
  if (!/\./.test(t) && /^\s*-?\d+,\d+\s*[;\s]\s*-?\d+,\d+\s*$/.test(t)) {
    t = t.replace(/,/g, ".").replace(/;/g, " ");
  }

  // Numbers, degrees-minutes-seconds, hemispheres
  const re = /(?<![\d.])(-)?(\d{1,3}(?:\.\d+)?)(?!\d)\s*(?:°\s*(?:(\d{1,2}(?:\.\d+)?)\s*'\s*)?(?:(\d{1,2}(?:\.\d+)?)\s*(?:"|'')\s*)?)?/g;
  const prefixStyle = /^\s*[NSEW]\s*-?\d/i.test(t);
  let tokens = [];
  let mm;
  while ((mm = re.exec(t)) !== null) {
    const hasDeg = mm[0].includes("°");
    const value = Number(mm[2]) + (mm[3] ? Number(mm[3]) / 60 : 0) + (mm[4] ? Number(mm[4]) / 3600 : 0);
    let letter = "";
    if (prefixStyle) {
      const lm = /(?:^|[^A-Za-z])([NSEW])\s*$/i.exec(t.slice(0, mm.index));
      if (lm) letter = lm[1].toUpperCase();
    } else {
      const lm = /^\s*([NSEW])(?![A-Za-z])/i.exec(t.slice(mm.index + mm[0].length));
      if (lm) letter = lm[1].toUpperCase();
    }
    tokens.push({
      value: mm[1] ? -value : value,
      letter,
      precise: hasDeg || mm[2].includes("."),
      dms: hasDeg,
    });
  }
  const precise = tokens.filter((k) => k.precise);
  if (precise.length >= 2) tokens = precise;
  if (tokens.length < 2) return null;

  const notes = [];
  if (tokens.length > 2) notes.push(tokens.length + " numbers found, using the first two");
  const [a, b] = tokens;
  const isLat = (h) => h === "N" || h === "S";
  const isLon = (h) => h === "E" || h === "W";
  if ((isLat(a.letter) && isLat(b.letter)) || (isLon(a.letter) && isLon(b.letter))) return null;

  let lat, lon;
  let format = a.dms ? "Degrees, minutes, seconds" : "Decimal";
  if (isLat(a.letter) || isLon(b.letter)) { lat = a; lon = b; }
  else if (isLon(a.letter) || isLat(b.letter)) { lat = b; lon = a; notes.push("lon, lat order detected"); }
  else { lat = a; lon = b; }

  let latV = lat.letter ? Math.abs(lat.value) : lat.value;
  let lonV = lon.letter ? Math.abs(lon.value) : lon.value;
  if (lat.letter === "S") latV = -latV;
  if (lon.letter === "W") lonV = -lonV;
  if (a.letter || b.letter) format += " with hemispheres";

  // No hints: a first value beyond ±90 can only be a longitude
  if (!a.letter && !b.letter && Math.abs(latV) > 90 && Math.abs(lonV) <= 90) {
    [latV, lonV] = [lonV, latV];
    notes.push("lon, lat order detected");
  }
  return found(latV, lonV, format, notes);
}
