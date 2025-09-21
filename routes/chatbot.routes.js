const express = require('express')
const chatBot = require('../controllers/chat-bot.controller')
const router = express.Router()


router.post('/chat',chatBot)

  
module.exports = router