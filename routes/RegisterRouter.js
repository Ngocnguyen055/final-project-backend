const express = require("express");
const router = express.Router();
const User = require("../db/userModel.js");

// POST /user - Register a new user (public, no auth required)
router.post("/", async function (request, response) {
  const { login_name, password, first_name, last_name, location, description, occupation } = request.body;

  // Validate required fields
  if (!login_name || login_name.trim() === "") {
    return response.status(400).send("login_name is required");
  }
  if (!password || password.trim() === "") {
    return response.status(400).send("password is required");
  }
  if (!first_name || first_name.trim() === "") {
    return response.status(400).send("first_name is required");
  }
  if (!last_name || last_name.trim() === "") {
    return response.status(400).send("last_name is required");
  }

  try {
    // Check if login_name already exists
    const existingUser = await User.findOne({ login_name: login_name });
    if (existingUser) {
      return response.status(400).send("login_name already exists");
    }

    // Create new user with plain text password
    const newUser = await User.create({
      login_name: login_name,
      password: password,
      first_name: first_name,
      last_name: last_name,
      location: location || "",
      description: description || "",
      occupation: occupation || "",
    });

    response.status(200).json({
      _id: newUser._id,
      login_name: newUser.login_name,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
    });
  } catch (error) {
    console.error("Registration error:", error);
    response.status(500).send("Internal Server Error");
  }
});

module.exports = router;
