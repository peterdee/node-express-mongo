const express = require('express');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.all('*', (req, res) => res.status(404).send({
  info: 'NOT_FOUND',
  status: 404,
}));

module.exports = app;
