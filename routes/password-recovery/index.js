const express = require('express');

const sendRecoveryEmail = require('./sendRecoveryEmail.controller');
const submitNewPassword = require('./submitNewPassword.controller');

const router = express.Router();

router.post('/send-email', sendRecoveryEmail);
router.post('/submit-password', submitNewPassword);

module.exports = router;
