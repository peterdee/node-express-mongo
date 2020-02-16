const express = require('express');
const multer = require('multer');

const authenticate = require('../../middlewares/authenticate');
const deleteAvatar = require('./deleteAvatar.controller');
const updateAvatar = require('./updateAvatar.controller');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.delete('/', authenticate, deleteAvatar);
router.patch('/', authenticate, upload.single('file'), updateAvatar);

module.exports = router;
