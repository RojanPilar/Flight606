const Flight = require("../models/Flight");
const Aircraft = require("../models/Aircraft");
const Airline = require("../models/Airline");
const Airport = require("../models/Airport");
const Booking = require("../models/Booking");
const Seat = require("../models/Seat");
const { createNotification } = require("./notification");
const { errorHandler } = require("../auth");



const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F'];
const BUSINESS_ROWS = 2;
const SEATS_PER_ROW = 6;

const generateSeatDocuments = (flightId, totalSeats) => {
	const seats = [];

	for (let i = 0; i < totalSeats; i++) {
		const row = Math.floor(i / SEATS_PER_ROW) + 1;
		const col = COLUMNS[i % SEATS_PER_ROW];

		seats.push({
			flightId,
			seatNumber: `${row}${col}`,
			class: row <= BUSINESS_ROWS ? 'business' : 'economy',
			isOccupied: false,
			isActive: true
		});
	}

	return seats;
};


// USER LEVEL ACCESS

module.exports.searchFlights = (req, res) => {
	if (!req.query.originAirportId) {
		return res.status(400).send({ message: "Origin Airport ID required" });
	}
	if (!req.query.destinationAirportId) {
		return res.status(400).send({ message: "Destination Airport ID required" });
	}
	if (!req.query.departureDate) {
		return res.status(400).send({ message: "Departure date required" });
	}

	const startOfDay = new Date(req.query.departureDate);
	startOfDay.setUTCHours(0, 0, 0, 0);
	const endOfDay = new Date(req.query.departureDate);
	endOfDay.setUTCHours(23, 59, 59, 999);

	return Flight.find({
		originAirportId: req.query.originAirportId,
		destinationAirportId: req.query.destinationAirportId,
		departureTime: { $gte: startOfDay, $lte: endOfDay },
		isActive: true,
		status: "scheduled"
	})
	.populate("originAirportId")
	.populate("destinationAirportId")
	.populate("airlineId")
	.then(result => {
		if (result.length === 0) {
			return res.status(404).send({ message: "No flights found for this date" });
		}
		return res.status(200).send({
			message: "Flights found",
			flights: result
		});
	})
	.catch(err => errorHandler(err, req, res));
};

module.exports.getFlightById = (req, res) => {
	return Flight.findOne({
		_id: req.params.id,
		isActive: true
	})
	.populate("originAirportId")
	.populate("destinationAirportId")
	.populate("airlineId")
	.then(result => {
		if (!result) {
			return res.status(404).send({ message: "No flight found" });
		}
		return res.status(200).send({
			message: "Flight found",
			result
		});
	})
	.catch(err => errorHandler(err, req, res));
};

module.exports.getFlightStatus = (req, res) => {
	const flightNumber = (req.params.flightNumber || "").trim().toUpperCase();

	if (!flightNumber) {
		return res.status(400).send({ message: "Flight number is required" });
	}

	return Flight.findOne({ flightNumber })
		.populate("originAirportId")
		.populate("destinationAirportId")
		.populate("airlineId")
		.then(result => {
			if (!result) {
				return res.status(404).send({ message: "No flight found with that flight number" });
			}
			return res.status(200).send({
				message: "Flight found",
				result
			});
		})
		.catch(err => errorHandler(err, req, res));
};


// ADMIN LEVEL ACCESS

module.exports.createFlight = (req, res) => {
	const { airlineId, aircraftId, originAirportId, destinationAirportId, flightNumber, departureTime, arrivalTime, basePrice, businessPrice, originTerminal, destinationTerminal } = req.body;

	if (!airlineId) {
		return res.status(400).send({ message: "Airline ID required" });
	}
	if (!aircraftId) {
		return res.status(400).send({ message: "Aircraft ID required" });
	}
	if (!originAirportId) {
		return res.status(400).send({ message: "Origin Airport ID required" });
	}
	if (!destinationAirportId) {
		return res.status(400).send({ message: "Destination Airport ID required" });
	}
	if (!flightNumber) {
		return res.status(400).send({ message: "Flight number required" });
	}
	if (!departureTime) {
		return res.status(400).send({ message: "Departure Time required" });
	}
	if (!arrivalTime) {
		return res.status(400).send({ message: "Arrival Time required" });
	}
	if (basePrice === undefined || basePrice === null) {
		return res.status(400).send({ message: "Economy price (basePrice) required" });
	}
	if (businessPrice === undefined || businessPrice === null) {
		return res.status(400).send({ message: "Business class price (businessPrice) required" });
	}
	if (businessPrice <= basePrice) {
		return res.status(400).send({ message: "Business class price must be greater than economy price" });
	}

	return Airline.findById(airlineId)
		.then(airline => {
			if (!airline) {
				return res.status(404).send({ message: "Airline not found" });
			}
			if (!airline.isActive) {
				return res.status(400).send({ message: "Cannot assign an inactive airline" });
			}

			return Aircraft.findById(aircraftId)
				.then(aircraft => {
					if (!aircraft) {
						return res.status(404).send({ message: "Aircraft not found" });
					}
					if (!aircraft.isActive) {
						return res.status(400).send({ message: "Cannot assign an inactive aircraft" });
					}

					return Airport.findById(originAirportId)
						.then(originAirport => {
							if (!originAirport) {
								return res.status(404).send({ message: "Origin airport not found" });
							}
							if (!originAirport.isActive) {
								return res.status(400).send({ message: "Origin airport is inactive" });
							}

							return Airport.findById(destinationAirportId)
								.then(destinationAirport => {
									if (!destinationAirport) {
										return res.status(404).send({ message: "Destination airport not found" });
									}
									if (!destinationAirport.isActive) {
										return res.status(400).send({ message: "Destination airport is inactive" });
									}

									return Flight.findOne({ flightNumber })
										.then(existingFlight => {
											if (existingFlight) {
												return res.status(409).send({ message: "Flight number already exists" });
											}

											const newFlight = new Flight({
												airlineId,
												aircraftId,
												originAirportId,
												destinationAirportId,
												flightNumber,
												departureTime,
												arrivalTime,
												status: "scheduled",
												basePrice,
												businessPrice,
												originTerminal: originTerminal || null,
												destinationTerminal: destinationTerminal || null,
												isActive: true
											});

											return newFlight.save()
												.then(savedFlight => {
													const seatDocuments = generateSeatDocuments(
														savedFlight._id,
														aircraft.totalSeats
													);

													return Seat.insertMany(seatDocuments)
														.then(seats => {
															return res.status(201).send({
																message: "Flight created successfully",
																result: savedFlight,
																seatsGenerated: seats.length
															});
														});
												});
										});
								});
						});
				});
		})
		.catch(err => errorHandler(err, req, res));
};

