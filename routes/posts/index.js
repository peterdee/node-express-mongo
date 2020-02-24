const express = require('express');

// const authenticate = require('../../middlewares/authenticate');
const getAllPosts = require('./getAllPosts.controller.js');
const paginate = require('../../middlewares/paginate');
const search = require('../../middlewares/search');

const router = express.Router();

router.get('/', paginate, search, getAllPosts);

module.exports = router;
