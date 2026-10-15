import test from "node:test";
import assert from "node:assert/strict";
import { buildLinks, dms, f6 } from "../js/links.js";

const wgs = { lat: 39.9042, lon: 116.4074 };
const gcj = { lat: 39.905603, lon: 116.413642 };

test("AMap navigation link uses GCJ-02 as lon,lat plus the name", () => {
  const { amapNav } = buildLinks(wgs, gcj, true, "Lakeside camp", "car");
  assert.equal(
    amapNav.url,
    "https://uri.amap.com/navigation?to=116.413642,39.905603,Lakeside%20camp&mode=car&src=gps-link-bridge&coordinate=gaode&callnative=1"
  );
});

test("commas and pipes in the name cannot break the link", () => {
  const { amapNav, baidu } = buildLinks(wgs, gcj, true, "Lake, camp | north", "car");
  assert.ok(amapNav.url.includes(",Lake%20camp%20north&"));
  assert.ok(baidu.url.includes("|name:Lake%20camp%20north&"));
});

test("an empty name falls back to a default", () => {
  const { amapNav } = buildLinks(wgs, gcj, true, "  ", "car");
  assert.ok(amapNav.url.includes(",Destination&"));
});

test("bike maps to AMap ride and Google bicycling", () => {
  const l = buildLinks(wgs, gcj, true, "", "bike");
  assert.ok(l.amapNav.url.includes("mode=ride"));
  assert.ok(l.google.url.includes("travelmode=bicycling"));
});

test("WGS-84 apps get WGS-84 and GCJ-02 apps get GCJ-02", () => {
  const l = buildLinks(wgs, gcj, true, "", "car");
  assert.ok(l.google.url.includes("destination=39.905603,116.413642"));
  assert.ok(l.apple.url.includes("daddr=39.905603,116.413642"));
  assert.ok(l.osmand.url.startsWith("https://osmand.net/map?pin=39.904200,116.407400"));
});

test("geo: link only carries a label when a name is given", () => {
  assert.equal(buildLinks(wgs, gcj, true, "", "car").geo.url, "geo:39.904200,116.407400");
  assert.ok(buildLinks(wgs, gcj, true, "Camp", "car").geo.url.endsWith("(Camp)"));
});

test("text formats", () => {
  const l = buildLinks(wgs, gcj, true, "", "car");
  assert.equal(l.fmtLatLon.url, "39.904200, 116.407400");
  assert.equal(l.fmtLonLat.url, "116.407400, 39.904200");
  assert.equal(l.fmtDms.url, "39°54'15.1\"N 116°24'26.6\"E");
  assert.equal(l.fmtGcj.url, "39.905603, 116.413642");
});

test("dms handles hemispheres and rounding", () => {
  assert.equal(dms(-33.8688, "N", "S"), "33°52'07.7\"S");
  assert.equal(dms(0.99999999, "N", "S"), "1°00'00.0\"N");
  assert.equal(f6(1.5), "1.500000");
});
