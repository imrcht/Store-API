const mongoose = require("mongoose");
const errorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const User = require("../models/User");
const secrets = require("../secrets");

// Register User post api/v1/auth/register
exports.register = asyncHandler(async (req, res, next) => {
	const { name, email, phone, password, role } = req.body;

	// Create User in database
	const user = await User.create({
		name,
		email,
		phone,
		password,
		role,
	});

	// Create token and cookie and send response
	sendTokenResponse(user, 201, res);
});

// Login User post api/v1/auth/login
exports.login = asyncHandler(async (req, res, next) => {
	const { email, password } = req.body;

	// check if field is not empty
	if (!email || !password) {
		return next(
			new errorResponse("Please enter email or password first", 400),
		);
	}

	// finding user
	const user = await User.findOne({ email: email }).select("+password");

	if (!user) {
		return next(new errorResponse("Invalid Credentials", 401));
	}

	// match password
	const isMatch = await user.matchPwd(password);

	if (!isMatch) {
		return next(new errorResponse("Invalid Credentials", 401));
	}

	// Create token and cookie and send response
	sendTokenResponse(user, 200, res);
});

// get loggedin user
// private
exports.getMe = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user.id);

	res.status(200).json({
		success: true,
		user,
	});
});

// get all users
// Private only for admin
exports.getUsers = asyncHandler(async (req, res, next) => {
	if (req.user.role != "admin") {
		return next(
			new errorResponse(
				`${req.user.role} is not authorized to access this route`,
				401,
			),
		);
	}
	res.status(200).json(res.advanceResult);
});

// create and send cookie and token
const sendTokenResponse = (user, statusCode, res) => {
	const token = user.getSignedJwtToken();

	const options = {
		expires: new Date(
			Date.now() + secrets.jwt_cookie_expire * 24 * 60 * 60 * 1000,
		),
		httpOnly: true,
	};

	res.status(statusCode)
		.cookie("token", token, options)
		.json({
			success: true,
			token: token,
			message: `${user.email} sucesss full `,
		});
};
