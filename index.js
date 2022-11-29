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
const dbName = "account_info";

connectDB();

app.get("/transactions", getTransactions);

async function getTransactions(req, res) {
	const { account = "" } = req.query;

	if (account.length == 0) {
		res.status(422).send({
			error: "Account id is required!",
		});
	}

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

	res.json({ data: dbData.value });
}

async function connectDB() {
	try {
		await client.connect();
		console.log("Connected successfully to mongodb server");

		app.listen(PORT, () => {
			console.log(`KoinX app running on port: ${PORT}`);
		});
	} catch (error) {
		console.error(`Unable to connect to DB: ${error}`);
	}
}
