const express = require('express');

const registration = require('./registration.controller');

const router = express.Router();

router.post('/', registration);

module.exports = router;
