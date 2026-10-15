import test from "node:test";
import assert from "node:assert/strict";
import { wgsToGcj, gcjToWgs, outsideChina } from "../js/convert.js";

test("Beijing is shifted by the expected offset", () => {
  const g = wgsToGcj(116.4074, 39.9042);
  assert.equal(g.shifted, true);
  assert.ok(Math.abs(g.lon - 116.41364) < 1e-4);
  assert.ok(Math.abs(g.lat - 39.90560) < 1e-4);
});

test("points outside China are left untouched", () => {
  const g = wgsToGcj(2.3522, 48.8566);
  assert.deepEqual(g, { lon: 2.3522, lat: 48.8566, shifted: false });
  assert.equal(outsideChina(2.3522, 48.8566), true);
});

test("GCJ-02 to WGS-84 round trip is accurate to well under a meter", () => {
  for (const [lon, lat] of [[116.4074, 39.9042], [121.4737, 31.2304], [104.0668, 30.5728], [87.6168, 43.8256]]) {
    const g = wgsToGcj(lon, lat);
    const w = gcjToWgs(g.lon, g.lat);
    assert.ok(Math.abs(w.lon - lon) < 1e-7, "lon " + lon);
    assert.ok(Math.abs(w.lat - lat) < 1e-7, "lat " + lat);
  }
});
