const express = require("express");
const paymentController = require("../controllers/payment");
const { verify, verifyAdmin } = require("../auth");
const router = express.Router();


// USER LEVEL ACCESS
router.post("/user/create-payment", verify, paymentController.createPaymentUser);

router.post("/guest/create-payment", paymentController.createPaymentGuest);

router.get("/user/my-payments", verify, paymentController.getMyPaymentsUser);

router.post("/guest/my-payments", paymentController.getMyPaymentsGuest);


// ADMIN LEVEL ACCESS
router.get("/get-all-payments", verify, verifyAdmin, paymentController.getAllPayments);

router.get("/get-payment/:id", verify, verifyAdmin, paymentController.getPaymentById);

router.patch("/update-payment-status/:id", verify, verifyAdmin, paymentController.updatePaymentStatus);


module.exports = router;