const Product = require("../models/Product");
const mongoose = require("mongoose");
const errorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const User = require("../models/User");

exports.getProducts = asyncHandler(async (req, res, next) => {
	res.status(200).json(res.advanceResult);
	// const products = await Product.find();

	// if (!products) {
	// 	return next(
	// 		new errorResponse(`Resource not found of id ${req.params.id}`, 404),
	// 	);
	// } else {
	// 	res.status(201).json({
	// 		success: true,
	// 		count: products.length,
	// 		data: products,
	// 	});
	// }
});

exports.createProduct = asyncHandler(async (req, res, next) => {
	// Add user to body
	req.body.seller = req.user.id;

	// check for listed product
	const listedProduct = await Product.find({ user: req.user.id });

	if (listedProduct.length === 10 && req.user.role != "admin") {
		return next(
			new errorResponse(
				`The user with name ${req.user.name} has already listed 10 products`,
			),
		);
	}

	const product = await Product.create(req.body);

	// Adding product to user
	const user = User.findById(req.user.id);

	user.products = product._id;

	console.log(product._id);
	console.log(user.products);
	res.status(201).json({
		success: true,
		data: product,
	});
});

exports.getProduct = asyncHandler(async (req, res, next) => {
	const product = await Product.findById(req.params.id);
	console.log(req.params.id);
	if (!product) {
		return next(
			new errorResponse(`Resource not found of id ${req.params.id}`, 404),
		);
	} else {
		res.status(201).json({
			success: true,
			data: product,
		});
	}
});

exports.updateProduct = asyncHandler(async (req, res, next) => {
	let product = await Product.findById(req.params.id);

	if (!product) {
		return next(
			new errorResponse(`Resource not found of id ${req.params.id}`, 404),
		);
	}
	// making sure that only the product seller or admin can update product details
	if (
		product.seller.toString() !== req.user.id &&
		req.user.role !== "admin"
	) {
		return next(
			new errorResponse(
				`${req.user.name} is not allowed to update this product details`,
				401,
			),
		);
	}

	// Update Product
	product = await Product.findByIdAndUpdate(req.params.id, req.body, {
		runValidators: true,
		new: true,
	});

	res.json({
		success: true,
		data: product,
	});
});

exports.deleteProduct = asyncHandler(async (req, res, next) => {
	let product = await Product.findById(req.params.id);
	if (!product) {
		return next(
			new errorResponse(`Resource not found of id ${req.params.id}`, 404),
		);
	}
	// making sure that only the product seller or admin can delete product details
	if (
		product.seller.toString() !== req.user.id &&
		req.user.role !== "admin"
	) {
		return next(
			new errorResponse(
				`${req.user.name} is not allowed to delete this product details`,
				401,
			),
		);
	}

	// Delete the product
	Product.deleteOne({ _id: req.params.id }, (err) => {
		if (err) {
			next(err);
		} else {
			res.json({
				success: true,
				message: `Product deleted by the user ${req.user.name} `,
			});
		}
	});
});
