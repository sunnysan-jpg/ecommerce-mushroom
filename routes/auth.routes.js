const express = require('express');
const passport = require("passport");
const router = express.Router();
const jwt = require('jsonwebtoken');
const { register, login, getProfile, adminlogin, googleSuccess } = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');


router.post('/register', register);
router.post('/login', login);
router.post('/adminlogin',adminlogin)
router.get('/profile', authMiddleware, getProfile);


// router.post('/logout', authenticateToken, authController.logout);
// router.post('/verify-otp',authController.verifyOtp);
// router.post('/send-otp',authController.sendOtp);

// google auth

router.get("/google", passport.authenticate("google", {
  scope: ["profile", "email"]
}));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  googleSuccess // 👈 this handles both login + register
);



module.exports = router;
