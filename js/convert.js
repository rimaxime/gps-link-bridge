// WGS-84 <-> GCJ-02 conversion.
// This is the widely used public approximation, not AMap's internal algorithm.
// It only shifts points inside a rough bounding box around mainland China.

const PI = Math.PI;
const AXIS = 6378245.0;
const ECC = 0.00669342162296594323;

export function outsideChina(lon, lat) {
  return lon < 72.004 || lon > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

function transformLat(x, y) {
  let v = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  v += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3;
  v += (20 * Math.sin(y * PI) + 40 * Math.sin(y / 3 * PI)) * 2 / 3;
  v += (160 * Math.sin(y / 12 * PI) + 320 * Math.sin(y * PI / 30)) * 2 / 3;
  return v;
}

function transformLon(x, y) {
  let v = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  v += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3;
  v += (20 * Math.sin(x * PI) + 40 * Math.sin(x / 3 * PI)) * 2 / 3;
  v += (150 * Math.sin(x / 12 * PI) + 300 * Math.sin(x / 30 * PI)) * 2 / 3;
  return v;
}

/** @returns {{lon:number, lat:number, shifted:boolean}} */
export function wgsToGcj(lon, lat) {
  if (outsideChina(lon, lat)) return { lon, lat, shifted: false };
  const radLat = lat / 180 * PI;
  let magic = Math.sin(radLat);
  magic = 1 - ECC * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  const dLat = transformLat(lon - 105, lat - 35) * 180 / ((AXIS * (1 - ECC)) / (magic * sqrtMagic) * PI);
  const dLon = transformLon(lon - 105, lat - 35) * 180 / (AXIS / sqrtMagic * Math.cos(radLat) * PI);
  return { lon: lon + dLon, lat: lat + dLat, shifted: true };
}

/** Inverse by fixed-point iteration (sub-millimeter after a few rounds). */
export function gcjToWgs(lon, lat) {
  if (outsideChina(lon, lat)) return { lon, lat };
  let w = { lon, lat };
  for (let i = 0; i < 6; i++) {
    const g = wgsToGcj(w.lon, w.lat);
    w = { lon: w.lon - (g.lon - lon), lat: w.lat - (g.lat - lat) };
  }
  return w;
}
