import test from "node:test";
import assert from "node:assert/strict";
import { parseCoords } from "../js/parse.js";

const near = (a, b) => Math.abs(a - b) < 1e-4;

const accepted = [
  ["decimal with comma", "39.9042, 116.4074", 39.9042, 116.4074],
  ["decimal with space", "39.9042 116.4074", 39.9042, 116.4074],
  ["decimal without space", "39.9042,116.4074", 39.9042, 116.4074],
  ["negative values", "-33.8688 151.2093", -33.8688, 151.2093],
  ["negative longitude", "39.9042,-116.4074", 39.9042, -116.4074],
  ["decimal comma", "39,9042 116,4074", 39.9042, 116.4074],
  ["lon, lat order", "116.4074, 39.9042", 39.9042, 116.4074],
  ["DMS with suffix hemispheres", "39°54'15.1\"N 116°24'26.7\"E", 39.9042, 116.4074],
  ["hemisphere prefix", "N 39.9042 E 116.4074", 39.9042, 116.4074],
  ["hemisphere suffix, lon first", "116.4074 E, 39.9042 N", 39.9042, 116.4074],
  ["degrees and decimal minutes", "S 33°52.1' E 151°12.5'", -33.86833, 151.20833],
  ["labeled values", "Lat: 39.9042 Lon: 116.4074", 39.9042, 116.4074],
  ["geo: URI", "geo:39.9042,116.4074", 39.9042, 116.4074],
  ["Google Maps @ link", "https://www.google.com/maps/@39.9042,116.4074,15z", 39.9042, 116.4074],
  ["Google Maps !3d!4d link", "https://www.google.com/maps/place/X/data=!3d39.9042!4d116.4074", 39.9042, 116.4074],
  ["OSM map fragment", "https://www.openstreetmap.org/#map=16/39.9042/116.4074", 39.9042, 116.4074],
  ["OSM marker link", "https://www.openstreetmap.org/?mlat=39.9042&mlon=116.4074", 39.9042, 116.4074],
  ["query parameter", "https://example.com/?q=39.9042%2C116.4074", 39.9042, 116.4074],
];

for (const [label, input, lat, lon] of accepted) {
  test("parses " + label, () => {
    const r = parseCoords(input);
    assert.ok(r, "expected a result for " + input);
    assert.ok(near(r.lat, lat), "lat " + r.lat + " vs " + lat);
    assert.ok(near(r.lon, lon), "lon " + r.lon + " vs " + lon);
  });
}

test("Google Maps links are flagged as GCJ-02", () => {
  for (const url of [
    "https://www.google.com/maps/@39.9042,116.4074,15z",
    "https://www.google.com/maps/place/X/data=!3d39.9042!4d116.4074",
    "https://www.google.com/maps?q=39.9042,116.4074",
  ]) {
    const r = parseCoords(url);
    assert.equal(r.datumHint, "gcj", url);
  }
});

test("other inputs carry no datum hint", () => {
  for (const input of ["39.9042, 116.4074", "geo:39.9042,116.4074", "https://www.openstreetmap.org/#map=16/39.9042/116.4074"]) {
    assert.equal(parseCoords(input).datumHint, undefined, input);
  }
});

test("reports the lon, lat swap", () => {
  const r = parseCoords("116.4074, 39.9042");
  assert.ok(r.notes.some((n) => n.includes("lon, lat")));
});

for (const input of ["", "   ", "hello", "no numbers here", "N 39.9 N 40.1", "95.5, 200.5"]) {
  test("rejects " + JSON.stringify(input), () => {
    assert.equal(parseCoords(input), null);
  });
}
