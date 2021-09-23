const express = require("express");
const router = express.Router();
const control = require("../controllers/products");
const { protect, authorize } = require("../middleware/auth");
const Product = require("../models/Product");
const advanceResults = require("../middleware/advancedResults");

router
	.route("/")
	.get(advanceResults(Product, "seller"), control.getProducts)
	.post(protect, authorize("admin", "seller"), control.createProduct);

router
	.route("/:id")
	.get(control.getProduct)
	.put(protect, authorize("admin", "seller"), control.updateProduct)
	.delete(protect, authorize("admin", "seller"), control.deleteProduct);

module.exports = router;
