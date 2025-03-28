const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User"); 
const router = express.Router();
const JWT_SECRET = "Splendid_Ganesha"; 
const nodemailer = require("nodemailer");

//Configuring nodemailer to make the forward password functionality
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});
// ROUTE: Create a user using POST "/api/auth/createuser" - No login required
router.post(
  "/createuser",
  [
    body("name", "Name must be at least 3 characters").isLength({ min: 3 }),
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password must be at least 5 characters").isLength({ min: 5 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if user already exists
      let existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);

      // Create the user
      const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secPass,
      });

      // Create JWT token (default expiration)
      const data = { user: { id: user.id } };
      const authtoken = jwt.sign(data, JWT_SECRET, { expiresIn: "1h" });

      res.status(200).json({ authtoken });
    } catch (error) {
      console.error("Error in /createuser:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ROUTE: Login existing user
router.post(
  "/login",
  [
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { email, password, remember } = req.body; // Expecting a 'remember' field
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: "Invalid credentials" });
      }
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        return res.status(400).json({ error: "Invalid credentials" });
      }
      const payload = { user: { id: user._id } };

      // Set expiration based on "remember me" checkbox
      const tokenExpiry = remember ? "365d" : "1h";
      const authtoken = jwt.sign(payload, JWT_SECRET, { expiresIn: tokenExpiry });
      res.json({ authtoken });
    } catch (error) {
      console.error("Error in /login:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ROUTE: Forgot Password - Request a password reset link
router.post(
  "/forgotpassword",
  [body("email", "Enter a valid email").isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { email } = req.body;
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: "User with this email does not exist" });
      }
      // Generate a reset token and set expiration (1 hour)
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiration = Date.now() + 3600000; // 1 hour from now

      user.resetToken = resetToken;
      user.resetTokenExpiration = resetTokenExpiration;
      await user.save();

      // Construct the reset link
      const resetLink = `https://presenze-plum.netlify.app/resetpassword?token=${resetToken}`;

      // Define the email options
      const mailOptions = {
        from: '"Your App Name" <no-reply@yourdomain.com>', // sender address
        to: email, // recipient address
        subject: "Password Reset Request",
        text: `You requested a password reset. Click on the link to reset your password: ${resetLink}\n\nIf you did not request this, please ignore this email.`,
        // You can also add html if you prefer:
        // html: `<p>You requested a password reset.</p><p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
      };

      // Send the email
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("Error sending email:", err);
          return res.status(500).json({ error: "Error sending password reset email" });
        }
        console.log("Password reset email sent:", info.response);
        res.json({ message: "Password reset link sent to email" });
      });
    } catch (error) {
      console.error("Error in /forgotpassword:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ROUTE: Reset Password - Update password using the reset token
router.post(
  "/resetpassword",
  [
    body("token", "Token is required").not().isEmpty(),
    body("newPassword", "Password must be at least 5 characters").isLength({ min: 5 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { token, newPassword } = req.body;
      // Find the user with the valid, unexpired reset token
      let user = await User.findOne({
        resetToken: token,
        resetTokenExpiration: { $gt: Date.now() },
      });
      if (!user) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }
      // Hash the new password and update the user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;
      user.resetToken = undefined;
      user.resetTokenExpiration = undefined;
      await user.save();

      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Error in /resetpassword:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;