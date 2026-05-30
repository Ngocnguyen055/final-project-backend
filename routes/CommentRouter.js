const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Photo = require("../db/photoModel");

// GET /commentsOfUser/:id - Get all comments by a user
router.get("/commentsOfUser/:id", async function (request, response) {
  const id = request.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return response.status(400).send("ID người dùng không hợp lệ");
  }

  try {
    const photos = await Photo.find({ "comments.user_id": id }).select(
      "user_id file_name comments"
    );
    let userComments = [];

    photos.forEach((photo) => {
      if (photo.comments) {
        photo.comments.forEach((c) => {
          if (c.user_id.toString() === id) {
            userComments.push({
              _id: c._id,
              comment: c.comment,
              date_time: c.date_time,
              photo_file_name: photo.file_name,
              photo_id: photo._id,
              photo_owner_id: photo.user_id,
            });
          }
        });
      }
    });

    response.status(200).send(userComments);
  } catch (error) {
    console.error("Lỗi lấy comments:", error);
    response.status(500).send("Lỗi server nội bộ");
  }
});

// POST /commentsOfPhoto/:photo_id - Add a comment to a photo
router.post("/commentsOfPhoto/:photo_id", async function (request, response) {
  const photoId = request.params.photo_id;
  const { comment } = request.body;
  const userId = request.userId; // Set by auth middleware

  if (!comment || comment.trim() === "") {
    return response.status(400).send("Comment cannot be empty");
  }

  if (!mongoose.Types.ObjectId.isValid(photoId)) {
    return response.status(400).send("Invalid photo ID");
  }

  try {
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return response.status(400).send("Photo not found");
    }

    const newComment = {
      comment: comment,
      date_time: new Date(),
      user_id: userId,
    };

    photo.comments.push(newComment);
    await photo.save();

    response.status(200).json(newComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    response.status(500).send("Internal Server Error");
  }
});

module.exports = router;
