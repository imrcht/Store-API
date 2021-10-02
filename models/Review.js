const mongoose = require("mongoose");
const slugify = require("slugify");

const ReviewSchema = new mongoose.Schema({
	title: {
		type: String,
		required: [true, "please add a name"],
		trim: true,
		maxlength: [100, "Name cannot be more than of 100 characters"],
	},
	slug: String,
	text: {
		type: String,
		required: [true, "please add a type"],
		trim: true,
		maxlength: [500, "type cannot be more than of 500 characters"],
	},
	rating: {
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
	user: {
		type: mongoose.Schema.ObjectId,
		ref: "User",
		trim: true,
	},
	product: {
		type: mongoose.Schema.ObjectId,
		ref: "Product",
		trim: true,
	},
});

// Prevent user for submitting more than one review for one product
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

// // Static method to get average rating and save
// ReviewSchema.static.getAverageRating = async function (productId) {
// 	const obj = await this.aggregate([
// 		{
// 			$match: { product: productId },
// 		},
// 		{
// 			$group: {
// 				_id: "$product",
// 				averageRating: { $avg: "$rating" },
// 			},
// 		},
// 	]);

// 	try {
// 		await this.model("Product").findByIdAndUpdate(productId, {
// 			averageRating: obj[0].averageRating,
// 		});
// 	} catch (err) {
// 		console.log(err);
// 	}
// };

// Review middleware to slugify the title and call averagerating before save
ReviewSchema.pre("save", function (next) {
	this.slug = slugify(this.title, { lower: true });
	// this.constructor.getAverageRating(this.product);
	next();
});

// call averagerating before remove
ReviewSchema.pre("remove", function (next) {
	this.constructor.getAverageRating(this.product);
	next();
});

module.exports = mongoose.model("Review", ReviewSchema);
