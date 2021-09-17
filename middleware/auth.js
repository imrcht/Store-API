const User = require("../models/User");
const jwt = require("jsonwebtoken");
const asyncHandler = require("./async");
const errorResponse = require("../utils/errorResponse");
const secrets = require("../secrets");

exports.protect = asyncHandler(async (req, res, next) => {
	let token;

	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith("Bearer")
	) {
		token = req.headers.authorization.split(" ")[1];
	}
	// else if (req.cookie.token) {
	// 	token = req.cookie.token;
	// }

	// Make sure token is present
	if (!token) {
		return next(
			new errorResponse(
				"You are not authorized to access this route",
				401,
			),
		);
	}

	try {
		// Verify token
		const decoded = jwt.verify(token, secrets.jwt_secret_key);

		console.log(decoded);

		req.user = await User.findById(decoded.id);

		res.status(200).json({
			success: true,
			user: req.user,
		});

		next();
	} catch (err) {
		return next(
			new errorResponse(
				"You are not authorized to access this route",
				401,
			),
		);
	}
});
