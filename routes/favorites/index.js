const express = require('express');

const addFavorite = require('./addFavorite.controller');
// const authenticate = require('../../middlewares/authenticate');
const deleteFavorite = require('./deleteFavorite.controller');

const router = express.Router();

router.post('/:id', /* authenticate, */ addFavorite);
router.delete('/:id', /* authenticate, */ deleteFavorite);

module.exports = router;
