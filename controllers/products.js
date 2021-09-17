const Product = require("../models/Product");
const mongoose = require("mongoose");
const errorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");

exports.getProducts = asyncHandler(async (req, res, next) => {
	const products = await Product.find();

	if (!products) {
		return errorResponse(`Resource not found`, 404);
	} else {
		res.status(201).json({
			success: true,
			count: products.length,
			data: products,
		});
	}
});

exports.createProduct = asyncHandler(async (req, res, next) => {
	// Add user to body
	req.body.seller = req.user.id;

	// check for listed product
	const listedProduct = await Product.find({ user: req.user.id });

	if ((listedProduct.length = 10 && req.user.role != "admin")) {
		return next(
			new errorResponse(
				`The user with name ${req.user.name} has already listed 10 products`,
			),
		);
	}

	const product = await Product.create(req.body);

	res.status(201).json({
		success: true,
		data: product,
	});
});

exports.getProduct = asyncHandler(async (req, res, next) => {
	const product = await Product.findById(req.params.id);
	console.log(req.params.id);
	if (!product) {
		return errorResponse(`Resource not found of id ${req.params.id}`, 404);
	} else {
		res.status(201).json({
			success: true,
			data: product,
		});
	}
});

exports.updateProduct = asyncHandler(async (req, res, next) => {
	const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
		runValidators: true,
		new: true,
	});

	if (!product) {
		return errorResponse(`Resource not found of id ${req.params.id}`, 404);
	}

	res.json({
		success: true,
		data: product,
	});
});

exports.deleteProduct = asyncHandler((req, res, next) => {
	Product.deleteOne({ _id: req.params.id }, (err) => {
		if (err) {
			next(err);
		} else {
			res.json({
				success: true,
			});
		}
	});
});
