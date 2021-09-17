const express = require("express");
const router = express.Router();
const control = require("../controllers/products");
const { protect } = require("../middleware/auth");

router.route("/").get(control.getProducts).post(protect, control.createProduct);

router
	.route("/:id")
	.get(control.getProduct)
	.put(protect, control.updateProduct)
	.delete(protect, control.deleteProduct);

module.exports = router;
