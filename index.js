const express = require("express");
const app = express();
const cors = require("cors");
const dbConnect = require("./db/dbConnect");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter");
const CommentRouter = require("./routes/CommentRouter");
const AdminRouter = require("./routes/AdminRouter");
const { authMiddleware } = require("./middleware/authMiddleware");

dbConnect();

app.use(cors());
app.use(express.json());

// ====== PUBLIC ROUTES (no auth required) ======
// Login & Logout
app.use("/admin", AdminRouter);

// Registration: POST /user (must be before the auth-protected /user routes)
const registerRouter = require("./routes/RegisterRouter");
app.use("/user", registerRouter);

// ====== PROTECTED ROUTES (auth required) ======
app.use("/user", authMiddleware, UserRouter);
app.use("/", authMiddleware, PhotoRouter);
app.use("/", authMiddleware, CommentRouter);

app.get("/", (request, response) => {
  response.send({ message: "Hello from photo-sharing app API!" });
});

app.listen(8081, () => {
  console.log("server listening on port 8081");
});
