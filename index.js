// IMPORTS
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const mongoose = require("mongoose");

// ROUTE IMPORTS
const userRoutes = require("./routes/user");
const aircraftRoutes = require("./routes/aircraft");
const airlineRoutes = require("./routes/airline");
const airportRoutes = require("./routes/airport");
const bookingRoutes = require("./routes/booking");
const bookingPassengerRoutes = require("./routes/bookingPassenger");
const flightRoutes = require("./routes/flight");
const passengerRoutes = require("./routes/passenger");
const paymentRoutes = require("./routes/payment");
const itineraryRoutes = require("./routes/itinerary");
const notificationRoutes = require("./routes/notification");
const seatRoutes = require("./routes/seat");
const cors = require('cors');
const corsOptions = {
    origin: ["http://localhost:5173", "http://localhost:8000"],
    credentials: true,
    optionsSuccessStatus: 200
};

// APP INITIALIZATION 
const app = express();
app.use(cors(corsOptions));

//DATABASE CONNECTION
mongoose.connect(process.env.MONGODB_STRING);
let db = mongoose.connection;
db.on("error", (err) => console.error("Connection error:", err));
db.once("open", () => console.log("Now connected to MongoDB Atlas."));

// MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

// ROUTES
app.use("/users", userRoutes);
app.use("/aircrafts", aircraftRoutes);
app.use("/airlines", airlineRoutes);
app.use("/airports", airportRoutes);
app.use("/bookings", bookingRoutes);
app.use("/bookingpassengers", bookingPassengerRoutes);
app.use("/flights", flightRoutes);
app.use("/passengers", passengerRoutes);
app.use("/payments", paymentRoutes);
app.use("/itineraries", itineraryRoutes);
app.use("/notifications", notificationRoutes);
app.use("/seats", seatRoutes);



// SERVER START
if(require.main === module) {
	app.listen(process.env.PORT, () => console.log(`Server running at port ${process.env.PORT}`));
}

module.exports = {app, mongoose};