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

const uploadFields = upload.fields([
    { name: "standardImages", maxCount: 10 },
    { name: "extraFiles", maxCount: 5 },
]);

router.post("/create", uploadFields, createProduct);
router.get("/", getProducts);
router.get("/:id", getProduct);
router.patch("/:id", uploadFields, updateProduct);
router.delete("/:id", deleteProduct);
router.post("/:id/variants", uploadFields, addVariant);
router.patch("/:id/default-variant", updateDefaultVariant);

module.exports = router;
