const fs = require("fs");
const mongoose = require("mongoose");
const colors = require("colors");
const Product = require("./models/Product.js");
const User = require("./models/User");
const secrets = require("./secrets");

mongoose.connect(
	`mongodb+srv://${secrets.user}:${secrets.pwd}@cluster0.vhg7m.mongodb.net/StoreApiDB`,
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
	},
);

// Read json files
const products = JSON.parse(
	fs.readFileSync(`${__dirname}/_data/products.json`, "utf-8"),
);
const users = JSON.parse(
	fs.readFileSync(`${__dirname}/_data/users.json`, "utf-8"),
);

const importData = async () => {
	try {
		await Product.create(products);
		await User.create(users);
		console.log("Data imported ....".green.inverse);
		process.exit(0);
	} catch (err) {
		console.log(err);
	}
};

const deleteData = async () => {
	try {
		await Product.deleteMany();
		await User.deleteMany();
		console.log("data destroyed ...".red.inverse);
		process.exit(0);
	} catch (err) {
		console.log(err);
	}
};

if (process.argv[2] === "-import") {
	importData();
} else if (process.argv[2] === "-delete") {
	deleteData();
}
