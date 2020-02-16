const express = require('express');

const image = require('./image.controller');

const router = express.Router();

router.get('/:id', image);

module.exports = router;
