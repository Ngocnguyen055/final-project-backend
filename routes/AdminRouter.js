const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../db/userModel.js");
const { JWT_SECRET, authMiddleware } = require("../middleware/authMiddleware");

// POST /admin/login
router.post("/login", async function (request, response) {
  const { login_name, password } = request.body;

  if (!login_name || !password) {
    return response.status(400).send("login_name and password are required");
  }

  try {
    const user = await User.findOne({ login_name: login_name });

    if (!user) {
      return response.status(400).send("Invalid login_name");
    }

    // Plain text password comparison
    if (user.password !== password) {
      return response.status(400).send("Invalid password");
    }

    // Create JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "24h",
    });

    response.status(200).json({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      login_name: user.login_name,
      token: token,
    });
  } catch (error) {
    console.error("Login error:", error);
    response.status(500).send("Internal Server Error");
  }
});

// POST /admin/logout
router.post("/logout", authMiddleware, function (request, response) {
  // With JWT, logout is handled client-side by deleting the token.
  // This endpoint just confirms the user was logged in (valid token).
  response.status(200).send("Logged out successfully");
});

module.exports = router;
