const express = require("express");
const morgan = require("morgan");
const connectDB = require("./config/db");
const colors = require("colors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const expressRateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");
// Routes from products
const products = require("./routes/products");
// Routes from Auth
const auth = require("./routes/auth");
// Routes from review
const reviews = require("./routes/reviews");
// Middleware
const errorHandler = require("./middleware/error");

const app = express();
const PORT = process.env.PORT || 7000;

// Connect to Database
connectDB();

//Dev logging using morgan
app.use(morgan("dev"));

// using body parser and cookie parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());

// Set Security headers
app.use(helmet());

// prevent xss attacks
app.use(xss());

// sanitize everything Protext from noSQL injection
app.use(mongoSanitize());

// Rate limit 100 requests per 10 minutes
const limiter = expressRateLimit({
	windowMs: 10 * 60 * 1000, // 10 minutes
	max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// prevent http params pollution attack
app.use(hpp());

// Using CORS middleware to allow other domains to use our resources
app.use(cors());

// Mount routes
app.use("/api/v1/products", products);
app.use("/api/v1/auth", auth);
app.use("/api/v1/reviews", reviews);

// Using Middleware
app.use(errorHandler);

const server = app.listen(PORT, () => {
	console.log(`App listening on port ${PORT}`.yellow.bold);
});

// Handle Unhadled Promise rejections
process.on("unhandledRejection", (err, Promise) => {
	console.log(`Error: ${err}`.red.bgCyan);
	// Close server and exit with 1
	server.close(() => process.exit(1));
});
