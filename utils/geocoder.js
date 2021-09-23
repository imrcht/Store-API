const nodeGeocoder = require("node-geocoder");
const secrets = require("../secrets");
const options = {
	provider: secrets.provider,
	apiKey: secrets.apikey,
	formatter: null,
};

const Geocoder = nodeGeocoder(options);

module.exports = Geocoder;
