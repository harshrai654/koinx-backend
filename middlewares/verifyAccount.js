function verifyAccount(req, res, next) {
	const { account = "" } = req.query;
	if (account.length == 0) {
		res.status(422).send({
			error: "Account id is required!",
		});

		return;
	}

	next();
}

module.exports = verifyAccount;
