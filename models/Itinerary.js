const mongoose = require("mongoose");

const itinerarySchema = new mongoose.Schema({
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

    bookings: [{
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: [true, "Booking ID is required"]
        },

        type: {
            type: String,
            enum: ["outbound", "return", "layover"],
            required: [true, "Flight type is required"]
        },

        gate: {
            type: String,
            default: null
        }
    }],

    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Itinerary", itinerarySchema);