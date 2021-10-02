const mongoose = require("mongoose");
const crypto = require("crypto");
const errorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");
const Product = require("../models/Product");
const secrets = require("../secrets");

// @desc 	Register User
// @route 	POST api/v1/auth/register
// @access	Public
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

// @desc 	Login User
// @route 	POST api/v1/auth/login
// @access	Public
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

// @desc 	Logout User
// @route 	GET api/v1/auth/logout
// @access	Private
exports.logout = asyncHandler(async (req, res, next) => {
	res.cookie("token", "none", {
		expires: new Date(Date.now() + 10 * 1000),
	});

	res.status(200).json({
		success: true,
		message: "User logged out",
	});
});

// @desc 	Create User
// @route 	POST api/v1/auth/user
// @access	Private to Admin
exports.createUser = asyncHandler(async (req, res, next) => {
	const { name, email, phone, password, role } = req.body;

	// Create User in database
	const user = await User.create({
		name,
		email,
		phone,
		password,
		role,
	});

	res.status(201).json({
		success: true,
		message: `${user.role} of name ${user.name} created successfully`,
	});
});

// @desc 	User details
// @route 	GET api/v1/auth/me
// @access	Private
exports.getMe = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user.id);

	res.status(200).json({
		success: true,
		user,
	});
});

// @desc 	Get all User
// @route 	GET api/v1/auth/users
// @access	Private to Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
	res.status(200).json(res.advanceResult);
});

// @desc 	Get single User
// @route 	GET api/v1/auth/user/:id
// @access	Private to Admin
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

// @desc 	Delete single User
// @route 	DELETE api/v1/auth/user/:id
// @access	Private to Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
	let user = await User.findById(req.params.id);

	if (!user) {
		return next(
			new errorResponse(`User with id ${req.params.id} not found`, 404),
		);
	}
	const userRole = user.role;
	const username = user.name;
	user = user.remove();
	// console.log(user);

	res.status(200).json({
		success: true,
		message: `${username} of role ${userRole} removed by Admin`,
	});
});

// @desc 	Update user details
// @route 	PUT api/v1/auth/user/:id
// @access	Private to Admin
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

// @desc 	Update User details
// @route 	PUT api/v1/auth/updateme
// @access	Private to User itself
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

// @desc 	Update User Password
// @route 	PUT api/v1/auth/usermypassword
// @access	Private to User itself
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

// @desc 	Generate Forgot Password token
// @route 	POST api/v1/auth/forgotpassword
// @access	Public
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
		user.resetPasswordToken = undefined;
		user.resetPasswordExpire = undefined;

		await user.save({ validateBeforeSave: false });
		console.log(err);
		return next(new errorResponse(`Email could not be sent`, 500));
	}
});

// @desc 	Reset Password link
// @route 	PUT api/v1/auth/resetpassword/:resetToken
// @access	Public
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

	if (user.role === "admin") {
		res.status(statusCode)
			.cookie("token", token, options)
			.json({
				success: true,
				token: token,
				message: `Our Admin The ${user.name} has arrived `,
			});
	} else {
		res.status(statusCode)
			.cookie("token", token, options)
			.json({
				success: true,
				token: token,
				message: `${user.email} sucesss full `,
			});
	}
};
