const express = require('express');
const logger = require('morgan');

const { basic } = require('./services/responses');
const config = require('./config');

const { APIS, RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = config;

const login = require('./routes/login');
const registration = require('./routes/registration');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.login}`, login);
app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.registration}`, registration);

// handle non-existing routes
app.all('*', (req, res) => basic(req, res, rs[404], sm.resourceNotFound));

module.exports = app;
