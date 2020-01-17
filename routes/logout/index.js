const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const logoutFromAllDevices = require('./logoutFromAllDevices.controller');
const logoutFromASingleDevice = require('./logoutFromASingleDevice.controller');

const router = express.Router();

router.get('/all', authenticate, logoutFromAllDevices);
router.post('/', authenticate, logoutFromASingleDevice);

module.exports = router;
