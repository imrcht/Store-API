const express = require("express");
const router = express.Router();
const control = require("../controllers/auth");
const { protect } = require("../middleware/auth");
const advanceResults = require("../middleware/advancedResults");
const User = require("../models/User");

router.post("/register", control.register);
router.post("/login", control.login);
router.get("/me", protect, control.getMe);
router.get(
	"/users",
	protect,
	advanceResults(User, "products"),
	control.getUsers,
);

module.exports = router;
