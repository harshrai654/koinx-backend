require("dotenv").config();
const express = require("express");
const { default: BigNumber } = require("bignumber.js");
const { MongoClient } = require("mongodb");
const app = express();
const PORT = process.env.PORT || 3001;
const dbEndpoint = process.env.DB_ENDPOINT;
const client = new MongoClient(dbEndpoint);
const { updateRateDB, fetchRate } = require("./rateFetchService");
const verifyAccount = require("./middlewares/verifyAccount");
const { getTransactions, getBalance } = require("./utils");
const fetchRateInterval = 10 * 60 * 1000; //10 minutes

initialise();

app.get("/transactions", verifyAccount, async (req, res) => {
	const { account = "" } = req.query;
	const data = await getTransactions(account);
	res.json({ data });
});

app.get("/balance", verifyAccount, async (req, res) => {
	const { account = "" } = req.query;
	const data = await getBalance(account);
	const rate = new BigNumber(await fetchRate());
	const balanceInr = rate.multipliedBy(data);
	res.json({ data: balanceInr });
});

/**
 * @description Connects to mongodb atlas server and starts fetch service
 * to store time based ETH-INR data
 */
async function initialise() {
	let timer;
	try {
		await client.connect();
		console.log("Connected successfully to mongodb server");

		app.listen(PORT, () => {
			console.log(`KoinX app running on port: ${PORT}`);
		});

		updateRateDB();
		timer = setInterval(updateRateDB, fetchRateInterval);
	} catch (error) {
		console.error(`Unable to connect to DB: ${error}`);
		clearInterval(timer);
	}
}
