const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const deleteAccount = require('./deleteAccount.controller');
const getAccount = require('./getAccount.controller');
const updateAccount = require('./updateAccount.controller');

const router = express.Router();

router.delete('/', authenticate, deleteAccount);
router.get('/', authenticate, getAccount);
router.patch('/', authenticate, updateAccount);

module.exports = router;
