const express = require('express');

const sendVerificationLink = require('./sendVerificationLink.controller');

const router = express.Router();

router.get('/', sendVerificationLink);

module.exports = router;
