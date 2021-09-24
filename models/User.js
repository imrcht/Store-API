const mongoose = require("mongoose");
const slugify = require("slugify");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const secrets = require("../secrets");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, "please add a name"],
		trim: true,
		maxlength: [50, "Name cannot be more than of 50 characters"],
	},
	slug: String,
	phone: {
		type: String,
		unique: true,
		maxlength: [20, "Phone "],
	},
	email: {
		type: String,
		unique: true,
		required: [true, "Please enter an email address"],
		match: [/\S+@\S+\.\S+/, "Please enter a valid email address"],
	},
	role: {
		type: String,
		enum: ["user", "admin", "seller"],
		default: "user",
	},
	password: {
		type: String,
		required: [true, "Please enter password"],
		minlenght: 8,
		select: false,
	},
	resetPasswordToken: String,
	resetPasswordExpire: Date,
	createdAt: {
		type: Date,
		default: Date.now,
	},
	products: {
		type: [mongoose.Schema.ObjectId],
		ref: "Product",
	},
});

// middleware to delete products realted to this user
UserSchema.pre("remove", async function (next) {
	console.log("Inside remove", this._id);
	await this.model("Product").deleteMany({ seller: this._id });
	next();
});

// User middleware to slugify the name and encrypting the password
UserSchema.pre("save", async function (next) {
	if (!this.isModified("password")) {
		next();
	}

	this.slug = slugify(this.name, { lower: true });
	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
	next();
});

// Sign jwt and send
UserSchema.methods.getSignedJwtToken = function () {
	return jwt.sign({ id: this._id }, secrets.jwt_secret_key, {
		expiresIn: secrets.jwt_expire,
	});
};

// Match entered password to hashed password
UserSchema.methods.matchPwd = async function (enteredPwd) {
	// this will return a promise
	return await bcrypt.compare(enteredPwd, this.password);
};

// getresetpassword token
UserSchema.methods.getResetPasswordToken = function () {
	// generate token
	let resetToken = crypto.randomBytes(20);
	// console.log("buffer of resetpwdtoken", resetToken);
	resetToken = resetToken.toString("hex");

	this.resetPasswordToken = crypto
		.createHash("sha1")
		.update(resetToken)
		.digest("hex");
	console.log(this.resetPasswordToken);
	this.resetPasswordExpire = Date.now() * 60 * 60;

	return resetToken;
};

// GeoCode and create loacation field
// UserSchema.pre("save", async function (next) {
// 	const loc = await geocoder.geocode(this.address);
// 	this.location = {
// 		type: "Point",
// 		coordinates: [loc[0].longitude, loc[0].latitude],
// 		formattedAddress: loc[0].formattedAddress,
// 		city: loc[0].city,
// 		state: loc[0].stateCode,
// 		street: loc[0].streetName,
// 		zipcode: loc[0].zipcode,
// 		country: loc[0].countryCode,
// 	};
// 	//Do not save address
// 	this.address = undefined;
// 	next();
// });

module.exports = mongoose.model("User", UserSchema);
