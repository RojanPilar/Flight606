const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		default: null
	},

	bookingId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Booking",
		required: [true, "Booking ID is required"]
	},

	paymentMethod: {
		type: String,
		required: [true, "Payment method is required"],
		enum: ["credit_card", "debit_card", "gcash", "cash"]
	},

	amount: {
		type: Number,
		required: [true, "Amount is required"],
		min: [0, "Amount cannot be negative"]
	},

	status: {
		type: String,
		enum: ["pending", "paid", "failed", "refunded"],
		default: "pending"
	},

	transactionId: {
		type: String,
		default: null,
		unique: true,
		sparse: true
	},

	paidAt: {
		type: Date,
		default: null
	}
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);