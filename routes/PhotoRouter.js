const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const Photo = require("../db/photoModel.js");
const User = require("../db/userModel");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save uploaded photos to frontend/public/images
    const imagesDir = path.join(__dirname, "..", "..", "frontend", "public", "images");
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp + random + original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "upload_" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Only allow image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// GET /photosOfUser/:id - Get all photos of a user
router.get("/photosOfUser/:id", async (request, response) => {
  const id = request.params.id;
  const photos = await Photo.find({ user_id: id });

  if (!photos || photos.length === 0) {
    return response.status(400).send("Không tìm thấy ảnh cho user này");
  }

  const photosJSON = JSON.parse(JSON.stringify(photos));

  for (let i = 0; i < photosJSON.length; i++) {
    let photo = photosJSON[i];
    delete photo.__v;

    for (let j = 0; j < photo.comments.length; j++) {
      let comment = photo.comments[j];

      const commentUser = await User.findById(
        comment.user_id,
        "_id first_name last_name"
      );

      comment.user = commentUser;
      delete comment.user_id;
    }
  }

  response.status(200).send(photosJSON);
});

// POST /photos/new - Upload a new photo
router.post("/photos/new", upload.single("photo"), async (request, response) => {
  const userId = request.userId; // Set by auth middleware

  if (!request.file) {
    return response.status(400).send("No file uploaded");
  }

  try {
    const newPhoto = await Photo.create({
      file_name: request.file.filename,
      date_time: new Date(),
      user_id: userId,
      comments: [],
    });

    response.status(200).json(newPhoto);
  } catch (error) {
    console.error("Error uploading photo:", error);
    response.status(500).send("Internal Server Error");
  }
});

module.exports = router;
