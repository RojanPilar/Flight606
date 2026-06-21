const Airport = require("../models/Airport");
const { errorHandler } = require("../auth");

// USER LEVEL ACCESS
module.exports.getAirportById = (req, res) => {
	return Airport.findById(req.params.id)
	.then(result => {
		if (!result) {
			return res.status(404).send({ message: "No airport found"});
		}
		return res.status(200).send({
			message: "Airport found",
			result
		});
	})
	.catch(err=> errorHandler(err, req, res));  
};

module.exports.getAllAirports = (req, res) => {
	return Airport.find()
	.then(result => {
		if (result.length === 0) {
			return res.status(404).send({ message: "No airports found"});
		}
		return res.status(200).send({
			message: "Airports found",
			result
		});
	})
	.catch(err=> errorHandler(err, req, res));
};


// ADMIN LEVEL ACCESS 

module.exports.createAirport = (req, res) => {
    const { name, iataCode, city, country } = req.body;

    if (!name || !iataCode || !city || !country) {
    	return res.status(400).send({ message: "Airport name, IATA code, city and country are required"});
    }

    return Airport.findOne({
    	$or: [{ name },	{ iataCode }]
    })

    .then((existingAirport)=>{
    	if (existingAirport) {
    		const conflict = existingAirport.name === name ? "Name" : "IATA code";
            return res.status(409).send({ message: `${conflict} is already registered` });
    	}

    	const newAirport = new Airport({
    		name,
    		iataCode,
    		city,
    		country,
    		isActive: true
    	});

    	return newAirport.save()
            .then((result) => {
                return res.status(201).send({ 
                    message: "Airport registered successfully",
                    result 
                });
            });
    })
    .catch(err => errorHandler(err, req, res));
};

module.exports.deactivateAirport = (req, res) => {
    return Airport.findById(req.params.id) 
        .then(airport => {
            if (!airport) {
                return res.status(404).send({ message: "Airport not found" });
            }
            if (!airport.isActive) { 
                return res.status(400).send({ message: "Airport is already deactivated" });
            }

            return Airport.findByIdAndUpdate(
                req.params.id,
                { isActive: false },
                { new: true }
            )
                .then(result => res.status(200).send({ 
                    message: "Airport deactivated successfully", 
                    result 
                }));
        })
        .catch(err => errorHandler(err, req, res));
};

module.exports.reactivateAirport = (req, res) => {
    return Airport.findById(req.params.id) 
        .then(airport => {
            if (!airport) {
                return res.status(404).send({ message: "Airport not found" });
            }
            if (airport.isActive) { 
                return res.status(400).send({ message: "Airport is already active" });
            }

            return Airport.findByIdAndUpdate(
                req.params.id,
                { isActive: true },
                { new: true }
            )
                .then(result => res.status(200).send({ 
                    message: "Airport reactivated successfully", 
                    result 
                }));
        })
        .catch(err => errorHandler(err, req, res));
};