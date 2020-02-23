const { isNumber } = require('../services/utilities');
const { PAGINATION } = require('../config');

/**
 * Pagination middleware
 * @param req {object} - request object
 * @param res {object} - response object
 * @param next {*} - continue to the next controller or middleware
 * @returns {*}
 */
module.exports = (req, res, next) => {
  // get pagination values
  const { query: { limit: xLimit = '', page: xPage = '' } = {} } = req;
  const limit = (isNumber(xLimit) && Number(xLimit) > 0)
    ? Number(xLimit)
    : PAGINATION.limit;
  const page = (isNumber(xPage) && Number(xPage) >= 1)
    ? Number(xPage)
    : PAGINATION.page;

  // add pagination data to the request object
  req.pagination = {
    limit,
    offset: (limit * page) - limit,
    page,
  };

  // continue
  return next();
};
