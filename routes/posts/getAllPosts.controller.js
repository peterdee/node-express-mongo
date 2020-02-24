const { data, internalError } = require('../../services/responses');
const db = require('../../db');
const { formatPaginatedResponse } = require('../../services/utilities');
const { RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = require('../../config');

/**
 * Get all posts
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 */
module.exports = async (req, res) => {
  try {
    const { pagination, search } = req;

    const regExp = {
      $regex: search,
      $options: 'i',
    };
    const query = {
      $or: [
        {
          authorName: regExp,
        },
        {
          rawText: regExp,
        },
        {
          subtitle: regExp,
        },
        {
          title: regExp,
        },
      ],
      isDeleted: false,
    };
    const [count, posts] = await Promise.all([
      db.Post.countDocuments(query),
      db.Post.find(
        query,
        null,
        {
          limit: pagination.limit,
          skip: pagination.offset,
          sort: '-_id',
        },
      ).populate({
        path: 'authorId',
        select: 'avatarLink fullName',
      }),
    ]);
    const formattedData = formatPaginatedResponse(count, posts, pagination);

    return data(req, res, rs[200], sm.ok, formattedData);
  } catch (error) {
    return internalError(req, res, error);
  }
};
