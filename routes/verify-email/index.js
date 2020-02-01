const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const sendVerificationLink = require('./sendVerificationLink.controller');
const verifyCode = require('./verifyCode.controller');

const router = express.Router();

router.get('/', authenticate, sendVerificationLink);
router.post('/', verifyCode);

module.exports = router;
