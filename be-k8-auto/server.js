const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();

// Allow CORS only for your deployed frontend
const corsOptions = {
  origin: ["https://k8-automate.vercel.app", "http://localhost:5173"], // Replace with the correct frontend URL
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions)); // Apply CORS with specific options

app.use(express.json());

app.get("/health", async (req, res) => {
  res.json("I am healthy :)");
});

app.post("/authenticate", async (req, res) => {
  const { code } = req.body;

  const params = {
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    code,
  };

  console.log(params);

  try {
    const response = await axios.post("https://github.com/login/oauth/access_token", params, {
      headers: {
        Accept: "application/json",
      },
    });

    res.json(response.data); // Returns the access token to the frontend
  } catch (error) {
    console.error("Error fetching access token:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Authentication failed" });
  }
});

app.listen(3001, () => console.log("Server running on port 3001"));
