/**
 * Search middleware
 * @param req {object} - request object
 * @param res {object} - response object
 * @param next {*} - continue to the next controller or middleware
 * @returns {*}
 */
module.exports = (req, res, next) => {
  const { query: { search: value = '' } = {} } = req;
  req.search = value;

  // continue
  return next();
};
