const compression = require('compression');
const cors = require('cors');
const express = require('express');
const favicon = require('serve-favicon');
const helmet = require('helmet');
const limiter = require('express-rate-limit');
const logger = require('morgan');
const path = require('path');

const { basic } = require('./services/responses');
const config = require('./config');

const { APIS, RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = config;

const account = require('./routes/account');
const accountRecovery = require('./routes/account-recovery');
const avatar = require('./routes/avatar');
const changeEmail = require('./routes/change-email');
const changePassword = require('./routes/change-password');
const comments = require('./routes/comments');
const favorites = require('./routes/favorites');
const image = require('./routes/image');
const index = require('./routes/index');
const login = require('./routes/login');
const logout = require('./routes/logout');
const passwordRecovery = require('./routes/password-recovery');
const posts = require('./routes/posts');
const refreshTokens = require('./routes/refresh-tokens');
const registration = require('./routes/registration');
const verifyEmail = require('./routes/verify-email');

const app = express();

// disable CORS for now
app.use(cors());

// run the rate limiter
app.use(limiter({
  handler: (req, res) => basic(req, res, rs[429], sm.requestLimitExceeded),
  max: 250,
  windowMs: 150000,
}));

app.use(compression());
app.use(favicon(path.join(__dirname, 'assets', 'favicon.ico')));
app.use(helmet());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// serve static documentation
if (config.ENV === config.ENVS.dev) {
  app.use(express.static(path.join(__dirname, 'docs')));
}

app.use('/', index);
app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.account}`, account);
app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.accountRecovery}`, accountRecovery);
app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.avatar}`, avatar);
app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.changeEmail}`, changeEmail);
app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.changePassword}`, changePassword);
app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.comments}`, comments);
app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.favorites}`, favorites);
app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.image}`, image);
app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.login}`, login);
app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.logout}`, logout);
app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.passwordRecovery}`, passwordRecovery);
app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.posts}`, posts);
app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.refreshTokens}`, refreshTokens);
app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.registration}`, registration);
app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.verifyEmail}`, verifyEmail);

// handle non-existing routes
app.all('*', (req, res) => basic(req, res, rs[404], sm.resourceNotFound));

module.exports = app;
