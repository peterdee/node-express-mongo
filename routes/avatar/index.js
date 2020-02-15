const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const deleteAvatar = require('./deleteAvatar.controller');
const updateAvatar = require('./updateAvatar.controller');

const router = express.Router();

router.delete('/', authenticate, deleteAvatar);
router.patch('/', authenticate, updateAvatar);

module.exports = router;
