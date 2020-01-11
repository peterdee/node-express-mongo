const express = require('express');

const registration = require('./registration.controller');

const router = express.Router();

router.get('/', registration);

module.exports = router;
