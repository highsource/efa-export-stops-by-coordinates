const exportStops = require("./index.js");

const urlTemplate = "http://efa.vrr.de/vrr/XSLT_COORD_REQUEST?&jsonp=&boundingBox=&boundingBoxLU={minx}%3A{miny}%3AWGS84%5BDD.DDDDD%5D&boundingBoxRL={maxx}%3A{maxy}%3AWGS84%5BDD.DDDDD%5D&coordOutputFormat=WGS84%5BGGZHTXX%5D&type_1=STOP&outputFormat=json&inclFilter=1";
const minx = 7;
const miny = 52;
const maxx = 9;
const maxy = 53;
const maxPins = 1000;
const pause = 250;
const districtCodes = ["03459"];

exportStops(urlTemplate, minx, miny, maxx, maxy, pause, maxPins, districtCodes);
