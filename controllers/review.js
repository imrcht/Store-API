const Review = require("../models/Review");
const Product = require("../models/Product");
const User = require("../models/User");
const errorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");

// Public
// GET api/v1/products/:productId/reviews - get specific product reviews
// GET api/v1/reviews - get all reviews
exports.getReviews = asyncHandler(async (req, res, next) => {
	if (req.params.productId) {
		const reviews = await Review.find({ product: req.params.productId });

		res.status(200).json({
			success: true,
			count: reviews.length,
			data: reviews,
		});
	} else {
		res.status(200).json(res.advanceResult);
	}
});

// Public
// GET api/v1/reviews/:id  get a single review
exports.getReview = asyncHandler(async (req, res, next) => {
	const review = await Review.findById(req.params.id).populate({
		path: "product",
		select: "name productType averageRating",
	});

	if (!review) {
		return next(
			new errorResponse(`Review not found of id ${req.params.id}`, 404),
		);
	}

	res.status(200).json({
		success: true,
		review,
	});
});

// Private only for users and admin
// POST api/v1/products/:productId/reviews - get specific product reviews
exports.createReview = asyncHandler(async (req, res, next) => {
	let product = await Product.findById(req.params.productId);

	if (!product) {
		return next(
			new errorResponse(
				`Product with ${req.params.productId} not exists`,
				404,
			),
		);
	}

	const { title, text, rating } = req.body;

	const review = await Review.create({
		title,
		text,
		rating,
		product: req.params.productId,
		user: req.user.id,
	});

	// Updating user
	let user = await User.findById(req.user.id);

	let addReviews = user.reviews;
	addReviews.push(review._id);

	user = await User.findByIdAndUpdate(
		req.user.id,
		{ reviews: addReviews },
		{
			runValidators: true,
			new: true,
		},
	);

	// Updating product
	addReviews = product.reviews;
	addReviews.push(review._id);

	product = await Product.findByIdAndUpdate(
		req.params.productId,
		{ reviews: addReviews },
		{ runValidators: true, new: true },
	);

	res.status(201).json({
		success: true,
		review,
	});
});

// Private to user and admin
// PUT api/v1/reviews/:id  get a single review
exports.updateReview = asyncHandler(async (req, res, next) => {
	let review = await Review.findById(req.params.id);

	if (!review) {
		return next(
			new errorResponse(`Review not found of id ${req.params.id}`, 404),
		);
	}

	if (review.user.toString() != req.user.id && req.user.role != "admin") {
		return next(
			new errorResponse(
				`User not authorized to update reviews other than his`,
				401,
			),
		);
	}

	review = await Review.findByIdAndUpdate(req.params.id, req.body, {
		runValidators: true,
		new: true,
	});

	res.status(200).json({
		success: true,
		review,
	});
});

// delete a review
// Private only for user and admin
// DELETE api/v1/reviews/:id
exports.deleteReview = asyncHandler(async (req, res, next) => {
	let review = await Review.findById(req.params.id);

	if (!review) {
		return next(
			new errorResponse(`Review with id ${req.params.id} not found`, 404),
		);
	}

	// Check whether the user is owner or admin
	if (review.user.toString() != req.user.id && req.user.role != "admin") {
		return next(
			new errorResponse(
				`User not authorized to delete reviews other than his`,
				401,
			),
		);
	}

	// find review in products
	let product = await Product.findById(review.product);
	let reviewsarr = product.reviews;
	reviewsarr = reviewsarr.filter((rev) => {
		return rev.toString() != review._id;
	});
	// Delete that review in products
	product = await Product.findByIdAndUpdate(
		review.product,
		{ reviews: reviewsarr },
		{
			runValidators: true,
			new: true,
		},
	);

	// Find review in users
	let user = await User.findById(review.user);
	reviewsarr = user.reviews;
	reviewsarr = reviewsarr.filter((rev) => {
		return rev.toString() != review._id;
	});
	// Delete that review in users
	user = await User.findByIdAndUpdate(
		review.user,
		{ reviews: reviewsarr },
		{
			runValidators: true,
			new: true,
		},
	);

	// Delete review from database
	review = await Review.findByIdAndDelete(req.params.id);

	res.status(200).json({
		success: true,
		message: `Review removed`,
	});
});
