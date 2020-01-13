const { isMaster } = require('cluster');
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');

const { DATABASE: DB } = require('../config');
const { log } = require('../services/utilities');
const seeding = require('./seeding');

const basename = path.basename(__filename);

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
connection.on('disconnected', () => isMaster && log('-- database: disconnected'));
connection.once('open', () => isMaster && log('-- database: connected'));

// handle process termination: close database connection
process.on('SIGINT', () => connection.close(() => isMaster && log('-- database: closing connection')));

// load schemas and create models
fs.readdirSync(`${__dirname}/schemas`)
  .filter((file) => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach((file) => {
    const [schema] = file.split('.');
    const name = `${schema[0].toUpperCase()}${schema.slice(1)}`;
    /* eslint-disable-next-line */
    connection[name] = mongoose.model(name, require(`./schemas/${file}`)(mongoose));
  });

// seeding
seeding(connection);

module.exports = connection;
