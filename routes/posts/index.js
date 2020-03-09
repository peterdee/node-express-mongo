const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const deletePost = require('./deletePost.controller');
const getAllPosts = require('./getAllPosts.controller');
const getSinglePost = require('./getSinglePost.controller');
const paginate = require('../../middlewares/paginate');
const search = require('../../middlewares/search');
const softAuthenticate = require('../../middlewares/softAuthenticate');

const router = express.Router();

router.get('/all', softAuthenticate, paginate, search, getAllPosts);
router.delete('/delete/:id', authenticate, deletePost);
router.get('/id/:id', softAuthenticate, getSinglePost);

module.exports = router;
