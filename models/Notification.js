const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    guestEmail: {
        type: String,
        default: null,
        lowercase: true,
        trim: true
    },

    type: {
        type: String,
        enum: ["booking_confirmed", "flight_status_change", "itinerary_created"],
        required: [true, "Notification type is required"]
    },

    message: {
        type: String,
        required: [true, "Notification message is required"]
    },

    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },

    referenceModel: {
        type: String,
        enum: ["Booking", "Flight", "Itinerary"],
        default: null
    },

    isRead: {
        type: Boolean,
        default: false
    },

    emailSent: {
        type: Boolean,
        default: false
    },

    emailSentAt: {
        type: Date,
        default: null
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);