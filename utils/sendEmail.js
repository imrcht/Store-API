const nodemailer = require("nodemailer");
const secrets = require("../secrets");

const sendEmail = async (options) => {
	// create transport
	var transport = nodemailer.createTransport({
		host: "smtp.mailtrap.io",
		port: 2525,
		auth: {
			user: "e0cc328edc80f1",
			pass: "d46d6975d563fe",
		},
	});

	var mailOptions = {
		from: `${secrets.from_name} <${secrets.from_email}>`,
		to: options.email,
		subject: options.subject,
		text: options.message,
	};

	const info = await transport.sendMail(mailOptions);

	console.log(`Message sent: ${info.messageId}`);
};

module.exports = sendEmail;
