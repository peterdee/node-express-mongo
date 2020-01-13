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
// available data types for the data validation function
const DATA_TYPES = {
  array: 'array',
  boolean: 'boolean',
  booleanString: 'booleanString',
  number: 'number',
  numberString: 'numberString',
  object: 'object',
  string: 'string',
};
// available environments
const ENVS = {
  dev: 'dev',
  prod: 'prod',
  stage: 'stage',
};
// database connection and settings
const DATABASE = {
  enableSeeding: ev.DB_ENABLE_SEEDING === 'true',
  env: ev.DB_ENV || ENVS.dev,
  host: ev.DB_HOST || 'localhost',
  name: ev.DB_NAME,
  password: ev.DB_PASSWORD,
  port: Number(ev.DB_PORT) || 27017,
  username: ev.DB_USERNAME,
};
// application environment
const { APP_ENV: ENV = ENVS.dev } = ev;
// application port
const PORT = Number(ev.APP_PORT) || 2211;
// available server response statuses
const RESPONSE_STATUSES = {
  200: 200,
  400: 400,
  401: 401,
  403: 403,
  404: 404,
  500: 500,
};
// default server response messages ('info' field)
const SERVER_MESSAGES = {
  accessDenied: 'ACCESS_DENIED',
  internalServerError: 'INTERNAL_SERVER_ERROR',
  invalidData: 'INVALID_DATA',
  invalidToken: 'INVALID_TOKEN',
  missingData: 'MISSING_DATA',
  missingToken: 'MISSING_TOKEN',
  noAdditionalInformation: 'NO_ADDITIONAL_INFORMATION',
  ok: 'OK',
  resourceNotFound: 'RESOURCE_NOT_FOUND',
};
// default values for the tokens
const TOKENS = {
  access: {
    expiration: Number(ev.TOKENS_ACCESS_EXPIRATION) || 86400, // 1 day in seconds
    secret: ev.TOKENS_ACCESS_SECRET,
  },
  refresh: {
    expiration: Number(ev.TOKENS_REFRESH_EXPIRATION) || 604800, // 1 week in seconds
    secret: ev.TOKENS_REFRESH_SECRET,
  },
};
// data for default seeded user
const USER = {
  email: ev.USER_EMAIL,
  firstName: ev.USER_FIRSTNAME,
  lastName: ev.USER_LASTNAME,
  password: ev.USER_PASSWORD,
};

module.exports = {
  APIS,
  DATA_TYPES,
  DATABASE,
  ENV,
  ENVS,
  PORT,
  RESPONSE_STATUSES,
  SERVER_MESSAGES,
  TOKENS,
  USER,
};
