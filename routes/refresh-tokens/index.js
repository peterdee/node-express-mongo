const express = require('express');

const refreshTokens = require('./refreshTokens.controller');

const router = express.Router();

router.post('/', refreshTokens);

module.exports = router;
