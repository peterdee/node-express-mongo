const express = require('express');

const image = require('./image.controller');

const router = express.Router();

router.get('/:name', image);

module.exports = router;
