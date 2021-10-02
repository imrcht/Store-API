const express = require("express");
const router = express.Router({ mergeParams: true });
const control = require("../controllers/review");
const { protect, authorize } = require("../middleware/auth");
const Review = require("../models/Review");
const advanceResults = require("../middleware/advancedResults");

router
	.route("/")
	.get(
		advanceResults(Review, {
			path: "product",
			select: "title description",
		}),
		control.getReviews,
	)
	.post(protect, authorize("user", "admin"), control.createReview);

router
	.route("/:id")
	.get(control.getReview)
	.put(protect, authorize("user", "admin"), control.updateReview)
	.delete(protect, authorize("user", "admin"), control.deleteReview);

module.exports = router;