module.exports.getAllFlights = (req, res) => {
	return Flight.find()
		.then(result => {
			if (result.length === 0) {
				return res.status(404).send({ message: "No flights found" });
			}
			return res.status(200).send({
				message: "Flights found",
				result
			});
		})
		.catch(err => errorHandler(err, req, res));
};

module.exports.updateFlight = (req, res) => {
	const { airlineId, aircraftId, originAirportId, destinationAirportId, flightNumber, departureTime, arrivalTime, status, basePrice, businessPrice, originTerminal, destinationTerminal } = req.body;

	if (basePrice !== undefined && businessPrice !== undefined && businessPrice <= basePrice) {
		return res.status(400).send({ message: "Business class price must be greater than economy price" });
	}

	const updates = {};
	if (airlineId !== undefined)             updates.airlineId             = airlineId;
	if (aircraftId !== undefined)            updates.aircraftId            = aircraftId;
	if (originAirportId !== undefined)       updates.originAirportId       = originAirportId;
	if (destinationAirportId !== undefined)  updates.destinationAirportId  = destinationAirportId;
	if (flightNumber !== undefined)          updates.flightNumber          = flightNumber;
	if (departureTime !== undefined)         updates.departureTime         = departureTime;
	if (arrivalTime !== undefined)           updates.arrivalTime           = arrivalTime;
	if (status !== undefined)                updates.status                = status;
	if (basePrice !== undefined)             updates.basePrice             = basePrice;
	if (businessPrice !== undefined)         updates.businessPrice         = businessPrice;
	if (originTerminal !== undefined)        updates.originTerminal        = originTerminal || null;
	if (destinationTerminal !== undefined)   updates.destinationTerminal   = destinationTerminal || null;

	if (Object.keys(updates).length === 0) {
		return res.status(400).send({ message: "At least one field is required to update" });
	}

	return Flight.findByIdAndUpdate(
		req.params.id,
		updates,
		{ new: true }
	)
	.then(result => {
		if (!result) {
			return res.status(404).send({ message: "Flight not found" });
		}

		if (status === "delayed" || status === "cancelled") {
			Booking.find({ flightId: result._id, isActive: true })
				.then(bookings => {
					bookings.forEach(booking => {
						createNotification({
							userId: booking.userId,
							guestEmail: booking.guestEmail,
							type: "flight_status_change",
							message: `Flight ${result.flightNumber} has been ${status}.`,
							referenceId: result._id,
							referenceModel: "Flight"
						})
						.catch(err => console.error("Notification failed:", err));
					});
				})
				.catch(err => console.error("Booking lookup failed:", err));
		}

		return res.status(200).send({
			message: "Flight updated successfully",
			result
		});
	}) 
	.catch(err => errorHandler(err, req, res)); 
};

module.exports.deactivateFlight = (req, res) => {
	return Flight.findById(req.params.id)
		.then(flight => {
			if (!flight) {
				return res.status(404).send({ message: "Flight not found" });
			}
			if (!flight.isActive) {
				return res.status(400).send({ message: "Flight is already deactivated" });
			}

			return Flight.findByIdAndUpdate(
				req.params.id,
				{ isActive: false },
				{ new: true }
			)
			.then(result => {
				return Seat.updateMany(
					{ flightId: req.params.id },
					{ isActive: false }
				)
				.then(() => {
					return res.status(200).send({
						message: "Flight deactivated successfully",
						result
					});
				});
			});
		})
		.catch(err => errorHandler(err, req, res));
};

module.exports.reactivateFlight = (req, res) => {
	return Flight.findById(req.params.id)
		.then(flight => {
			if (!flight) {
				return res.status(404).send({ message: "Flight not found" });
			}
			if (flight.isActive) {
				return res.status(400).send({ message: "Flight is already active" });
			}

			return Flight.findByIdAndUpdate(
				req.params.id,
				{ isActive: true },
				{ new: true }
			)
			.then(result => {
				return Seat.updateMany(
					{ flightId: req.params.id, isOccupied: false },
					{ isActive: true }
				)
				.then(() => {
					return res.status(200).send({
						message: "Flight reactivated successfully",
						result
					});
				});
			});
		})
		.catch(err => errorHandler(err, req, res));
};