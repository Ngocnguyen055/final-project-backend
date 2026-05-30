const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../db/userModel.js");
const Photo = require("../db/photoModel.js");

// GET /user/list - Get list of all users
router.get("/list", async function (request, response) {
  try {
    const users = await User.find({}).select("_id first_name last_name");

    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const userObj = JSON.parse(JSON.stringify(user));

        userObj.photo_count = await Photo.countDocuments({ user_id: user._id });

        const photosWithUserComments = await Photo.find({
          "comments.user_id": user._id,
        });
        let commentCount = 0;
        photosWithUserComments.forEach((photo) => {
          photo.comments.forEach((c) => {
            if (c.user_id.toString() === user._id.toString()) {
              commentCount++;
            }
          });
        });
        userObj.comment_count = commentCount;

        return userObj;
      })
    );

    response.status(200).send(usersWithCounts);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách user:", error);
    response.status(500).send("Internal Server Error");
  }
});

// POST /user - Register a new user
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

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await User.create({
      login_name: login_name,
      password: hashedPassword,
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

// GET /user/:id - Get user details
router.get("/:id", async function (request, response) {
  const id = request.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return response.status(400).send("ID không hợp lệ");
  }

  try {
    const user = await User.findById(id).select(
      "_id first_name last_name location description occupation"
    );

    if (!user) {
      return response.status(400).send("Không tìm thấy người dùng");
    }

    response.status(200).send(user);
  } catch (error) {
    console.error("Lỗi lấy chi tiết user:", error);
    response.status(500).send("Internal Server Error");
  }
});

module.exports = router;
