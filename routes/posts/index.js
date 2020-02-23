const express = require('express');

// const authenticate = require('../../middlewares/authenticate');
const getAllPosts = require('./getAllPosts.controller.js');
const paginate = require('../../middlewares/paginate');

const router = express.Router();

router.get('/', paginate, getAllPosts);

module.exports = router;
