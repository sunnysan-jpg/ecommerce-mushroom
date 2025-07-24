const multer = require('multer');
const storage = require('../config/cloudinary.config'); // Don't store on disk
const upload = multer({ storage });

module.exports = upload;
