// Builds navigation links and text formats for one point.

export const f6 = (n) => n.toFixed(6);

export function dms(v, pos, neg) {
  const h = v >= 0 ? pos : neg;
  v = Math.abs(v);
  let d = Math.floor(v);
  let m = Math.floor((v - d) * 60);
  let s = Math.round(((v - d) * 60 - m) * 60 * 10) / 10;
  if (s >= 60) { s = 0; m += 1; }
  if (m >= 60) { m = 0; d += 1; }
  return d + "°" + String(m).padStart(2, "0") + "'" + s.toFixed(1).padStart(4, "0") + '"' + h;
}

export const MODES = {
  car:  { amap: "car",  baidu: "driving", google: "driving",   apple: "d" },
  walk: { amap: "walk", baidu: "walking", google: "walking",   apple: "w" },
  bus:  { amap: "bus",  baidu: "transit", google: "transit",   apple: "r" },
  bike: { amap: "ride", baidu: "riding",  google: "bicycling", apple: "c" },
};

const SRC = "gps-link-bridge";

/**
 * @param {{lat:number, lon:number}} wgs  the point in WGS-84
 * @param {{lat:number, lon:number}} gcj  the same point in GCJ-02
 * @param {boolean} shifted               true when the GCJ-02 offset applies here
 * @param {string} rawName                optional place name
 * @param {keyof typeof MODES} modeKey
 * @returns {Record<string, {title:string, tag:string, url:string, nav?:boolean}>}
 */
export function buildLinks(wgs, gcj, shifted, rawName, modeKey) {
  const mode = MODES[modeKey] || MODES.car;
  const named = String(rawName || "").replace(/[,|]/g, " ").replace(/\s+/g, " ").trim();
  const n = encodeURIComponent(named || "Destination");
  const gTag = shifted ? "GCJ-02" : "GCJ-02 = WGS-84";
  const gl = f6(gcj.lat), go = f6(gcj.lon), wl = f6(wgs.lat), wo = f6(wgs.lon);
  const nav = true;

  return {
    amapNav: { nav, tag: gTag, title: "Opens AMap with a route to this point",
      url: "https://uri.amap.com/navigation?to=" + go + "," + gl + "," + n + "&mode=" + mode.amap + "&src=" + SRC + "&coordinate=gaode&callnative=1" },
    amapPin: { nav, tag: gTag, title: "Shows this point in AMap",
      url: "https://uri.amap.com/marker?position=" + go + "," + gl + "&name=" + n + "&src=" + SRC + "&coordinate=gaode&callnative=1" },
    google: { nav, tag: gTag, title: "Opens Google Maps with a route",
      url: "https://www.google.com/maps/dir/?api=1&destination=" + gl + "," + go + "&travelmode=" + mode.google },
    apple: { nav, tag: gTag, title: "Opens Apple Maps with a route",
      url: "https://maps.apple.com/?daddr=" + gl + "," + go + "&dirflg=" + mode.apple },
    baidu: { nav, tag: "WGS-84", title: "Opens the Baidu Maps app with a route (app link, not a web page)",
      url: "baidumap://map/direction?destination=latlng:" + wl + "," + wo + "|name:" + n + "&mode=" + mode.baidu + "&coord_type=wgs84&src=andr.gpslinkbridge.app" },
    osmand: { nav, tag: "WGS-84", title: "Shows this point in OsmAnd",
      url: "https://osmand.net/map?pin=" + wl + "," + wo + "#16/" + wl + "/" + wo },
    osm: { nav, tag: "WGS-84", title: "Shows this point on OpenStreetMap",
      url: "https://www.openstreetmap.org/?mlat=" + wl + "&mlon=" + wo + "#map=16/" + wl + "/" + wo },
    geo: { nav, tag: "WGS-84", title: "Android geo: link, opens the default map app",
      url: "geo:" + wl + "," + wo + (named ? "?q=" + wl + "," + wo + "(" + n + ")" : "") },

    fmtLatLon: { tag: "WGS-84", title: "Latitude, longitude", url: wl + ", " + wo },
    fmtLonLat: { tag: "WGS-84", title: "Longitude, latitude", url: wo + ", " + wl },
    fmtDms:    { tag: "WGS-84", title: "Degrees, minutes, seconds", url: dms(wgs.lat, "N", "S") + " " + dms(wgs.lon, "E", "W") },
    fmtGcj:    { tag: gTag,     title: "Latitude, longitude", url: gl + ", " + go },
  };
}
