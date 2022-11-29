const { MongoClient } = require("mongodb");
const axios = require("axios");
const apiEndpoint = process.env.RATE_API_ENDPOINT;
const dbEndpoint = process.env.DB_ENDPOINT;
const client = new MongoClient(dbEndpoint);
const dbName = "account_info";

/**
 * @description Fetches the current ethereum rate and
 * saves the value in "conversion_rate" collection
 */
async function updateRateDB() {
	const value = await fetchRate();
	const db = client.db(dbName);
	const collection = db.collection("conversion_rate");
	const time = new Date();

	await collection.insertOne({
		time,
		value,
	});

	console.log(`Ethereum value: Rs. ${value} at: ${time}`);
}

/**
 * No params
 * @returns Current value of ether in INR
 */
async function fetchRate() {
	const response = await axios.get(apiEndpoint, {
		headers: {
			"Accept-Encoding": "application/json",
		},
	});
	const value = response.data.ethereum.inr;

	return value;
}

module.exports = {
	updateRateDB,
	fetchRate,
};
