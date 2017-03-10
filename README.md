# efa-export-stops-by-coordinates

Exports stops from EFA by bounding box coordinates.

# Usage

```
const exportStops = require("efa-export-stops-by-coordinates");

const urlTemplate = "http://efa.vrr.de/vrr/XSLT_COORD_REQUEST?&jsonp=&boundingBox=&boundingBoxLU={minx}%3A{miny}%3AWGS84%5BDD.DDDDD%5D&boundingBoxRL={maxx}%3A{maxy}%3AWGS84%5BDD.DDDDD%5D&coordOutputFormat=WGS84%5BGGZHTXX%5D&type_1=STOP&outputFormat=json&inclFilter=1";
const minx = 5;
const miny = 47;
const maxx = 15;
const maxy = 56;
const maxPins = 1000;
const pause = 250;
const districtCodes = ["03459"];

exportStops(urlTemplate, minx, miny, maxx, maxy, pause, districtCodes);
```

Parameters:

* `urlTemplate` - template of the `XML_COORD_REQUEST` or `XSLT_COORD_REQUEST` EFA endpoint. Placeholders `{minx}`, `{miny}`, `{maxx}`, `{maxy}` will be replaced with bounding box coordinates.
* `minx`, `miny`, `maxx`, `maxy` - coordinates of the bounding box to start with.
* `pause` - length of the pause between requests, in ms. `0` disables pausing.
* `maxPins` - maximum amount of pins in the response. If the service returns more pins, we'll subquery with smaller quadrants.
* `districtCodes` - array of [district codes](https://de.wikipedia.org/wiki/Liste_der_Landkreise_in_Deutschland) used to filter stops, may be omitted.

The script starts from the provided bounding box and requests stops. If no stops are returned or if the result is too large (more that 1000 stops), the bounding box is divided into four smaller equal bounding boxes which are recursively queried in turn. This is repeated until the query produces adequate results or the bounding box gets too small (less that 0.25 in both dimensions).

The script roduces CSV output in the following format:

```
"stop_id","stop_name","stop_lon","stop_lat","stop_code"
"20023337","Niederkrüchten, Elmpt D.Zollamt",6.12488,51.20878,"de:5166:23337"
```

Results are written to the standard output.

# Disclaimer

Usage of this script may or may not be legal, use on your own risk.  
This repository provides only source code, no data.

# License

Source code is licensed under [BSD 2-clause license](LICENSE). No license and no guarantees implied on the produced data, produce and use on your own risk.