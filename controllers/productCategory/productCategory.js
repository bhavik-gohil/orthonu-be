const { ProductCategory } = require("../../models");
const {
  createProductCategorySchema,
  updateProductCategorySchema,
} = require("../../validation/productCategory");

const createProductCategory = async (req, res) => {
  try {
    const { error, value } = createProductCategorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const category = await ProductCategory.create(value);
    res.status(201).json(category);
  } catch (err) {
    console.error("Error creating product category:", err);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: err.message });
  }
};

const getProductCategory = async (req, res) => {
  try {
    const categories = await ProductCategory.findAll({
      order: [['productCategory', 'ASC']]
    });
    res.status(200).json(categories);
  } catch (err) {
    console.error("Error getting product categories:", err);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: err.message });
  }
};

const updateProductCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateProductCategorySchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const category = await ProductCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    await category.update(value);
    res.status(200).json(category);
  } catch (err) {
    console.error("Error updating product category:", err);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: err.message });
  }
};

const deleteProductCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await ProductCategory.findByPk(id);
    
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    await category.destroy();
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("Error deleting product category:", err);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: err.message });
  }
};

module.exports = {
  createProductCategory,
  getProductCategory,
  updateProductCategory,
  deleteProductCategory,
};
