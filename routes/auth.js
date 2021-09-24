const express = require("express");
const router = express.Router();
const control = require("../controllers/auth");
const { protect, authorize } = require("../middleware/auth");
const advanceResults = require("../middleware/advancedResults");
const User = require("../models/User");

router.post("/register", control.register);
router.post("/login", control.login);
router.get("/me", protect, control.getMe);
router.get(
	"/users",
	protect,
	authorize("admin"),
	advanceResults(User, "products"),
	control.getUsers,
);
router
	.route("/:id")
	.delete(protect, authorize("admin"), control.deleteUser)
	.put(protect, control.update);

// router.delete("/delete/:id", protect, authorize("admin"), control.deleteUser);

module.exports = router;
