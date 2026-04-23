const express = require('express');
const router = express.Router();
const upload = require('../utils/upload');
const { uploadCategoryImage } = require('../controllers/uploadController');

router.post('/category-image', upload.single('image'), uploadCategoryImage);

module.exports = router;
