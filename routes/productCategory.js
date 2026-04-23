const express = require("express");
const router = express.Router();
const {
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} = require("../controllers/productCategory/productCategory");

// Admin-only routes
router.post("/", createProductCategory);
router.patch("/:id", updateProductCategory);
router.delete("/:id", deleteProductCategory);

module.exports = router;
