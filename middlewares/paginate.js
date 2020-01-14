const { isNumber } = require('../services/utilities');
const { PAGINATION } = require('../config');

/**
 * Pagination middleware
 * @param req {object} - request object
 * @param res {object} - request object
 * @param next {*} - continue to the next controller or middleware
 * @returns {*}
 */
module.exports = (req, res, next) => {
  // get pagination values
  const { query: { xLimit = '', xPage = '' } = {} } = req;
  const limit = (isNumber(xLimit) && Number(xLimit) > 0)
    ? Number(xLimit)
    : PAGINATION.limit;
  const page = (isNumber(xPage) && Number(xPage) >= 1)
    ? Number(xPage)
    : PAGINATION.page;

  // add pagination data to request
  req.pagination = {
    limit,
    offset: (limit * page) - limit,
    page,
  };

  // continue
  return next();
};
