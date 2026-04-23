const express = require("express");
const router = express.Router();
const colorsController = require("../controllers/colorsController");
const authMiddleware = require("../middleware/authMiddleware");
const { mainAdminOnly } = require("../middleware/roleMiddleware");

// Admin-only routes (create, delete)
router.post("/", authMiddleware, mainAdminOnly, colorsController.createColor);
router.delete("/:id", authMiddleware, mainAdminOnly, colorsController.deleteColor);

module.exports = router;
