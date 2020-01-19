const express = require('express');

const index = require('./index.controller');

const router = express.Router();

router.all('/', index);

module.exports = router;
