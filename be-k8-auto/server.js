const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/health", async (req, res) => {
  res.json({msg: "I am healthy :)"});
})


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
