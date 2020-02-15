const express = require('express');

const image = require('./image.controller');

const router = express.Router();

router.all('/:name', image);

module.exports = router;
