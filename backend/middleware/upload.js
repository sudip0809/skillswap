const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
module.exports = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads'),
    filename: (req, file, cb) => cb(null, crypto.randomBytes(12).toString('hex') + path.extname(file.originalname))
  }),
  limits: { fileSize: 20 * 1024 * 1024 }
});
