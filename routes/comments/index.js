const express = require('express');

const addComment = require('./addComment.controller');
const authenticate = require('../../middlewares/authenticate');
const deleteComment = require('./deleteComment.controller');
const getComments = require('./getComments.controller');
const paginate = require('../../middlewares/paginate');

const router = express.Router();

router.post('/', authenticate, addComment);
router.delete('/:id', authenticate, deleteComment);
router.get('/:id', paginate, getComments);

module.exports = router;
