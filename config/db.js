const mongoose = require("mongoose");

const connectDB = async () => {
	const conn = await mongoose.connect("mongodb://localhost:27017/StoreDB", {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	console.log(
		`MongoDb Connected: ${conn.connection.host}`.cyan.underline.bold,
	);
};

module.exports = connectDB;
