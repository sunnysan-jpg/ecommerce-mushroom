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
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    try {

      const profile = req.user;

      const email = profile.emails?.[0]?.value;
      const name = profile.displayName;

      if (!email) {
        return res.status(400).send("Google account has no email");
      }

      const token = jwt.sign(
        { email, name },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.redirect(`${process.env.FRONTEND_URL}/googleauthsuccess?token=${token}`);

    } catch (err) {
      console.error("Google callback error:", err);
      res.status(500).send(err.message);
    }
  }
);



module.exports = router;
