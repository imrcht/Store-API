const express = require("express");
const router = express.Router();
const control = require("../controllers/auth");
const { protect } = require("../middleware/auth");

router.post("/register", control.register);
router.post("/login", control.login);
router.get("/me", protect, control.getMe);

module.exports = router;
