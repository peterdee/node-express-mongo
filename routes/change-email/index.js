const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const sendVerificationLink = require('./sendVerificationLink.controller');
const verifyCode = require('./verifyCode.controller');

const router = express.Router();

router.post('/send-link', authenticate, sendVerificationLink);
router.post('/verify-code', verifyCode);

module.exports = router;
