const express = require("express");
const { fetchImages, fetchTags } = require("../controllers/podsController");
const router = express.Router();

router.get("/fetch-images", fetchImages);
router.get("/fetch-tags", fetchTags);

module.exports = router;
