const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const getAccount = require('./getAccount.controller');
const updateAccount = require('./updateAccount.controller');

const router = express.Router();

router.get('/', authenticate, getAccount);
router.patch('/', authenticate, updateAccount);

module.exports = router;
