const express = require('express');

const sendRecoveryEmail = require('./sendRecoveryEmail.controller');
const verifyRecoveryCode = require('./verifyRecoveryCode.controller');

const router = express.Router();

router.post('/send-email', sendRecoveryEmail);
router.post('/verify-code', verifyRecoveryCode);

module.exports = router;
