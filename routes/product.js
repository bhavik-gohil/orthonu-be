const express = require("express");
const router = express.Router();
const upload = require("../utils/upload");
const { createProduct } = require("../controllers/product/createProduct");
const { updateProduct } = require("../controllers/product/updateProduct");
const { deleteProduct } = require("../controllers/product/deleteProduct");
const { getProducts } = require("../controllers/product/getProducts");
const { getProduct } = require("../controllers/product/getProduct");
const { addVariant } = require("../controllers/product/addVariant");
const { updateDefaultVariant } = require("../controllers/product/updateDefaultVariant");
const { reorderProducts } = require("../controllers/product/reorderProducts");

// Using upload.any() to be more permissive with field names and avoid "MulterError: Unexpected field"
// We enforce field-specific logic and limits manually in the controllers.
const uploadMiddleware = upload.any();

router.post("/create", uploadMiddleware, createProduct);
router.patch("/reorder", reorderProducts);
router.get("/", getProducts);
router.get("/:id", getProduct);
router.patch("/:id", uploadMiddleware, updateProduct);
router.delete("/:id", deleteProduct);
router.post("/:id/variants", uploadMiddleware, addVariant);
router.patch("/:id/default-variant", updateDefaultVariant);

module.exports = router;
