const compression = require('compression');
const express = require('express');
const helmet = require('helmet');
const limiter = require('express-rate-limit');
const logger = require('morgan');

const { basic } = require('./services/responses');
const config = require('./config');

const { APIS, RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = config;

const changePassword = require('./routes/change-password');
const login = require('./routes/login');
const logout = require('./routes/logout');
const passwordRecovery = require('./routes/password-recovery');
const refreshTokens = require('./routes/refresh-tokens');
const registration = require('./routes/registration');

const app = express();

// run the rate limiter first
app.use(limiter({
  handler: (req, res) => basic(req, res, rs[429], sm.requestLimitExceeded),
  max: 500,
  windowMs: 150000,
}));

app.use(compression());
app.use(helmet());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.changePassword}`, changePassword);
app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.login}`, login);
app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.logout}`, logout);
app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.passwordRecovery}`, passwordRecovery);
app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.refreshTokens}`, refreshTokens);
app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.registration}`, registration);

// handle non-existing routes
app.all('*', (req, res) => basic(req, res, rs[404], sm.resourceNotFound));

module.exports = app;
