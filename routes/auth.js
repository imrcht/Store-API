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
router.put("/updateme", protect, control.updateMe);
router.put("/updatemypassword", protect, control.updateMyPassword);

router
	.route("/user/:id")
	.delete(protect, authorize("admin"), control.deleteUser)
	.put(protect, authorize("admin"), control.update)
	.get(protect, authorize("admin"), control.getUser);

router.post("/forgotpassword", control.forgotPassword);

router.put("/resetpassword/:resetToken", control.resetPassword);

module.exports = router;
