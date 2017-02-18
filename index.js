const got = require('got');
const csv = require('csv');
const leftPad = require('left-pad');

const EPSILON = Math.pow(2, -2);
const MAX_PINS = 1000;

const queryPins = function(urlTemplate, minx, miny, maxx, maxy) {
	const url = urlTemplate
		.replace("{minx}", minx)
		.replace("{miny}", miny)
		.replace("{maxx}", maxx)
		.replace("{maxy}", maxy);

	return new Promise(function(resolve, reject){
		got(url)
		.then(response => {
			const result = JSON.parse(response.body);
			// console.log("Got " + result.pins.length + " results from " + url + ".");
			const smallestAllowedBoundingBox = Math.max(maxx - minx, maxy - miny) <= EPSILON;
			if (result.pins.length > 0 && (result.pins.length <= MAX_PINS || smallestAllowedBoundingBox)) {
				resolve(result.pins);
			} else if (!smallestAllowedBoundingBox)
			{
				subqueryPins(urlTemplate, minx, miny, maxx, maxy).then(resolve).catch(reject);
			} else {
				resolve([]);
			}
		})
		.catch(error => {
			// console.log("Error querying " + url + ", requerying.");
			subqueryPins(urlTemplate, minx, miny, maxx, maxy).then(resolve).catch(reject);
		});
	});
};

const subqueryPins = function(urlTemplate, minx, miny, maxx, maxy) {

	return new Promise(function(resolve, reject){
		const midx = (minx + maxx) / 2;
		const midy = (miny + maxy) / 2;
		Promise
		.all([
			queryPins(urlTemplate, minx, miny, midx, midy),
			queryPins(urlTemplate, midx, miny, maxx, midy),
			queryPins(urlTemplate, minx, midy, midx, maxy),
			queryPins(urlTemplate, midx, midy, maxx, maxy)
		])
		.then(results => resolve([].concat.apply([], results)))
		.catch(reject);
	});
};

const convertPinsToStops = function(pins) {
	return pins.map(convertPinToStop);
};

const convertPinToStop = function(pin) {
	if (!pin.attrs) { pin.attrs = []; }
	const attributes = pin.attrs.reduce((attibutes, attribute) => Object.assign(attibutes, { [attribute.name]: attribute.value }), {});
	const lonLat = pin.coords.split(",");

	const stopId = pin.stateless;
	const stop = {
		stop_id: stopId,
		stop_name: pin.locality + ", " + pin.desc,
		stop_lon: Number(lonLat[0]/100000),
		stop_lat: Number(lonLat[1]/100000),
		stop_code: attributes.STOP_GLOBAL_ID || ""
	};
	return stop;
};

const removeStopsWithoutCoordinates = function(stops) {
	return stops.filter(stop => stop.stop_lon && stop.stop_lat);
};

const removeDuplicateStops = function(stops) {
	const filteredStops = [];
	const stopsById = {};

	stops.forEach(stop => {
		const existingStop = stopsById[stop.stop_id];
		if (existingStop) {
			if (	stop.stop_id !== existingStop.stop_id ||
				stop.stop_name !== existingStop.stop_name ||
				stop.stop_lon !== existingStop.stop_lon ||
				stop.stop_lat !== existingStop.stop_lat)
			{
				// console.log("Duplicate but different stop.");
				// console.log("Existing stop:", existingStop);
				// console.log("Duplicate stop:", stop);
			}
		}
		else {
			stopsById[stop.stop_id] = stop;
			filteredStops.push(stop);
		}
	});
	return filteredStops;
};

const retainStopsWithDistrictCodes = function(districtCodes) {
	if (districtCodes) {
		const districtCodesMap = districtCodes.reduce((districtCodesMap, districtCode) => Object.assign(districtCodesMap, { [districtCode]: true }), {});
		return stops => stops.filter(
			stop => {
				const districtCode = leftPad((stop.stop_code.match(/^de:(\d+):/)||['', ''])[1], 5, '0');
				return districtCodesMap[districtCode];
			}
		);
	}
	else {
		return stops => stops;
	}

};

const sortStops = function(stops) {
	return stops.sort((s1, s2) => s1.stop_id < s2.stop_id);
};

const outputStops = function(stops) {
	csv.stringify(stops, {header: true, quotedString: true, columns: ["stop_id", "stop_name", "stop_lon", "stop_lat", "stop_code"]}, function(err, data){
		process.stdout.write(data);
	});
}

const exportStops = function(urlTemplate, minx, miny, maxx, maxy, districtCodes)  {
	queryPins(urlTemplate, minx, miny, maxx, maxy)
	.then(convertPinsToStops)
	.then(removeStopsWithoutCoordinates)
	.then(removeDuplicateStops)
	.then(retainStopsWithDistrictCodes(districtCodes))
	.then(sortStops)
	.then(outputStops)
	.catch(error => console.log(error));
};

module.exports = exportStops;