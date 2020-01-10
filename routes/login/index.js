const express = require('express');

const login = require('./login.controller');

const router = express.Router();

router.post('/', login);

module.exports = router;
