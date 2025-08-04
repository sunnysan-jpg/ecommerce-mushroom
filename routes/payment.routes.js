const express = require('express')
const { authMiddleware } = require('../middleware/auth.middleware')
const {createPayment, verifyPayment} = require('../controllers/payment.controller')
const router = express.Router()


router.post('/create',createPayment)
router.post('/verify-payment',verifyPayment)


module.exports = router