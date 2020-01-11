const express = require('express');
const logger = require('morgan');

const { APIS } = require('./config');
const db = require('./db');

// db.findOne({ name: 'JACK' }).then((res) => console.log(res)).catch((err) => console.log(err));

const login = require('./routes/login');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(`/${APIS.prefix}/${APIS.version}/${APIS.paths.login}`, login);

app.all('*', (req, res) => res.status(404).send({
  info: 'NOT_FOUND',
  status: 404,
}));

module.exports = app;
