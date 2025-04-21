const { default: axios } = require("axios");

const authenticate = (req, res) => async (req, res) => {
    const { code } = req.body;
  
    const params = {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    };
  
    try {
      const response = await axios.post("https://github.com/login/oauth/access_token", params, {
        headers: {
          Accept: "application/json",
        },
      });
  
      res.json(response.data);
    } catch (error) {
      console.error("Error fetching access token:", error.response ? error.response.data : error.message);
      res.status(500).json({ error: "Authentication failed" });
    }
  }

  module.exports = {
    authenticate
  }