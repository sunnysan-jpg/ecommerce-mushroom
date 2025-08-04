const express = require('express')
const { authMiddleware } = require('../middleware/auth.middleware')
const createPayment = require('../controllers/payment.controller')
const router = express.Router()


router.post('/create',createPayment)


module.exports = router