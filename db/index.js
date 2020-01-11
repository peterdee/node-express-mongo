const { isMaster } = require('cluster');
const mongoose = require('mongoose');

const { DATABASE: DB } = require('../config');
const { log } = require('../services/utilities');

// connect to the database
mongoose.connect(
  `mongodb://${DB.username}:${DB.password}@${DB.host}:${DB.port}/${DB.name}`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
);

const { connection } = mongoose;

if (!connection) throw new Error('-- database: connection failed');

connection.on('error', (error) => isMaster && log(`-- database: ERROR\n${error}`));
connection.on('disconnected', () => isMaster && log(`-- database: disconnected`));
connection.once('open', () => isMaster && log(`-- database: connected`));

// handle process termination: close database connection
process.on('SIGINT', () => connection.close(() => isMaster && log(`-- database: closing connection`)));

module.exports = connection;
