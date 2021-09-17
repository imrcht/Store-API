const mongoose = require("mongoose");
const slugify = require("slugify");

const ProductSchema = new mongoose.Schema({
	title: {
		type: String,
		required: [true, "please add a name"],
		trim: true,
		maxlength: [50, "Name cannot be more than of 50 characters"],
	},
	slug: String,
	productType: {
		type: String,
		required: [true, "please add a type"],
		trim: true,
		maxlength: [50, "type cannot be more than of 50 characters"],
	},
	description: {
		type: String,
		required: [true, "please add a description"],
		unique: true,
		trim: true,
		maxlength: [500, "Description cannot be more than of 500 characters"],
	},
	averageRating: {
		type: Number,
		min: [1, "Min rating is atleast one"],
		max: [5, "Max rating is atmost five"],
	},
	photo: {
		type: String,
		default: "no-photo.jpg",
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	cost: Number,
	Seller: {
		type: String,
		required: [true, "please add a Seller"],
		trim: true,
		maxlength: [50, "Seller name cannot be more than of 50 characters"],
	},
});

// Product middleware to slugify the title
ProductSchema.pre("save", function (next) {
	this.slug = slugify(this.title, { lower: true });
	next();
});

module.exports = mongoose.model("Product", ProductSchema);
