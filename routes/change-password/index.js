const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const changePassword = require('./changePassword.controller');

const router = express.Router();

router.post('/', authenticate, changePassword);

module.exports = router;
