const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const models = require("../modelData/models.js");

const User = require("../db/userModel.js");
const Photo = require("../db/photoModel.js");
const SchemaInfo = require("../db/schemaInfo.js");

const versionString = "1.0";

async function dbLoad() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("Successfully connected to MongoDB Atlas!");
  } catch (error) {
    console.log("Unable connecting to MongoDB Atlas!");
    return;
  }

  await User.deleteMany({});
  await Photo.deleteMany({});
  await SchemaInfo.deleteMany({});

  const userModels = models.userListModel();
  const mapFakeId2RealId = {};
  for (const user of userModels) {
    userObj = new User({
      first_name: user.first_name,
      last_name: user.last_name,
      location: user.location,
      description: user.description,
      occupation: user.occupation,
      login_name: user.login_name,
      password: user.password,
    });

    try {
      await userObj.save();
      mapFakeId2RealId[user._id] = userObj._id;
      user.objectID = userObj._id;
      console.log(
        "Adding user:",
        user.first_name + " " + user.last_name,
        " with login_name:",
        user.login_name,
        " and ID ",
        user.objectID
      );
    } catch (error) {
      console.error("Error create user", error);
    }
  }

  const photoModels = [];
  const userIDs = Object.keys(mapFakeId2RealId);
  userIDs.forEach(function (id) {
    photoModels.push(...models.photoOfUserModel(id));
  });
  for (const photo of photoModels) {
    photoObj = await Photo.create({
      file_name: photo.file_name,
      date_time: photo.date_time,
      user_id: mapFakeId2RealId[photo.user_id],
    });
    photo.objectID = photoObj._id;
    if (photo.comments) {
      photo.comments.forEach(function (comment) {
        photoObj.comments = photoObj.comments.concat([
          {
            comment: comment.comment,
            date_time: comment.date_time,
            user_id: comment.user.objectID,
          },
        ]);
        console.log(
          "Adding comment of length %d by user %s to photo %s",
          comment.comment.length,
          comment.user.objectID,
          photo.file_name
        );
      });
    }

    try {
      await photoObj.save();
      console.log(
        "Adding photo:",
        photo.file_name,
        " of user ID ",
        photoObj.user_id
      );
    } catch (error) {
      console.error("Error create photo", error);
    }
  }

  try {
    schemaInfo = await SchemaInfo.create({
      version: versionString,
    });
    console.log("SchemaInfo object created with version ", schemaInfo.version);
  } catch (error) {
    console.error("Error create schemaInfo", error);
  }

  console.log("\n=== Seed complete! ===");
  console.log("All users have password: 'weak'");
  console.log("Login names: ian, ellen, peregrin, rey, april, john\n");

  mongoose.disconnect();
}

// Run if called directly
if (require.main === module) {
  dbLoad();
} else {
  module.exports = dbLoad;
}
