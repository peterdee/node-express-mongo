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

    // regular expression for the search
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

    // get post count and post data
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

    // count the comments and favorites for the posts
    const doc = '_doc';
    const postIds = posts.map(({ _id = '' }) => _id);
    const commentsCount = await Promise.all(postIds.map(
      (postId = '') => db.Comment.countDocuments({ postId }),
    ));
    const favoritesCount = await Promise.all(postIds.map(
      (postId = '') => db.Favorite.countDocuments({ postId }),
    ));

    // get all of the Favorite posts
    const favoritedPosts = (req.id && await Promise.all(postIds.map((id) => db.Favorite.findOne({
      isDeleted: false,
      postId: id,
      userId: req.id,
    })))).map(({ postId }) => postId) || [];

    // add the Favorite status
    const withFavorites = favoritedPosts.length === 0
      ? posts.map((post) => ({ ...post[doc] }))
      : posts.map((post) => {
        if (favoritedPosts.includes(post.id)) {
          return {
            ...post[doc],
            isFavorite: true,
          };
        }
        return { ...post[doc] };
      });

    // add counts
    const withCounts = withFavorites.map((post, i) => ({
      ...post,
      comments: commentsCount[i],
      favorites: favoritesCount[i],
    }));

    // format the response data
    const formattedData = formatPaginatedResponse(count, withCounts, pagination);

    return data(req, res, rs[200], sm.ok, formattedData);
  } catch (error) {
    return internalError(req, res, error);
  }
};
