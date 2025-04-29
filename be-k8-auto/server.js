const express = require("express");
const cors = require("cors");
const authRoute = require("./routes/authRoute"); 
const podsRoute = require("./routes/podsRoute"); 
require("dotenv").config();

const app = express();

const corsOptions = {
  origin: ["https://k8-automate.vercel.app", "http://localhost:5173"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json("I am healthy :)");
});

app.use("/api/auth", authRoute); // Use the auth route
app.use("/api/pods", podsRoute); // Use the auth route

app.listen(3001, () => console.log("Server running on port 3001"));
