const { env: ev } = process;

// API properties
const APIS = {
  paths: {
    login: 'login',
    registration: 'registration',
  },
  prefix: 'api',
  version: 'v1',
};
// available environments
const ENVS = {
  dev: 'dev',
  prod: 'prod',
  stage: 'stage',
};
// application environment
const { APP_ENV: ENV = ENVS.dev } = ev;
// database connection and settings
const DATABASE = {
  enableSeeding: ev.DB_ENABLE_SEEDING === "true",
  env: ev.DB_ENV || ENVS.dev,
  host: ev.DB_HOST || 'localhost',
  name: ev.DB_NAME,
  password: ev.DB_PASSWORD,
  port: Number(ev.DB_PORT) || 27017,
  username: ev.DB_USERNAME,
};
// application port
const PORT = Number(ev.APP_PORT) || 2211;
// data for default seeded user
const USER = {
  email: ev.USER_EMAIL,
  firstName: ev.USER_FIRSTNAME,
  lastName: ev.USER_LASTNAME,
  password: ev.USER_PASSWORD,
};

module.exports = {
  APIS,
  DATABASE,
  ENV,
  ENVS,
  PORT,
  USER,
};
