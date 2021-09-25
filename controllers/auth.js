const mongoose = require("mongoose");
const crypto = require("crypto");
const errorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const sendEmail = require("../utils/sendEmail");
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
	res.status(200).json(res.advanceResult);
});

// get single user
// Private only for admin
exports.getUser = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.params.id);

	if (!user) {
		return next(
			new errorResponse(`User with ${req.params.id} not found`, 404),
		);
	}

	res.status(200).json({
		success: true,
		user,
	});
});

// delete a user
// Private only for admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
	let user = User.findById(req.params.id);

	if (!user) {
		return next(
			new errorResponse(`User with id ${req.params.id} not found`, 404),
		);
	}
	user = user.remove();
	console.log(user);

	res.status(200).json({
		success: true,
		message: "User removed by admin",
	});
});

// update user details
// Private only for admin and user itself
exports.update = asyncHandler(async (req, res, next) => {
	let user = await User.findById(req.params.id);

	if (!user) {
		return next(
			new errorResponse(`User with id ${req.params.id} not found`, 404),
		);
	}

	if (req.user.role !== "admin") {
		if (req.user.id !== req.params.id) {
			return next(
				new errorResponse(
					`${req.user.name} is not allowed to update another user`,
					401,
				),
			);
		}
	}

	// Update User
	user = await User.findByIdAndUpdate(req.params.id, req.body, {
		runValidators: true,
		new: true,
	});

	res.status(200).json({
		success: true,
		data: user,
	});
});

// update loggedin user details
// private to loggedin user
exports.updateMe = asyncHandler(async (req, res, next) => {
	const user = await User.findByIdAndUpdate(req.user.id, req.body, {
		runValidators: true,
		new: true,
	});

	res.status(200).json({
		success: true,
		user,
	});
});

// update loggedin user password
// private to loggedin user
exports.updateMyPassword = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user.id).select("+password");

	const isMatch = await user.matchPwd(req.body.currentpassword);
	if (!isMatch) {
		return next(new errorResponse(`Current password is incorrect`, 401));
	}

	user.password = req.body.newpassword;
	await user.save();

	sendTokenResponse(user, 200, res);
});

// Forgot password token
// public route
exports.forgotPassword = asyncHandler(async (req, res, next) => {
	const user = await User.findOne({ email: req.body.email });

	if (!user) {
		return next(
			new errorResponse(`User with ${req.body.email} not found`, 404),
		);
	}

	const resetPasswordToken = user.getResetPasswordToken();
	await user.save({ validateBeforeSave: false });

	resetUrl = `${req.protocol}://${req.get(
		"host",
	)}/api/v1/auth/resetpassword/${resetPasswordToken}`;
	const options = {
		message: `Your reset password url is ${resetUrl}`,
		email: user.email,
		subject: "Reset Password URL",
	};

	try {
		sendEmail(options);
		res.status(201).json({
			success: true,
			message: "email sent",
		});
	} catch (err) {
		console.log(err);
		user.resetPasswordToken = undefined;
		user.resetPasswordExpire = undefined;

		await user.save({ validateBeforeSave: false });

		return next(new errorResponse(`Email could not be sent`, 500));
	}
});

// reset password
// public
// api/v1/auth/resetpassword/:resetToken
exports.resetPassword = asyncHandler(async (req, res, next) => {
	const resetPasswordToken = crypto
		.createHash("sha1")
		.update(req.params.resetToken)
		.digest("hex");

	const user = await User.findOne({
		resetPasswordToken,
		resetPasswordExpire: {
			$gt: Date.now(),
		},
	});

	if (!user) {
		return next(new errorResponse(`Invalid/Expired Token `, 400));
	}

	user.password = req.body.password;
	user.resetPasswordToken = undefined;
	user.resetPasswordExpire = undefined;
	user.save();

	sendTokenResponse(user, 200, res);
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
