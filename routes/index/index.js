const express = require('express');

const index = require('./index.controller');

const router = express.Router();

router.get('/', index);

module.exports = router;
