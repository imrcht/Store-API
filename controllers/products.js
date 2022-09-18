const Product = require('../models/Product');
const mongoose = require('mongoose');
const errorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const Razorpay = require('razorpay');

// @desc 	Get all products
// @route 	GET api/v1/products
// @access	Public
exports.getProducts = asyncHandler(async (req, res, next) => {
	res.status(200).json(res.advanceResult);
});

// @desc 	List product
// @route 	POST api/v1/products
// @access	Private to seller and Admin
exports.createProduct = asyncHandler(async (req, res, next) => {
	// Add user to body
	req.body.seller = req.user.id;

	// check for listed product
	const listedProduct = await Product.find({ user: req.user.id });

	if (listedProduct.length === 10 && req.user.role != 'admin') {
		return next(
			new errorResponse(
				`The user with name ${req.user.name} has already listed 10 products`,
				400,
			),
		);
	}

	const product = await Product.create(req.body);

	// Adding product to user
	let user = await User.findById(req.user.id);

	let addproducts = user.products;
	addproducts.push(product._id);

	user = await User.findByIdAndUpdate(
		req.user.id,
		{ products: addproducts },
		{
			runValidators: true,
			new: true,
		},
	);

	res.status(201).json({
		success: true,
		data: product,
	});
});

// @desc 	Get single product
// @route 	GET api/v1/product
// @access	Public
exports.getProduct = asyncHandler(async (req, res, next) => {
	const product = await Product.findById(req.params.id);

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

// @desc 	Udpate product
// @route 	PUT api/v1/product/:id
// @access	Private to Admin and product seller
exports.updateProduct = asyncHandler(async (req, res, next) => {
	let product = await Product.findById(req.params.id);

	if (!product) {
		return next(
			new errorResponse(`Resource not found of id ${req.params.id}`, 404),
		);
	}
	// making sure that only the product seller or admin can update product details
	if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
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

// @desc 	Delete product
// @route 	DELETE api/v1/product/:id
// @access	Private to Admin and product seller
exports.deleteProduct = asyncHandler(async (req, res, next) => {
	let product = await Product.findById(req.params.id);
	if (!product) {
		return next(
			new errorResponse(`Resource not found of id ${req.params.id}`, 404),
		);
	}
	// making sure that only the product seller or admin can delete product details
	if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
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
