const { MongoClient } = require("mongodb");
const axios = require("axios");
const { default: BigNumber } = require("bignumber.js");
const apiKey = process.env.ETHERSCAN_API_KEY;
const apiEndpoint = process.env.API_ENDPOINT;
const dbEndpoint = process.env.DB_ENDPOINT;
const client = new MongoClient(dbEndpoint);
const dbName = "account_info";

/**
 * @description Returns total balance of a account from saved transaction in db of specified account
 * if account ID is not present in DB then transactions of the account are fetched and saved and then balance is
 * calculated
 * balance is in INR.
 * @param {*} account: account id of user
 * @returns
 */
async function getBalance(account) {
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

	let balance = new BigNumber(0);

	transactions.forEach((trx) => {
		const { from, to, value } = trx;
		let val = new BigNumber(value);
		if (from.toLowerCase() === account.toLowerCase()) {
			balance = balance.minus(val);
		} else if (to.toLowerCase() === account.toLowerCase()) {
			balance = balance.plus(val);
		}
	});

	const balanceEth = balance.dividedBy(BigNumber(1000000000000000000));
	console.log(`Account: ${account} | Balance: ${balanceEth}`);
	return balanceEth;
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

module.exports = {
	getTransactions,
	getBalance,
};
