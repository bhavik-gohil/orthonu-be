const { Colors } = require("../models");

const getAllColors = async (req, res) => {
  try {
    const colors = await Colors.findAll();
    return res.status(200).json(colors);
  } catch (err) {
    console.error("Get all colors error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const createColor = async (req, res) => {
  const { color, colorName } = req.body;
  if (!color) {
    return res.status(400).json({ message: "Color hex value is required." });
  }
  if (!colorName) {
    return res.status(400).json({ message: "colorName is required." });
  }

  try {
    const newColor = await Colors.create({
      color: color,
      colorName: colorName, // Using hex as name as per requirement "only accept hash value"
    });
    return res.status(201).json(newColor);
  } catch (err) {
    console.error("Create color error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const deleteColor = async (req, res) => {
  const { id } = req.params;
  try {
    const color = await Colors.findByPk(id);
    if (!color) {
      return res.status(404).json({ message: "Color not found." });
    }
    await color.destroy();
    return res.status(200).json({ message: "Color deleted successfully." });
  } catch (err) {
    console.error("Delete color error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  getAllColors,
  createColor,
  deleteColor,
};
