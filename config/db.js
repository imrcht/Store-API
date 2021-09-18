const mongoose = require("mongoose");
const secrets = require("../secrets");

const connectDB = async () => {
	const conn = await mongoose.connect(
		`mongodb+srv://${secrets.user}:${secrets.pwd}@cluster0.vhg7m.mongodb.net/StoreApiDB`,
		{
			useNewUrlParser: true,
			useUnifiedTopology: true,
		},
	);

	console.log(
		`MongoDb Connected: ${conn.connection.host}`.cyan.underline.bold,
	);
};

module.exports = connectDB;
