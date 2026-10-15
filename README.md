# GPS Link Bridge

Paste coordinates from iOverlander, OsmAnd or a map link, and get a navigation link for AMap (Gaode) or another map app.

Many apps cannot open AMap directly from a shared point. This page converts the coordinates (WGS-84 to GCJ-02 when needed) and builds a link that opens straight into navigation.

**Runs entirely in the browser.** No server, no account, no tracking, no external requests. Your coordinates never leave your device.

## What you can paste

| Input | Example |
| --- | --- |
| Decimal degrees | `39.9042, 116.4074` or `39.9042 116.4074` |
| Decimal comma | `39,9042 116,4074` |
| lon, lat order (auto-detected) | `116.4074, 39.9042` |
| Degrees, minutes, seconds | `39°54'15.1"N 116°24'26.7"E` |
| Hemisphere letters | `N 39.9042 E 116.4074` |
| Labeled values | `Lat: 39.9042 Lon: 116.4074` |
| `geo:` URI | `geo:39.9042,116.4074` |
| Map links | Google Maps (`@lat,lon`, `!3d…!4d…`), OpenStreetMap, OsmAnd |

If the order is ambiguous, use **Swap lat / lon**.

## What you get

- AMap: navigation link and "show point" link
- Google Maps, Apple Maps, Baidu Maps (app link), OsmAnd, OpenStreetMap, `geo:` (Android)
- The coordinates as text: lat,lon, lon,lat, degrees-minutes-seconds, GCJ-02

Travel modes: car, walk, transit, bike. Add an optional place name to label the destination.

## Coordinate systems

iOverlander and OsmAnd give WGS-84. AMap, Google Maps and Apple Maps expect GCJ-02 inside mainland China (they draw their maps with that offset), and WGS-84 elsewhere. The page converts for you, so each link is tagged with the system it uses. If you paste coordinates that are already GCJ-02, switch **Pasted coordinates are in** to GCJ-02. Google Maps links are the exception: inside mainland China their coordinates are already GCJ-02, so the page reads them that way automatically.

The conversion uses the widely shared public algorithm, not AMap's internal one, so expect a difference of a few meters at most. It only applies inside a rough bounding box around mainland China. Elsewhere the point is used as is.

Worth checking on your own devices: the Baidu link is an app link (`baidumap://`) that only works on a phone with the app installed, and Apple Maps behavior in China has not been verified on a device.

## Run locally

The page uses ES modules, so it must be served over HTTP (opening `index.html` directly from disk will not load the scripts).

```bash
npm start            # tiny Node server, no dependencies
# then open http://localhost:8000   (PORT=3000 npm start to change the port)
```

Any static server works too (`npx serve`, VS Code Live Server, and so on).

## Tests

Requires Node 18 or later. No dependencies.

```bash
npm test
```

The tests cover the coordinate conversion, the input parser and the link builder.

## Deploy on GitHub Pages

1. Push this folder to a GitHub repository.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, then branch `main` and folder `/ (root)`.
4. The site appears at `https://<your-user>.github.io/<repo>/`.

All paths in the project are relative, so it works under a repository sub-path.

## Project layout

```
index.html        page markup
css/style.css     styles, light and dark
js/convert.js     WGS-84 <-> GCJ-02
js/parse.js       reads coordinates from free text
js/links.js       builds links and text formats
js/app.js         page behavior
scripts/serve.js  local dev server (Node, no dependencies)
test/             node:test unit tests
```

## License

MIT
