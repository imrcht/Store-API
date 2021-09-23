const advanceResults = (model, populate) => async (req, res, next) => {
	let query;
	// retrieving select query
	let { select, sort } = req.query;

	// retrieving filter query in string form
	queryString = JSON.stringify(req.query);

	// add $ sign to symbols
	queryString = queryString.replace(
		/\b(gt|gte|lt|lte|in)\b/g,
		(match) => `$${match}`,
	);

	console.log(queryString);

	// Finding resource
	query = model.find(JSON.parse(queryString));

	if (populate) {
		query = query.populate(populate);
	}

	// select required fields
	if (select) {
		selections = select.split(",");
		query = query.select(selections);
	}
	//  sort required fields
	if (sort) {
		const sortBy = sort.split(",").join("");
		console.log(sortBy);
		query = query.sort(sortBy);
	} else {
		const sortBy = "-createdAt";
		query = query.sort(sortBy);
	}

	const results = await query;

	res.advanceResult = {
		success: true,
		count: results.length,
		data: results,
	};
	next();
};

module.exports = advanceResults;
