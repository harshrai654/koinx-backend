require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { MongoClient } = require("mongodb");
const app = express();
const PORT = process.env.PORT || 3001;
const apiKey = process.env.ETHERSCAN_API_KEY;
const apiEndpoint = process.env.API_ENDPOINT;
const dbEndpoint = process.env.DB_ENDPOINT;
const client = new MongoClient(dbEndpoint);
const { updateRateDB } = require("./rateFetchService");
const verifyAccount = require("./middlewares/verifyAccount");
const dbName = "account_info";
const fetchRateInterval = 10 * 60 * 1000; //10 minutes

initialise();

app.get("/transactions", verifyAccount, async (req, res) => {
	const { account = "" } = req.query;
	const data = await getTransactions(account);
	res.json({ data });
});

app.get("/balance", verifyAccount, getBalance);

async function getBalance(req, res) {
	const { account = "" } = req.query;
	const db = client.db(dbName);
	const collection = db.collection("transactions");

	let data = await collection.findOne({
		account,
	});

	if (!data) {
		console.log(
			"No saved transactions found. Fetching and saving transactions to database."
		);
		data = await getTransactions(account);
	}

	transactions = data.transactions;

	let balance = new Big();

	res.send({});
}

/**
 * Handles /transaction route and saves all transactions of an account number in DB.
 * @param req : request object containing query params data
 * @param res : response object used to send data back to user
 */
async function getTransactions(account) {
	const url = `${apiEndpoint}?module=account&action=txlist&address=${account}&startblock=0&endblock=99999999&sort=asc&apikey=${apiKey}`;

	const response = await axios.get(url);
	const data = response.data.result;

	console.log(
		`Fetched total ${data.length} transactions for account: ${account}`
	);

	const db = client.db(dbName);
	const collection = db.collection("transactions");

	const dbData = await collection.findOneAndUpdate(
		{
			account,
		},
		{
			$set: { transactions: data },
		},
		{
			upsert: true,
			returnDocument: "after",
		}
	);
	console.log(
		`Saved total ${dbData.value.transactions.length} transactions for account: ${dbData.value.account}`
	);

	return dbData.value;
}

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
